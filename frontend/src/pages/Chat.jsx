import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { socket } from '../socket';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';

const Chat = () => {
  const { user, logout } = useAuth();
  
  // State
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState({ type: 'global', id: 'global' }); // { type: 'global' | 'private', id: string }
  
  // Real-time messages state
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // References to keep event handlers updated with latest state
  const activeChatRef = useRef(activeChat);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  useEffect(() => {
    // Initial data fetch
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        // Get online users
        const onlineRes = await api.get('/api/users/online');
        if (onlineRes.success) {
          setOnlineUsers(onlineRes.users.filter(u => u !== user.username));
        }

        // Get contacts
        const contactsRes = await api.get('/api/chat/contacts');
        if (contactsRes.success) {
          setContacts(contactsRes.contacts);
        }
        
      } catch (error) {
        console.error('Failed to fetch initial chat data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Socket Event Listeners for Presence
    const handleUserOnline = (data) => {
      setOnlineUsers(data.onlineUsers.filter(u => u !== user?.username));
    };

    const handleUserOffline = (data) => {
      setOnlineUsers(data.onlineUsers.filter(u => u !== user?.username));
    };

    // Socket Event Listeners for Real-time Messaging
    const handleNewMessage = (message) => {
      // Only append if we are currently looking at the global chat
      if (activeChatRef.current.type === 'global') {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleReceivePrivateMessage = (message) => {
      // Update contacts list if it's a new contact
      setContacts(prev => {
        if (!prev.includes(message.chatWith)) {
          return [...prev, message.chatWith];
        }
        return prev;
      });

      // Append to view if we are actively chatting with them
      if (activeChatRef.current.type === 'private' && activeChatRef.current.id === message.chatWith) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleUserTyping = (data) => {
      const isRelevant = 
        (data.room === 'global' && activeChatRef.current.type === 'global') ||
        (data.room === 'private' && activeChatRef.current.type === 'private' && activeChatRef.current.id === data.username);
      
      if (isRelevant) {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.add(data.username);
          return next;
        });
      }
    };

    const handleUserStopTyping = (data) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(data.username);
        return next;
      });
    };

    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('new_message', handleNewMessage);
    socket.on('receive_private_message', handleReceivePrivateMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('new_message', handleNewMessage);
      socket.off('receive_private_message', handleReceivePrivateMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [user]);

  // Handle Chat Switching
  const handleSelectChat = async (type, id) => {
    setActiveChat({ type, id });
    setMessages([]);
    setTypingUsers(new Set());
    setIsLoading(true);

    try {
      if (type === 'global') {
        const res = await api.get('/api/chat/history');
        if (res.success) setMessages(res.messages);
      } else if (type === 'private') {
        const res = await api.get(`/api/chat/private/${id}`);
        if (res.success) setMessages(res.messages);
        
        // Ensure user is in contacts if we initiate chat from "Online Users"
        setContacts(prev => prev.includes(id) ? prev : [...prev, id]);
      }
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load of global chat history
  useEffect(() => {
    handleSelectChat('global', 'global');
  }, []);

  return (
    <div className="chat-layout">
      <Sidebar 
        user={user}
        logout={logout}
        onlineUsers={onlineUsers} 
        contacts={contacts}
        activeChat={activeChat}
        onSelectChat={handleSelectChat}
      />
      <div className="main-content">
        <ChatArea 
          user={user}
          activeChat={activeChat}
          messages={messages}
          isLoading={isLoading}
          typingUsers={Array.from(typingUsers)}
        />
      </div>
    </div>
  );
};

export default Chat;
