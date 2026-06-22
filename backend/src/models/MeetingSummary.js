/**
 * IntellMeet Backend – MeetingSummary Mongoose Model
 * Stores AI-generated transcripts, summaries, and action items.
 */

const mongoose = require('mongoose');

const transcriptSegmentSchema = new mongoose.Schema(
  {
    speaker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    speakerName: { type: String },
    text: { type: String, required: true },
    timestamp: { type: Number, default: 0 }, // seconds from start
    confidence: { type: Number, min: 0, max: 1, default: 1 },
  },
  { _id: false }
);

const actionItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assigneeName: { type: String, default: '' },
    dueDate: { type: Date },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    createdTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  },
  { _id: true }
);

const meetingSummarySchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      unique: true,
    },
    transcript: [transcriptSegmentSchema],
    summary: {
      type: String,
      maxlength: [3000, 'Summary cannot exceed 3000 characters'],
      default: '',
    },
    keyPoints: [{ type: String, maxlength: 500 }],
    actionItems: [actionItemSchema],
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'neutral',
    },
    topics: [{ type: String, maxlength: 100 }],
    generatedAt: { type: Date, default: Date.now },
    model: { type: String, default: 'gpt-4o' }, // Which AI model generated this
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

meetingSummarySchema.index({ meeting: 1 }, { unique: true });

const MeetingSummary = mongoose.model('MeetingSummary', meetingSummarySchema);
module.exports = MeetingSummary;
