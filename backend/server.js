/**
 * IntellMeet Backend – Server Entry Point
 * Bootstraps MongoDB, Redis, Express, and Socket.io.
 */


'use strict';

// Load environment variables FIRST
require('dotenv').config();

// Validate env before anything else
const validateEnv = require('./src/config/env');
validateEnv();

const http = require('http');
const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/db');
const { connectRedis, disconnectRedis } = require('./src/config/redis');
const { configureCloudinary } = require('./src/config/cloudinary');
const { initSocket } = require('./src/socket/index');
const logger = require('./src/middleware/logger');

const PORT = parseInt(process.env.PORT, 10) || 5000;

// Create HTTP server
const httpServer = http.createServer(app);

// ─── Bootstrap Function ───────────────────────────────────────────────────────
const bootstrap = async () => {
  try {
    logger.info('🚀 IntellMeet Backend starting...');

    // 1. Connect to MongoDB
    await connectDB();

    // 2. Connect to Redis (non-blocking failure)
    await connectRedis();

    // 3. Configure Cloudinary
    configureCloudinary();

    // 4. Initialize Socket.io namespaces
    initSocket(httpServer);

    // 5. Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`✅ Server running at http://localhost:${PORT}`);
      logger.info(`📡 Socket.io ready at ws://localhost:${PORT}`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Frontend URL: ${process.env.CLIENT_URL}`);
      logger.info(`📋 API Docs: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error(`Bootstrap failed: ${error.message}`, { stack: error.stack });
    process.exit(1);
  }
};

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  logger.info(`\n🛑 ${signal} received. Starting graceful shutdown...`);

  try {
    // 1. Notify all connected sockets
    const { getIO } = require('./src/socket/index');
    try {
      const io = getIO();
      io.emit('server-shutdown', { message: 'Server is shutting down. Please reconnect shortly.' });
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5s for clients
    } catch {
      // IO might not be initialized
    }

    // 2. Stop accepting new connections
    httpServer.close((err) => {
      if (err) logger.error(`HTTP server close error: ${err.message}`);
      else logger.info('HTTP server closed');
    });

    // 3. Close database connections
    await disconnectDB();
    await disconnectRedis();

    logger.info('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error(`Shutdown error: ${error.message}`);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Global Error Handlers ────────────────────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', { reason: reason?.message || reason, stack: reason?.stack });
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('unhandledRejection');
  }
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { message: error.message, stack: error.stack });
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('uncaughtException');
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
bootstrap();
