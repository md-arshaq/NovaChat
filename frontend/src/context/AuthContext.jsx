import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { socket } from '../socket';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ bio: '', avatar_url: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const sessionId = localStorage.getItem('sessionId');
    const username = localStorage.getItem('username');
    
    if (sessionId && username) {
      setUser({ username, sessionId });
      connectSocket(sessionId);
      fetchProfile();
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

  const fetchProfile = async () => {
    try {
      const data = await api.get('/api/users/me');
      if (data.success) {
        setProfile({
          bio: data.profile.bio || '',
          avatar_url: data.profile.avatar_url || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const updateProfile = async (formData) => {
    const data = await api.upload('/api/users/profile', formData);
    if (data.success) {
      setProfile({
        bio: data.profile.bio || '',
        avatar_url: data.profile.avatar_url || '',
      });
    }
    return data;
  };

  const login = async (username, password) => {
    try {
      const data = await api.post('/api/auth/login', { username, password });
      if (data.success) {
        localStorage.setItem('sessionId', data.sessionId);
        localStorage.setItem('username', data.username);
        setUser({ username: data.username, sessionId: data.sessionId });
        connectSocket(data.sessionId);
        // Fetch profile after login
        setTimeout(() => fetchProfile(), 100);
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
      setProfile({ bio: '', avatar_url: '' });
      socket.disconnect();
    }
  };

  const value = {
    user,
    profile,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
