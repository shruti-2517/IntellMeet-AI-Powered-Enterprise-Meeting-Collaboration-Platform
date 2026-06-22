/**
 * IntellMeet Backend – Task Mongoose Model
 * Supports Kanban board ordering, comments, and attachments.
 */

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
    publicId: { type: String, default: '' },
    size: { type: Number, default: 0 },
    mimeType: { type: String, default: '' },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', default: null },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'review', 'completed', 'cancelled'],
      default: 'todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    dueDate: { type: Date, index: true },
    completedAt: { type: Date },
    tags: [{ type: String, maxlength: 50 }],
    attachments: [attachmentSchema],
    comments: [commentSchema],
    order: { type: Number, default: 0 }, // For Kanban ordering
    column: { type: String, default: 'todo' }, // Kanban column name
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ team: 1, status: 1 });
taskSchema.index({ team: 1, column: 1, order: 1 });

// ─── Pre-save Hook ────────────────────────────────────────────────────────────
taskSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
