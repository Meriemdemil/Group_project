// ChatMessage.jsx
import React from "react";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import ReactMarkdown from "react-markdown";

import "./ChatMessage.css";

const ChatMessage = ({ message }) => {
  const { role, content, time } = message;

  // If it's an object, serialize it; otherwise just render the string
  const text =
    typeof content === "string" ? content : JSON.stringify(content, null, 2);

  return (
    <div
      className={`message ${role === "user" ? "user-message" : "ai-message"}`}
    >
      <div className="message-header">
        {role === "user" ? "You" : "AI Assistant"}
      </div>

      <div className="message-content markdown-body">
        <div className="markdown-body">
          <ReactMarkdown
            children={message.content}
            remarkPlugins={[remarkGfm, remarkBreaks]}
          />
        </div>
      </div>

      <div className="message-time">{time}</div>
    </div>
  );
};

export default ChatMessage;