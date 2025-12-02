require("dotenv").config();
const jwt = require("jsonwebtoken");

/**
 * Secret key used to sign and verify JWT tokens
 * Should be set via JWT_SECRET environment variable for security
 * Default value is insecure and should only be used in development
 */
const JWT_SECRET = process.env.JWT_SECRET || "change_me";

/**
 * Token expiration time (default: 7 days)
 * Can be overridden via JWT_EXPIRES_IN environment variable
 * Format: "7d", "24h", "60m", etc.
 */
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Creates a signed JWT token with the provided payload
 * 
 * @param {object} payload - Data to encode in the token (typically user ID, role, etc.)
 * @param {object} options - Additional JWT options to override defaults
 * @returns {string} The signed JWT token
 */
function signToken(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    ...options,
  });
}

/**
 * Verifies and decodes a JWT token
 * Throws an error if the token is invalid, expired, or tampered with
 * 
 * @param {string} token - The JWT token to verify
 * @returns {object} The decoded token payload
 * @throws {Error} If token is invalid, expired, or signature doesn't match
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };
