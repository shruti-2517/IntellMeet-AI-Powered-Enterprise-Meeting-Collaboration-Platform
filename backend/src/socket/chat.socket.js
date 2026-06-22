/**
 * IntellMeet Backend – Chat Socket Handler
 * Real-time in-meeting chat events.
 */

const logger = require('../middleware/logger');

/**
 * Setup in-meeting chat socket events.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Namespace} ns
 * @param {import('socket.io').Socket} socket
 */
const setupChatSocket = (io, ns, socket) => {
  const userId = socket.userId;

  // ─── Send Chat Message ────────────────────────────────────────────────────
  socket.on('chat-message', ({ meetingId, message, sender }) => {
    const room = `meeting:${meetingId}`;

    const payload = {
      _id: `${Date.now()}-${userId}`, // Temp ID until saved to DB
      content: message,
      sender: {
        _id: userId,
        name: sender?.name || 'Unknown',
        avatar: sender?.avatar || { url: '' },
      },
      senderName: sender?.name || 'Unknown',
      type: 'text',
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
    };

    // Broadcast to all in room (including sender for confirmation)
    ns.to(room).emit('chat-message', payload);

    logger.debug(`Chat message in ${meetingId} from ${userId}: "${String(message).slice(0, 50)}..."`);
  });

  // ─── Typing Indicators ────────────────────────────────────────────────────
  socket.on('typing-start', ({ meetingId, userName }) => {
    socket.to(`meeting:${meetingId}`).emit('user-typing', {
      userId,
      userName: userName || 'Someone',
    });
  });

  socket.on('typing-stop', ({ meetingId }) => {
    socket.to(`meeting:${meetingId}`).emit('user-stopped-typing', { userId });
  });

  // ─── Message Reaction (real-time broadcast) ───────────────────────────────
  socket.on('message-reaction', ({ meetingId, messageId, emoji }) => {
    ns.to(`meeting:${meetingId}`).emit('message-reaction-update', {
      messageId,
      emoji,
      userId,
    });
  });

  // ─── Message Deleted (real-time broadcast) ────────────────────────────────
  socket.on('message-deleted', ({ meetingId, messageId }) => {
    ns.to(`meeting:${meetingId}`).emit('message-deleted', { messageId, deletedBy: userId });
  });
};

module.exports = { setupChatSocket };
