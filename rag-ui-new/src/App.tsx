import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import ChatMessage from './assets/ChatMessage.tsx';
import TypingIndicator from './assets/TypingIndicator.tsx';
import Sidebar from './assets/Sidebar.tsx';

function App() {
  const [messages, setMessages] = useState<{role: string, content: string, time: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!input.trim()) return;
    
    // Get current time
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message
    const userMessage = {
      role: 'user',
      content: input,
      time: currentTime
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input }),
      });

      const data = await response.json();
      const aiResponseTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const botMessage = {
        role: 'assistant',
        content: data.answers.join('\n\n'),
        time: aiResponseTime
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.', time: errorTime }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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
        
        <form className="input-form" onSubmit={sendMessage}>
          <div className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message here..."
              disabled={loading}
            />
<button 
  type="submit" 
  disabled={loading || input.trim() === ''}
  aria-label="Send message" // For screen readers
>              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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