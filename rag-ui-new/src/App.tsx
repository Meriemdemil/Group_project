import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import ChatMessage from './assets/ChatMessage.tsx';
import TypingIndicator from './assets/TypingIndicator.tsx';
import Sidebar from './assets/Sidebar.tsx';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  time: string;
};

type APIResponse = {
  answers?: string[];
  answer?: string;
  status?: string;
  error?: string;
};

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, {
      role,
      content,
      time: getCurrentTime()
    }]);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim()) {
      setError('Please enter a message');
      return;
    }
    
    // Add user message
    addMessage('user', input);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data: APIResponse = await response.json();
      
      // Handle both response formats
      let answerContent = "I couldn't find an answer to that question.";
      if (data.answer) {
        answerContent = data.answer;
      } else if (data.answers && data.answers.length > 0) {
        answerContent = data.answers.join('\n\n');
      }

      addMessage('assistant', answerContent);
    } catch (err) {
      console.error('API Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get response';
      addMessage('assistant', `Sorry, I encountered an error: ${errorMessage}`);
      setError('Failed to get response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={toggleSidebar} onClearChat={clearChat} />
      
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="header">
          <button className="menu-button" onClick={toggleSidebar} aria-label="Toggle sidebar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 18H21M3 12H21M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
              messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))
            )}
            
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form className="input-form" onSubmit={sendMessage}>
          <div className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message here..."
              disabled={loading}
              aria-label="Type your message"
            />
            <button 
              type="submit" 
              disabled={loading || input.trim() === ''}
              aria-label="Send message"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="disclaimer">
            Student helper powered by RAG
          </div>
        </form>
      </main>
    </div>
  );
}

export default App;