const { client } = require('../config/redis');

/**
 * GET /api/users/online
 * Get list of currently online users.
 */
const getOnlineUsers = async (req, res) => {
  try {
    const users = await client.sMembers('online_users');

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    console.error('Get online users error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch online users.',
    });
  }
};

/**
 * GET /api/users/profile/:username
 * Get user profile info (public data only).
 */
const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const exists = await client.exists(`user:${username}`);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: `User '${username}' not found.`,
      });
    }

    const createdAt = await client.hGet(`user:${username}`, 'created_at');
    const isOnline = await client.sIsMember('online_users', username);

    return res.status(200).json({
      success: true,
      profile: {
        username,
        created_at: createdAt,
        online: isOnline,
      },
    });
  } catch (err) {
    console.error('Get user profile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.',
    });
  }
};

module.exports = { getOnlineUsers, getUserProfile };
