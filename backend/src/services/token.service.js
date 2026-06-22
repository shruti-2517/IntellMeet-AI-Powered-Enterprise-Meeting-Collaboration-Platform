/**
 * IntellMeet Backend – JWT Token Service
 * Handles access/refresh token generation, verification, and rotation.
 */

const jwt = require('jsonwebtoken');
const { getRedisClient, isRedisConnected } = require('../config/redis');
const logger = require('../middleware/logger');

/**
 * Generate a short-lived access token.
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    issuer: 'intellmeet',
    audience: 'intellmeet-client',
  });
};

/**
 * Generate a long-lived refresh token.
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    issuer: 'intellmeet',
    audience: 'intellmeet-client',
  });
};

/**
 * Verify an access token. Throws on invalid/expired.
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
    issuer: 'intellmeet',
    audience: 'intellmeet-client',
  });
};

/**
 * Verify a refresh token. Throws on invalid/expired.
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: 'intellmeet',
    audience: 'intellmeet-client',
  });
};

/**
 * Blacklist a token in Redis until its natural expiry.
 */
const blacklistToken = async (token) => {
  if (!isRedisConnected()) return;
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return;
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await getRedisClient().setEx(`blacklist:${token}`, ttl, '1');
    }
  } catch (err) {
    logger.error(`Token blacklist error: ${err.message}`);
  }
};

/**
 * Check if a token has been blacklisted.
 */
const isTokenBlacklisted = async (token) => {
  if (!isRedisConnected()) return false;
  try {
    const result = await getRedisClient().get(`blacklist:${token}`);
    return result === '1';
  } catch (err) {
    logger.error(`Token blacklist check error: ${err.message}`);
    return false;
  }
};

/**
 * Rotate refresh token: blacklist old, issue new pair.
 */
const rotateRefreshToken = async (oldToken, userId, role) => {
  await blacklistToken(oldToken);
  const accessToken = generateAccessToken(userId, role);
  const refreshToken = generateRefreshToken(userId);
  return { accessToken, refreshToken };
};

/**
 * Set access and refresh tokens as httpOnly cookies on the response.
 */
const setCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clear access and refresh token cookies.
 */
const clearCookies = (res) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
  rotateRefreshToken,
  setCookies,
  clearCookies,
};
