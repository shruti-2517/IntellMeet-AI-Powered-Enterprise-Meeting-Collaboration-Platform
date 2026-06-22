/**
 * IntellMeet Backend – Message Routes
 * Base: /api/messages
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { verifyToken, loadUser } = require('../middleware/auth.middleware');
const { validateSendMessage } = require('../middleware/validate');

router.get('/meeting/:meetingId', verifyToken, messageController.getMessages);
router.post('/meeting/:meetingId', verifyToken, loadUser, validateSendMessage, messageController.sendMessage);
router.delete('/:messageId', verifyToken, messageController.deleteMessage);
router.post('/:messageId/react', verifyToken, messageController.toggleReaction);

module.exports = router;
