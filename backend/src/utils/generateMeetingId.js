/**
 * IntellMeet Backend – Meeting ID Generator
 * Generates a unique, URL-safe 10-character meeting room ID.
 * Uses a combination of alphanumeric characters, excluding
 * visually ambiguous chars (0, O, I, l).
 */

const { v4: uuidv4 } = require('uuid');

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const ID_LENGTH = 10;

/**
 * Generate a cryptographically-seeded random meeting ID.
 * Format: xxxxx-xxxxx (two groups of 5, hyphen-separated)
 * @returns {string} - e.g. "aB3dF-kM9nP"
 */
const generateMeetingId = () => {
  const uuid = uuidv4().replace(/-/g, '');
  let id = '';

  // Use UUID entropy to pick from CHARSET
  for (let i = 0; i < ID_LENGTH; i++) {
    const hexPair = uuid.slice(i * 2, i * 2 + 2);
    const index = parseInt(hexPair, 16) % CHARSET.length;
    id += CHARSET[index];
  }

  // Format as xxxxx-xxxxx
  return `${id.slice(0, 5)}-${id.slice(5)}`;
};

/**
 * Generate a shorter 8-character invite code for team invitations.
 * @returns {string} - e.g. "aB3dFkM9"
 */
const generateInviteCode = () => {
  const uuid = uuidv4().replace(/-/g, '');
  let code = '';
  for (let i = 0; i < 8; i++) {
    const hexPair = uuid.slice(i * 2, i * 2 + 2);
    const index = parseInt(hexPair, 16) % CHARSET.length;
    code += CHARSET[index];
  }
  return code;
};

module.exports = { generateMeetingId, generateInviteCode };
