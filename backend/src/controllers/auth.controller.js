/**
 * IntellMeet Backend – Auth Controller
 * Handles registration, login, logout, token refresh, and password flows.
 */

const crypto = require('crypto');
const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  blacklistToken,
  rotateRefreshToken,
  setCookies,
  clearCookies,
  isTokenBlacklisted,
} = require('../services/token.service');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../services/email.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../middleware/logger');

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return sendError(res, 409, 'An account with this email already exists.');
  }

  const user = new User({ name: name.trim(), email: email.toLowerCase().trim(), password });
  const verificationRawToken = user.generateEmailVerificationToken();
  await user.save();

  // Send verification email (non-blocking)
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationRawToken}`;
  sendVerificationEmail(user.email, user.name, verificationUrl).catch((err) =>
    logger.error(`Verification email failed: ${err.message}`)
  );

  // Generate tokens
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token on user
  user.refreshTokens = [refreshToken];
  await user.save();

  setCookies(res, accessToken, refreshToken);

  logger.info(`New user registered: ${user.email}`);

  return sendSuccess(
    res,
    201,
    {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        preferences: user.preferences,
      },
      accessToken,
    },
    'Account created successfully. Please verify your email.'
  );
});

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findByEmail(email);
  if (!user) {
    return sendError(res, 401, 'Invalid email or password.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return sendError(res, 401, 'Invalid email or password.');
  }

  // Generate token pair
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Store refresh token (limit to 5 devices)
  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
  user.isOnline = true;
  user.lastSeen = new Date();
  await user.save();

  setCookies(res, accessToken, refreshToken);

  logger.info(`User logged in: ${user.email}`);

  return sendSuccess(
    res,
    200,
    {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar,
        preferences: user.preferences,
        teams: user.teams,
      },
      accessToken,
    },
    'Login successful'
  );
});

// ─── Logout ───────────────────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.accessToken || req.token;
  const refreshToken = req.cookies?.refreshToken;

  // Blacklist current access token
  if (token) await blacklistToken(token);

  // Remove refresh token from user's list
  if (req.user?.userId && refreshToken) {
    await User.findByIdAndUpdate(req.user.userId, {
      $pull: { refreshTokens: refreshToken },
      isOnline: false,
      lastSeen: new Date(),
    });
  }

  clearCookies(res);
  return sendSuccess(res, 200, null, 'Logged out successfully');
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    return sendError(res, 401, 'Refresh token not provided.');
  }

  // Check blacklist
  const blacklisted = await isTokenBlacklisted(refreshToken);
  if (blacklisted) {
    return sendError(res, 401, 'Refresh token has been invalidated.');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return sendError(res, 401, 'Invalid or expired refresh token.');
  }

  const user = await User.findById(decoded.userId).select('+refreshTokens');
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    return sendError(res, 401, 'Refresh token not recognized.');
  }

  // Rotate: blacklist old, issue new
  const { accessToken, refreshToken: newRefreshToken } = await rotateRefreshToken(
    refreshToken,
    user._id,
    user.role
  );

  // Update stored tokens
  user.refreshTokens = user.refreshTokens
    .filter((t) => t !== refreshToken)
    .concat(newRefreshToken)
    .slice(-5);
  await user.save();

  setCookies(res, accessToken, newRefreshToken);

  return sendSuccess(res, 200, { accessToken }, 'Token refreshed successfully');
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Always return success to prevent email enumeration
  if (!user) {
    return sendSuccess(res, 200, null, 'If that email exists, a reset link has been sent.');
  }

  const rawToken = user.generatePasswordResetToken();
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
  sendPasswordResetEmail(user.email, user.name, resetUrl).catch((err) =>
    logger.error(`Password reset email failed: ${err.message}`)
  );

  return sendSuccess(res, 200, null, 'If that email exists, a reset link has been sent.');
});

// ─── Reset Password ───────────────────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password +passwordResetToken +passwordResetExpires');

  if (!user) {
    return sendError(res, 400, 'Password reset token is invalid or has expired.');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // Invalidate all sessions
  await user.save();

  clearCookies(res);
  return sendSuccess(res, 200, null, 'Password reset successfully. Please log in with your new password.');
});

// ─── Verify Email ─────────────────────────────────────────────────────────────
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({ emailVerificationToken: hashedToken }).select(
    '+emailVerificationToken'
  );

  if (!user) {
    return sendError(res, 400, 'Email verification link is invalid or has already been used.');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  await user.save();

  return sendSuccess(res, 200, null, 'Email verified successfully! You can now access all features.');
});

// ─── Resend Verification ──────────────────────────────────────────────────────
exports.resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select('+emailVerificationToken');

  if (!user) return sendError(res, 404, 'User not found.');
  if (user.isEmailVerified) {
    return sendError(res, 400, 'Email is already verified.');
  }

  const rawToken = user.generateEmailVerificationToken();
  await user.save();

  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}`;
  await sendVerificationEmail(user.email, user.name, verificationUrl);

  return sendSuccess(res, 200, null, 'Verification email resent successfully.');
});

// ─── Get Me ───────────────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).populate('teams', 'name avatar members');

  if (!user) return sendError(res, 404, 'User not found.');

  return sendSuccess(res, 200, { user }, 'Profile retrieved');
});
