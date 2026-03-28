// Simple wrapper for fetch API
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const api = {
  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    // Get session ID from localStorage
    const sessionId = localStorage.getItem('sessionId');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    
    if (sessionId) {
      headers['x-session-id'] = sessionId;
    }

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }
};
