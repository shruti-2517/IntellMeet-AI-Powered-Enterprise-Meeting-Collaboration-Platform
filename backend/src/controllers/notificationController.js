import Notification from '../models/Notification.js'

// GET /api/notifications — get all notifications for logged-in user
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({ success: true, notifications })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PATCH /api/notifications/:id/read — mark one as read
export const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    )
    res.json({ success: true, notification: notif })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PATCH /api/notifications/read-all — mark all as read
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    )
    res.json({ success: true, message: 'All notifications marked as read' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// Helper: create a notification + send via socket (used internally)
export const createNotification = async (io, recipientId, type, title, message, meetingId) => {
  try {
    const notif = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      meeting: meetingId || null,
    })
    // Send real-time notification via socket
    io.to(`user:${recipientId}`).emit('new-notification', notif)
    return notif
  } catch (err) {
    console.error('Error creating notification:', err.message)
  }
}