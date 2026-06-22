/**
 * IntellMeet Backend – Meeting Socket Handler
 * WebRTC signaling: offer/answer/ICE candidates + meeting room events.
 */

const logger = require('../middleware/logger');

/**
 * Setup meeting room socket events.
 * @param {import('socket.io').Server} io
 * @param {import('socket.io').Namespace} ns
 * @param {import('socket.io').Socket} socket
 */
const setupMeetingSocket = (io, ns, socket) => {
  const userId = socket.userId;

  // ─── Join Room ───────────────────────────────────────────────────────────
  socket.on('join-room', ({ meetingId, userName, avatar }) => {
    const room = `meeting:${meetingId}`;
    socket.join(room);
    socket.meetingId = meetingId;

    // Get current participants in the room
    const socketsInRoom = ns.adapter.rooms.get(room);
    const participantCount = socketsInRoom ? socketsInRoom.size : 1;

    logger.info(`User ${userId} joined meeting room: ${meetingId}`);

    // Notify others in the room
    socket.to(room).emit('user-joined', {
      userId,
      userName,
      avatar,
      socketId: socket.id,
      participantCount,
    });

    // Send current room info back to joining user
    socket.emit('room-info', {
      meetingId,
      room,
      participantCount,
    });
  });

  // ─── Leave Room ──────────────────────────────────────────────────────────
  socket.on('leave-room', ({ meetingId }) => {
    const room = `meeting:${meetingId}`;
    socket.leave(room);
    socket.to(room).emit('user-left', { userId, socketId: socket.id });
    logger.info(`User ${userId} left meeting room: ${meetingId}`);
  });

  // ─── WebRTC Signaling: Offer ──────────────────────────────────────────────
  socket.on('offer', ({ to, offer }) => {
    ns.to(to).emit('offer', { from: socket.id, offer });
  });

  // ─── WebRTC Signaling: Answer ─────────────────────────────────────────────
  socket.on('answer', ({ to, answer }) => {
    ns.to(to).emit('answer', { from: socket.id, answer });
  });

  // ─── WebRTC Signaling: ICE Candidate ──────────────────────────────────────
  socket.on('ice-candidate', ({ to, candidate }) => {
    ns.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  // ─── Toggle Mute ─────────────────────────────────────────────────────────
  socket.on('toggle-mute', ({ meetingId, isMuted }) => {
    const room = `meeting:${meetingId}`;
    socket.to(room).emit('participant-muted', { userId, socketId: socket.id, isMuted });
  });

  // ─── Toggle Video ─────────────────────────────────────────────────────────
  socket.on('toggle-video', ({ meetingId, isVideoOn }) => {
    const room = `meeting:${meetingId}`;
    socket.to(room).emit('participant-video', { userId, socketId: socket.id, isVideoOn });
  });

  // ─── Screen Share ─────────────────────────────────────────────────────────
  socket.on('start-screen-share', ({ meetingId }) => {
    socket.to(`meeting:${meetingId}`).emit('screen-share-started', { userId, socketId: socket.id });
  });

  socket.on('stop-screen-share', ({ meetingId }) => {
    socket.to(`meeting:${meetingId}`).emit('screen-share-stopped', { userId, socketId: socket.id });
  });

  // ─── Raise Hand ──────────────────────────────────────────────────────────
  socket.on('raise-hand', ({ meetingId }) => {
    socket.to(`meeting:${meetingId}`).emit('hand-raised', { userId, socketId: socket.id });
  });

  // ─── Reaction ─────────────────────────────────────────────────────────────
  socket.on('reaction', ({ meetingId, emoji }) => {
    ns.to(`meeting:${meetingId}`).emit('reaction-received', {
      userId,
      socketId: socket.id,
      emoji,
      timestamp: Date.now(),
    });
  });

  // ─── Recording ────────────────────────────────────────────────────────────
  socket.on('start-recording', ({ meetingId }) => {
    ns.to(`meeting:${meetingId}`).emit('recording-started', { startedBy: userId });
  });

  socket.on('stop-recording', ({ meetingId }) => {
    ns.to(`meeting:${meetingId}`).emit('recording-stopped', { stoppedBy: userId });
  });

  // ─── Kick Participant ─────────────────────────────────────────────────────
  socket.on('kick-participant', ({ meetingId, targetUserId }) => {
    ns.to(`meeting:${meetingId}`).emit('participant-kicked', {
      userId: targetUserId,
      kickedBy: userId,
    });
  });

  // ─── Lock Room ────────────────────────────────────────────────────────────
  socket.on('lock-room', ({ meetingId, isLocked }) => {
    ns.to(`meeting:${meetingId}`).emit('room-locked', { isLocked, lockedBy: userId });
  });

  // ─── Meeting Ended ────────────────────────────────────────────────────────
  socket.on('end-meeting', ({ meetingId }) => {
    ns.to(`meeting:${meetingId}`).emit('meeting-ended', { meetingId, endedBy: userId });
  });

  // ─── Disconnect: Auto-leave room ─────────────────────────────────────────
  socket.on('disconnect', () => {
    if (socket.meetingId) {
      socket.to(`meeting:${socket.meetingId}`).emit('user-left', {
        userId,
        socketId: socket.id,
      });
    }
  });
};

module.exports = { setupMeetingSocket };
