/**
 * IntellMeet Backend – Team Controller
 */

const Team = require('../models/Team');
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const { generateInviteCode } = require('../utils/generateMeetingId');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const { sendSuccess, sendError, buildPagination } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { KEYS, TTL, get: cacheGet, set: cacheSet, del: cacheDel } = require('../services/cache.service');

// ─── Create Team ──────────────────────────────────────────────────────────────
exports.createTeam = asyncHandler(async (req, res) => {
  const { name, description, isPrivate } = req.body;

  const team = await Team.create({
    name: name.trim(),
    description: description?.trim() || '',
    owner: req.user.userId,
    members: [{ user: req.user.userId, role: 'owner', joinedAt: new Date() }],
    isPrivate: isPrivate || false,
  });

  // Add team to owner's profile
  await User.findByIdAndUpdate(req.user.userId, { $addToSet: { teams: team._id } });

  await team.populate('owner', 'name email avatar');
  return sendSuccess(res, 201, { team }, 'Team created successfully');
});

// ─── Get My Teams ─────────────────────────────────────────────────────────────
exports.getMyTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find({ 'members.user': req.user.userId })
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar isOnline')
    .sort({ createdAt: -1 });

  return sendSuccess(res, 200, { teams }, 'Teams retrieved');
});

// ─── Get Team by ID ───────────────────────────────────────────────────────────
exports.getTeamById = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  const cached = await cacheGet(KEYS.team(teamId));
  if (cached) return sendSuccess(res, 200, { team: cached }, 'Team retrieved');

  const team = await Team.findById(teamId)
    .populate('owner', 'name email avatar')
    .populate('members.user', 'name email avatar isOnline lastSeen');

  if (!team) return sendError(res, 404, 'Team not found.');
  if (!team.isMember(req.user.userId)) return sendError(res, 403, 'You are not a member of this team.');

  await cacheSet(KEYS.team(teamId), team, TTL.TEAM);
  return sendSuccess(res, 200, { team }, 'Team retrieved');
});

// ─── Update Team ──────────────────────────────────────────────────────────────
exports.updateTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const team = await Team.findById(teamId);

  if (!team) return sendError(res, 404, 'Team not found.');
  if (!team.isAdminOrOwner(req.user.userId)) {
    return sendError(res, 403, 'Only admins or the owner can update this team.');
  }

  const allowedFields = ['name', 'description', 'isPrivate', 'settings'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) team[field] = req.body[field];
  });

  await team.save();
  await cacheDel(KEYS.team(teamId));
  return sendSuccess(res, 200, { team }, 'Team updated successfully');
});

// ─── Delete Team ──────────────────────────────────────────────────────────────
exports.deleteTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const team = await Team.findById(teamId);

  if (!team) return sendError(res, 404, 'Team not found.');
  if (team.owner.toString() !== req.user.userId) {
    return sendError(res, 403, 'Only the team owner can delete this team.');
  }

  // Remove team from all members' profiles
  const memberIds = team.members.map((m) => m.user);
  await User.updateMany({ _id: { $in: memberIds } }, { $pull: { teams: team._id } });

  await team.deleteOne();
  await cacheDel(KEYS.team(teamId));
  return sendSuccess(res, 200, null, 'Team deleted successfully');
});

// ─── Invite by Email ──────────────────────────────────────────────────────────
exports.inviteMember = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { email } = req.body;

  const team = await Team.findById(teamId);
  if (!team) return sendError(res, 404, 'Team not found.');

  if (!team.isAdminOrOwner(req.user.userId) && !team.settings.allowMemberInvite) {
    return sendError(res, 403, 'You do not have permission to invite members.');
  }

  const inviteLink = `${process.env.CLIENT_URL}/join-team/${team.inviteCode}`;
  return sendSuccess(res, 200, { inviteLink, inviteCode: team.inviteCode },
    email ? `Invitation sent to ${email}` : 'Invite link generated');
});

// ─── Join via Invite Code ─────────────────────────────────────────────────────
exports.joinTeam = asyncHandler(async (req, res) => {
  const { inviteCode } = req.params;
  const team = await Team.findOne({ inviteCode });

  if (!team) return sendError(res, 404, 'Invalid invite code.');
  if (team.isMember(req.user.userId)) {
    return sendError(res, 409, 'You are already a member of this team.');
  }

  team.members.push({ user: req.user.userId, role: 'member', joinedAt: new Date() });
  await team.save();

  await User.findByIdAndUpdate(req.user.userId, { $addToSet: { teams: team._id } });
  await cacheDel(KEYS.team(team._id.toString()));

  await team.populate('owner', 'name email avatar');
  return sendSuccess(res, 200, { team }, 'Joined team successfully');
});

// ─── Remove Member ────────────────────────────────────────────────────────────
exports.removeMember = asyncHandler(async (req, res) => {
  const { teamId, userId } = req.params;
  const team = await Team.findById(teamId);

  if (!team) return sendError(res, 404, 'Team not found.');
  if (!team.isAdminOrOwner(req.user.userId)) {
    return sendError(res, 403, 'Only admins or the owner can remove members.');
  }
  if (team.owner.toString() === userId) {
    return sendError(res, 400, 'Cannot remove the team owner.');
  }

  team.members = team.members.filter((m) => m.user.toString() !== userId);
  await team.save();
  await User.findByIdAndUpdate(userId, { $pull: { teams: team._id } });
  await cacheDel(KEYS.team(teamId));

  return sendSuccess(res, 200, null, 'Member removed from team');
});

// ─── Change Member Role ───────────────────────────────────────────────────────
exports.changeMemberRole = asyncHandler(async (req, res) => {
  const { teamId, userId } = req.params;
  const { role } = req.body;

  if (!['admin', 'member'].includes(role)) {
    return sendError(res, 400, 'Role must be admin or member.');
  }

  const team = await Team.findById(teamId);
  if (!team) return sendError(res, 404, 'Team not found.');
  if (team.owner.toString() !== req.user.userId) {
    return sendError(res, 403, 'Only the team owner can change member roles.');
  }

  const member = team.members.find((m) => m.user.toString() === userId);
  if (!member) return sendError(res, 404, 'Member not found in team.');

  member.role = role;
  await team.save();
  await cacheDel(KEYS.team(teamId));

  return sendSuccess(res, 200, null, `Member role updated to ${role}`);
});

// ─── Upload Team Avatar ───────────────────────────────────────────────────────
exports.uploadTeamAvatar = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  if (!req.file) return sendError(res, 400, 'Please provide an image file.');

  const team = await Team.findById(teamId);
  if (!team) return sendError(res, 404, 'Team not found.');
  if (!team.isAdminOrOwner(req.user.userId)) {
    return sendError(res, 403, 'Only admins can change the team avatar.');
  }

  if (team.avatar?.publicId) {
    await deleteFromCloudinary(team.avatar.publicId).catch(() => {});
  }

  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'intellmeet/team-avatars',
    width: 300,
    height: 300,
    crop: 'fill',
  });

  team.avatar = { url: result.secure_url, publicId: result.public_id };
  await team.save();
  await cacheDel(KEYS.team(teamId));

  return sendSuccess(res, 200, { avatar: team.avatar }, 'Team avatar updated');
});

// ─── Get Team Meetings ────────────────────────────────────────────────────────
exports.getTeamMeetings = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const team = await Team.findById(teamId);
  if (!team) return sendError(res, 404, 'Team not found.');
  if (!team.isMember(req.user.userId)) return sendError(res, 403, 'Access denied.');

  const meetings = await Meeting.find({ team: teamId })
    .populate('host', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(50);

  return sendSuccess(res, 200, { meetings }, 'Team meetings retrieved');
});

// ─── Update Kanban Columns ────────────────────────────────────────────────────
exports.updateKanbanColumns = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { columns } = req.body;

  const team = await Team.findById(teamId);
  if (!team) return sendError(res, 404, 'Team not found.');
  if (!team.isAdminOrOwner(req.user.userId)) return sendError(res, 403, 'Only admins can update columns.');

  team.kanbanColumns = columns;
  await team.save();
  await cacheDel(KEYS.team(teamId));

  return sendSuccess(res, 200, { kanbanColumns: team.kanbanColumns }, 'Kanban columns updated');
});

// ─── Leave Team ───────────────────────────────────────────────────────────────
exports.leaveTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const team = await Team.findById(teamId);
  if (!team) return sendError(res, 404, 'Team not found.');

  if (team.owner.toString() === req.user.userId) {
    return sendError(res, 400, 'Team owner cannot leave. Transfer ownership or delete the team.');
  }

  team.members = team.members.filter((m) => m.user.toString() !== req.user.userId);
  await team.save();
  await User.findByIdAndUpdate(req.user.userId, { $pull: { teams: team._id } });
  await cacheDel(KEYS.team(teamId));

  return sendSuccess(res, 200, null, 'You have left the team');
});

// ─── Regenerate Invite Code ───────────────────────────────────────────────────
exports.regenerateInviteCode = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const team = await Team.findById(teamId);
  if (!team) return sendError(res, 404, 'Team not found.');
  if (!team.isAdminOrOwner(req.user.userId)) return sendError(res, 403, 'Only admins can regenerate invite codes.');

  team.inviteCode = generateInviteCode();
  await team.save();
  await cacheDel(KEYS.team(teamId));

  return sendSuccess(res, 200, { inviteCode: team.inviteCode }, 'Invite code regenerated');
});
