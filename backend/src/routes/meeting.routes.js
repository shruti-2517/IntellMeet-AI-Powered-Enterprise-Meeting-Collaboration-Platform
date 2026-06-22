/**
 * IntellMeet Backend – Meeting Routes
 * Base: /api/meetings
 */

const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meeting.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validateCreateMeeting } = require('../middleware/validate');

router.post('/', verifyToken, validateCreateMeeting, meetingController.createMeeting);
router.get('/', verifyToken, meetingController.getMeetings);
router.get('/upcoming', verifyToken, meetingController.getUpcoming);
router.get('/history', verifyToken, meetingController.getHistory);
router.get('/:meetingId', verifyToken, meetingController.getMeetingById);
router.put('/:meetingId', verifyToken, meetingController.updateMeeting);
router.delete('/:meetingId', verifyToken, meetingController.deleteMeeting);
router.post('/:meetingId/join', verifyToken, meetingController.joinMeeting);
router.post('/:meetingId/leave', verifyToken, meetingController.leaveMeeting);
router.post('/:meetingId/end', verifyToken, meetingController.endMeeting);
router.post('/:meetingId/lock', verifyToken, meetingController.lockMeeting);
router.post('/:meetingId/kick/:userId', verifyToken, meetingController.kickParticipant);
router.put('/:meetingId/participant/:userId', verifyToken, meetingController.updateParticipant);
router.post('/:meetingId/recording/start', verifyToken, meetingController.startRecording);
router.post('/:meetingId/recording/stop', verifyToken, meetingController.stopRecording);
router.get('/:meetingId/summary', verifyToken, meetingController.getMeetingSummary);
router.post('/:meetingId/invite', verifyToken, meetingController.inviteParticipants);

module.exports = router;
