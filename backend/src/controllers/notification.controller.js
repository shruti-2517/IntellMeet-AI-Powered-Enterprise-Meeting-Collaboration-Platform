/**
 * IntellMeet Backend – Notification Controller
 */

const Notification = require('../models/Notification');
const { sendSuccess, sendError, buildPagination } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { KEYS, TTL, get: cacheGet, set: cacheSet, del: cacheDel } = require('../services/cache.service');

// ─── Get Notifications ────────────────────────────────────────────────────────
exports.getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = { recipient: req.user.userId };

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, { notifications }, 'Notifications retrieved', buildPagination(total, page, limit));
});

// ─── Get Unread Count ─────────────────────────────────────────────────────────
exports.getUnreadCount = asyncHandler(async (req, res) => {
  const cacheKey = KEYS.notifUnread(req.user.userId);
  const cached = await cacheGet(cacheKey);

  if (cached !== null) {
    return sendSuccess(res, 200, { count: cached }, 'Unread count retrieved');
  }

  const count = await Notification.countDocuments({
    recipient: req.user.userId,
    isRead: false,
  });

  await cacheSet(cacheKey, count, TTL.NOTIF_UNREAD);
  return sendSuccess(res, 200, { count }, 'Unread count retrieved');
});

// ─── Mark Single Notification as Read ────────────────────────────────────────
exports.markAsRead = asyncHandler(async (req, res) => {
  const { notifId } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: notifId, recipient: req.user.userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) return sendError(res, 404, 'Notification not found.');

  await cacheDel(KEYS.notifUnread(req.user.userId));
  return sendSuccess(res, 200, { notification }, 'Notification marked as read');
});

// ─── Mark All as Read ─────────────────────────────────────────────────────────
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user.userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  await cacheDel(KEYS.notifUnread(req.user.userId));
  return sendSuccess(res, 200, null, 'All notifications marked as read');
});

// ─── Delete Notification ──────────────────────────────────────────────────────
exports.deleteNotification = asyncHandler(async (req, res) => {
  const { notifId } = req.params;

  const result = await Notification.findOneAndDelete({
    _id: notifId,
    recipient: req.user.userId,
  });

  if (!result) return sendError(res, 404, 'Notification not found.');

  await cacheDel(KEYS.notifUnread(req.user.userId));
  return sendSuccess(res, 200, null, 'Notification deleted');
});

// ─── Clear All Read Notifications ────────────────────────────────────────────
exports.clearAll = asyncHandler(async (req, res) => {
  await Notification.deleteMany({
    recipient: req.user.userId,
    isRead: true,
  });

  await cacheDel(KEYS.notifUnread(req.user.userId));
  return sendSuccess(res, 200, null, 'Read notifications cleared');
});
