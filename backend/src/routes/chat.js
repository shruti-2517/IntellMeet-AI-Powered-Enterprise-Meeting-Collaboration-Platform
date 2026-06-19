import express from 'express'
import { getRoomMessages } from '../controllers/chatController.js'

const router = express.Router()

// GET /api/chat/:roomId — fetch chat history for a meeting room
router.get('/:roomId', getRoomMessages)

export default router