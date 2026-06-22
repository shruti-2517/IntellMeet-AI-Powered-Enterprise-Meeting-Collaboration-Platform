/**
 * IntellMeet Backend – Global Error Handler Middleware
 * Handles all Express errors with consistent JSON responses.
 */

const logger = require('./logger');
const { StatusCodes } = require('http-status-codes');

/**
 * Create a standardized error response object.
 */
const createErrorResponse = (statusCode, message, errors = null, stack = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  if (process.env.NODE_ENV === 'development' && stack) {
    response.stack = stack;
  }
  return { statusCode, body: response };
};

/**
 * Global Express error handler (4-argument signature required by Express).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || StatusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal server error';
  let errors = null;

  // ── Mongoose Validation Error ─────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // ── Mongoose CastError (invalid ObjectId) ─────────────────────────────────
  else if (err.name === 'CastError') {
    statusCode = StatusCodes.BAD_REQUEST;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // ── MongoDB Duplicate Key (code 11000) ────────────────────────────────────
  else if (err.code === 11000) {
    statusCode = StatusCodes.CONFLICT;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' is already in use.`;
  }

  // ── JWT Errors ────────────────────────────────────────────────────────────
  else if (err.name === 'JsonWebTokenError') {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = 'Invalid token. Please log in again.';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = 'Token expired. Please refresh your session.';
  }

  // ── Multer Errors ─────────────────────────────────────────────────────────
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'File too large. Maximum file size is 10MB.';
  }
  else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Unexpected file field. Please check your upload.';
  }

  // ── Express-Validator Errors ──────────────────────────────────────────────
  else if (err.array && typeof err.array === 'function') {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Validation error';
    errors = err.array();
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error(`[${req.method} ${req.path}] ${statusCode} - ${message}`, {
      stack: err.stack,
      body: req.body,
      user: req.user?.userId,
    });
  } else {
    logger.warn(`[${req.method} ${req.path}] ${statusCode} - ${message}`);
  }

  const { body } = createErrorResponse(statusCode, message, errors, err.stack);
  return res.status(statusCode).json(body);
};

/**
 * 404 Not Found handler — must be registered AFTER all routes.
 */
const notFound = (req, res) => {
  return res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

module.exports = { errorHandler, notFound };
