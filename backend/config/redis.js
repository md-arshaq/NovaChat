const redis = require('redis');

// Create Redis client
let clientOptions = {};

if (process.env.REDIS_URL) {
  clientOptions.url = process.env.REDIS_URL;
  
  // If the URL uses rediss://, it requires TLS
  if (process.env.REDIS_URL.startsWith('rediss://')) {
    clientOptions.socket = {
      tls: true,
      rejectUnauthorized: false,
    };
  }
} else {
  clientOptions.socket = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  };
}

const client = redis.createClient(clientOptions);

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
    const hostInfo = process.env.REDIS_URL || `${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
    console.error(`💡 Make sure Redis is running on / properly configured at: ${hostInfo}`);
    process.exit(1);
  }
};

module.exports = { client, connectRedis };
