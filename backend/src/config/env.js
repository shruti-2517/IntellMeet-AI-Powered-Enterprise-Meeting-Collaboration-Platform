/**
 * IntellMeet Backend – Environment Variable Validation
 * Validates all required environment variables on startup.
 * Throws immediately if any critical variable is missing.
 */

const REQUIRED_VARS = [
  'PORT',
  'NODE_ENV',
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

const OPTIONAL_VARS_WITH_DEFAULTS = {
  CLIENT_URL: 'http://localhost:5173',
  REDIS_URL: 'redis://localhost:6379',
  JWT_ACCESS_EXPIRES: '15m',
  JWT_REFRESH_EXPIRES: '7d',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX: '100',
  AUTH_RATE_LIMIT_MAX: '10',
};

/**
 * Validates environment variables and applies defaults.
 * Call this BEFORE any other module initialization.
 */
const validateEnv = () => {
  const missing = [];

  // Check required vars
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.error('❌ FATAL: Missing required environment variables:');
    missing.forEach((v) => console.error(`   - ${v}`));
    console.error('\nPlease copy .env.example to .env and fill in all values.');
    process.exit(1);
  }

  // Apply defaults for optional vars
  for (const [varName, defaultValue] of Object.entries(OPTIONAL_VARS_WITH_DEFAULTS)) {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
    }
  }

  // Validate JWT secrets are long enough
  if (process.env.JWT_ACCESS_SECRET.length < 32) {
    console.error('❌ FATAL: JWT_ACCESS_SECRET must be at least 32 characters');
    process.exit(1);
  }
  if (process.env.JWT_REFRESH_SECRET.length < 32) {
    console.error('❌ FATAL: JWT_REFRESH_SECRET must be at least 32 characters');
    process.exit(1);
  }

  // Warn about missing optional but important vars
  const importantOptional = ['OPENAI_API_KEY', 'CLOUDINARY_CLOUD_NAME', 'SMTP_USER'];
  importantOptional.forEach((varName) => {
    if (!process.env[varName]) {
      console.warn(`⚠️  WARNING: ${varName} is not set. Related features will be disabled.`);
    }
  });

  return {
    PORT: parseInt(process.env.PORT, 10) || 5000,
    NODE_ENV: process.env.NODE_ENV,
    CLIENT_URL: process.env.CLIENT_URL,
    MONGODB_URI: process.env.MONGODB_URI,
    REDIS_URL: process.env.REDIS_URL,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES,
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10),
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10),
    AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10),
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
  };
};

module.exports = validateEnv;
