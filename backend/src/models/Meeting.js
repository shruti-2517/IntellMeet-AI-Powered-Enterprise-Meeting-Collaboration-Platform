import mongoose from 'mongoose'

const actionItemSchema = new mongoose.Schema({
  text:     { type: String, required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  done:     { type: Boolean, default: false }
})

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    roomId: {
      type: String,
      unique: true,
      required: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    scheduledAt: { type: Date },
    startedAt:   { type: Date },
    endedAt:     { type: Date },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended'],
      default: 'scheduled',
    },
    recording:   { type: String, default: '' },
    transcript:  { type: String, default: '' },
    summary:     { type: String, default: '' },
    actionItems: [actionItemSchema],
  },
  { timestamps: true }
)

export default mongoose.model('Meeting', meetingSchema)