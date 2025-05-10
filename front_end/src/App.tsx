import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import ChatMessage from "./assets/ChatMessage.tsx";
import TypingIndicator from "./assets/TypingIndicator.tsx";
import Sidebar from "./assets/Sidebar.tsx";
import Login from "./assets/Login.tsx";
import SignUp from "./assets/SignUp.tsx";
import ForgotPassword from "./assets/forgotPassword.tsx";

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
  const [userEmail, setUserEmail] = useState(
    () => localStorage.getItem("userEmail") || ""
  );
  const [chatSessions, setChatSessions] = useState<Record<string, Message[]>>(
    {}
  );
  const [showAuthModal, setShowAuthModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [authMode, setAuthMode] = useState<
    "login" | "signup" | "forgotPassword"
  >("login");
  const [showLogin, setShowLogin] = useState(false);

  const openLogin = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) setUserEmail(email);
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    fetch(`http://localhost:5001/api/conversations/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Loaded history for user:", userId, data);
        setMessagesHistory(
          data.map((conv: any) => ({ id: conv.id, title: conv.title }))
        );
      })
      .catch(console.error);
  }, [userEmail]);

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

    if (!userEmail) {
      alert("Please log in to ask a question.");
      return;
    }

    console.log("📤 Sending to RAG server at 5000:", input);
    const userMessage = input;
    addMessage("user", userMessage);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      // ✅ Step 1: Ensure conversation exists in DB before inserting messages
      const userId = localStorage.getItem("userId");
      const alreadySaved = messagesHistory.find((h) => h.id === conversationId);
      if (userId && !alreadySaved) {
        console.log("📝 Creating conversation in DB first:", {
          id: conversationId,
          userId,
          title: input,
        });

        await fetch("http://localhost:5001/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: conversationId, // force ID to match in both DB and frontend
            userId,
            title: input,
          }),
        });

        setMessagesHistory((prev) => [
          { title: input, id: conversationId },
          ...prev,
        ]);
      }

      // ✅ Step 2: Call RAG server
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
      const answerText = data.answer || "I couldn't find an answer.";

      // ✅ Step 3: Save to local state
      addMessage("assistant", answerText);

      // ✅ Step 4: Save messages to DB
      console.log("📥 Storing user message:", { conversationId, userMessage });
      await fetch("http://localhost:5001/api/conversations/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          role: "user",
          content: userMessage,
        }),
      });

      console.log("📥 Storing assistant message:", {
        conversationId,
        answerText,
      });
      await fetch("http://localhost:5001/api/conversations/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          role: "assistant",
          content: answerText,
        }),
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("❌ Error in sendMessage:", errMsg);
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

  const handleDeleteConversation = async (id: string) => {
    try {
      await fetch(`http://localhost:5001/api/conversations/${id}`, {
        method: "DELETE",
      });

      setMessagesHistory((prev) => prev.filter((conv) => conv.id !== id));
      setChatSessions((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });

      if (id === conversationId) {
        clearChat();
        setConversationId(crypto.randomUUID());
      }
    } catch (error) {
      console.error("❌ Failed to delete conversation:", error);
      alert("Failed to delete conversation. Try again.");
    }
  };

  const handleNewChat = async () => {
    clearChat();
    const newId = crypto.randomUUID();
    setConversationId(newId);

    const userId = localStorage.getItem("userId");
    const firstMessage = messages.find((m) => m.role === "user");

    if (userId && firstMessage) {
      await fetch("http://localhost:5001/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: firstMessage?.content || "New Chat",
        }),
      });
    }
  };

  const handleLoadConversation = async (id: string) => {
    const res = await fetch(
      `http://localhost:5001/api/conversations/messages/${id}`
    );
    const data = await res.json();
    setMessages(data);
    setConversationId(id);
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
        userEmail={userEmail}
        onClickGuest={() => {
          if (!userEmail) setShowLogin(true);
        }}
      />

      <main className={`main-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <header className="header">
          <button className="menu-button" onClick={toggleSidebar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor"
                strokeWidth="2"
              />
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
              className="w-full p-3 bg-white text-white rounded-md focus:outline-none"
            />
            <button type="submit" disabled={loading || !input.trim()}>
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

      {showLogin && authMode === "login" && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-[100] flex items-center justify-center">
          <Login
            onLogin={(email, id) => {
              localStorage.setItem("userEmail", email);
              localStorage.setItem("userId", id);
              setUserEmail(email);
              setShowLogin(false);
              setAuthMode("login");
              closeLogin();
            }}
            onSwitchToSignup={() => setAuthMode("signup")}
            onSwitchToForgotPassword={() => setAuthMode("forgotPassword")}
            onClose={closeLogin}
          />
        </div>
      )}

      {showLogin && authMode === "signup" && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center">
          <SignUp
            onSwitchToLogin={() => setAuthMode("login")}
            onClose={closeLogin}
            onLogin={(email, id) => {
              localStorage.setItem("userEmail", email);
              localStorage.setItem("userId", id);
              setUserEmail(email);
              setShowLogin(false);
            }}
          />
        </div>
      )}

      {showLogin && authMode === "forgotPassword" && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center">
          <ForgotPassword
            onSwitchToLogin={() => setAuthMode("login")}
            onClose={closeLogin}
          />
        </div>
      )}
    </div>
  );
}

export default App;
