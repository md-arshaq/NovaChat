const path = require('path');
const fs = require('fs');
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
 * GET /api/users/me
 * Get the authenticated user's own profile.
 */
const getMyProfile = async (req, res) => {
  try {
    const username = req.user;

    const userData = await client.hGetAll(`user:${username}`);

    return res.status(200).json({
      success: true,
      profile: {
        username,
        bio: userData.bio || '',
        avatar_url: userData.avatar_url || '',
        created_at: userData.created_at || '',
      },
    });
  } catch (err) {
    console.error('Get my profile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile.',
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

    const userData = await client.hGetAll(`user:${username}`);
    const isOnline = await client.sIsMember('online_users', username);

    return res.status(200).json({
      success: true,
      profile: {
        username,
        bio: userData.bio || '',
        avatar_url: userData.avatar_url || '',
        created_at: userData.created_at || '',
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

/**
 * PUT /api/users/profile
 * Update the authenticated user's profile (avatar and/or bio).
 * Expects multipart/form-data with optional `avatar` file and optional `bio` field.
 */
const updateProfile = async (req, res) => {
  try {
    const username = req.user;
    const updates = {};

    // Handle bio
    if (req.body.bio !== undefined) {
      const bio = req.body.bio.trim();
      if (bio.length > 250) {
        return res.status(400).json({
          success: false,
          message: 'Bio must be 250 characters or less.',
        });
      }
      updates.bio = bio;
    }

    // Handle avatar upload
    if (req.file) {
      // With multer-storage-cloudinary, req.file.path contains the resolved Cloudinary URL
      updates.avatar_url = req.file.path;
      
      // Note: We skip deleting the old Cloudinary image here for simplicity.
      // In production, we could extract the public_id and use cloudinary.uploader.destroy().
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided.',
      });
    }

    // Save updates to Redis
    await client.hSet(`user:${username}`, updates);

    // Fetch full updated profile
    const userData = await client.hGetAll(`user:${username}`);

    console.log(`✅ Profile updated: ${username}`);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      profile: {
        username,
        bio: userData.bio || '',
        avatar_url: userData.avatar_url || '',
        created_at: userData.created_at || '',
      },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
    });
  }
};

module.exports = { getOnlineUsers, getMyProfile, getUserProfile, updateProfile };
