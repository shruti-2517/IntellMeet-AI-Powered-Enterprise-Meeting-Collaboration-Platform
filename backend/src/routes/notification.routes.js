/**
 * IntellMeet Backend – Notification Routes
 * Base: /api/notifications
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/', verifyToken, notificationController.getNotifications);
router.get('/unread-count', verifyToken, notificationController.getUnreadCount);
router.put('/read-all', verifyToken, notificationController.markAllAsRead);
router.delete('/clear-all', verifyToken, notificationController.clearAll);
router.put('/:notifId/read', verifyToken, notificationController.markAsRead);
router.delete('/:notifId', verifyToken, notificationController.deleteNotification);

module.exports = router;
