const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getOnlineUsers, getUserProfile } = require('../controllers/userController');

// All user routes are protected
router.use(authMiddleware);

router.get('/online', getOnlineUsers);
router.get('/profile/:username', getUserProfile);

module.exports = router;
