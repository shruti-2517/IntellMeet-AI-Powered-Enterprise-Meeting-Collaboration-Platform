/**
 * IntellMeet Backend – Meeting Controller
 * Full lifecycle: create, join, leave, end, record, and manage meetings.
 */

const Meeting = require('../models/Meeting');
const MeetingSummary = require('../models/MeetingSummary');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { generateMeetingId } = require('../utils/generateMeetingId');
const { sendSuccess, sendError, buildPagination } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sendMeetingInvitation, sendMeetingSummaryEmail } = require('../services/email.service');
const { generateMeetingSummary } = require('../services/ai.service');
const { KEYS, TTL, get: cacheGet, set: cacheSet, del: cacheDel } = require('../services/cache.service');
const logger = require('../middleware/logger');

const PAGE_DEFAULT = 1;
const LIMIT_DEFAULT = 20;

// ─── Create Meeting ───────────────────────────────────────────────────────────
exports.createMeeting = asyncHandler(async (req, res) => {
  const { title, description, scheduledAt, team, settings, agenda, tags } = req.body;

  const meetingId = generateMeetingId();

  const meeting = await Meeting.create({
    title: title.trim(),
    description: description?.trim() || '',
    meetingId,
    host: req.user.userId,
    team: team || null,
    participants: [{ user: req.user.userId, role: 'host', joinedAt: scheduledAt ? null : new Date() }],
    status: scheduledAt ? 'scheduled' : 'active',
    scheduledAt: scheduledAt || null,
    startedAt: scheduledAt ? null : new Date(),
    settings: settings || {},
    agenda: agenda || [],
    tags: tags || [],
  });

  await meeting.populate('host', 'name email avatar');

  logger.info(`Meeting created: ${meetingId} by user ${req.user.userId}`);

  return sendSuccess(res, 201, { meeting }, 'Meeting created successfully');
});

// ─── Get All Meetings (paginated) ─────────────────────────────────────────────
exports.getMeetings = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || PAGE_DEFAULT, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || LIMIT_DEFAULT, 100);
  const status = req.query.status;
  const skip = (page - 1) * limit;

  const filter = {
    $or: [{ host: req.user.userId }, { 'participants.user': req.user.userId }],
  };
  if (status) filter.status = status;

  const [meetings, total] = await Promise.all([
    Meeting.find(filter)
      .populate('host', 'name email avatar')
      .populate('team', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Meeting.countDocuments(filter),
  ]);

  return sendSuccess(
    res,
    200,
    { meetings },
    'Meetings retrieved',
    buildPagination(total, page, limit)
  );
});

// ─── Get Upcoming Meetings ────────────────────────────────────────────────────
exports.getUpcoming = asyncHandler(async (req, res) => {
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const meetings = await Meeting.find({
    $or: [{ host: req.user.userId }, { 'participants.user': req.user.userId }],
    status: 'scheduled',
    scheduledAt: { $gte: new Date(), $lte: sevenDaysFromNow },
  })
    .populate('host', 'name email avatar')
    .sort({ scheduledAt: 1 })
    .limit(20);

  return sendSuccess(res, 200, { meetings }, 'Upcoming meetings retrieved');
});

// ─── Get Meeting History ──────────────────────────────────────────────────────
exports.getHistory = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {
    $or: [{ host: req.user.userId }, { 'participants.user': req.user.userId }],
    status: 'ended',
  };

  const [meetings, total] = await Promise.all([
    Meeting.find(filter)
      .populate('host', 'name email avatar')
      .populate('summary')
      .sort({ endedAt: -1 })
      .skip(skip)
      .limit(limit),
    Meeting.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, { meetings }, 'Meeting history retrieved', buildPagination(total, page, limit));
});

// ─── Get Meeting by ID ────────────────────────────────────────────────────────
exports.getMeetingById = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;

  const cached = await cacheGet(KEYS.meeting(meetingId));
  if (cached) return sendSuccess(res, 200, { meeting: cached }, 'Meeting retrieved');

  const meeting = await Meeting.findOne({ meetingId })
    .populate('host', 'name email avatar')
    .populate('team', 'name avatar')
    .populate('participants.user', 'name email avatar isOnline')
    .populate({ path: 'summary', select: 'summary keyPoints actionItems sentiment topics' });

  if (!meeting) return sendError(res, 404, 'Meeting not found.');

  await cacheSet(KEYS.meeting(meetingId), meeting, TTL.MEETING);
  return sendSuccess(res, 200, { meeting }, 'Meeting retrieved');
});

// ─── Update Meeting ───────────────────────────────────────────────────────────
exports.updateMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;

  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) return sendError(res, 404, 'Meeting not found.');

  if (meeting.host.toString() !== req.user.userId) {
    return sendError(res, 403, 'Only the host can update this meeting.');
  }

  const allowedFields = ['title', 'description', 'scheduledAt', 'settings', 'agenda', 'tags'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  Object.assign(meeting, updates);
  await meeting.save();
  await cacheDel(KEYS.meeting(meetingId));

  return sendSuccess(res, 200, { meeting }, 'Meeting updated successfully');
});

// ─── Delete Meeting ───────────────────────────────────────────────────────────
exports.deleteMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const meeting = await Meeting.findOne({ meetingId });

  if (!meeting) return sendError(res, 404, 'Meeting not found.');
  if (meeting.host.toString() !== req.user.userId) {
    return sendError(res, 403, 'Only the host can delete this meeting.');
  }
  if (meeting.status === 'active') {
    return sendError(res, 400, 'Cannot delete an active meeting. End it first.');
  }

  meeting.status = 'cancelled';
  await meeting.save();
  await cacheDel(KEYS.meeting(meetingId));

  return sendSuccess(res, 200, null, 'Meeting cancelled successfully');
});

// ─── Join Meeting ─────────────────────────────────────────────────────────────
exports.joinMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const { password } = req.body;

  const meeting = await Meeting.findOne({ meetingId }).select('+settings.password');
  if (!meeting) return sendError(res, 404, 'Meeting not found.');

  if (meeting.status === 'ended') return sendError(res, 400, 'This meeting has already ended.');
  if (meeting.status === 'cancelled') return sendError(res, 400, 'This meeting was cancelled.');
  if (meeting.settings.isLocked) return sendError(res, 403, 'This meeting is locked.');

  // Guest access check
  if (!meeting.settings.allowGuestJoin && req.user.role === 'guest') {
    return sendError(res, 403, 'Guests are not allowed to join this meeting.');
  }

  // Password check
  if (meeting.settings.password) {
    if (!password || password !== meeting.settings.password) {
      return sendError(res, 401, 'Incorrect meeting password.');
    }
  }

  // Participant limit
  if (meeting.participants.length >= meeting.settings.maxParticipants) {
    return sendError(res, 400, `Meeting is full (max ${meeting.settings.maxParticipants} participants).`);
  }

  // Check if already a participant
  const isAlreadyIn = meeting.participants.some(
    (p) => p.user.toString() === req.user.userId
  );

  if (!isAlreadyIn) {
    meeting.participants.push({
      user: req.user.userId,
      role: 'participant',
      joinedAt: new Date(),
      isMuted: meeting.settings.muteOnEntry,
    });
    await meeting.save();
    await cacheDel(KEYS.meeting(meetingId));
  }

  return sendSuccess(res, 200, { meeting }, 'Joined meeting successfully');
});

// ─── Leave Meeting ────────────────────────────────────────────────────────────
exports.leaveMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) return sendError(res, 404, 'Meeting not found.');

  const participantIndex = meeting.participants.findIndex(
    (p) => p.user.toString() === req.user.userId
  );

  if (participantIndex === -1) {
    return sendError(res, 400, 'You are not in this meeting.');
  }

  // Mark left time
  meeting.participants[participantIndex].leftAt = new Date();

  // If host leaves and no co-host, auto-end
  if (
    meeting.host.toString() === req.user.userId &&
    !meeting.participants.some((p) => p.role === 'co-host' && !p.leftAt)
  ) {
    meeting.status = 'ended';
    meeting.endedAt = new Date();
    const startTime = meeting.startedAt || meeting.createdAt;
    meeting.duration = Math.round((meeting.endedAt - startTime) / 60000);
  }

  await meeting.save();
  await cacheDel(KEYS.meeting(meetingId));

  return sendSuccess(res, 200, null, 'Left meeting successfully');
});

// ─── End Meeting ──────────────────────────────────────────────────────────────
exports.endMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const meeting = await Meeting.findOne({ meetingId }).populate('participants.user', 'name email');

  if (!meeting) return sendError(res, 404, 'Meeting not found.');
  if (meeting.host.toString() !== req.user.userId) {
    return sendError(res, 403, 'Only the host can end this meeting.');
  }
  if (meeting.status === 'ended') {
    return sendError(res, 400, 'Meeting is already ended.');
  }

  meeting.status = 'ended';
  meeting.endedAt = new Date();
  const startTime = meeting.startedAt || meeting.createdAt;
  meeting.duration = Math.round((meeting.endedAt - startTime) / 60000);

  await meeting.save();
  await cacheDel(KEYS.meeting(meetingId));

  // Trigger AI summary generation asynchronously
  setImmediate(async () => {
    try {
      const transcript = `[Meeting: ${meeting.title}. No transcript provided - summary generated from meeting metadata.]`;
      const participants = meeting.participants
        .filter((p) => p.user)
        .map((p) => ({ name: p.user.name, email: p.user.email }));

      const aiResult = await generateMeetingSummary(transcript, meeting.title, participants);
      const summary = await MeetingSummary.create({
        meeting: meeting._id,
        summary: aiResult.summary,
        keyPoints: aiResult.keyPoints,
        actionItems: aiResult.actionItems,
        sentiment: aiResult.sentiment,
        topics: aiResult.topics,
        model: aiResult.model,
        generatedAt: new Date(),
      });

      meeting.summary = summary._id;
      await meeting.save();

      logger.info(`AI summary generated for meeting ${meetingId}`);
    } catch (err) {
      logger.error(`AI summary generation failed for ${meetingId}: ${err.message}`);
    }
  });

  return sendSuccess(res, 200, { meeting }, 'Meeting ended successfully');
});

// ─── Lock/Unlock Meeting ──────────────────────────────────────────────────────
exports.lockMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) return sendError(res, 404, 'Meeting not found.');
  if (meeting.host.toString() !== req.user.userId) {
    return sendError(res, 403, 'Only the host can lock/unlock this meeting.');
  }

  meeting.settings.isLocked = !meeting.settings.isLocked;
  await meeting.save();
  await cacheDel(KEYS.meeting(meetingId));

  return sendSuccess(res, 200, { isLocked: meeting.settings.isLocked },
    meeting.settings.isLocked ? 'Meeting locked' : 'Meeting unlocked');
});

// ─── Kick Participant ─────────────────────────────────────────────────────────
exports.kickParticipant = asyncHandler(async (req, res) => {
  const { meetingId, userId } = req.params;
  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) return sendError(res, 404, 'Meeting not found.');

  const requesterParticipant = meeting.participants.find(
    (p) => p.user.toString() === req.user.userId
  );
  if (!requesterParticipant || !['host', 'co-host'].includes(requesterParticipant.role)) {
    return sendError(res, 403, 'Only the host or co-host can remove participants.');
  }

  const targetIndex = meeting.participants.findIndex((p) => p.user.toString() === userId);
  if (targetIndex === -1) return sendError(res, 404, 'Participant not found in meeting.');

  meeting.participants[targetIndex].leftAt = new Date();
  await meeting.save();
  await cacheDel(KEYS.meeting(meetingId));

  return sendSuccess(res, 200, null, 'Participant removed from meeting');
});

// ─── Update Participant ───────────────────────────────────────────────────────
exports.updateParticipant = asyncHandler(async (req, res) => {
  const { meetingId, userId } = req.params;
  const { role, isMuted, isVideoOn } = req.body;

  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) return sendError(res, 404, 'Meeting not found.');

  const isHost = meeting.host.toString() === req.user.userId;
  if (!isHost) return sendError(res, 403, 'Only the host can update participant settings.');

  const participant = meeting.participants.find((p) => p.user.toString() === userId);
  if (!participant) return sendError(res, 404, 'Participant not found.');

  if (role && ['co-host', 'participant'].includes(role)) participant.role = role;
  if (typeof isMuted === 'boolean') participant.isMuted = isMuted;
  if (typeof isVideoOn === 'boolean') participant.isVideoOn = isVideoOn;

  await meeting.save();
  await cacheDel(KEYS.meeting(meetingId));

  return sendSuccess(res, 200, { participant }, 'Participant updated');
});

// ─── Start Recording ──────────────────────────────────────────────────────────
exports.startRecording = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) return sendError(res, 404, 'Meeting not found.');
  if (meeting.host.toString() !== req.user.userId) {
    return sendError(res, 403, 'Only the host can start recording.');
  }

  meeting.isRecording = true;
  await meeting.save();
  await cacheDel(KEYS.meeting(meetingId));

  return sendSuccess(res, 200, null, 'Recording started');
});

// ─── Stop Recording ───────────────────────────────────────────────────────────
exports.stopRecording = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) return sendError(res, 404, 'Meeting not found.');

  meeting.isRecording = false;
  await meeting.save();
  await cacheDel(KEYS.meeting(meetingId));

  return sendSuccess(res, 200, null, 'Recording stopped');
});

// ─── Get Summary ─────────────────────────────────────────────────────────────
exports.getMeetingSummary = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) return sendError(res, 404, 'Meeting not found.');

  const summary = await MeetingSummary.findOne({ meeting: meeting._id })
    .populate('actionItems.assignee', 'name email avatar');

  if (!summary) return sendError(res, 404, 'Summary not yet generated for this meeting.');

  return sendSuccess(res, 200, { summary }, 'Summary retrieved');
});

// ─── Invite Participants ──────────────────────────────────────────────────────
exports.inviteParticipants = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const { emails } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return sendError(res, 400, 'Please provide an array of email addresses.');
  }

  const meeting = await Meeting.findOne({ meetingId }).populate('host', 'name');
  if (!meeting) return sendError(res, 404, 'Meeting not found.');

  const results = await Promise.allSettled(
    emails.map((email) =>
      sendMeetingInvitation(
        email,
        'Colleague',
        meeting.title,
        meeting.meetingId,
        meeting.host.name,
        meeting.scheduledAt
      )
    )
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return sendSuccess(res, 200, { sent, total: emails.length }, `Invitations sent to ${sent}/${emails.length} recipients`);
});
