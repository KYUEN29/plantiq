import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { askChatAssistant } from '../services/api';

const QUICK_SUGGESTIONS = [
  "How are my plants doing?",
  "Why is my plant unhealthy?",
  "How to improve growth?",
  "Give me a care summary",
];

const ChatWidget = ({ latestResults }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hey there! 🌿 I'm your Plantiq assistant. Ask me about your plants, past assessments, or any care tips you need!", sender: 'ai' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    const userQuery = text.trim();
    const newMsg = { id: Date.now(), text: userQuery, sender: 'user' };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setIsTyping(true);
    setShowSuggestions(false);

    const sessionContext = latestResults 
      ? { current_session: latestResults } 
      : {};

    try {
      const reply = await askChatAssistant(userQuery, sessionContext);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: reply, sender: 'ai' }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "Hmm, I couldn't reach my servers right now. Please try again in a moment! 🌱", sender: 'ai' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat UI */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col mb-4 animate-in fade-in slide-in-from-bottom-8 duration-300" style={{ height: '520px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">Plantiq Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse"></div>
                  <p className="text-sm text-green-50 opacity-90">Online</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.sender === 'user' ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'}`}>
                    {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>
                  <div className={`p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-gray-900 text-white rounded-tr-sm dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-100 dark:border-gray-700 shadow-sm'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Quick Suggestions */}
            {showSuggestions && messages.length <= 2 && (
              <div className="flex flex-wrap gap-2 ml-9">
                {QUICK_SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800/40 text-green-700 dark:text-green-400 rounded-full text-xs font-medium hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors active:scale-95"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[85%] flex-row">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 rounded-tl-sm shadow-sm flex items-center gap-1.5 border border-gray-100 dark:border-gray-700">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 relative">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about your plants..." 
                className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm outline-none dark:text-white transition-all"
              />
              <button 
                type="submit" 
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-2 p-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-all active:scale-90"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${isOpen ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 rotate-0' : 'bg-gradient-to-tr from-green-500 to-emerald-400 text-white animate-pulse hover:animate-none'}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
};

export default ChatWidget;

