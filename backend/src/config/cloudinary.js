/**
 * IntellMeet Backend – Cloudinary Configuration
 * Compatible with cloudinary npm package v1 and v2.
 */

const cloudinaryPkg = require('cloudinary');
// cloudinary v1 exports as .v2, cloudinary v2 exports directly
const cloudinary = cloudinaryPkg.v2 || cloudinaryPkg;
const logger = require('../middleware/logger');

/**
 * Configure the Cloudinary SDK.
 * Called once at startup if credentials are available.
 */
const configureCloudinary = () => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    logger.warn('⚠️  Cloudinary credentials not set. File uploads will be disabled.');
    return false;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  logger.info('✅ Cloudinary configured.');
  return true;
};

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer
 * @param {object} options - Cloudinary upload options
 * @returns {object} - Upload result with url and public_id
 */
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'intellmeet',
        resource_type: 'auto',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Delete a resource from Cloudinary by its public_id.
 * @param {string} publicId - The public_id of the resource
 * @param {string} resourceType - 'image', 'video', or 'raw'
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    logger.error(`Cloudinary delete failed for ${publicId}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  cloudinary,
  configureCloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
};
