import express from 'express'
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notificationController.js'

const router = express.Router()

router.get('/',                getMyNotifications)  // GET  /api/notifications
router.patch('/:id/read',      markAsRead)          // PATCH /api/notifications/:id/read
router.patch('/read-all',      markAllAsRead)       // PATCH /api/notifications/read-all

export default router