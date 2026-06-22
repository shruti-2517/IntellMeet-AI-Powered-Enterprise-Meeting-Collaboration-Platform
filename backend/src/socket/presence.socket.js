/**
 * IntellMeet Backend – Presence Socket Handler
 * Online/offline user presence tracking.
 */

const User = require('../models/User');
const logger = require('../middleware/logger');

// Grace period before removing disconnected user from presence (ms)
const RECONNECT_GRACE_PERIOD = 30000; // 30 seconds

// Track disconnect timers: userId → timeoutHandle
const disconnectTimers = new Map();

/**
 * Setup user presence socket events.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Namespace} ns
 * @param {import('socket.io').Socket} socket
 * @param {Map} userSocketMap
 */
const setupPresenceSocket = (io, ns, socket, userSocketMap) => {
  const userId = socket.userId;

  // ─── User Goes Online ─────────────────────────────────────────────────────
  const markOnline = async () => {
    // Cancel any pending offline timer
    if (disconnectTimers.has(userId)) {
      clearTimeout(disconnectTimers.get(userId));
      disconnectTimers.delete(userId);
    }

    try {
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
    } catch (err) {
      logger.error(`Presence update failed (online): ${err.message}`);
    }

    // Broadcast to everyone
    ns.emit('presence-update', { userId, isOnline: true, lastSeen: new Date() });
    logger.debug(`User ${userId} is now ONLINE`);
  };

  // ─── User Goes Offline ────────────────────────────────────────────────────
  const markOffline = async () => {
    const lastSeen = new Date();
    try {
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
    } catch (err) {
      logger.error(`Presence update failed (offline): ${err.message}`);
    }

    ns.emit('presence-update', { userId, isOnline: false, lastSeen });
    logger.debug(`User ${userId} is now OFFLINE`);
  };

  // Mark online when socket connects
  socket.on('user-online', () => markOnline());
  markOnline(); // Auto-mark online on connection

  // ─── Heartbeat (keep-alive) ───────────────────────────────────────────────
  socket.on('heartbeat', () => {
    User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch(() => {});
  });

  // ─── Get Bulk Presence ────────────────────────────────────────────────────
  socket.on('get-presence', async ({ userIds }, callback) => {
    if (!Array.isArray(userIds)) return;

    try {
      const users = await User.find(
        { _id: { $in: userIds } },
        'isOnline lastSeen'
      );

      const presenceMap = {};
      users.forEach((u) => {
        presenceMap[u._id.toString()] = { isOnline: u.isOnline, lastSeen: u.lastSeen };
      });

      if (typeof callback === 'function') callback(presenceMap);
    } catch (err) {
      logger.error(`get-presence error: ${err.message}`);
    }
  });

  // ─── Explicit Offline ────────────────────────────────────────────────────
  socket.on('user-offline', () => {
    const sockets = userSocketMap.get(userId);
    if (!sockets || sockets.size <= 1) {
      markOffline();
    }
  });

  // ─── Disconnect with Grace Period ─────────────────────────────────────────
  socket.on('disconnect', () => {
    const sockets = userSocketMap.get(userId);
    // Only mark offline if no other sockets remain after grace period
    const timer = setTimeout(() => {
      const currentSockets = userSocketMap.get(userId);
      if (!currentSockets || currentSockets.size === 0) {
        markOffline();
      }
      disconnectTimers.delete(userId);
    }, RECONNECT_GRACE_PERIOD);

    disconnectTimers.set(userId, timer);
  });
};

module.exports = { setupPresenceSocket };
