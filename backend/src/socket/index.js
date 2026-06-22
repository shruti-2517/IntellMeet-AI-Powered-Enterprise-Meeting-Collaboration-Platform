/**
 * IntellMeet Backend – Socket.io Server Initialization
 * Sets up namespaces: /meeting, /notifications, /presence
 */

const { Server } = require('socket.io');
const { verifyAccessToken } = require('../services/token.service');
const logger = require('../middleware/logger');
const { setupMeetingSocket } = require('./meeting.socket');
const { setupChatSocket } = require('./chat.socket');
const { setupNotificationSocket } = require('./notification.socket');
const { setupPresenceSocket } = require('./presence.socket');

// In-memory store for userId → socketId mapping
// In production with multiple servers, use Redis adapter
const userSocketMap = new Map(); // userId → Set of socketIds

let io = null;

/**
 * Initialize Socket.io server and all namespaces.
 * @param {http.Server} httpServer
 * @returns {Server} - Configured Socket.io instance
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Auth Middleware for All Namespaces ──────────────────────────────────
  const authMiddleware = (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      logger.warn(`Socket auth failed: ${err.message}`);
      next(new Error('Invalid or expired token'));
    }
  };

  // ─── Meeting Namespace (/meeting) ────────────────────────────────────────
  const meetingNs = io.of('/meeting');
  meetingNs.use(authMiddleware);
  meetingNs.on('connection', (socket) => {
    logger.info(`[/meeting] Socket connected: ${socket.id} (user: ${socket.userId})`);

    // Track user→socket mapping
    if (!userSocketMap.has(socket.userId)) {
      userSocketMap.set(socket.userId, new Set());
    }
    userSocketMap.get(socket.userId).add(socket.id);

    setupMeetingSocket(io, meetingNs, socket);
    setupChatSocket(io, meetingNs, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`[/meeting] Socket disconnected: ${socket.id} (reason: ${reason})`);
      const sockets = userSocketMap.get(socket.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSocketMap.delete(socket.userId);
      }
    });
  });

  // ─── Notifications Namespace (/notifications) ────────────────────────────
  const notifNs = io.of('/notifications');
  notifNs.use(authMiddleware);
  notifNs.on('connection', (socket) => {
    logger.info(`[/notifications] Socket connected: ${socket.id} (user: ${socket.userId})`);
    setupNotificationSocket(io, notifNs, socket, userSocketMap);

    socket.on('disconnect', () => {
      logger.info(`[/notifications] Socket disconnected: ${socket.id}`);
    });
  });

  // ─── Presence Namespace (/presence) ──────────────────────────────────────
  const presenceNs = io.of('/presence');
  presenceNs.use(authMiddleware);
  presenceNs.on('connection', (socket) => {
    logger.info(`[/presence] Socket connected: ${socket.id} (user: ${socket.userId})`);
    setupPresenceSocket(io, presenceNs, socket, userSocketMap);

    socket.on('disconnect', () => {
      logger.info(`[/presence] Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('✅ Socket.io initialized with namespaces: /meeting, /notifications, /presence');
  return io;
};

/**
 * Get the Socket.io instance (for use in controllers).
 */
const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

/**
 * Get socket IDs for a specific user.
 */
const getUserSockets = (userId) => {
  return userSocketMap.get(userId.toString()) || new Set();
};

/**
 * Emit an event to a specific user (all their connected sockets).
 */
const emitToUser = (userId, event, data) => {
  const sockets = getUserSockets(userId.toString());
  const notifNs = io?.of('/notifications');
  if (notifNs && sockets.size > 0) {
    sockets.forEach((socketId) => {
      notifNs.to(socketId).emit(event, data);
    });
  }
};

module.exports = { initSocket, getIO, getUserSockets, emitToUser };
