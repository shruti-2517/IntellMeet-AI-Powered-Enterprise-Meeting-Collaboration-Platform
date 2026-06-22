/**
 * IntellMeet Backend – Message Controller
 */

const Message = require('../models/Message');
const Meeting = require('../models/Meeting');
const { sendSuccess, sendError, buildPagination } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── Get Chat History ─────────────────────────────────────────────────────────
exports.getMessages = asyncHandler(async (req, res) => {
  const { meetingId: shortId } = req.params;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const skip = (page - 1) * limit;

  const meeting = await Meeting.findOne({ meetingId: shortId });
  if (!meeting) return sendError(res, 404, 'Meeting not found.');

  const [messages, total] = await Promise.all([
    Message.find({ meeting: meeting._id, isDeleted: false })
      .populate('sender', 'name avatar')
      .populate('replyTo', 'content sender senderName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Message.countDocuments({ meeting: meeting._id, isDeleted: false }),
  ]);

  return sendSuccess(
    res,
    200,
    { messages: messages.reverse() }, // Return in chronological order
    'Messages retrieved',
    buildPagination(total, page, limit)
  );
});

// ─── Send Message ─────────────────────────────────────────────────────────────
exports.sendMessage = asyncHandler(async (req, res) => {
  const { meetingId: shortId } = req.params;
  const { content, type = 'text', replyTo } = req.body;

  const meeting = await Meeting.findOne({ meetingId: shortId });
  if (!meeting) return sendError(res, 404, 'Meeting not found.');

  const sender = req.userDoc || { _id: req.user.userId, name: 'Unknown', avatar: { url: '' } };

  const message = await Message.create({
    meeting: meeting._id,
    sender: req.user.userId,
    senderName: sender.name || 'Unknown',
    senderAvatar: sender.avatar?.url || '',
    content,
    type,
    replyTo: replyTo || null,
  });

  await message.populate('sender', 'name avatar');

  return sendSuccess(res, 201, { message }, 'Message sent');
});

// ─── Delete Message ───────────────────────────────────────────────────────────
exports.deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const message = await Message.findById(messageId);

  if (!message) return sendError(res, 404, 'Message not found.');
  if (message.sender.toString() !== req.user.userId) {
    return sendError(res, 403, 'You can only delete your own messages.');
  }

  message.isDeleted = true;
  await message.save();

  return sendSuccess(res, 200, null, 'Message deleted');
});

// ─── Toggle Reaction ──────────────────────────────────────────────────────────
exports.toggleReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  if (!emoji) return sendError(res, 400, 'Emoji is required.');

  const message = await Message.findById(messageId);
  if (!message) return sendError(res, 404, 'Message not found.');

  const existingReaction = message.reactions.find((r) => r.emoji === emoji);

  if (existingReaction) {
    const userIndex = existingReaction.users.indexOf(req.user.userId);
    if (userIndex > -1) {
      // Remove reaction
      existingReaction.users.splice(userIndex, 1);
      if (existingReaction.users.length === 0) {
        message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
      }
    } else {
      // Add user to existing reaction
      existingReaction.users.push(req.user.userId);
    }
  } else {
    // New reaction
    message.reactions.push({ emoji, users: [req.user.userId] });
  }

  await message.save();
  return sendSuccess(res, 200, { reactions: message.reactions }, 'Reaction toggled');
});
