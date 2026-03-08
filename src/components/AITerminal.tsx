import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Send, Bot, User, Loader2 } from 'lucide-react';
import { ChatMessage, Project } from '../types';
import { processSystemCommand } from '../services/geminiService';

interface AITerminalProps {
  projects: Project[];
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onUpdateProjects: (projects: Project[]) => void;
}

export const AITerminal: React.FC<AITerminalProps> = ({ projects, messages, setMessages, onUpdateProjects }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { response, updatedProjects } = await processSystemCommand(input, projects);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (updatedProjects) {
        onUpdateProjects(updatedProjects);
      }
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '系统连接中断，请检查神经链路。',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      drag
      dragMomentum={false}
      className="fixed bottom-8 right-8 z-[60]"
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[calc(100vw-2rem)] sm:w-[400px] h-[70vh] sm:h-[500px] bg-background-dark/95 backdrop-blur-2xl border border-primary/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when interacting with terminal
          >
            {/* Header */}
            <div className="p-4 border-b border-primary/20 bg-primary/5 flex items-center gap-2">
              <Terminal size={16} className="text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">系统 AI 终端</span>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Bot size={48} className="text-primary/20 mb-4" />
                  <p className="text-sm text-white/40">我是系统助手。你可以向我汇报进度，或请求创建、拆分任务。</p>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? 'bg-primary/10 text-primary' : 'bg-white/5 text-white/60'
                    }`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user' 
                        ? 'bg-primary/20 text-primary rounded-tr-none' 
                        : 'bg-white/5 text-white/90 rounded-tl-none border border-white/5'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="size-8 rounded-lg flex items-center justify-center bg-white/5 text-white/60">
                      <Bot size={16} />
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl rounded-tl-none border border-white/5">
                      <Loader2 size={16} className="animate-spin text-primary" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-primary/20 bg-background-dark">
              <div className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="输入指令..."
                  className="w-full bg-white/5 border border-primary/20 rounded-lg pl-4 pr-12 py-3 text-sm text-primary placeholder:text-primary/30 focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-white transition-colors disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group"
      >
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all"></div>
        <div className="w-16 h-16 bg-background-dark/80 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-primary relative z-10 transition-transform hover:scale-110">
          <Bot size={32} className="text-primary" />
        </div>
        {messages.length > 0 && !isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-background-dark z-20 animate-pulse"></div>
        )}
      </button>
    </motion.div>
  );
};
