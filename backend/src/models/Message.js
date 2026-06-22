/**
 * IntellMeet Backend – Message Mongoose Model
 * In-meeting chat messages with reactions and reply threading.
 */

const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema(
  {
    emoji: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: { type: String, default: '' },
    senderAvatar: { type: String, default: '' },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    type: {
      type: String,
      enum: ['text', 'file', 'system', 'reaction'],
      default: 'text',
    },
    file: {
      url: { type: String },
      name: { type: String },
      size: { type: Number },
      mimeType: { type: String },
    },
    reactions: [reactionSchema],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        if (ret.isDeleted) {
          ret.content = '[Message deleted]';
          delete ret.file;
        }
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
messageSchema.index({ meeting: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
