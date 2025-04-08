import React from 'react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose , onClearChat }) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2>History</h2>
        <button className="close-button" onClick={onClose ? onClose : undefined} aria-label="Close sidebar">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
</button>
      </div>
      
      <div className="sidebar-content">
        <button className="new-chat-button" onClick={onClearChat}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New Chat
        </button>
        
        <div className="conversations">
          <h3>Recent Conversations</h3>
          <div className="conversation-list">
            <div className="no-conversations">No recent conversations</div>
          </div>
        </div>
      </div>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">U</div>
          <div className="user-name">User</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;