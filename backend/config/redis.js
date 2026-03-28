const redis = require('redis');

// Create Redis client
const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
});

// Error handling
client.on('error', (err) => {
  console.error('❌ Redis Client Error:', err.message);
});

client.on('connect', () => {
  console.log('🔗 Connecting to Redis...');
});

client.on('ready', () => {
  console.log('✅ Redis is ready!');
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await client.connect();
    // Test the connection
    const pong = await client.ping();
    console.log(`✅ Redis PING → ${pong}`);
  } catch (err) {
    console.error('❌ Failed to connect to Redis:', err.message);
    console.error('💡 Make sure Redis is running on', process.env.REDIS_HOST + ':' + process.env.REDIS_PORT);
    process.exit(1);
  }
};

module.exports = { client, connectRedis };
