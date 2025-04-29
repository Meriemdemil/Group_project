import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./ChatMessage.css";

const ChatMessage = ({ message }) => {
  const { role, content, time } = message;

  // Coerce content into a plain string
  const markdown =
    typeof content === "string"
      ? content
      : typeof content === "object"
      ? JSON.stringify(content, null, 2)
      : String(content);

  return (
    <div
      className={`message ${role === "user" ? "user-message" : "ai-message"}`}
    >
      <div className="message-header">
        {role === "user" ? "You" : "AI Assistant"}
      </div>
      <div className="message-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
      <div className="message-time">{time}</div>
    </div>
  );
};

export default ChatMessage;
