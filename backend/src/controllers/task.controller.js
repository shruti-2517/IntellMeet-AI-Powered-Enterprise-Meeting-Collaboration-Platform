/**
 * IntellMeet Backend – Task Controller
 * Kanban board CRUD with drag-drop reordering and comments.
 */

const Task = require('../models/Task');
const Team = require('../models/Team');
const Notification = require('../models/Notification');
const { uploadToCloudinary } = require('../config/cloudinary');
const { sendSuccess, sendError, buildPagination } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sendTaskAssignedEmail } = require('../services/email.service');
const User = require('../models/User');
const logger = require('../middleware/logger');

// ─── Create Task ──────────────────────────────────────────────────────────────
exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, assignee, team, meeting, priority, dueDate, tags, column } = req.body;

  const task = await Task.create({
    title: title.trim(),
    description: description?.trim() || '',
    assignee: assignee || null,
    assignedBy: req.user.userId,
    team: team || null,
    meeting: meeting || null,
    priority: priority || 'medium',
    dueDate: dueDate || null,
    tags: tags || [],
    column: column || 'todo',
    status: column || 'todo',
  });

  // Notify assignee
  if (assignee && assignee !== req.user.userId) {
    const [assigneeUser, assignerUser] = await Promise.all([
      User.findById(assignee).select('name email preferences'),
      User.findById(req.user.userId).select('name'),
    ]);

    if (assigneeUser) {
      await Notification.create({
        recipient: assignee,
        sender: req.user.userId,
        type: 'task_assigned',
        title: 'New Task Assigned',
        body: `${assignerUser?.name || 'Someone'} assigned you: "${title}"`,
        data: { taskId: task._id },
      });

      // Send email notification
      if (assigneeUser.preferences?.notifications?.email) {
        sendTaskAssignedEmail(
          assigneeUser.email,
          assigneeUser.name,
          title,
          assignerUser?.name || 'A team member',
          dueDate,
          null
        ).catch(() => {});
      }
    }
  }

  await task.populate('assignee', 'name email avatar');
  return sendSuccess(res, 201, { task }, 'Task created successfully');
});

// ─── Get My Tasks ─────────────────────────────────────────────────────────────
exports.getMyTasks = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;
  const { status, priority } = req.query;

  const filter = { assignee: req.user.userId };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedBy', 'name avatar')
      .populate('team', 'name')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, { tasks }, 'Tasks retrieved', buildPagination(total, page, limit));
});

// ─── Get Team Tasks (Kanban) ──────────────────────────────────────────────────
exports.getTeamTasks = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  const team = await Team.findById(teamId);
  if (!team) return sendError(res, 404, 'Team not found.');
  if (!team.isMember(req.user.userId)) return sendError(res, 403, 'You are not a member of this team.');

  const tasks = await Task.find({ team: teamId })
    .populate('assignee', 'name avatar email')
    .populate('assignedBy', 'name')
    .sort({ column: 1, order: 1 });

  // Group by column
  const columns = {};
  team.kanbanColumns.forEach((col) => {
    columns[col.id] = { ...col, tasks: [] };
  });

  tasks.forEach((task) => {
    const colId = task.column || task.status;
    if (columns[colId]) {
      columns[colId].tasks.push(task);
    } else {
      if (!columns.todo) columns.todo = { id: 'todo', name: 'To Do', tasks: [] };
      columns.todo.tasks.push(task);
    }
  });

  return sendSuccess(res, 200, { columns, tasks }, 'Team tasks retrieved');
});

// ─── Get Single Task ──────────────────────────────────────────────────────────
exports.getTaskById = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const task = await Task.findById(taskId)
    .populate('assignee', 'name email avatar')
    .populate('assignedBy', 'name email avatar')
    .populate('comments.author', 'name avatar')
    .populate('team', 'name')
    .populate('meeting', 'title meetingId');

  if (!task) return sendError(res, 404, 'Task not found.');
  return sendSuccess(res, 200, { task }, 'Task retrieved');
});

// ─── Update Task ──────────────────────────────────────────────────────────────
exports.updateTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const task = await Task.findById(taskId);
  if (!task) return sendError(res, 404, 'Task not found.');

  const allowedFields = ['title', 'description', 'status', 'priority', 'dueDate', 'tags', 'column'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  // Sync column with status
  if (req.body.status && !req.body.column) task.column = req.body.status;
  if (req.body.column && !req.body.status) task.status = req.body.column;

  await task.save();
  return sendSuccess(res, 200, { task }, 'Task updated successfully');
});

// ─── Delete Task ──────────────────────────────────────────────────────────────
exports.deleteTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const task = await Task.findById(taskId);
  if (!task) return sendError(res, 404, 'Task not found.');

  const isCreator = task.assignedBy?.toString() === req.user.userId;
  const isAdmin = req.user.role === 'admin';
  if (!isCreator && !isAdmin) {
    return sendError(res, 403, 'Only the task creator or admin can delete this task.');
  }

  await task.deleteOne();
  return sendSuccess(res, 200, null, 'Task deleted successfully');
});

// ─── Update Task Status ───────────────────────────────────────────────────────
exports.updateTaskStatus = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  const validStatuses = ['todo', 'in-progress', 'review', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return sendError(res, 400, 'Invalid status value.');
  }

  const task = await Task.findByIdAndUpdate(
    taskId,
    { status, column: status },
    { new: true }
  ).populate('assignee', 'name avatar');

  if (!task) return sendError(res, 404, 'Task not found.');
  return sendSuccess(res, 200, { task }, 'Task status updated');
});

// ─── Reassign Task ────────────────────────────────────────────────────────────
exports.assignTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { assigneeId } = req.body;

  const task = await Task.findByIdAndUpdate(
    taskId,
    { assignee: assigneeId || null },
    { new: true }
  ).populate('assignee', 'name email avatar');

  if (!task) return sendError(res, 404, 'Task not found.');
  return sendSuccess(res, 200, { task }, 'Task reassigned successfully');
});

// ─── Add Comment ──────────────────────────────────────────────────────────────
exports.addComment = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { text } = req.body;

  const task = await Task.findByIdAndUpdate(
    taskId,
    { $push: { comments: { author: req.user.userId, text: text.trim(), createdAt: new Date() } } },
    { new: true }
  ).populate('comments.author', 'name avatar');

  if (!task) return sendError(res, 404, 'Task not found.');
  const newComment = task.comments[task.comments.length - 1];
  return sendSuccess(res, 201, { comment: newComment }, 'Comment added');
});

// ─── Delete Comment ───────────────────────────────────────────────────────────
exports.deleteComment = asyncHandler(async (req, res) => {
  const { taskId, commentId } = req.params;
  const task = await Task.findById(taskId);
  if (!task) return sendError(res, 404, 'Task not found.');

  const comment = task.comments.id(commentId);
  if (!comment) return sendError(res, 404, 'Comment not found.');
  if (comment.author.toString() !== req.user.userId) {
    return sendError(res, 403, 'You can only delete your own comments.');
  }

  comment.deleteOne();
  await task.save();
  return sendSuccess(res, 200, null, 'Comment deleted');
});

// ─── Bulk Reorder (Kanban drag-drop) ─────────────────────────────────────────
exports.reorderTasks = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { tasks } = req.body; // [{ taskId, column, order }]

  if (!Array.isArray(tasks)) return sendError(res, 400, 'tasks must be an array.');

  const team = await Team.findById(teamId);
  if (!team || !team.isMember(req.user.userId)) {
    return sendError(res, 403, 'Access denied.');
  }

  await Promise.all(
    tasks.map(({ taskId, column, order }) =>
      Task.findByIdAndUpdate(taskId, { column, order, status: column })
    )
  );

  return sendSuccess(res, 200, null, 'Tasks reordered successfully');
});

// ─── Upload Attachment ────────────────────────────────────────────────────────
exports.uploadAttachment = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  if (!req.file) return sendError(res, 400, 'No file provided.');

  const result = await uploadToCloudinary(req.file.buffer, {
    folder: 'intellmeet/task-attachments',
    resource_type: 'auto',
  });

  const task = await Task.findByIdAndUpdate(
    taskId,
    {
      $push: {
        attachments: {
          url: result.secure_url,
          name: req.file.originalname,
          publicId: result.public_id,
          size: req.file.size,
          mimeType: req.file.mimetype,
        },
      },
    },
    { new: true }
  );

  if (!task) return sendError(res, 404, 'Task not found.');
  return sendSuccess(res, 200, { attachments: task.attachments }, 'Attachment uploaded');
});
