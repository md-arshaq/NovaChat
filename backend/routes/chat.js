const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  sendMessage,
  getChatHistory,
  sendPrivateMessage,
  getPrivateChatHistory,
  getChatContacts,
} = require('../controllers/chatController');

// All chat routes are protected
router.use(authMiddleware);

// Global chat
router.post('/message', sendMessage);
router.get('/history', getChatHistory);

// Private chat
router.post('/private', sendPrivateMessage);
router.get('/private/:username', getPrivateChatHistory);

// Chat contacts
router.get('/contacts', getChatContacts);

module.exports = router;
