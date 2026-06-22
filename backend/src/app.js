/**
 * IntellMeet Backend – Express App Configuration
 * Configures all middleware, routes, and error handlers.
 */

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');

// xss-clean is deprecated — load optionally
let xssClean = null;
try { xssClean = require('xss-clean'); } catch { /* disabled */ }

const logger = require('./middleware/logger');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { sanitizeBody } = require('./utils/sanitize');

// Route imports
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const meetingRoutes = require('./routes/meeting.routes');
const messageRoutes = require('./routes/message.routes');
const taskRoutes = require('./routes/task.routes');
const teamRoutes = require('./routes/team.routes');
const notificationRoutes = require('./routes/notification.routes');
const aiRoutes = require('./routes/ai.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Required for WebRTC
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", 'wss:', 'ws:'],
    },
  },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ─── Compression ──────────────────────────────────────────────────────────────
app.use(compression());

// ─── Request Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Security Sanitization ────────────────────────────────────────────────────
app.use(mongoSanitize()); // Prevent MongoDB operator injection
if (xssClean) app.use(xssClean()); // XSS sanitization (optional)
app.use(sanitizeBody);    // Additional custom sanitization

// ─── HTTP Request Logging ─────────────────────────────────────────────────────
app.use(morgan(':method :url :status :response-time ms - :res[content-length]', {
  stream: logger.stream,
  skip: (req) => req.url === '/health', // Don't log health checks
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use('/api/', generalLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const mongoose = require('mongoose');
  const { isRedisConnected } = require('./config/redis');

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: isRedisConnected() ? 'connected' : 'disconnected',
  });
});

// ─── API Info ─────────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    name: 'IntellMeet API',
    version: '2.0.0',
    status: 'running',
    documentation: 'https://docs.intellmeet.com/api',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      meetings: '/api/meetings',
      messages: '/api/messages',
      tasks: '/api/tasks',
      teams: '/api/teams',
      notifications: '/api/notifications',
      ai: '/api/ai',
      analytics: '/api/analytics',
    },
  });
});

// ─── API Routes (versioned + backward compatible) ─────────────────────────────
const API_PREFIX = '/api';
const API_V1_PREFIX = '/api/v1';

const registerRoutes = (prefix) => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/meetings`, meetingRoutes);
  app.use(`${prefix}/messages`, messageRoutes);
  app.use(`${prefix}/tasks`, taskRoutes);
  app.use(`${prefix}/teams`, teamRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/ai`, aiRoutes);
  app.use(`${prefix}/analytics`, analyticsRoutes);
};

registerRoutes(API_PREFIX);
registerRoutes(API_V1_PREFIX);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use(notFound);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
