import React from 'react';

const Sidebar = ({ user, logout, onlineUsers, contacts, activeChat, onSelectChat }) => {
  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="user-profile">
          <div className="avatar">
            {user?.username?.[0]?.toUpperCase()}
            <span className="status-dot"></span>
          </div>
          <div className="user-info">
            <span className="username">{user?.username}</span>
            <span className="status-text">Online</span>
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
              <div className="chat-icon group-icon">🌍</div>
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
                  <div className="avatar small">
                    {u[0].toUpperCase()}
                    <span className="status-dot online"></span>
                  </div>
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
                  <div className="avatar small">
                    {contact[0].toUpperCase()}
                    {/* Only show offline if they aren't in the online list */}
                    <span className={`status-dot ${onlineUsers.includes(contact) ? 'online' : 'offline'}`}></span>
                  </div>
                  <div className="chat-name">{contact}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
