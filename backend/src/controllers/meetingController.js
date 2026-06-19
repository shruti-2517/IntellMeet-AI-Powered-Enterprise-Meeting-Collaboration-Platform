import { v4 as uuidv4 } from 'uuid'
import Meeting from '../models/Meeting.js'

// POST /api/meetings — create a new meeting
export const createMeeting = async (req, res) => {
  try {
    const { title, description, teamId, scheduledAt } = req.body

    const meeting = await Meeting.create({
      title,
      description: description || '',
      roomId: uuidv4(),
      host: req.user._id,     // req.user is set by Person 1's authenticate middleware
      team: teamId || null,
      scheduledAt: scheduledAt || null,
    })

    res.status(201).json({ success: true, meeting })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/meetings — get all meetings for logged-in user
export const getMyMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [
        { host: req.user._id },
        { participants: req.user._id },
      ],
    })
      .populate('host', 'name email')
      .sort({ createdAt: -1 })

    res.json({ success: true, meetings })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// GET /api/meetings/:id — get one meeting by ID
export const getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('host', 'name email')
      .populate('participants', 'name email')

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' })
    }

    res.json({ success: true, meeting })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PATCH /api/meetings/:id/join — join an existing meeting
export const joinMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: { participants: req.user._id },
        status: 'active',
        startedAt: new Date(),
      },
      { new: true }
    )

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' })
    }

    res.json({ success: true, meeting })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PATCH /api/meetings/:id/end — end a meeting
export const endMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { status: 'ended', endedAt: new Date() },
      { new: true }
    )

    res.json({ success: true, meeting })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
// POST /api/meetings/:id/action-items — add an action item
export const addActionItem = async (req, res) => {
  try {
    const { text, assigneeId } = req.body

    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          actionItems: {
            text,
            assignee: assigneeId || null,
            done: false,
          },
        },
      },
      { new: true }
    ).populate('actionItems.assignee', 'name email')

    res.status(201).json({ success: true, meeting })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// PATCH /api/meetings/:id/action-items/:itemId — toggle action item done
export const toggleActionItem = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' })

    const item = meeting.actionItems.id(req.params.itemId)
    if (!item) return res.status(404).json({ message: 'Action item not found' })

    item.done = !item.done
    await meeting.save()

    res.json({ success: true, meeting })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}