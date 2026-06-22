/**
 * IntellMeet Backend – Task Routes
 * Base: /api/tasks
 */

const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { uploadFile, handleMulterError } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validateCreateTask, validateUpdateTask } = require('../middleware/validate');

router.post('/', verifyToken, validateCreateTask, taskController.createTask);
router.get('/', verifyToken, taskController.getMyTasks);
router.get('/team/:teamId', verifyToken, taskController.getTeamTasks);
router.get('/:taskId', verifyToken, taskController.getTaskById);
router.put('/:taskId', verifyToken, validateUpdateTask, taskController.updateTask);
router.delete('/:taskId', verifyToken, taskController.deleteTask);
router.put('/:taskId/status', verifyToken, taskController.updateTaskStatus);
router.put('/:taskId/assign', verifyToken, taskController.assignTask);
router.post('/:taskId/comment', verifyToken, taskController.addComment);
router.delete('/:taskId/comment/:commentId', verifyToken, taskController.deleteComment);
router.post('/:taskId/attachment', verifyToken, uploadLimiter, uploadFile, handleMulterError, taskController.uploadAttachment);
router.put('/team/:teamId/reorder', verifyToken, taskController.reorderTasks);

module.exports = router;
