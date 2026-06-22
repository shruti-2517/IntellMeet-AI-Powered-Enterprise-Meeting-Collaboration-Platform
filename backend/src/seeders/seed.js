/**
 * IntellMeet Backend – Database Seeder
 * Creates demo data: 1 admin + 2 members, 1 team, 2 meetings, 5 tasks.
 * Run with: npm run seed
 */

'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const Meeting = require('../models/Meeting');
const MeetingSummary = require('../models/MeetingSummary');
const Task = require('../models/Task');
const { generateMeetingId } = require('../utils/generateMeetingId');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellmeet';

const seed = async () => {
  console.log('🌱 Starting IntellMeet database seeding...\n');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    // ── Clear existing data ──────────────────────────────────────────────────
    await Promise.all([
      User.deleteMany({}),
      Team.deleteMany({}),
      Meeting.deleteMany({}),
      MeetingSummary.deleteMany({}),
      Task.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data\n');

    // ── Create Users ─────────────────────────────────────────────────────────
    const [admin, alice, bob] = await User.create([
      {
        name: 'Admin User',
        email: 'admin@intellmeet.com',
        password: 'Admin@123',
        role: 'admin',
        isEmailVerified: true,
        bio: 'Platform administrator',
      },
      {
        name: 'Alice Johnson',
        email: 'alice@intellmeet.com',
        password: 'Alice@123',
        role: 'member',
        isEmailVerified: true,
        bio: 'Product Manager & Meeting Facilitator',
      },
      {
        name: 'Bob Smith',
        email: 'bob@intellmeet.com',
        password: 'Bob@1234',
        role: 'member',
        isEmailVerified: true,
        bio: 'Senior Software Engineer',
      },
    ]);
    console.log('👥 Created 3 users:');
    console.log(`   Admin: admin@intellmeet.com / Admin@123`);
    console.log(`   Alice: alice@intellmeet.com / Alice@123`);
    console.log(`   Bob:   bob@intellmeet.com  / Bob@1234\n`);

    // ── Create Team ──────────────────────────────────────────────────────────
    const team = await Team.create({
      name: 'IntellMeet Dev Team',
      description: 'The core development team for IntellMeet platform',
      owner: admin._id,
      members: [
        { user: admin._id, role: 'owner', joinedAt: new Date() },
        { user: alice._id, role: 'admin', joinedAt: new Date() },
        { user: bob._id, role: 'member', joinedAt: new Date() },
      ],
    });

    // Add team to each user
    await User.updateMany(
      { _id: { $in: [admin._id, alice._id, bob._id] } },
      { $addToSet: { teams: team._id } }
    );
    console.log(`🏢 Created team: "${team.name}" (Invite code: ${team.inviteCode})\n`);

    // ── Create Meetings ───────────────────────────────────────────────────────
    const pastMeeting = await Meeting.create({
      title: 'Q1 2026 Sprint Review',
      description: 'Reviewing progress on Q1 goals and planning Q2 roadmap',
      meetingId: generateMeetingId(),
      host: alice._id,
      team: team._id,
      participants: [
        { user: alice._id, role: 'host', joinedAt: new Date(Date.now() - 90 * 60000), leftAt: new Date() },
        { user: admin._id, role: 'co-host', joinedAt: new Date(Date.now() - 88 * 60000), leftAt: new Date() },
        { user: bob._id, role: 'participant', joinedAt: new Date(Date.now() - 85 * 60000), leftAt: new Date() },
      ],
      status: 'ended',
      startedAt: new Date(Date.now() - 90 * 60000),
      endedAt: new Date(),
      duration: 90,
      tags: ['sprint-review', 'q1', '2026'],
      agenda: ['Review sprint velocity', 'Demo new features', 'Retrospective', 'Plan Q2 roadmap'],
    });

    const upcomingMeeting = await Meeting.create({
      title: 'IntellMeet Design Review',
      description: 'Reviewing the new dashboard UI and user flow improvements',
      meetingId: generateMeetingId(),
      host: admin._id,
      team: team._id,
      participants: [
        { user: admin._id, role: 'host' },
        { user: alice._id, role: 'participant' },
        { user: bob._id, role: 'participant' },
      ],
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60000), // Tomorrow
      settings: { maxParticipants: 50, muteOnEntry: true },
      tags: ['design', 'ux', 'dashboard'],
      agenda: ['Dashboard redesign walkthrough', 'Feedback & iteration', 'Action items'],
    });

    console.log('📅 Created 2 meetings:');
    console.log(`   Ended:    "${pastMeeting.title}" (ID: ${pastMeeting.meetingId})`);
    console.log(`   Upcoming: "${upcomingMeeting.title}" (ID: ${upcomingMeeting.meetingId})\n`);

    // ── Create AI Summary for past meeting ───────────────────────────────────
    const summary = await MeetingSummary.create({
      meeting: pastMeeting._id,
      summary: 'The Q1 2026 Sprint Review was a productive session covering major milestones achieved in the quarter. The team demonstrated significant progress on the AI summarization feature, real-time collaboration tools, and the redesigned dashboard. Key decisions were made regarding Q2 priorities, with a focus on mobile optimization, enhanced analytics, and enterprise integrations. The team exhibited strong momentum with a sprint velocity of 87%, exceeding the target by 12%.',
      keyPoints: [
        'Sprint velocity of 87% exceeded target by 12%',
        'AI meeting summarization feature launched and well-received',
        'Real-time chat and WebRTC signaling fully functional',
        'Dashboard redesign in final review stage',
        'Q2 roadmap approved: Mobile app, Advanced Analytics, Enterprise SSO',
      ],
      actionItems: [
        { text: 'Complete dashboard redesign mockups', assigneeName: 'Alice Johnson', priority: 'high', status: 'pending' },
        { text: 'Implement mobile push notifications', assigneeName: 'Bob Smith', priority: 'medium', status: 'pending' },
        { text: 'Set up enterprise SSO documentation', assigneeName: 'Admin User', priority: 'low', status: 'pending' },
      ],
      sentiment: 'positive',
      topics: ['Sprint Review', 'Product Roadmap', 'AI Features', 'WebRTC', 'Dashboard'],
      model: 'gpt-4o',
      generatedAt: new Date(),
    });

    pastMeeting.summary = summary._id;
    await pastMeeting.save();
    console.log('🤖 Created AI summary for past meeting\n');

    // ── Create Tasks ──────────────────────────────────────────────────────────
    await Task.create([
      {
        title: 'Implement real-time notifications',
        description: 'Set up Socket.io notification namespace and push notification delivery system',
        assignee: bob._id,
        assignedBy: alice._id,
        team: team._id,
        status: 'completed',
        column: 'completed',
        priority: 'high',
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60000),
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60000),
        tags: ['backend', 'socket.io'],
      },
      {
        title: 'Design AI Summary UI component',
        description: 'Create the meeting summary card with key points, action items, and sentiment badge',
        assignee: alice._id,
        assignedBy: admin._id,
        team: team._id,
        status: 'in-progress',
        column: 'in-progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60000),
        tags: ['frontend', 'design', 'ai'],
      },
      {
        title: 'Add Kanban drag-and-drop',
        description: 'Implement react-beautiful-dnd or similar for task Kanban board',
        assignee: bob._id,
        assignedBy: alice._id,
        team: team._id,
        status: 'todo',
        column: 'todo',
        priority: 'medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60000),
        tags: ['frontend', 'kanban'],
      },
      {
        title: 'Write API documentation',
        description: 'Document all REST API endpoints with examples using Swagger/OpenAPI',
        assignee: admin._id,
        assignedBy: admin._id,
        team: team._id,
        status: 'review',
        column: 'review',
        priority: 'medium',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60000),
        tags: ['documentation'],
      },
      {
        title: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and Docker deployment',
        assignee: bob._id,
        assignedBy: admin._id,
        team: team._id,
        status: 'todo',
        column: 'todo',
        priority: 'urgent',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60000),
        tags: ['devops', 'ci-cd'],
      },
    ]);

    console.log('✅ Created 5 tasks in various Kanban states\n');

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ Seeding complete! IntellMeet is ready to run.');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n🔑 Login credentials:');
    console.log('   Admin: admin@intellmeet.com | Admin@123');
    console.log('   Alice: alice@intellmeet.com | Alice@123');
    console.log('   Bob:   bob@intellmeet.com   | Bob@1234');
    console.log('\n🚀 Start the server with: npm run dev\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

seed();
