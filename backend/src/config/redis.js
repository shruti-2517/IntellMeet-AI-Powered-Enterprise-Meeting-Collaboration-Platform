/**
 * IntellMeet Backend – Redis Connection & Helper Methods
 */

const { createClient } = require('redis');
const logger = require('../middleware/logger');

let redisClient = null;
let isConnected = false;

/**
 * Initialize and connect the Redis client.
 */
const connectRedis = async () => {
  // Skip Redis entirely if no URL is configured
  if (!process.env.REDIS_URL) {
    logger.warn('⚠️  REDIS_URL not set. Running without Redis (caching & token blacklisting disabled).');
    return null;
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            logger.error('Redis: Max reconnect attempts reached.');
            return new Error('Redis: Max reconnect attempts reached');
          }
          return Math.min(retries * 500, 3000);
        },
      },
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis client error: ${err.message}`);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected.');
      isConnected = true;
    });

    redisClient.on('reconnecting', () => {
      logger.warn('⚠️  Redis reconnecting...');
    });

    redisClient.on('ready', () => {
      isConnected = true;
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error(`Redis connection failed: ${error.message}`);
    logger.warn('⚠️  Running without Redis. Caching and token blacklisting will be disabled.');
    // Don't exit — app can run without Redis (degraded mode)
    return null;
  }
};

/**
 * Get the Redis client instance.
 */
const getRedisClient = () => redisClient;

/**
 * Check if Redis is currently connected.
 */
const isRedisConnected = () => isConnected && redisClient !== null;

/**
 * Gracefully close Redis connection.
 */
const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed.');
  }
};

module.exports = {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  isRedisConnected,
};
