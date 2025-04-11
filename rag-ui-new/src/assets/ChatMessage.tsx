import React from 'react';
import './ChatMessage.css';

const ChatMessage = ({ message }) => {
  const { role, content, time } = message;
  
  return (
    <div className={`message ${role === 'user' ? 'user-message' : 'ai-message'}`}>
      <div className="message-header">
        {role === 'user' ? 'You' : 'AI Assistant'}
      </div>
      <div className="message-content">{content}</div>
      <div className="message-time">{time}</div>
    </div>
  );
};

export default ChatMessage;