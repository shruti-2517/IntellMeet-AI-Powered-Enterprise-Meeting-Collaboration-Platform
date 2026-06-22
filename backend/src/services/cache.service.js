/**
 * IntellMeet Backend – Redis Cache Service
 * Wrapper around Redis with TTL management and pattern-based deletion.
 */

const { getRedisClient, isRedisConnected } = require('../config/redis');
const logger = require('../middleware/logger');

// ─── Cache Key Namespaces ─────────────────────────────────────────────────────
const KEYS = {
  user: (id) => `user:${id}`,
  meeting: (id) => `meeting:${id}`,
  team: (id) => `team:${id}`,
  notifUnread: (userId) => `notif:unread:${userId}`,
  summary: (meetingId) => `summary:${meetingId}`,
};

// ─── TTL Constants (seconds) ──────────────────────────────────────────────────
const TTL = {
  USER: 300,        // 5 minutes
  MEETING: 60,      // 1 minute
  TEAM: 120,        // 2 minutes
  NOTIF_UNREAD: 30, // 30 seconds
  SUMMARY: 0,       // Permanent (no expiry)
};

/**
 * Get a cached value (parsed from JSON).
 */
const get = async (key) => {
  if (!isRedisConnected()) return null;
  try {
    const raw = await getRedisClient().get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.error(`Cache get error [${key}]: ${err.message}`);
    return null;
  }
};

/**
 * Set a value in cache (serialized as JSON).
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds - 0 means no expiry
 */
const set = async (key, value, ttlSeconds = 60) => {
  if (!isRedisConnected()) return;
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await getRedisClient().setEx(key, ttlSeconds, serialized);
    } else {
      await getRedisClient().set(key, serialized);
    }
  } catch (err) {
    logger.error(`Cache set error [${key}]: ${err.message}`);
  }
};

/**
 * Delete a single cache key.
 */
const del = async (key) => {
  if (!isRedisConnected()) return;
  try {
    await getRedisClient().del(key);
  } catch (err) {
    logger.error(`Cache del error [${key}]: ${err.message}`);
  }
};

/**
 * Delete all keys matching a pattern (e.g. 'meetings:user:*').
 */
const delPattern = async (pattern) => {
  if (!isRedisConnected()) return;
  try {
    const keys = await getRedisClient().keys(pattern);
    if (keys.length > 0) {
      await getRedisClient().del(keys);
    }
  } catch (err) {
    logger.error(`Cache delPattern error [${pattern}]: ${err.message}`);
  }
};

/**
 * Check if a key exists.
 */
const exists = async (key) => {
  if (!isRedisConnected()) return false;
  try {
    const result = await getRedisClient().exists(key);
    return result === 1;
  } catch (err) {
    logger.error(`Cache exists error [${key}]: ${err.message}`);
    return false;
  }
};

/**
 * Reset the TTL of an existing key.
 */
const expire = async (key, ttlSeconds) => {
  if (!isRedisConnected()) return;
  try {
    await getRedisClient().expire(key, ttlSeconds);
  } catch (err) {
    logger.error(`Cache expire error [${key}]: ${err.message}`);
  }
};

module.exports = { get, set, del, delPattern, exists, expire, KEYS, TTL };
