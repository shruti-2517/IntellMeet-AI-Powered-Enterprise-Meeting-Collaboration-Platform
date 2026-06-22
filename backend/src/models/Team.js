/**
 * IntellMeet Backend – Team Mongoose Model
 * Team workspace with members, Kanban columns, and invite codes.
 */

const mongoose = require('mongoose');
const { generateInviteCode } = require('../utils/generateMeetingId');

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const kanbanColumnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, maxlength: 50 },
    order: { type: Number, required: true },
    color: { type: String, default: '#6366f1' },
  },
  { _id: false }
);

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Team must have an owner'],
    },
    members: [memberSchema],
    inviteCode: {
      type: String,
      unique: true,
      index: true,
    },
    isPrivate: { type: Boolean, default: false },
    settings: {
      allowMemberInvite: { type: Boolean, default: true },
      defaultMeetingSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    kanbanColumns: {
      type: [kanbanColumnSchema],
      default: [
        { id: 'todo', name: 'To Do', order: 0, color: '#94a3b8' },
        { id: 'in-progress', name: 'In Progress', order: 1, color: '#6366f1' },
        { id: 'review', name: 'In Review', order: 2, color: '#f59e0b' },
        { id: 'completed', name: 'Completed', order: 3, color: '#10b981' },
      ],
    },
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
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ owner: 1 });

// ─── Pre-validate Hook: Generate invite code ──────────────────────────────────
teamSchema.pre('validate', function (next) {
  if (!this.inviteCode) {
    this.inviteCode = generateInviteCode();
  }
  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────
teamSchema.methods.isMember = function (userId) {
  return this.members.some((m) => m.user.toString() === userId.toString());
};

teamSchema.methods.getMemberRole = function (userId) {
  const member = this.members.find((m) => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

teamSchema.methods.isAdminOrOwner = function (userId) {
  const role = this.getMemberRole(userId);
  return role === 'owner' || role === 'admin';
};

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;
