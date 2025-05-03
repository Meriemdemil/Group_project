import React from "react";
import "./Sidebar.css";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onClearChat: () => void;
  history: { title: string; id: string }[];
  onDelete: (id: string) => void;
  onLoadConversation: (id: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onClearChat,
  history,
  onDelete,
  onLoadConversation,
}) => {
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h2>History</h2>
        <button
          className="close-button"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="sidebar-content">
        <button className="new-chat-button" onClick={onClearChat}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          New Chat
        </button>

        <div className="conversations">
          <h3>Recent Conversations</h3>
          <div className="conversation-list">
            {history.length === 0 ? (
              <div className="no-conversations">No recent conversations</div>
            ) : (
              [...history]
                .slice()
                .map((item) => (
                  <div key={item.id} className="conversation-item">
                    <span
                      onClick={() => onLoadConversation(item.id)}
                      className="conversation-title"
                    >
                      {item.title}
                    </span>
                    <button
                      className="delete-button"
                      onClick={() => onDelete(item.id)} // Adjust index due to reverse()
                      title="Delete"
                      aria-label="Delete conversation"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6l-1 14H6L5 6"></path>
                        <path d="M10 11v6"></path>
                        <path d="M14 11v6"></path>
                        <path d="M9 6V4h6v2"></path>
                      </svg>
                    </button>
                  </div>
                ))
            )}
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
