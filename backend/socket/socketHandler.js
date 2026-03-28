const { client } = require('../config/redis');
const { getChatKey } = require('../utils/helpers');

/**
 * Initialize Socket.IO event handlers.
 * @param {import('socket.io').Server} io - The Socket.IO server instance.
 */
function initializeSocket(io) {
  // Map of socket.id → username (for tracking who is connected)
  const socketUserMap = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    /**
     * EVENT: authenticate
     * Client sends { sessionId } to authenticate their socket connection.
     */
    socket.on('authenticate', async ({ sessionId }) => {
      try {
        if (!sessionId) {
          socket.emit('auth_error', { message: 'No session ID provided.' });
          return socket.disconnect(true);
        }

        // Validate session in Redis
        const username = await client.get(`session:${sessionId}`);
        if (!username) {
          socket.emit('auth_error', { message: 'Invalid or expired session.' });
          return socket.disconnect(true);
        }

        // Store mapping
        socketUserMap.set(socket.id, username);
        socket.userId = username;
        socket.sessionId = sessionId;

        // Join the global chat room
        socket.join('global');

        // Join a personal room for private messages
        socket.join(`user:${username}`);

        // Add to online users set
        await client.sAdd('online_users', username);

        // Get updated online users list
        const onlineUsers = await client.sMembers('online_users');

        // Notify everyone that this user came online
        io.emit('user_online', {
          username,
          onlineUsers,
        });

        // Confirm authentication to the client
        socket.emit('authenticated', {
          message: `Welcome, ${username}!`,
          username,
          onlineUsers,
        });

        console.log(`✅ User authenticated via socket: ${username}`);
      } catch (err) {
        console.error('Socket authenticate error:', err);
        socket.emit('auth_error', { message: 'Authentication failed.' });
        socket.disconnect(true);
      }
    });

    /**
     * EVENT: send_message
     * Client sends { message } to the global chat.
     */
    socket.on('send_message', async ({ message }) => {
      try {
        const username = socket.userId;
        if (!username) return;

        if (!message || message.trim() === '') return;

        const timestamp = new Date().toISOString();

        // Store in Redis Stream
        const messageId = await client.xAdd('chat_stream:global', '*', {
          user: username,
          message: message.trim(),
          timestamp,
        });

        // Broadcast to everyone in the global room
        io.to('global').emit('new_message', {
          id: messageId,
          user: username,
          message: message.trim(),
          timestamp,
          room: 'global',
        });

        console.log(`💬 [global] ${username}: ${message.trim()}`);
      } catch (err) {
        console.error('Socket send_message error:', err);
      }
    });

    /**
     * EVENT: private_message
     * Client sends { to, message } for a private chat.
     */
    socket.on('private_message', async ({ to, message }) => {
      try {
        const sender = socket.userId;
        if (!sender) return;

        if (!to || !message || message.trim() === '') return;

        const chatKey = getChatKey(sender, to);
        const timestamp = new Date().toISOString();

        // Store in Redis Stream
        const messageId = await client.xAdd(chatKey, '*', {
          user: sender,
          message: message.trim(),
          timestamp,
        });

        // Track chat partners
        await client.sAdd(`user_chats:${sender}`, to);
        await client.sAdd(`user_chats:${to}`, sender);

        const messageData = {
          id: messageId,
          user: sender,
          message: message.trim(),
          timestamp,
          chatWith: to,
        };

        // Send to the recipient's personal room
        io.to(`user:${to}`).emit('receive_private_message', {
          ...messageData,
          chatWith: sender,
        });

        // Also send back to sender for confirmation
        socket.emit('receive_private_message', messageData);

        console.log(`💬 [private] ${sender} → ${to}: ${message.trim()}`);
      } catch (err) {
        console.error('Socket private_message error:', err);
      }
    });

    /**
     * EVENT: typing
     * Client sends { room, to } to indicate they are typing.
     * room = 'global' for global chat, or omit for private chat with 'to'.
     */
    socket.on('typing', ({ room, to }) => {
      const username = socket.userId;
      if (!username) return;

      if (room === 'global') {
        socket.to('global').emit('user_typing', {
          username,
          room: 'global',
        });
      } else if (to) {
        // Send typing indicator to the specific user
        io.to(`user:${to}`).emit('user_typing', {
          username,
          room: 'private',
        });
      }
    });

    /**
     * EVENT: stop_typing
     * Client sends when they stop typing.
     */
    socket.on('stop_typing', ({ room, to }) => {
      const username = socket.userId;
      if (!username) return;

      if (room === 'global') {
        socket.to('global').emit('user_stop_typing', {
          username,
          room: 'global',
        });
      } else if (to) {
        io.to(`user:${to}`).emit('user_stop_typing', {
          username,
          room: 'private',
        });
      }
    });

    /**
     * EVENT: disconnect
     * Clean up when a user disconnects.
     */
    socket.on('disconnect', async () => {
      try {
        const username = socketUserMap.get(socket.id);
        if (!username) return;

        // Remove from maps
        socketUserMap.delete(socket.id);

        // Check if user has any other active sockets
        const sockets = await io.in(`user:${username}`).fetchSockets();
        if (sockets.length === 0) {
          // No more connections — mark as offline
          await client.sRem('online_users', username);

          const onlineUsers = await client.sMembers('online_users');

          io.emit('user_offline', {
            username,
            onlineUsers,
          });

          console.log(`👋 User disconnected: ${username}`);
        }
      } catch (err) {
        console.error('Socket disconnect error:', err);
      }
    });
  });

  console.log('🔌 Socket.IO handlers initialized');
}

module.exports = initializeSocket;
