import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProfileEditor from './ProfileEditor';
import UserAvatar from './UserAvatar';
import globalChatIcon from '../assets/global-chat.png';
import { getAvatarUrl } from '../utils/helpers';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const Sidebar = ({ user, logout, onlineUsers, contacts, activeChat, onSelectChat }) => {
  const { profile } = useAuth();
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const avatarUrl = getAvatarUrl(profile?.avatar_url, BACKEND_URL);

  return (
    <>
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <div
            className="user-profile"
            onClick={() => setShowProfileEditor(true)}
            style={{ cursor: 'pointer' }}
            title="Edit profile"
            id="sidebar-open-profile"
          >
            <div className="avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user?.username} className="avatar-img" />
              ) : (
                user?.username?.[0]?.toUpperCase()
              )}
              <span className="status-dot"></span>
            </div>
            <div className="user-info">
              <span className="username">{user?.username}</span>
              <span className="status-text">Online</span>
            </div>
            {/* Edit hint icon */}
            <div className="profile-edit-hint">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
          </div>
          <button onClick={logout} className="logout-btn" title="Logout">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>

        <div className="sidebar-scrollable">
          <div className="sidebar-section">
            <h3 className="section-title">Rooms</h3>
            <ul className="chat-list">
              <li
                className={`chat-item ${activeChat.type === 'global' ? 'active' : ''}`}
                onClick={() => onSelectChat('global', 'global')}
              >
                <img src={globalChatIcon} alt="Global Chat" className="chat-icon group-icon" />
                <div className="chat-name">Global Chat</div>
              </li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h3 className="section-title">Online Users ({onlineUsers.length})</h3>
            {onlineUsers.length === 0 ? (
              <div className="empty-state">No one else is online</div>
            ) : (
              <ul className="chat-list">
                {onlineUsers.map(u => (
                  <li
                    key={u}
                    className={`chat-item ${activeChat.id === u ? 'active' : ''}`}
                    onClick={() => onSelectChat('private', u)}
                  >
                    <UserAvatar username={u} className="avatar small">
                      <span className="status-dot online"></span>
                    </UserAvatar>
                    <div className="chat-name">{u}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {contacts.length > 0 && (
            <div className="sidebar-section">
              <h3 className="section-title">Recent Chats</h3>
              <ul className="chat-list">
                {contacts.map(contact => (
                  <li
                    key={contact}
                    className={`chat-item ${activeChat.id === contact ? 'active' : ''}`}
                    onClick={() => onSelectChat('private', contact)}
                  >
                    <UserAvatar username={contact} className="avatar small">
                      {/* Only show offline if they aren't in the online list */}
                      <span className={`status-dot ${onlineUsers.includes(contact) ? 'online' : 'offline'}`}></span>
                    </UserAvatar>
                    <div className="chat-name">{contact}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>

      <ProfileEditor
        isOpen={showProfileEditor}
        onClose={() => setShowProfileEditor(false)}
      />
    </>
  );
};

export default Sidebar;
