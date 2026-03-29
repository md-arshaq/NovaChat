import React, { useState, useRef, useEffect } from 'react';
import { socket } from '../socket';
import ProfileModal from './ProfileModal';
import UserAvatar from './UserAvatar';
import globalChatIcon from '../assets/global-chat.png';

const ChatArea = ({ user, activeChat, messages, isLoading, typingUsers }) => {
  const [inputVal, setInputVal] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    if (activeChat.type === 'global') {
      socket.emit('send_message', { message: inputVal });
    } else {
      socket.emit('private_message', { to: activeChat.id, message: inputVal });
    }

    // Stop typing locally immediately
    socket.emit('stop_typing', { room: activeChat.type, to: activeChat.type === 'private' ? activeChat.id : undefined });
    clearTimeout(typingTimeoutRef.current);

    setInputVal('');
  };

  const handleInputChange = (e) => {
    setInputVal(e.target.value);

    // Emit typing event
    socket.emit('typing', { room: activeChat.type, to: activeChat.type === 'private' ? activeChat.id : undefined });

    // Clear existing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { room: activeChat.type, to: activeChat.type === 'private' ? activeChat.id : undefined });
    }, 2000);
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleUserClick = (username) => {
    if (username !== user?.username) {
      setSelectedUser(username);
    }
  };

  return (
    <>
      <div className="chat-area">
        <header className="chat-header glass-panel">
          <div className="chat-title-info">
            {activeChat.type === 'global' ? (
              <>
                <img src={globalChatIcon} alt="Global Chat" className="chat-icon group-icon" />
                <div className="header-details">
                  <h2>Global Chat</h2>
                  <span className="subtitle">Public room for all users</span>
                </div>
              </>
            ) : (
              <>
                <UserAvatar
                  username={activeChat.id}
                  className="avatar clickable"
                  onClick={() => handleUserClick(activeChat.id)}
                  title="View Profile"
                />
                <div className="header-details">
                  <h2
                    className="clickable"
                    onClick={() => handleUserClick(activeChat.id)}
                    style={{ cursor: 'pointer' }}
                    title="View Profile"
                  >
                    {activeChat.id}
                  </h2>
                  <span className="subtitle">Private Conversation</span>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="messages-container">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <h3>No messages yet</h3>
              <p>Be the first to say hello!</p>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((msg, i) => {
                const isMine = msg.user === user?.username;
                const showAvatar = !isMine && (i === 0 || messages[i - 1].user !== msg.user);

                return (
                  <div key={msg.id} className={`message-wrapper ${isMine ? 'mine' : 'theirs'}`}>
                    {!isMine && (
                      <div className="message-avatar">
                        {showAvatar && (
                          <UserAvatar
                            username={msg.user}
                            className="avatar small clickable"
                            title={`View ${msg.user}'s Profile`}
                            onClick={() => handleUserClick(msg.user)}
                          />
                        )}
                      </div>
                    )}
                    <div className="message-content">
                      {!isMine && showAvatar && (
                        <span
                          className="message-sender clickable"
                          onClick={() => handleUserClick(msg.user)}
                          style={{ cursor: 'pointer' }}
                        >
                          {msg.user}
                        </span>
                      )}
                      <div className="message-bubble fade-in">
                        {msg.message}
                      </div>
                      <span className="message-time">{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                );
              })}

              {typingUsers.length > 0 && (
                <div className="typing-indicator fade-in">
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  <div className="dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="chat-input-area glass-panel">
          <form onSubmit={handleSendMessage} className="message-form">
            <input
              type="text"
              placeholder="Type a message..."
              value={inputVal}
              onChange={handleInputChange}
              className="message-input"
              autoComplete="off"
            />
            <button type="submit" className="send-btn" disabled={!inputVal.trim() || isLoading}>
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      </div>

      <ProfileModal
        username={selectedUser}
        isOpen={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
      />
    </>
  );
};

export default ChatArea;
