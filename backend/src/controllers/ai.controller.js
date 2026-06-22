/**
 * IntellMeet Backend – AI Controller
 */

const Meeting = require('../models/Meeting');
const MeetingSummary = require('../models/MeetingSummary');
const { transcribeMeeting, generateMeetingSummary, extractActionItems, improveSummary } = require('../services/ai.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { KEYS, TTL, get: cacheGet, set: cacheSet } = require('../services/cache.service');
const logger = require('../middleware/logger');

// ─── Transcribe Audio ─────────────────────────────────────────────────────────
exports.transcribeAudio = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, 400, 'Please provide an audio file.');

  const result = await transcribeMeeting(
    req.file.buffer,
    req.file.mimetype,
    req.file.originalname
  );

  return sendSuccess(res, 200, { transcription: result }, 'Audio transcribed successfully');
});

// ─── Generate Meeting Summary ─────────────────────────────────────────────────
exports.generateSummary = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const { transcript: providedTranscript, force = false } = req.body;

  const meeting = await Meeting.findOne({ meetingId })
    .populate('participants.user', 'name email');

  if (!meeting) return sendError(res, 404, 'Meeting not found.');
  if (meeting.status !== 'ended') {
    return sendError(res, 400, 'Can only generate summaries for ended meetings.');
  }

  // Check cache (unless force refresh)
  if (!force) {
    const cached = await cacheGet(KEYS.summary(meetingId));
    if (cached) return sendSuccess(res, 200, { summary: cached }, 'Summary retrieved from cache');
  }

  const existingSummary = await MeetingSummary.findOne({ meeting: meeting._id });
  if (existingSummary && !force) {
    await cacheSet(KEYS.summary(meetingId), existingSummary, TTL.SUMMARY);
    return sendSuccess(res, 200, { summary: existingSummary }, 'Summary retrieved');
  }

  const transcript = providedTranscript ||
    (existingSummary?.transcript?.map((s) => `${s.speakerName}: ${s.text}`).join('\n')) ||
    `[Meeting: ${meeting.title}]`;

  const participants = meeting.participants
    .filter((p) => p.user)
    .map((p) => ({ name: p.user.name, email: p.user.email }));

  const aiResult = await generateMeetingSummary(transcript, meeting.title, participants);

  let summary;
  if (existingSummary) {
    Object.assign(existingSummary, {
      summary: aiResult.summary,
      keyPoints: aiResult.keyPoints,
      actionItems: aiResult.actionItems,
      sentiment: aiResult.sentiment,
      topics: aiResult.topics,
      model: aiResult.model,
      generatedAt: new Date(),
    });
    summary = await existingSummary.save();
  } else {
    summary = await MeetingSummary.create({
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
  }

  await cacheSet(KEYS.summary(meetingId), summary, TTL.SUMMARY);
  logger.info(`AI summary generated for meeting ${meetingId}`);

  return sendSuccess(res, 200, { summary }, 'Summary generated successfully');
});

// ─── Extract Action Items ─────────────────────────────────────────────────────
exports.extractActions = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 20) {
    return sendError(res, 400, 'Please provide at least 20 characters of text to analyze.');
  }

  const actionItems = await extractActionItems(text);
  return sendSuccess(res, 200, { actionItems }, `Extracted ${actionItems.length} action items`);
});

// ─── Improve Existing Summary ─────────────────────────────────────────────────
exports.improveSummary = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const { instructions } = req.body;

  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) return sendError(res, 404, 'Meeting not found.');

  const existingSummary = await MeetingSummary.findOne({ meeting: meeting._id });
  if (!existingSummary) return sendError(res, 404, 'No existing summary found for this meeting.');

  const transcript = existingSummary.transcript?.map((s) => `${s.speakerName}: ${s.text}`).join('\n') || '';
  const improved = await improveSummary(existingSummary.summary, transcript, instructions);

  if (!improved) return sendError(res, 500, 'Failed to improve summary. Please try again.');

  if (improved.summary) existingSummary.summary = improved.summary;
  if (improved.keyPoints) existingSummary.keyPoints = improved.keyPoints;
  if (improved.actionItems) existingSummary.actionItems = improved.actionItems;
  if (improved.sentiment) existingSummary.sentiment = improved.sentiment;
  if (improved.topics) existingSummary.topics = improved.topics;
  existingSummary.generatedAt = new Date();

  await existingSummary.save();

  return sendSuccess(res, 200, { summary: existingSummary }, 'Summary improved successfully');
});

// ─── Get Summary ──────────────────────────────────────────────────────────────
exports.getSummary = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;

  const cached = await cacheGet(KEYS.summary(meetingId));
  if (cached) return sendSuccess(res, 200, { summary: cached }, 'Summary retrieved');

  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) return sendError(res, 404, 'Meeting not found.');

  const summary = await MeetingSummary.findOne({ meeting: meeting._id })
    .populate('actionItems.assignee', 'name email avatar');

  if (!summary) return sendError(res, 404, 'No summary found for this meeting.');

  await cacheSet(KEYS.summary(meetingId), summary, TTL.SUMMARY);
  return sendSuccess(res, 200, { summary }, 'Summary retrieved');
});
