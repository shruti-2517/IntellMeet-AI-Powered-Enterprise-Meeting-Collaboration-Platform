/**
 * IntellMeet Backend – AI Routes
 * Base: /api/ai
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { aiLimiter } = require('../middleware/rateLimiter');
const { uploadAudio, handleMulterError } = require('../middleware/upload');

router.post('/transcribe', verifyToken, aiLimiter, uploadAudio, handleMulterError, aiController.transcribeAudio);
router.post('/summarize/:meetingId', verifyToken, aiLimiter, aiController.generateSummary);
router.post('/extract-actions', verifyToken, aiLimiter, aiController.extractActions);
router.post('/improve-summary/:meetingId', verifyToken, aiLimiter, aiController.improveSummary);
router.get('/summary/:meetingId', verifyToken, aiController.getSummary);

module.exports = router;
