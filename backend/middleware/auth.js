const { client } = require('../config/redis');

/**
 * Session-based authentication middleware.
 * Expects the session ID in the 'x-session-id' header.
 * If valid, attaches req.user (username) and req.sessionId.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'];

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: 'No session ID provided. Please login first.',
      });
    }

    // Look up session in Redis
    const username = await client.get(`session:${sessionId}`);

    if (!username) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please login again.',
      });
    }

    // Attach user info to the request
    req.user = username;
    req.sessionId = sessionId;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};

module.exports = authMiddleware;
