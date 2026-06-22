/**
 * IntellMeet Backend – User Routes
 * Base: /api/users
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { uploadImage, handleMulterError } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validateUpdateProfile, validateChangePassword } = require('../middleware/validate');

router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, validateUpdateProfile, userController.updateProfile);
router.post('/avatar', verifyToken, uploadLimiter, uploadImage, handleMulterError, userController.uploadAvatar);
router.delete('/avatar', verifyToken, userController.deleteAvatar);
router.put('/change-password', verifyToken, validateChangePassword, userController.changePassword);
router.get('/search', verifyToken, userController.searchUsers);
router.get('/stats', verifyToken, userController.getStats);
router.get('/:userId', verifyToken, userController.getUserById);

module.exports = router;
