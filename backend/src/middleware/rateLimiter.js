/**
 * IntellMeet Backend – Rate Limiter Middleware
 * Per-route rate limiting using express-rate-limit.
 */

const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000; // 15 minutes
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100;
const authMax = parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10;

/**
 * Standard rate limiter response handler.
 */
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
    retryAfter: Math.ceil(windowMs / 1000),
  });
};

/**
 * General API limiter — 100 requests per 15 minutes per IP.
 */
const generalLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => req.method === 'OPTIONS',
});

/**
 * Auth limiter — 10 requests per 15 minutes per IP.
 * Protects login/register from brute-force attacks.
 */
const authLimiter = rateLimit({
  windowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
    });
  },
});

/**
 * AI limiter — 20 requests per hour per user.
 * Prevents expensive AI API abuse.
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'AI request limit reached. Maximum 20 AI requests per hour.',
    });
  },
});

/**
 * Upload limiter — 10 uploads per hour per user.
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Upload limit reached. Maximum 10 uploads per hour.',
    });
  },
});

module.exports = { generalLimiter, authLimiter, aiLimiter, uploadLimiter };
