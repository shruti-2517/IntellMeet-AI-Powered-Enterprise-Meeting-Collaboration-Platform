/**
 * IntellMeet Backend – Notification Socket Handler
 * Pushes real-time notifications to connected users.
 */

const logger = require('../middleware/logger');

/**
 * Setup notification socket events.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Namespace} ns
 * @param {import('socket.io').Socket} socket
 * @param {Map} userSocketMap - userId → Set<socketId>
 */
const setupNotificationSocket = (io, ns, socket, userSocketMap) => {
  const userId = socket.userId;

  // Join personal notification room
  socket.join(`notif:${userId}`);
  logger.info(`User ${userId} joined notification room`);

  // Client acknowledges receipt of a notification
  socket.on('notification-read', ({ notifId }) => {
    logger.debug(`Notification ${notifId} read by user ${userId}`);
  });

  // Utility: Check if user is online
  socket.on('check-online', ({ targetUserId }, callback) => {
    const sockets = userSocketMap.get(targetUserId.toString());
    const isOnline = sockets && sockets.size > 0;
    if (typeof callback === 'function') callback({ isOnline });
  });
};

/**
 * Send a real-time notification to a user (called from controllers/services).
 * @param {import('socket.io').Namespace} ns - The /notifications namespace
 * @param {string} userId - Target user ID
 * @param {object} notification - Notification data
 */
const pushNotification = (ns, userId, notification) => {
  if (!ns) return;
  ns.to(`notif:${userId}`).emit('new-notification', { notification });
  logger.debug(`Pushed notification to user ${userId}: ${notification.title}`);
};

/**
 * Update unread count for a user.
 * @param {import('socket.io').Namespace} ns
 * @param {string} userId
 * @param {number} count
 */
const updateUnreadCount = (ns, userId, count) => {
  if (!ns) return;
  ns.to(`notif:${userId}`).emit('unread-count', { count });
};

module.exports = { setupNotificationSocket, pushNotification, updateUnreadCount };
