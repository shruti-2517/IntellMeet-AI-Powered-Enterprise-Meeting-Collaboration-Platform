/**
 * IntellMeet Backend – Meeting Mongoose Model
 */

const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: {
      type: String,
      enum: ['host', 'co-host', 'participant'],
      default: 'participant',
    },
    joinedAt: { type: Date },
    leftAt: { type: Date },
    isMuted: { type: Boolean, default: false },
    isVideoOn: { type: Boolean, default: true },
  },
  { _id: false }
);

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    meetingId: {
      type: String,
      unique: true,
      index: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Meeting must have a host'],
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    participants: [participantSchema],
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    scheduledAt: { type: Date, index: true },
    startedAt: { type: Date },
    endedAt: { type: Date },
    duration: { type: Number, default: 0 }, // in minutes
    isRecording: { type: Boolean, default: false },
    recording: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      duration: { type: Number, default: 0 },
    },
    settings: {
      allowGuestJoin: { type: Boolean, default: false },
      requireApproval: { type: Boolean, default: false },
      muteOnEntry: { type: Boolean, default: false },
      maxParticipants: { type: Number, default: 50 },
      isLocked: { type: Boolean, default: false },
      password: { type: String, default: '', select: false },
    },
    summary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MeetingSummary',
      default: null,
    },
    agenda: [{ type: String, maxlength: 500 }],
    tags: [{ type: String, maxlength: 50 }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.__v;
        if (ret.settings) delete ret.settings.password;
        return ret;
      },
    },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
meetingSchema.index({ host: 1, status: 1 });
meetingSchema.index({ 'participants.user': 1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────
meetingSchema.virtual('participantCount').get(function () {
  return this.participants ? this.participants.length : 0;
});

meetingSchema.virtual('isActive').get(function () {
  return this.status === 'active';
});

const Meeting = mongoose.model('Meeting', meetingSchema);
module.exports = Meeting;
