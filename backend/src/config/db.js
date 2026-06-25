/**
 * IntellMeet Backend – MongoDB Connection
 * Connects to MongoDB with retry logic (3 attempts, 5s delay between each).
 */

const mongoose = require('mongoose');
const logger = require('../middleware/logger');

const MAX_RETRIES = process.env.VERCEL ? 1 : 3;
const RETRY_DELAY_MS = process.env.VERCEL ? 1000 : 5000;

/**
 * Connect to MongoDB with exponential retry logic.
 * @param {number} retryCount - Current attempt number
 */
const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 8 connection options
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('✅ MongoDB reconnected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    return conn;
  } catch (error) {
    logger.error(`MongoDB connection failed (attempt ${retryCount + 1}/${MAX_RETRIES}): ${error.message}`);

     // Detect placeholder/unconfigured URI
    const uri = process.env.MONGODB_URI || '';
    if (uri.includes('YOUR_USERNAME') || uri.includes('username:password') || uri.includes('xxxxx')) {
      logger.error('');
      logger.error('━'.repeat(60));
      logger.error('🔧 ACTION REQUIRED: Update MONGODB_URI in your .env file!');
      logger.error('   Your current URI still has placeholder values.');
      logger.error('');
      logger.error('   Option 1 (Cloud — free): Sign up at https://cloud.mongodb.com');
      logger.error('   Option 2 (Local): Install MongoDB from https://www.mongodb.com/try/download/community');
      logger.error('━'.repeat(60));
      logger.error('');
      if (process.env.VERCEL) {
        throw new Error('MONGODB_URI is not configured.');
      }
      process.exit(1);
    }

    if (retryCount < MAX_RETRIES - 1) {
      logger.info(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(retryCount + 1);
    }

    logger.error('❌ All MongoDB connection attempts failed.');
    logger.error('   Check your MONGODB_URI in the .env file and make sure MongoDB is accessible.');
    if (process.env.VERCEL) {
      throw error;
    }
    process.exit(1);
  }
};

/**
 * Gracefully close the MongoDB connection.
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully.');
  } catch (error) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
