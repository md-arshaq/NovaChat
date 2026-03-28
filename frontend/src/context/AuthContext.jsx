import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { socket } from '../socket';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const sessionId = localStorage.getItem('sessionId');
    const username = localStorage.getItem('username');
    
    if (sessionId && username) {
      setUser({ username, sessionId });
      connectSocket(sessionId);
    }
    setLoading(false);

    return () => {
      socket.disconnect();
    };
  }, []);

  const connectSocket = (sessionId) => {
    socket.io.opts.query = { sessionId };
    socket.connect();
    
    socket.emit('authenticate', { sessionId });
    
    socket.on('auth_error', (data) => {
      console.error('Socket authentication error:', data.message);
      logout();
    });
  };

  const login = async (username, password) => {
    try {
      const data = await api.post('/api/auth/login', { username, password });
      if (data.success) {
        localStorage.setItem('sessionId', data.sessionId);
        localStorage.setItem('username', data.username);
        setUser({ username: data.username, sessionId: data.sessionId });
        connectSocket(data.sessionId);
        return { success: true };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const signup = async (username, password) => {
    try {
      const data = await api.post('/api/auth/signup', { username, password });
      if (data.success) {
        localStorage.setItem('sessionId', data.sessionId);
        localStorage.setItem('username', data.username);
        setUser({ username: data.username, sessionId: data.sessionId });
        connectSocket(data.sessionId);
        return { success: true };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout', {});
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      localStorage.removeItem('sessionId');
      localStorage.removeItem('username');
      setUser(null);
      socket.disconnect();
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
