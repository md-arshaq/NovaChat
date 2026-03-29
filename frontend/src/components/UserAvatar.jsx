import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getAvatarUrl as resolveAvatarUrl } from '../utils/helpers';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Shared cache to prevent fetching the same profile multiple times
const avatarCache = {};
const pendingRequests = {};

const UserAvatar = ({ username, className = "avatar", onClick, title, children, style }) => {
  const [avatarUrl, setAvatarUrl] = useState(avatarCache[username]);

  useEffect(() => {
    if (!username) return;

    if (avatarCache[username] !== undefined) {
      setAvatarUrl(avatarCache[username]);
      return;
    }

    if (!pendingRequests[username]) {
      pendingRequests[username] = api.get(`/api/users/profile/${username}`)
        .then(res => {
          if (res.success && res.profile.avatar_url) {
            const url = resolveAvatarUrl(res.profile.avatar_url, BACKEND_URL);
            avatarCache[username] = url;
            return url;
          }
          avatarCache[username] = null;
          return null;
        })
        .catch(err => {
          avatarCache[username] = null;
          return null;
        });
    }

    pendingRequests[username].then(url => {
        setAvatarUrl(url);
    });

  }, [username]);

  return (
    <div 
      className={className} 
      onClick={onClick} 
      title={title} 
      style={{ ...(onClick ? { cursor: 'pointer' } : {}), ...style }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={username} className="avatar-img" />
      ) : (
        username?.[0]?.toUpperCase()
      )}
      {children}
    </div>
  );
};

export default UserAvatar;
