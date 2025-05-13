import React from "react";
import "./Sidebar.css";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onClearChat: () => void;
  history: { title: string; id: string }[];
  onDelete: (id: string) => void;
  onLoadConversation: (id: string) => void;
  userEmail: string;
  onClickGuest: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onClearChat,
  history = [],
  onDelete,
  onLoadConversation,
  onClickGuest,
  userEmail,
}) => {
  return (
    <div className={`sidebar ${isOpen ? "open" : ""} flex flex-col h-screen`}>
      {/* Header */}
      <div className="sidebar-header flex items-center justify-between p-4">
        <h2 className="text-lg font-semibold">History</h2>
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

      {/* Content */}
      <div className="flex-grow overflow-y-auto px-4">
        <button className="new-chat-button mb-4 w-full" onClick={onClearChat}>
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
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Recent Conversations
          </h3>
          <div className="conversation-list">
            {history.length === 0 ? (
              <div className="no-conversations text-sm text-gray-400">
                No recent conversations
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="conversation-item flex justify-between items-center mb-2"
                >
                  <span
                    onClick={() => onLoadConversation(item.id)}
                    className="conversation-title text-sm cursor-pointer hover:underline"
                  >
                    {item.title}
                  </span>
                  <button
                    className="delete-button"
                    onClick={() => onDelete(item.id)}
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

      {/* Footer */}
      <div className="sidebar-footer border-t border-gray-200 p-4">
        <div
          onClick={onClickGuest}
          className="flex flex-col items-start space-y-1"
        >
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center cursor-pointer">
              {userEmail?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="text-sm cursor-pointer">{userEmail || "User"}</div>
          </div>

          {userEmail && (
            <span
              onClick={() => {
                if (confirm("Are you sure you want to log out?")) {
                  localStorage.removeItem("token");
                  localStorage.removeItem("userEmail");
                  localStorage.removeItem("userId");
                  window.location.reload();
                }
              }}
              className="text-sm text-gray-700 hover:text-red-600 cursor-pointer mt-1 ml-10"
            >
              Log out
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
