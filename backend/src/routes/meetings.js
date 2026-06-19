import express from 'express'
import {
  createMeeting,
  getMyMeetings,
  getMeeting,
  joinMeeting,
  endMeeting,
  addActionItem,
  toggleActionItem,
} from '../controllers/meetingController.js'

const router = express.Router()

router.get('/',            getMyMeetings)  // GET  /api/meetings
router.post('/',           createMeeting)  // POST /api/meetings
router.get('/:id',         getMeeting)     // GET  /api/meetings/:id
router.patch('/:id/join',  joinMeeting)    // PATCH /api/meetings/:id/join
router.patch('/:id/end',   endMeeting)     // PATCH /api/meetings/:id/end
router.post('/:id/action-items',             addActionItem) // POST /api/meetings/:id/action-items 
router.patch('/:id/action-items/:itemId',    toggleActionItem)  // PATCH /api/meetings/:id/action-items/:itemId 

export default router