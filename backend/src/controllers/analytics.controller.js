/**
 * IntellMeet Backend – Analytics Controller
 */

const Meeting = require('../models/Meeting');
const Task = require('../models/Task');
const User = require('../models/User');
const Team = require('../models/Team');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// ─── Personal Analytics ───────────────────────────────────────────────────────
exports.getPersonalAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalMeetingsThisWeek,
    totalMeetingsThisMonth,
    hostedMeetings,
    tasksCompleted,
    tasksOverdue,
    totalTasks,
    avgMeetingDuration,
  ] = await Promise.all([
    Meeting.countDocuments({
      'participants.user': userId,
      createdAt: { $gte: sevenDaysAgo },
    }),
    Meeting.countDocuments({
      'participants.user': userId,
      createdAt: { $gte: thirtyDaysAgo },
    }),
    Meeting.countDocuments({ host: userId }),
    Task.countDocuments({ assignee: userId, status: 'completed' }),
    Task.countDocuments({
      assignee: userId,
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] },
    }),
    Task.countDocuments({ assignee: userId }),
    Meeting.aggregate([
      {
        $match: {
          host: require('mongoose').Types.ObjectId.createFromHexString
            ? require('mongoose').Types.ObjectId.createFromHexString(userId.toString())
            : require('mongoose').Types.ObjectId(userId.toString()),
          status: 'ended',
          duration: { $gt: 0 },
        },
      },
      { $group: { _id: null, avg: { $avg: '$duration' } } },
    ]),
  ]);

  const taskCompletionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
  const avgDuration = avgMeetingDuration[0]?.avg || 0;

  return sendSuccess(res, 200, {
    analytics: {
      meetings: {
        thisWeek: totalMeetingsThisWeek,
        thisMonth: totalMeetingsThisMonth,
        hosted: hostedMeetings,
        avgDurationMinutes: Math.round(avgDuration),
      },
      tasks: {
        total: totalTasks,
        completed: tasksCompleted,
        overdue: tasksOverdue,
        completionRate: taskCompletionRate,
      },
    },
  }, 'Personal analytics retrieved');
});

// ─── Team Analytics ───────────────────────────────────────────────────────────
exports.getTeamAnalytics = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  const team = await Team.findById(teamId).populate('members.user', 'name email');
  if (!team) return sendError(res, 404, 'Team not found.');
  if (!team.isMember(req.user.userId)) return sendError(res, 403, 'Access denied.');

  const memberIds = team.members.map((m) => m.user._id);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalMeetings, completedTasks, totalTasks, topMembers] = await Promise.all([
    Meeting.countDocuments({ team: teamId, createdAt: { $gte: thirtyDaysAgo } }),
    Task.countDocuments({ team: teamId, status: 'completed' }),
    Task.countDocuments({ team: teamId }),
    Task.aggregate([
      { $match: { team: require('mongoose').Types.ObjectId.createFromHexString
        ? require('mongoose').Types.ObjectId.createFromHexString(teamId.toString())
        : require('mongoose').Types.ObjectId(teamId.toString()), status: 'completed' } },
      { $group: { _id: '$assignee', completedCount: { $sum: 1 } } },
      { $sort: { completedCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { 'user.name': 1, 'user.avatar': 1, completedCount: 1 } },
    ]),
  ]);

  return sendSuccess(res, 200, {
    analytics: {
      teamId,
      teamName: team.name,
      memberCount: team.members.length,
      meetings: { last30Days: totalMeetings },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      topPerformers: topMembers,
    },
  }, 'Team analytics retrieved');
});

// ─── Meeting Trends (last 30 days, daily chart data) ──────────────────────────
exports.getMeetingTrends = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const meetings = await Meeting.aggregate([
    {
      $match: {
        $or: [
          { host: require('mongoose').Types.ObjectId.createFromHexString
            ? require('mongoose').Types.ObjectId.createFromHexString(userId.toString())
            : require('mongoose').Types.ObjectId(userId.toString()) },
          { 'participants.user': require('mongoose').Types.ObjectId.createFromHexString
            ? require('mongoose').Types.ObjectId.createFromHexString(userId.toString())
            : require('mongoose').Types.ObjectId(userId.toString()) },
        ],
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        count: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);

  const chartData = meetings.map((item) => ({
    date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
    meetings: item.count,
    totalMinutes: item.totalDuration,
  }));

  return sendSuccess(res, 200, { chartData, period: 'last30days' }, 'Meeting trends retrieved');
});

// ─── Productivity Score ───────────────────────────────────────────────────────
exports.getProductivity = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    recentCompleted,
    recentTotal,
    onTimeTasks,
    lateTasks,
  ] = await Promise.all([
    Task.countDocuments({ assignee: userId, status: 'completed', completedAt: { $gte: sevenDaysAgo } }),
    Task.countDocuments({ assignee: userId, createdAt: { $gte: sevenDaysAgo } }),
    Task.countDocuments({
      assignee: userId,
      status: 'completed',
      $expr: { $lte: ['$completedAt', '$dueDate'] },
    }),
    Task.countDocuments({
      assignee: userId,
      status: 'completed',
      $expr: { $gt: ['$completedAt', '$dueDate'] },
    }),
  ]);

  const completionRate = recentTotal > 0 ? Math.round((recentCompleted / recentTotal) * 100) : 0;
  const onTimeRate = (onTimeTasks + lateTasks) > 0
    ? Math.round((onTimeTasks / (onTimeTasks + lateTasks)) * 100)
    : 100;

  // Simple weighted productivity score (0–100)
  const productivityScore = Math.round((completionRate * 0.6) + (onTimeRate * 0.4));

  return sendSuccess(res, 200, {
    productivity: {
      score: productivityScore,
      tasksCompletedThisWeek: recentCompleted,
      completionRate,
      onTimeRate,
      onTimeTasks,
      lateTasks,
      level: productivityScore >= 80 ? 'Excellent' : productivityScore >= 60 ? 'Good' : productivityScore >= 40 ? 'Fair' : 'Needs Improvement',
    },
  }, 'Productivity score retrieved');
});
