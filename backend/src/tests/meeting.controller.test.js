/**
 * IntellMeet Backend – Meeting Controller Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');
const Meeting = require('../../models/Meeting');

// Mock dependencies
jest.mock('../../config/redis', () => ({
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn(),
  getRedisClient: jest.fn(() => null),
  isRedisConnected: jest.fn(() => false),
}));

jest.mock('../../services/cache.service', () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  delPattern: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  expire: jest.fn().mockResolvedValue(undefined),
  KEYS: {
    user: (id) => `user:${id}`,
    meeting: (id) => `meeting:${id}`,
    team: (id) => `team:${id}`,
    notifUnread: (id) => `notif:unread:${id}`,
    summary: (id) => `summary:${id}`,
  },
  TTL: { USER: 300, MEETING: 60, TEAM: 120, NOTIF_UNREAD: 30, SUMMARY: 0 },
}));

jest.mock('../../services/email.service', () => ({
  sendMeetingInvitation: jest.fn().mockResolvedValue(true),
  sendMeetingSummaryEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../services/ai.service', () => ({
  generateMeetingSummary: jest.fn().mockResolvedValue({
    summary: 'Test summary',
    keyPoints: ['Point 1', 'Point 2'],
    actionItems: [],
    sentiment: 'positive',
    topics: ['Topic 1'],
    model: 'gpt-4o',
  }),
}));

jest.mock('../../services/token.service', () => {
  const actual = jest.requireActual('../../services/token.service');
  return {
    ...actual,
    isTokenBlacklisted: jest.fn().mockResolvedValue(false),
    blacklistToken: jest.fn().mockResolvedValue(undefined),
  };
});

let authToken;
let testUser;

describe('Meeting Controller', () => {
  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test_access_secret_at_least_32_characters_long_for_tests';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters_long_for_tests';
    process.env.CLIENT_URL = 'http://localhost:5173';
    process.env.NODE_ENV = 'test';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intellmeet_test');
    }

    // Create test user and get token
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Meeting Test User', email: 'meeting.test@test.intellmeet.com', password: 'Meet@1234' });

    authToken = res.body.data?.accessToken;
    testUser = res.body.data?.user;
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@test\.intellmeet\.com$/ });
    await Meeting.deleteMany({ title: /^Test/ });
    await mongoose.connection.close();
  });

  // ─── Create Meeting ────────────────────────────────────────────────────────
  describe('POST /api/meetings', () => {
    it('should create an instant meeting', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Instant Meeting' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meeting.title).toBe('Test Instant Meeting');
      expect(res.body.data.meeting.meetingId).toBeDefined();
      expect(res.body.data.meeting.status).toBe('active');
    });

    it('should create a scheduled meeting', async () => {
      const future = new Date(Date.now() + 24 * 60 * 60000).toISOString();
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Scheduled Meeting', scheduledAt: future });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.meeting.status).toBe('scheduled');
    });

    it('should reject meeting with past scheduledAt', async () => {
      const past = new Date(Date.now() - 60000).toISOString();
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Past Meeting', scheduledAt: past });

      expect(res.statusCode).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .send({ title: 'Test Meeting' });

      expect(res.statusCode).toBe(401);
    });

    it('should reject meeting with title too short', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'X' });

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── Get Meetings ──────────────────────────────────────────────────────────
  describe('GET /api/meetings', () => {
    it('should return paginated meetings for user', async () => {
      const res = await request(app)
        .get('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.meetings)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });
  });

  // ─── Get Upcoming ──────────────────────────────────────────────────────────
  describe('GET /api/meetings/upcoming', () => {
    it('should return upcoming meetings', async () => {
      const res = await request(app)
        .get('/api/meetings/upcoming')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.meetings)).toBe(true);
    });
  });

  // ─── Join Meeting ──────────────────────────────────────────────────────────
  describe('POST /api/meetings/:meetingId/join', () => {
    it('should join an existing meeting', async () => {
      // First create a meeting
      const createRes = await request(app)
        .post('/api/meetings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Join Meeting' });

      const { meetingId } = createRes.body.data.meeting;

      // Create another user and join
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Joiner', email: 'joiner@test.intellmeet.com', password: 'Join@1234' });

      const joinerToken = userRes.body.data.accessToken;

      const res = await request(app)
        .post(`/api/meetings/${meetingId}/join`)
        .set('Authorization', `Bearer ${joinerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent meeting', async () => {
      const res = await request(app)
        .post('/api/meetings/XXXXX-XXXXX/join')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
