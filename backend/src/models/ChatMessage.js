import mongoose from 'mongoose'

const chatMessageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,       // index for fast queries by room
    },
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'system'],
      default: 'text',
    },
  },
  { timestamps: true }
)

export default mongoose.model('ChatMessage', chatMessageSchema)