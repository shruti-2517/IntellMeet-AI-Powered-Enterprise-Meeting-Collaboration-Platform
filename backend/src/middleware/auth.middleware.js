/**
 * IntellMeet Backend – JWT Auth Middleware
 * verifyToken, requireRole, and optionalAuth middlewares.
 */

const { verifyAccessToken, isTokenBlacklisted } = require('../services/token.service');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');
const logger = require('./logger');

/**
 * Extract Bearer token from Authorization header OR httpOnly cookie.
 */
const extractToken = (req) => {
  // Check Authorization header first (Bearer <token>)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // Fall back to httpOnly cookie
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
};

/**
 * Verify JWT and attach req.user. Returns 401 if invalid/expired.
 */
const verifyToken = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return sendError(res, 401, 'Authentication required. Please log in.');
    }

    // Check blacklist (for logged-out tokens)
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return sendError(res, 401, 'Token has been invalidated. Please log in again.');
    }

    // Verify JWT
    const decoded = verifyAccessToken(token);

    // Attach user info (from token payload — no DB call for performance)
    req.user = { userId: decoded.userId, role: decoded.role };
    req.token = token; // Store for potential blacklisting

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token expired. Please refresh your session.');
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 401, 'Invalid token. Please log in again.');
    }
    logger.error(`Auth middleware error: ${err.message}`);
    return sendError(res, 500, 'Authentication error');
  }
};

/**
 * Role-based access control middleware.
 * Usage: requireRole('admin') or requireRole('admin', 'member')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return sendError(res, 401, 'Authentication required.');
  }
  if (!roles.includes(req.user.role)) {
    return sendError(
      res,
      403,
      `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
    );
  }
  next();
};

/**
 * Optional auth — sets req.user if token is valid, but doesn't reject if missing.
 * Useful for public routes that behave differently for authenticated users.
 */
const optionalAuth = async (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      req.user = null;
      return next();
    }

    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      req.user = null;
      return next();
    }

    const decoded = verifyAccessToken(token);
    req.user = { userId: decoded.userId, role: decoded.role };
  } catch {
    req.user = null;
  }
  next();
};

/**
 * Load full User document from DB and attach to req.userDoc.
 * Only use when you need the full user object (e.g., profile updates).
 */
const loadUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return sendError(res, 401, 'User not found. Account may have been deleted.');
    }
    req.userDoc = user;
    next();
  } catch (err) {
    logger.error(`loadUser middleware error: ${err.message}`);
    return sendError(res, 500, 'Error loading user data');
  }
};

module.exports = { verifyToken, requireRole, optionalAuth, loadUser };
