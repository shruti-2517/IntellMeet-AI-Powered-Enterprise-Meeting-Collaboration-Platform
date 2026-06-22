/**
 * IntellMeet Backend – User Controller
 */

const User = require('../models/User');
const Meeting = require('../models/Meeting');
const Task = require('../models/Task');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { sendSuccess, sendError, buildPagination } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { KEYS, TTL, del: cacheDelete, get: cacheGet, set: cacheSet } = require('../services/cache.service');

// ─── Get Profile ──────────────────────────────────────────────────────────────
exports.getProfile = asyncHandler(async (req, res) => {
  // Try cache first
  const cached = await cacheGet(KEYS.user(req.user.userId));
  if (cached) return sendSuccess(res, 200, { user: cached }, 'Profile retrieved');

  const user = await User.findById(req.user.userId)
    .populate('teams', 'name avatar members kanbanColumns');

  if (!user) return sendError(res, 404, 'User not found.');

  // Compute stats
  const [meetingsAttended, tasksCompleted] = await Promise.all([
    Meeting.countDocuments({ 'participants.user': user._id }),
    Task.countDocuments({ assignee: user._id, status: 'completed' }),
  ]);

  const userData = { ...user.toJSON(), stats: { meetingsAttended, tasksCompleted } };

  await cacheSet(KEYS.user(req.user.userId), userData, TTL.USER);
  return sendSuccess(res, 200, { user: userData }, 'Profile retrieved');
});

// ─── Update Profile ───────────────────────────────────────────────────────────
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, preferences } = req.body;

  const update = {};
  if (name) update.name = name.trim();
  if (bio !== undefined) update.bio = bio.trim();
  if (preferences) {
    if (preferences.timezone) update['preferences.timezone'] = preferences.timezone;
    if (preferences.theme) update['preferences.theme'] = preferences.theme;
    if (preferences.notifications) {
      if (typeof preferences.notifications.email === 'boolean')
        update['preferences.notifications.email'] = preferences.notifications.email;
      if (typeof preferences.notifications.push === 'boolean')
        update['preferences.notifications.push'] = preferences.notifications.push;
    }
  }

  const user = await User.findByIdAndUpdate(req.user.userId, { $set: update }, { new: true, runValidators: true });

  if (!user) return sendError(res, 404, 'User not found.');

  await cacheDelete(KEYS.user(req.user.userId));
  return sendSuccess(res, 200, { user }, 'Profile updated successfully');
});

// ─── Upload Avatar ────────────────────────────────────────────────────────────
exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, 400, 'Please provide an image file.');

  const user = await User.findById(req.user.userId);
  if (!user) return sendError(res, 404, 'User not found.');

  // Delete old avatar from Cloudinary
  if (user.avatar?.publicId) {
    await deleteFromCloudinary(user.avatar.publicId).catch(() => {});
  }

  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'intellmeet/avatars',
    width: 400,
    height: 400,
    crop: 'fill',
    quality: 'auto',
  });

  user.avatar = { url: result.secure_url, publicId: result.public_id };
  await user.save();
  await cacheDelete(KEYS.user(req.user.userId));

  return sendSuccess(res, 200, { avatar: user.avatar }, 'Avatar uploaded successfully');
});

// ─── Delete Avatar ────────────────────────────────────────────────────────────
exports.deleteAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) return sendError(res, 404, 'User not found.');

  if (user.avatar?.publicId) {
    await deleteFromCloudinary(user.avatar.publicId).catch(() => {});
  }

  user.avatar = { url: '', publicId: '' };
  await user.save();
  await cacheDelete(KEYS.user(req.user.userId));

  return sendSuccess(res, 200, null, 'Avatar removed successfully');
});

// ─── Change Password ──────────────────────────────────────────────────────────
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.userId).select('+password');
  if (!user) return sendError(res, 404, 'User not found.');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return sendError(res, 400, 'Current password is incorrect.');

  if (currentPassword === newPassword) {
    return sendError(res, 400, 'New password must be different from the current password.');
  }

  user.password = newPassword;
  user.refreshTokens = []; // Invalidate all other sessions
  await user.save();

  return sendSuccess(res, 200, null, 'Password changed successfully. Please log in again.');
});

// ─── Search Users ─────────────────────────────────────────────────────────────
exports.searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return sendError(res, 400, 'Search query must be at least 2 characters.');
  }

  const users = await User.find({
    $or: [
      { name: { $regex: q.trim(), $options: 'i' } },
      { email: { $regex: q.trim(), $options: 'i' } },
    ],
    _id: { $ne: req.user.userId }, // Exclude self
  })
    .select('name email avatar role isOnline')
    .limit(20);

  return sendSuccess(res, 200, { users }, `Found ${users.length} users`);
});

// ─── Get User By ID (Public Profile) ──────────────────────────────────────────
exports.getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select('name email avatar role isOnline lastSeen bio');
  if (!user) return sendError(res, 404, 'User not found.');

  return sendSuccess(res, 200, { user }, 'User profile retrieved');
});

// ─── Get Personal Stats ───────────────────────────────────────────────────────
exports.getStats = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const [
    totalMeetings,
    hostedMeetings,
    totalTasks,
    completedTasks,
    overdueTasks,
  ] = await Promise.all([
    Meeting.countDocuments({ 'participants.user': userId }),
    Meeting.countDocuments({ host: userId }),
    Task.countDocuments({ assignee: userId }),
    Task.countDocuments({ assignee: userId, status: 'completed' }),
    Task.countDocuments({ assignee: userId, dueDate: { $lt: new Date() }, status: { $nin: ['completed', 'cancelled'] } }),
  ]);

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return sendSuccess(res, 200, {
    stats: {
      totalMeetings,
      hostedMeetings,
      totalTasks,
      completedTasks,
      overdueTasks,
      taskCompletionRate: completionRate,
    },
  }, 'Stats retrieved');
});
