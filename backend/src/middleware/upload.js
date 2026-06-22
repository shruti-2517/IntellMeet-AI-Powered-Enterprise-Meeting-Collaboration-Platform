/**
 * IntellMeet Backend – File Upload Middleware
 * Multer configuration + Cloudinary integration.
 * Max file size: 10MB. Whitelisted MIME types only.
 */

const multer = require('multer');
const { uploadToCloudinary } = require('../config/cloudinary');
const { sendError } = require('../utils/apiResponse');
const logger = require('./logger');

// ─── Allowed MIME Types ───────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/mpeg'];
const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_AUDIO_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── Memory Storage (upload to Cloudinary from buffer) ────────────────────────
const memoryStorage = multer.memoryStorage();

/**
 * Create a multer instance with memory storage and file type filtering.
 * @param {string[]} allowedTypes - Array of allowed MIME types
 */
const createUpload = (allowedTypes) =>
  multer({
    storage: memoryStorage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname),
          false
        );
      }
    },
  });

// ─── Named Upload Middleware Instances ───────────────────────────────────────
const uploadImage = createUpload(ALLOWED_IMAGE_TYPES).single('avatar');
const uploadAudio = createUpload(ALLOWED_AUDIO_TYPES).single('audio');
const uploadFile = createUpload(ALLOWED_FILE_TYPES).single('file');
const uploadTeamAvatar = createUpload(ALLOWED_IMAGE_TYPES).single('avatar');

// ─── Cloudinary Upload Handler ────────────────────────────────────────────────

/**
 * Middleware to upload req.file buffer to Cloudinary.
 * Attaches result to req.uploadResult.
 * @param {string} folder - Cloudinary folder name
 * @param {string} resourceType - 'image', 'video', 'raw', 'auto'
 */
const uploadToCloud = (folder = 'intellmeet', resourceType = 'auto') => async (req, res, next) => {
  if (!req.file) return next();

  try {
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: `intellmeet/${folder}`,
      resource_type: resourceType,
      public_id: `${folder}_${Date.now()}`,
    });

    req.uploadResult = {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
    };

    logger.info(`File uploaded to Cloudinary: ${result.public_id}`);
    next();
  } catch (err) {
    logger.error(`Cloudinary upload failed: ${err.message}`);
    return sendError(res, 500, 'File upload failed. Please try again.');
  }
};

/**
 * Multer error handler middleware.
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 400, 'File too large. Maximum size is 10MB.');
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return sendError(res, 400, 'Invalid file type. Please upload an allowed file format.');
    }
    return sendError(res, 400, `Upload error: ${err.message}`);
  }
  next(err);
};

module.exports = {
  uploadImage,
  uploadAudio,
  uploadFile,
  uploadTeamAvatar,
  uploadToCloud,
  handleMulterError,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_AUDIO_TYPES,
};
