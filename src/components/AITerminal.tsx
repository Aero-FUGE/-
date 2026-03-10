import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Send, Bot, User, Loader2 } from 'lucide-react';
import { ChatMessage, Project, Domain, TaskStatus, Task } from '../types';
import { processSystemCommand, AISystemAction } from '../services/geminiService';
import { soundManager } from '../services/soundService';

interface AITerminalProps {
  projects: Project[];
  domains: Domain[];
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onUpdateProjects: (projects: Project[]) => void;
  onUpdateDomains: (domains: Domain[]) => void;
  addLogEntry: (type: any, eventName: string, targetName: string) => void;
  gainXP: (amount: number, reason: string) => void;
  soundEnabled: boolean;
  onTriggerReconstruction: () => void;
}

export const AITerminal: React.FC<AITerminalProps> = ({ 
  projects, 
  domains, 
  messages, 
  setMessages, 
  onUpdateProjects, 
  onUpdateDomains,
  addLogEntry,
  gainXP,
  soundEnabled,
  onTriggerReconstruction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading && soundEnabled) {
      soundManager.playAIProcessing();
    } else {
      soundManager.stopAIProcessing();
      
      // Play completion sound when loading finishes
      if (!isLoading && soundEnabled) {
        soundManager.playAIComplete();
      }
    }
  }, [isLoading, soundEnabled]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const executeActions = (actions: AISystemAction[]) => {
    let updatedProjects = [...projects];
    let updatedDomains = [...domains];
    let hasChanges = false;

    actions.forEach(action => {
      switch (action.type) {
        case 'CREATE_DOMAIN': {
          const { name, color } = action.payload;
          const newDomain: Domain = {
            id: Math.random().toString(36).substr(2, 9),
            name: name || '新领域',
            color: color || '#0df2f2',
            x: window.innerWidth / 2 - 200,
            y: window.innerHeight / 2 - 200,
            width: 400,
            height: 400,
          };
          updatedDomains.push(newDomain);
          addLogEntry('DOMAIN_CREATED', 'AI 神经链路：新领域已被开拓', newDomain.name);
          gainXP(50, `AI 开拓领域：${newDomain.name}`);
          hasChanges = true;
          break;
        }
        case 'CREATE_RING': {
          const { name, domainId, color, id, deadline } = action.payload;
          const domain = updatedDomains.find(d => d.id === domainId);
          const newProject: Project = {
            id: id || Math.random().toString(36).substr(2, 9),
            name: name || '新闭环',
            x: domain ? 50 : window.innerWidth / 2 - 68,
            y: domain ? 50 : window.innerHeight / 2 - 68,
            scale: 1,
            color: color || (domain ? domain.color : '#0df2f2'),
            tasks: [],
            domainId,
            deadline,
          };
          updatedProjects.push(newProject);
          addLogEntry('RING_CREATED', 'AI 神经链路：检测到新闭环初始化', newProject.name);
          gainXP(20, `AI 初始化闭环：${newProject.name}`);
          hasChanges = true;
          break;
        }
        case 'ADD_TASK': {
          const { ringId, name, estimatedTime, notes, deadline } = action.payload;
          updatedProjects = updatedProjects.map(p => {
            if (p.id === ringId) {
              const newTask: Task = {
                id: Math.random().toString(36).substr(2, 9),
                name: name || '新任务',
                estimatedTime: estimatedTime || 60,
                actualTime: 0,
                status: TaskStatus.TODO,
                notes: notes || '',
                order: p.tasks.length,
                deadline,
              };
              addLogEntry('TASK_PROGRESS', 'AI 神经链路：任务已注入', newTask.name);
              gainXP(5, `AI 注入任务：${newTask.name}`);
              return { ...p, tasks: [...p.tasks, newTask] };
            }
            return p;
          });
          hasChanges = true;
          break;
        }
        case 'UPDATE_TASK': {
          const { ringId, taskId, status, actualTime, notes, deadline } = action.payload;
          updatedProjects = updatedProjects.map(p => {
            if (p.id === ringId) {
              const updatedTasks = p.tasks.map(t => {
                if (t.id === taskId) {
                  const isNowDone = status === TaskStatus.DONE && t.status !== TaskStatus.DONE;
                  if (isNowDone) {
                    addLogEntry('TASK_COMPLETED', 'AI 神经链路：任务闭环完成', t.name);
                    gainXP(10, `AI 完成任务：${t.name}`);
                  }
                  return {
                    ...t,
                    status: (status as TaskStatus) || t.status,
                    actualTime: actualTime !== undefined ? actualTime : t.actualTime,
                    notes: notes !== undefined ? notes : t.notes,
                    deadline: deadline !== undefined ? deadline : t.deadline,
                  };
                }
                return t;
              });
              return { ...p, tasks: updatedTasks };
            }
            return p;
          });
          hasChanges = true;
          break;
        }
        case 'UPDATE_RING': {
          const { id, name, scale, color, x, y, deadline } = action.payload;
          updatedProjects = updatedProjects.map(p => {
            if (p.id === id) {
              return {
                ...p,
                name: name || p.name,
                scale: scale !== undefined ? scale : p.scale,
                color: color || p.color,
                x: x !== undefined ? x : p.x,
                y: y !== undefined ? y : p.y,
                deadline: deadline !== undefined ? deadline : p.deadline,
              };
            }
            return p;
          });
          hasChanges = true;
          break;
        }
        case 'DELETE_RING': {
          const { id } = action.payload;
          updatedProjects = updatedProjects.filter(p => p.id !== id);
          addLogEntry('RING_DELETED', 'AI 神经链路：闭环系统已销毁', id);
          hasChanges = true;
          break;
        }
        case 'DELETE_DOMAIN': {
          const { id } = action.payload;
          updatedDomains = updatedDomains.filter(d => d.id !== id);
          // Also unbind projects from this domain
          updatedProjects = updatedProjects.map(p => p.domainId === id ? { ...p, domainId: undefined } : p);
          addLogEntry('DOMAIN_DELETED', 'AI 神经链路：领域已被移除', id);
          hasChanges = true;
          break;
        }
        case 'ORGANIZE_MAP': {
          const { layoutType } = action.payload;
          // Simple grid layout for all rings
          if (layoutType === 'GRID') {
            updatedProjects = updatedProjects.map((p, i) => ({
              ...p,
              x: (i % 5) * 400,
              y: Math.floor(i / 5) * 400,
            }));
          }
          hasChanges = true;
          break;
        }
        case 'FOCUS_ON': {
          // Focus functionality removed as legacy map is disabled
          break;
        }
      }
    });

    if (hasChanges) {
      onTriggerReconstruction();
      onUpdateDomains(updatedDomains);
      onUpdateProjects(updatedProjects);
    }
  };

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
      const { response, actions } = await processSystemCommand(input, projects, domains);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      
      if (actions && actions.length > 0) {
        executeActions(actions);
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
              {messages.map((msg) => {
                const isSystemPrompt = msg.content.startsWith('「系统提示：');
                
                if (isSystemPrompt && msg.role === 'assistant') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="px-4 py-2 rounded-lg border border-primary/10 bg-primary/5">
                        <p className="text-[11px] font-mono text-primary/70 italic tracking-wide">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
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
                );
              })}
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
