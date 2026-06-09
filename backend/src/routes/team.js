import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { createTeam, inviteTeamMember, acceptInvite, getTeam } from '../controllers/teamController.js'

const router = express.Router()

router.post('/', authenticate, createTeam)
router.post('/:teamId/invite', authenticate, inviteTeamMember)
router.post('/invites/accept', authenticate, acceptInvite)
router.get('/:teamId', authenticate, getTeam)

export default router
