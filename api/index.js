/**
 * Vercel Serverless Function Entry Point for Express Backend
 * Loads the Express application and manages database/Redis connections.
 */

// Load backend environment configuration if running locally or if needed
require('dotenv').config();

const app = require('../backend/src/app');
const { connectDB } = require('../backend/src/config/db');
const { connectRedis } = require('../backend/src/config/redis');

// Database connection state cache
let isDbConnected = false;
let isRedisConnected = false;

// Middleware to ensure DB and Redis are connected before handling any requests
app.use(async (req, res, next) => {
  try {
    if (!isDbConnected) {
      await connectDB();
      isDbConnected = true;
    }
  } catch (err) {
    console.error('Failed to establish database connection in Vercel function:', err.message);
  }

  try {
    if (!isRedisConnected && process.env.REDIS_URL) {
      await connectRedis();
      isRedisConnected = true;
    }
  } catch (err) {
    console.error('Failed to establish Redis connection in Vercel function:', err.message);
  }

  next();
});

module.exports = app;
