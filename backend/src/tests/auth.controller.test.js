/**
 * IntellMeet Backend – Auth Controller Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/User');

// Mock Redis
jest.mock('../../config/redis', () => ({
  connectRedis: jest.fn(),
  disconnectRedis: jest.fn(),
  getRedisClient: jest.fn(() => null),
  isRedisConnected: jest.fn(() => false),
}));

// Mock email service
jest.mock('../../services/email.service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

// Mock token blacklisting (no Redis)
jest.mock('../../services/token.service', () => {
  const actual = jest.requireActual('../../services/token.service');
  return {
    ...actual,
    isTokenBlacklisted: jest.fn().mockResolvedValue(false),
    blacklistToken: jest.fn().mockResolvedValue(undefined),
  };
});

describe('Auth Controller', () => {
  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'test_access_secret_at_least_32_characters_long_for_tests';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_characters_long_for_tests';
    process.env.JWT_ACCESS_EXPIRES = '15m';
    process.env.JWT_REFRESH_EXPIRES = '7d';
    process.env.CLIENT_URL = 'http://localhost:5173';
    process.env.NODE_ENV = 'test';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intellmeet_test');
    }
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@test\.intellmeet\.com$/ });
    await mongoose.connection.close();
  });

  afterEach(async () => {
    await User.deleteMany({ email: /@test\.intellmeet\.com$/ });
  });

  // ─── Register ──────────────────────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@test.intellmeet.com',
          password: 'Test@1234',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@test.intellmeet.com');
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await User.create({ name: 'Existing', email: 'existing@test.intellmeet.com', password: 'Pass@1234' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'existing@test.intellmeet.com', password: 'Test@1234' });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'weak@test.intellmeet.com', password: 'weak' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'notanemail', password: 'Test@1234' });

      expect(res.statusCode).toBe(400);
    });
  });

  // ─── Login ─────────────────────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({ name: 'Login Test', email: 'login@test.intellmeet.com', password: 'Login@1234' });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.intellmeet.com', password: 'Login@1234' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('login@test.intellmeet.com');
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.intellmeet.com', password: 'WrongPass@1' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notexist@test.intellmeet.com', password: 'Pass@1234' });

      expect(res.statusCode).toBe(401);
    });
  });

  // ─── Get Me ────────────────────────────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Me Test', email: 'me@test.intellmeet.com', password: 'Me@Test12' });

      const token = registerRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.email).toBe('me@test.intellmeet.com');
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });
  });

  // ─── Logout ────────────────────────────────────────────────────────────────
  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Logout Test', email: 'logout@test.intellmeet.com', password: 'Logout@12' });

      const token = registerRes.body.data.accessToken;

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ─── Forgot Password ───────────────────────────────────────────────────────
  describe('POST /api/auth/forgot-password', () => {
    it('should return success even for non-existent email (prevent enumeration)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'ghost@test.intellmeet.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
