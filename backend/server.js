// Load environment variables first
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Import modules
const { connectRedis } = require('./config/redis');
const initializeSocket = require('./socket/socketHandler');

// Import routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');

// ─── App Setup ─────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS support
const io = new Server(server, {
  cors: {
    origin: '*', // Will restrict to frontend URL in production
    methods: ['GET', 'POST'],
  },
});

// ─── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ───────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '🚀 NGD Chat Server is running!',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth (signup, login, logout)',
      chat: '/api/chat (message, history, private)',
      users: '/api/users (online, profile)',
    },
  });
});

// ─── API Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

// ─── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ─── Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
});

// ─── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Connect to Redis first
    await connectRedis();

    // Initialize Socket.IO handlers
    initializeSocket(io);

    // Start listening
    server.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════');
      console.log(`🚀  NGD Chat Server running on port ${PORT}`);
      console.log(`📡  REST API:    http://localhost:${PORT}`);
      console.log(`🔌  WebSocket:   http://localhost:${PORT}`);
      console.log('═══════════════════════════════════════════');
      console.log('');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
