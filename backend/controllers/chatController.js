const { client } = require('../config/redis');
const { getChatKey, formatStreamMessage } = require('../utils/helpers');

/**
 * POST /api/chat/message
 * Send a message to the global chat stream.
 */
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const username = req.user;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.',
      });
    }

    const timestamp = new Date().toISOString();

    // Add message to global chat stream
    const messageId = await client.xAdd('chat_stream:global', '*', {
      user: username,
      message: message.trim(),
      timestamp,
    });

    return res.status(201).json({
      success: true,
      messageId,
      data: { id: messageId, user: username, message: message.trim(), timestamp },
    });
  } catch (err) {
    console.error('Send message error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message.',
    });
  }
};

/**
 * GET /api/chat/history
 * Fetch global chat history (latest messages, newest first).
 * Query: ?count=50 (default 50, max 200)
 */
const getChatHistory = async (req, res) => {
  try {
    let count = parseInt(req.query.count) || 50;
    count = Math.min(count, 200); // Cap at 200

    // XREVRANGE returns newest first
    const messages = await client.xRevRange('chat_stream:global', '+', '-', {
      COUNT: count,
    });

    // Reverse to get chronological order (oldest first)
    const formatted = messages.reverse().map(formatStreamMessage);

    return res.status(200).json({
      success: true,
      count: formatted.length,
      messages: formatted,
    });
  } catch (err) {
    console.error('Get chat history error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history.',
    });
  }
};

/**
 * POST /api/chat/private
 * Send a private message to another user.
 */
const sendPrivateMessage = async (req, res) => {
  try {
    const { to, message } = req.body;
    const sender = req.user;

    if (!to || !message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Recipient and message are required.',
      });
    }

    if (to === sender) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send a message to yourself.',
      });
    }

    // Check if recipient exists
    const recipientExists = await client.exists(`user:${to}`);
    if (!recipientExists) {
      return res.status(404).json({
        success: false,
        message: `User '${to}' does not exist.`,
      });
    }

    const chatKey = getChatKey(sender, to);
    const timestamp = new Date().toISOString();

    // Add message to private chat stream
    const messageId = await client.xAdd(chatKey, '*', {
      user: sender,
      message: message.trim(),
      timestamp,
    });

    // Track chat partners for both users
    await client.sAdd(`user_chats:${sender}`, to);
    await client.sAdd(`user_chats:${to}`, sender);

    return res.status(201).json({
      success: true,
      messageId,
      data: { id: messageId, user: sender, message: message.trim(), timestamp },
    });
  } catch (err) {
    console.error('Send private message error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to send private message.',
    });
  }
};

/**
 * GET /api/chat/private/:username
 * Fetch private chat history with a specific user.
 * Query: ?count=50 (default 50, max 200)
 */
const getPrivateChatHistory = async (req, res) => {
  try {
    const otherUser = req.params.username;
    const currentUser = req.user;

    let count = parseInt(req.query.count) || 50;
    count = Math.min(count, 200);

    const chatKey = getChatKey(currentUser, otherUser);

    const messages = await client.xRevRange(chatKey, '+', '-', {
      COUNT: count,
    });

    const formatted = messages.reverse().map(formatStreamMessage);

    return res.status(200).json({
      success: true,
      count: formatted.length,
      chatWith: otherUser,
      messages: formatted,
    });
  } catch (err) {
    console.error('Get private chat history error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch private chat history.',
    });
  }
};

/**
 * GET /api/chat/contacts
 * Get list of users the current user has chatted with.
 */
const getChatContacts = async (req, res) => {
  try {
    const username = req.user;
    const contacts = await client.sMembers(`user_chats:${username}`);

    return res.status(200).json({
      success: true,
      contacts,
    });
  } catch (err) {
    console.error('Get chat contacts error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch chat contacts.',
    });
  }
};

module.exports = {
  sendMessage,
  getChatHistory,
  sendPrivateMessage,
  getPrivateChatHistory,
  getChatContacts,
};
