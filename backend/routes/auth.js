const express = require('express');
const router = express.Router();
const { signup, login, logout } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes (require valid session)
router.post('/logout', authMiddleware, logout);

module.exports = router;
