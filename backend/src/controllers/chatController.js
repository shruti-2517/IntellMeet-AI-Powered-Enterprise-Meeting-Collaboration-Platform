import ChatMessage from '../models/ChatMessage.js'

// GET /api/chat/:roomId — get chat history for a room
export const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params
    const limit = parseInt(req.query.limit) || 50

    const messages = await ChatMessage.find({ roomId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 })          // oldest first
      .limit(limit)

    res.json({ success: true, messages })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// POST /api/chat/:roomId — save a message (called internally by socket)
export const saveMessage = async (roomId, senderId, senderName, message, meetingId) => {
  try {
    const msg = await ChatMessage.create({
      roomId,
      meeting: meetingId || null,
      sender: senderId,
      senderName,
      message,
    })
    return msg
  } catch (err) {
    console.error('Error saving chat message:', err.message)
    return null
  }
}