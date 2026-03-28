/**
 * Generate a consistent chat stream key for two users.
 * Sorts usernames alphabetically so both users use the same key.
 * @param {string} user1
 * @param {string} user2
 * @returns {string} e.g. "chat_stream:alice_bob"
 */
function getChatKey(user1, user2) {
  const sorted = [user1, user2].sort();
  return `chat_stream:${sorted[0]}_${sorted[1]}`;
}

/**
 * Format a Redis Stream entry into a clean message object.
 * @param {object} entry - Raw Redis stream entry { id, message }
 * @returns {object} Formatted message
 */
function formatStreamMessage(entry) {
  return {
    id: entry.id,
    user: entry.message.user,
    message: entry.message.message,
    timestamp: entry.message.timestamp,
  };
}

module.exports = { getChatKey, formatStreamMessage };
