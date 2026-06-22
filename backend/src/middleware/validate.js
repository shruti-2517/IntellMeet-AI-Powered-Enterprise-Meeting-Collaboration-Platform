/**
 * IntellMeet Backend – Request Validation Middleware
 * Uses express-validator to validate and sanitize all route inputs.
 */

const { body, param, query, validationResult } = require('express-validator');
const { sendError } = require('../utils/apiResponse');

/**
 * Run validationResult and return 400 with error array if invalid.
 * Always attach this as the LAST item in any validation chain.
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, 'Validation failed', errors.array());
  }
  next();
};

// ─── AUTH VALIDATORS ──────────────────────────────────────────────────────────

const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  handleValidation,
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

const validateForgotPassword = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  handleValidation,
];

const validateResetPassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  handleValidation,
];

// ─── MEETING VALIDATORS ───────────────────────────────────────────────────────

const validateCreateMeeting = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('scheduledAt must be a valid ISO 8601 date')
    .custom((val) => {
      if (new Date(val) <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }
      return true;
    }),
  body('settings.maxParticipants')
    .optional()
    .isInt({ min: 2, max: 500 })
    .withMessage('maxParticipants must be between 2 and 500'),
  handleValidation,
];

// ─── TASK VALIDATORS ──────────────────────────────────────────────────────────

const validateCreateTask = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 300 })
    .withMessage('Title must be between 2 and 300 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('dueDate must be a valid ISO 8601 date'),
  handleValidation,
];

const validateUpdateTask = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 300 })
    .withMessage('Title must be between 2 and 300 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'review', 'completed', 'cancelled'])
    .withMessage('Invalid status value'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority value'),
  handleValidation,
];

// ─── TEAM VALIDATORS ──────────────────────────────────────────────────────────

const validateCreateTeam = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Team name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  handleValidation,
];

// ─── MESSAGE VALIDATORS ───────────────────────────────────────────────────────

const validateSendMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  handleValidation,
];

// ─── USER VALIDATORS ──────────────────────────────────────────────────────────

const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Bio cannot exceed 300 characters'),
  body('preferences.timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a string'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'system'])
    .withMessage('Theme must be light, dark, or system'),
  handleValidation,
];

const validateChangePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number'),
  handleValidation,
];

// ─── PARAM VALIDATORS ─────────────────────────────────────────────────────────

const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .matches(/^[a-fA-F0-9]{24}$/)
    .withMessage(`${paramName} must be a valid MongoDB ObjectId`),
  handleValidation,
];

// ─── PAGINATION QUERY VALIDATOR ───────────────────────────────────────────────

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidation,
];

module.exports = {
  handleValidation,
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateCreateMeeting,
  validateCreateTask,
  validateUpdateTask,
  validateCreateTeam,
  validateSendMessage,
  validateUpdateProfile,
  validateChangePassword,
  validateObjectId,
  validatePagination,
};
