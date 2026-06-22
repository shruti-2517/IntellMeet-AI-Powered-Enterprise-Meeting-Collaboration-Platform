/**
 * IntellMeet Backend – Async Handler Wrapper
 * Wraps async route handlers to catch unhandled promise rejections
 * and forward them to Express's global error handler.
 *
 * Usage:
 *   router.get('/route', asyncHandler(async (req, res) => { ... }));
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
