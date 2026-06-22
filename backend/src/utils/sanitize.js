/**
 * IntellMeet Backend – Input Sanitization Helpers
 * XSS prevention and input cleaning utilities.
 */

/**
 * Strip HTML tags from a string to prevent XSS.
 * @param {string} input
 * @returns {string}
 */
const stripHtml = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/<[^>]*>/g, '').trim();
};

/**
 * Sanitize a plain text string — strip HTML and normalize whitespace.
 * @param {string} input
 * @returns {string}
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  return stripHtml(input).replace(/\s+/g, ' ').trim();
};

/**
 * Sanitize an object's string fields recursively.
 * @param {object} obj
 * @returns {object}
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  const sanitized = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Express middleware to sanitize all body string fields.
 */
const sanitizeBody = (req, _res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Validate that a string is a valid MongoDB ObjectId.
 * @param {string} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  return /^[a-fA-F0-9]{24}$/.test(id);
};

module.exports = { stripHtml, sanitizeString, sanitizeObject, sanitizeBody, isValidObjectId };
