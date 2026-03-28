const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { client } = require('../config/redis');

const SESSION_TTL = parseInt(process.env.SESSION_TTL) || 3600;
const SALT_ROUNDS = 10;

/**
 * POST /api/auth/signup
 * Register a new user with username and password.
 */
const signup = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 20 characters.',
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 4 characters.',
      });
    }

    // Check if user already exists
    const exists = await client.exists(`user:${username}`);
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Username already taken. Please choose another.',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Store user in Redis as a Hash
    await client.hSet(`user:${username}`, {
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
    });

    // Create session
    const sessionId = uuidv4();
    await client.set(`session:${sessionId}`, username, { EX: SESSION_TTL });

    console.log(`✅ User registered: ${username}`);

    return res.status(201).json({
      success: true,
      message: 'User created successfully!',
      sessionId,
      username,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during signup.',
    });
  }
};

/**
 * POST /api/auth/login
 * Authenticate user with username and password.
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    // Check if user exists
    const passwordHash = await client.hGet(`user:${username}`, 'password_hash');
    if (!passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    // Create session
    const sessionId = uuidv4();
    await client.set(`session:${sessionId}`, username, { EX: SESSION_TTL });

    console.log(`✅ User logged in: ${username}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      sessionId,
      username,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.',
    });
  }
};

/**
 * POST /api/auth/logout
 * Destroy session and remove user from online set.
 */
const logout = async (req, res) => {
  try {
    const username = req.user;
    const sessionId = req.sessionId;

    // Delete session
    await client.del(`session:${sessionId}`);

    // Remove from online users
    await client.sRem('online_users', username);

    console.log(`👋 User logged out: ${username}`);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during logout.',
    });
  }
};

module.exports = { signup, login, logout };
