import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import ChatMessage from './assets/ChatMessage.js';
import TypingIndicator from './assets/TypingIndicator.js';
import Sidebar from './assets/Sidebar.js';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to simulate AI response
  const generateAIResponse = async (userInput) => {
    const responses = [
      `I understand you're asking about '${userInput}'. Let me think about that...`,
      `Thanks for your question about '${userInput}'. Here's what I know...`,
      `Regarding '${userInput}', I can provide the following information...`,
      `Your query on '${userInput}' is interesting. Let me explain...`,
      `I've analyzed your question about '${userInput}' and here's my response...`
    ];
    
    const additional = [
      "This is a complex topic with many perspectives. When considering this question, it's important to look at various angles and consider different viewpoints to form a comprehensive understanding.",
      "There are several factors to consider when addressing this question. First, the context in which this occurs matters significantly. Second, historical precedents may provide valuable insights. Third, consider the potential implications of different approaches.",
      "Based on my knowledge, I can offer some insights. The primary consideration should be the fundamental principles involved, followed by practical applications, and finally the potential consequences of different choices.",
      "While I don't have perfect information, I can share what I know. Experts in this field often debate the nuances, but there are some generally accepted principles that can guide our thinking on this matter.",
      "It's important to approach this topic with nuance. Simple answers rarely capture the complexity of real-world situations, and what works in one context might not be appropriate in another."
    ];
    
    // Simulate thinking time
    return new Promise((resolve) => {
      setTimeout(() => {
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const randomAdditional = additional[Math.floor(Math.random() * additional.length)];
        resolve(`${randomResponse} ${randomAdditional}`);
      }, 2000);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (input.trim() === '') return;
    
    // Get current time
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message
    const userMessage = {
      role: 'user',
      content: input,
      time: currentTime
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsGenerating(true);
    
    // Generate AI response
    const aiResponse = await generateAIResponse(input);
    
    // Get updated time for AI response
    const aiResponseTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add AI message
    const aiMessage = {
      role: 'assistant',
      content: aiResponse,
      time: aiResponseTime
    };
    
    setMessages(prevMessages => [...prevMessages, aiMessage]);
    setIsGenerating(false);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const toggleSidebar = () => {
    console.log('Current sidebarOpen state:', sidebarOpen);
    setSidebarOpen(prevState => !prevState);
  };
  
  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} onClose={toggleSidebar} onClearChat={clearChat} />
      
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <header className="header">
        <button className="menu-button" onClick={toggleSidebar ? toggleSidebar : undefined} aria-label="Toggle sidebar">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 18H21M3 12H21M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
</button>

          <h1>Student booster</h1>
        </header>
        
        <div className="chat-container" ref={chatContainerRef}>
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
            
            {isGenerating && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <form className="input-form" onSubmit={handleSubmit}>
          <div className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              disabled={isGenerating}
            />
            <button type="submit" disabled={isGenerating || input.trim() === ''}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="disclaimer">
            This is a demo application. Responses are simulated.
          </div>
        </form>
      </main>
    </div>
  );
}

export default App;