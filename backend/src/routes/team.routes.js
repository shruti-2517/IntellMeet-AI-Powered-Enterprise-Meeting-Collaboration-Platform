/**
 * IntellMeet Backend – Team Routes
 * Base: /api/teams
 */

const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { uploadTeamAvatar, handleMulterError } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validateCreateTeam } = require('../middleware/validate');

router.post('/', verifyToken, validateCreateTeam, teamController.createTeam);
router.get('/', verifyToken, teamController.getMyTeams);
router.get('/:teamId', verifyToken, teamController.getTeamById);
router.put('/:teamId', verifyToken, teamController.updateTeam);
router.delete('/:teamId', verifyToken, teamController.deleteTeam);
router.post('/:teamId/invite', verifyToken, teamController.inviteMember);
router.post('/join/:inviteCode', verifyToken, teamController.joinTeam);
router.delete('/:teamId/members/:userId', verifyToken, teamController.removeMember);
router.put('/:teamId/members/:userId/role', verifyToken, teamController.changeMemberRole);
router.post('/:teamId/avatar', verifyToken, uploadLimiter, uploadTeamAvatar, handleMulterError, teamController.uploadTeamAvatar);
router.get('/:teamId/meetings', verifyToken, teamController.getTeamMeetings);
router.put('/:teamId/columns', verifyToken, teamController.updateKanbanColumns);
router.post('/:teamId/leave', verifyToken, teamController.leaveTeam);
router.post('/:teamId/regenerate-invite', verifyToken, teamController.regenerateInviteCode);

module.exports = router;
