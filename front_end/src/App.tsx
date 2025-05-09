import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import ChatMessage from "./assets/ChatMessage.tsx";
import TypingIndicator from "./assets/TypingIndicator.tsx";
import Sidebar from "./assets/Sidebar.tsx";

// Types

type Message = {
  role: "user" | "assistant";
  content: string;
  time: string;
};

type APIResponse = {
  answer?: string;
  status?: string;
  error?: string;
  conversation_id?: string;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesHistory, setMessagesHistory] = useState<
    { title: string; id: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>(() =>
    crypto.randomUUID()
  );
  const [chatSessions, setChatSessions] = useState<Record<string, Message[]>>(
    {}
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getCurrentTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const addMessage = (role: "user" | "assistant", content: string) => {
    const newMessage = { role, content, time: getCurrentTime() };
    setMessages((prev) => [...prev, newMessage]);
    setChatSessions((prevSessions) => ({
      ...prevSessions,
      [conversationId]: [...(prevSessions[conversationId] || []), newMessage],
    }));
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    addMessage("user", input);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          history: messages.map(({ role, content }) => ({ role, content })),
          conversation_id: conversationId,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data: APIResponse = await response.json();

      if (data.conversation_id && data.conversation_id !== conversationId) {
        setConversationId(data.conversation_id);
      }

      const answerText = data.answer || "I couldn't find an answer.";
      addMessage("assistant", answerText);
      console.log("Answer content (debug):", JSON.stringify(answerText));


      // ✅ Save conversation title to history (only once per new conversation)
      const alreadySaved = messagesHistory.find((h) => h.id === conversationId);
      const firstUserMessage = messages.find((m) => m.role === "user") || {
        content: input,
      };

      if (!alreadySaved && firstUserMessage) {
        setMessagesHistory((prev) => [
          { title: firstUserMessage.content, id: conversationId },
          ...prev,
        ]);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      addMessage("assistant", `Sorry, I encountered an error: ${errMsg}`);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };


  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDeleteConversation = (id: string) => {
    setMessagesHistory((prev) => prev.filter((conv) => conv.id !== id));
    setChatSessions((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    // 🟢 If the deleted conversation is currently active, reset the UI
    if (id === conversationId) {
      clearChat();
      setConversationId(crypto.randomUUID());
    }
  };




  const handleNewChat = () => {
    clearChat();
    setConversationId(crypto.randomUUID());
  };



  const handleLoadConversation = (id: string) => {
    const session = chatSessions[id];
    if (session) {
      setConversationId(id);
      setMessages(session);
    }
  };







  return (
    <div className="app">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={toggleSidebar}
        onClearChat={handleNewChat}
        history={messagesHistory}
        onDelete={handleDeleteConversation}
        onLoadConversation={handleLoadConversation}
      />

      <main className={`main-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <header className="header">
        <button
  type="button"
  className="menu-button"
  onClick={toggleSidebar}
  aria-label="Toggle menu"
>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" />
  </svg>
</button>


          <h1>Student booster</h1>
        </header>

        <div className="chat-container">
          <div className="messages">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <h2>Welcome to Student booster</h2>
                <p>Ask me anything and I'll try to help you!</p>
              </div>
            ) : (
              messages.map((msg, i) => <ChatMessage key={i} message={msg} />)
            )}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="input-form" onSubmit={sendMessage}>
          <div className="input-container">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
              placeholder="Type your message here..."
            />
          <button
  type="submit"
  disabled={loading || !input.trim()}
  aria-label="Send message"
>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path
      d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
      stroke="currentColor"
    />
  </svg>
</button>

          </div>
          <div className="disclaimer">Student helper powered by RAG</div>
        </form>
      </main>
    </div>
  );
}

export default App;
