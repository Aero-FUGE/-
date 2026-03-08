import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Minus, RotateCcw, Target, Layers, BarChart3, User as UserIcon, Trophy, Maximize2, Activity, FileText, Box } from 'lucide-react';
import { AchievementPanel } from './components/AchievementPanel';
import { SystemArchive } from './components/SystemArchive';
import { SystemLog } from './components/SystemLog';
import { ProfilePanel } from './components/ProfilePanel';
import { DomainArea } from './components/DomainArea';
import { cn } from './lib/utils';
import { ALL_TITLES } from './constants/titles';
import { ChatMessage, Project, TaskStatus, Achievement, UserStats, SystemLogEntry, Domain } from './types';
import { Ring } from './components/Ring';
import { SidePanel } from './components/SidePanel';
import { AITerminal } from './components/AITerminal';

const INITIAL_DOMAINS: Domain[] = [
  { id: 'd1', name: '音乐创作', color: '#0df2f2', x: 200, y: 100, width: 400, height: 400 },
  { id: 'd2', name: '粉丝运营', color: '#ff00ff', x: 650, y: 350, width: 400, height: 400 },
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    name: '新歌制作',
    x: 400,
    y: 200,
    scale: 1,
    color: '#0df2f2',
    domainId: 'd1',
    tasks: [
      { id: 't1', name: '编曲第一段', estimatedTime: 120, actualTime: 0, status: TaskStatus.DONE, order: 0 },
      { id: 't2', name: '人声录制', estimatedTime: 240, actualTime: 0, status: TaskStatus.IN_PROGRESS, order: 1 },
      { id: 't3', name: '后期混音', estimatedTime: 180, actualTime: 0, status: TaskStatus.TODO, order: 2 },
    ],
  },
  {
    id: '2',
    name: '实体专辑设计',
    x: 750,
    y: 450,
    scale: 1.2,
    color: '#ff00ff',
    domainId: 'd2',
    tasks: [
      { id: 't4', name: '封面插画', estimatedTime: 480, actualTime: 0, status: TaskStatus.TODO, order: 0 },
      { id: 't5', name: '排版设计', estimatedTime: 120, actualTime: 0, status: TaskStatus.TODO, order: 1 },
    ],
  },
];

export default function App() {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [domains, setDomains] = useState<Domain[]>(INITIAL_DOMAINS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [viewState, setViewState] = useState({ x: 0, y: 0, scale: 1 });
  const [achievements, setAchievements] = useState<Achievement[]>(ALL_TITLES);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null);
  const [systemLogs, setSystemLogs] = useState<SystemLogEntry[]>([]);
  const [stats, setStats] = useState<UserStats>({
    nickname: '系统绑定者',
    totalRingsCompleted: 0,
    totalTasksCompleted: 0,
    totalTimeSpent: 0,
    dailyRingsCompleted: 0,
    dailyProgress: 0,
    maxDailyProgress: 0,
    streakDays: 1,
    totalRingsCreated: 2, // Initial projects
    totalTasksCreated: 5, // Initial tasks
    lastActiveDate: new Date().toISOString().split('T')[0],
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const addLogEntry = useCallback((type: SystemLogEntry['type'], eventName: string, targetName: string) => {
    const newLog: SystemLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type,
      eventName,
      targetName,
    };
    setSystemLogs(prev => [newLog, ...prev]);
  }, []);

  useEffect(() => {
    // Initialize audio for completion sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    addLogEntry('SYSTEM_AWAKENED', '系统提示：神经链路已建立', '系统觉醒阶段：初始化完成');
  }, []);

  const checkAchievements = useCallback((updatedProjects: Project[]) => {
    const completedRings = updatedProjects.filter(p => 
      p.tasks.length > 0 && p.tasks.every(t => t.status === TaskStatus.DONE)
    );

    const totalTasksDone = updatedProjects.reduce((acc, p) => 
      acc + p.tasks.filter(t => t.status === TaskStatus.DONE).length, 0
    );

    const totalTasks = updatedProjects.reduce((acc, p) => acc + p.tasks.length, 0);
    const progress = totalTasks > 0 ? (totalTasksDone / totalTasks) * 100 : 0;

    setAchievements(prev => {
      let newlyUnlocked: Achievement[] = [];
      const next = prev.map(achievement => {
        if (achievement.unlockedAt) return achievement;

        let unlocked = false;
        const now = new Date();
        const hour = now.getHours();

        switch (achievement.id) {
          case 'awakening_1': if (stats.totalRingsCreated >= 1) unlocked = true; break;
          case 'awakening_2': if (stats.totalTasksCreated >= 3) unlocked = true; break;
          case 'awakening_3': if (completedRings.length >= 1) unlocked = true; break;
          case 'awakening_4': if (stats.streakDays >= 3) unlocked = true; break;
          case 'executor_1': if (completedRings.length >= 3) unlocked = true; break;
          case 'executor_2': if (completedRings.length >= 5) unlocked = true; break;
          case 'executor_3': if (progress >= 30) unlocked = true; break;
          case 'executor_5': if (stats.streakDays >= 7) unlocked = true; break;
          case 'control_1': if (completedRings.length >= 10) unlocked = true; break;
          case 'control_2': if (updatedProjects.length >= 10) unlocked = true; break;
          case 'control_4': if (totalTasksDone >= 100) unlocked = true; break;
          case 'control_5': if (stats.streakDays >= 10) unlocked = true; break;
          case 'rule_1': if (completedRings.length >= 20) unlocked = true; break;
          case 'rule_4': if (progress >= 70) unlocked = true; break;
          case 'rule_5': if (stats.streakDays >= 30) unlocked = true; break;
          case 'hidden_1': if (hour === 4 && completedRings.length > stats.totalRingsCompleted) unlocked = true; break;
          case 'hidden_2': if (hour === 1) unlocked = true; break;
        }

        if (unlocked) {
          const unlockedAchievement = { ...achievement, unlockedAt: Date.now() };
          newlyUnlocked.push(unlockedAchievement);
          return unlockedAchievement;
        }
        return achievement;
      });

      if (newlyUnlocked.length > 0) {
        const broadcastMessages: ChatMessage[] = newlyUnlocked.map(a => ({
          id: `broadcast-${a.id}-${Date.now()}`,
          role: 'assistant',
          content: `【系统提示】检测到称号解锁：\n【${a.title}】\n${a.description}`,
          timestamp: Date.now(),
        }));
        setMessages(prevMsgs => [...prevMsgs, ...broadcastMessages]);
      }

      return next;
    });

    // Update stats
    setStats(prev => ({
      ...prev,
      totalRingsCompleted: completedRings.length,
      totalTasksCompleted: totalTasksDone,
      dailyProgress: progress,
      maxDailyProgress: Math.max(prev.maxDailyProgress, progress),
    }));

    // Trigger sound for new completions
    updatedProjects.forEach(p => {
      const isComplete = p.tasks.length > 0 && p.tasks.every(t => t.status === TaskStatus.DONE);
      const wasComplete = projects.find(old => old.id === p.id)?.isCompleted;
      
      if (isComplete && !wasComplete) {
        audioRef.current?.play().catch(() => {});
        p.isCompleted = true;
      }
    });
  }, [projects, stats.totalRingsCreated, stats.totalTasksCreated, stats.streakDays, stats.totalRingsCompleted]);

  const updateProject = useCallback((updatedProject: Project) => {
    setProjects((prev) => {
      const oldProject = prev.find(p => p.id === updatedProject.id);
      
      const updatedProjects = prev.map((p) => {
        if (p.id === updatedProject.id) {
          const isComplete = updatedProject.tasks.length > 0 && 
                            updatedProject.tasks.every(t => t.status === TaskStatus.DONE);
          
          // Log task completions
          updatedProject.tasks.forEach(newTask => {
            const oldTask = oldProject?.tasks.find(t => t.id === newTask.id);
            if (newTask.status === TaskStatus.DONE && oldTask?.status !== TaskStatus.DONE) {
              addLogEntry('TASK_COMPLETED', '系统记录：检测到任务推进', `${updatedProject.name} > ${newTask.name}`);
            } else if (newTask.status === TaskStatus.IN_PROGRESS && oldTask?.status === TaskStatus.TODO) {
              addLogEntry('TASK_PROGRESS', '系统记录：任务进入执行阶段', `${updatedProject.name} > ${newTask.name}`);
            }
          });

          // If it just became complete, mark it so the animation doesn't repeat
          if (isComplete && !p.isCompleted) {
            audioRef.current?.play().catch(() => {});
            addLogEntry('RING_COMPLETED', '系统提示：闭环系统已达成', updatedProject.name);
            
            // Check domain progress
            if (updatedProject.domainId) {
              const domain = domains.find(d => d.id === updatedProject.domainId);
              if (domain) {
                addLogEntry('DOMAIN_PROGRESS', `系统提示：${domain.name}领域完成度提升`, `检测到闭环系统达成`);
              }
            }
            
            return { ...updatedProject, isCompleted: true };
          }
          
          // If it was complete but user added/undid a task, reset completion state
          if (!isComplete && p.isCompleted) {
            return { ...updatedProject, isCompleted: false };
          }

          return updatedProject;
        }
        return p;
      });
      
      checkAchievements(updatedProjects);
      return updatedProjects;
    });
  }, [checkAchievements, addLogEntry]);

  const handleDragRing = useCallback((id: string, x: number, y: number) => {
    setProjects((prev) => prev.map((p) => {
      if (p.id === id) {
        // Check if dropped into a domain
        let newDomainId = p.domainId;
        const ringCenterX = x + 68; // center calculation (radius 60 + stroke 8)
        const ringCenterY = y + 68;
        
        const targetDomain = domains.find(d => 
          ringCenterX >= d.x && ringCenterX <= d.x + d.width &&
          ringCenterY >= d.y && ringCenterY <= d.y + d.height
        );
        
        if (targetDomain && targetDomain.id !== p.domainId) {
          addLogEntry('DOMAIN_PROGRESS', `系统提示：闭环已绑定至 ${targetDomain.name}`, p.name);
          newDomainId = targetDomain.id;
        }
        
        return { ...p, x, y, domainId: newDomainId };
      }
      return p;
    }));
    setDraggingProjectId(null);
  }, [domains, addLogEntry]);

  const handleDragDomain = useCallback((id: string, x: number, y: number) => {
    setDomains((prev) => prev.map((d) => {
      if (d.id === id) {
        const dx = x - d.x;
        const dy = y - d.y;
        
        // Move associated projects
        setProjects(prevProjects => prevProjects.map(p => {
          if (p.domainId === id) {
            return { ...p, x: p.x + dx, y: p.y + dy };
          }
          return p;
        }));
        
        return { ...d, x, y };
      }
      return d;
    }));
  }, []);

  const handleResizeDomain = useCallback((id: string, width: number, height: number) => {
    setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, width, height } : d)));
  }, []);

  const handleUpdateDomain = useCallback((id: string, updates: Partial<Domain>) => {
    setDomains((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }, []);

  const handleScaleRing = useCallback((id: string, delta: number) => {
    setProjects((prev) => prev.map((p) => {
      if (p.id === id) {
        const newScale = Math.max(0.5, Math.min(3, p.scale + delta));
        return { ...p, scale: newScale };
      }
      return p;
    }));
  }, []);

  const handleUpdateProject = useCallback((updatedProject: Project) => {
    updateProject(updatedProject);
  }, [updateProject]);

  const handleDeleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setSelectedProjectId(null);
    setEditingProjectId(null);
  }, []);

  const addNewProject = (domainId?: string) => {
    const domain = domains.find(d => d.id === domainId);
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新闭环系统',
      x: domain ? domain.x + 50 : window.innerWidth / 2 - 100 - viewState.x,
      y: domain ? domain.y + 50 : window.innerHeight / 2 - 100 - viewState.y,
      scale: 1,
      color: domain ? domain.color : ['#0df2f2', '#ff00ff', '#00ff00', '#ffff00', '#ff4500'][Math.floor(Math.random() * 5)],
      tasks: [],
      domainId,
    };
    setProjects((prev) => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
    setEditingProjectId(newProject.id);
    setStats(prev => ({ ...prev, totalRingsCreated: prev.totalRingsCreated + 1 }));
    addLogEntry('RING_CREATED', '系统记录：检测到新闭环初始化', newProject.name);
  };

  const addNewDomain = () => {
    const names = ['音乐创作', '粉丝运营', '视频制作', '个人成长', '知识学习'];
    const colors = ['#0df2f2', '#ff00ff', '#00ff00', '#ffff00', '#ff4500'];
    const idx = Math.floor(Math.random() * names.length);
    
    const newDomain: Domain = {
      id: Math.random().toString(36).substr(2, 9),
      name: names[idx],
      color: colors[idx],
      x: Math.random() * 1000,
      y: Math.random() * 1000,
      width: 400,
      height: 400,
    };
    setDomains(prev => [...prev, newDomain]);
    addLogEntry('DOMAIN_CREATED', '系统提示：新领域已被开拓', newDomain.name);
  };

  const zoom = (delta: number) => {
    setViewState((prev) => ({ ...prev, scale: Math.max(0.2, Math.min(3, prev.scale + delta)) }));
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  return (
    <div className="h-screen w-screen bg-background-dark overflow-hidden flex flex-col font-display selection:bg-primary selection:text-background-dark">
      {/* HUD Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-primary/20 bg-background-dark/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="text-primary flex items-center justify-center p-2 border border-primary/30 rounded bg-primary/5">
              <UserIcon size={24} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background-dark" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tighter uppercase text-primary">
                {stats.nickname} <span className="text-white/20 font-light ml-1">#256324</span>
              </h1>
              <div className="flex gap-1">
                {achievements.filter(a => a.unlockedAt).slice(-3).map(a => (
                  <div key={a.id} className="px-1.5 py-0.5 bg-primary/20 border border-primary/40 rounded text-[8px] text-primary font-bold uppercase tracking-tighter">
                    {a.title}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-primary/60">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              神经连接：已建立 | 连续天数：{stats.streakDays}
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={12} className="text-primary" />
              <span className="text-[10px] text-white/40 uppercase">系统同步率</span>
              <span className="text-[10px] text-primary font-mono">{Math.round((achievements.filter(a => a.unlockedAt).length / achievements.length) * 100)}%</span>
            </div>
            <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(achievements.filter(a => a.unlockedAt).length / achievements.length) * 100}%` }}
                className="h-full bg-primary" 
              />
            </div>
          </div>
          <button 
            onClick={() => setIsAchievementOpen(true)}
            className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 rounded text-primary hover:bg-primary/20 transition-all"
          >
            <Trophy size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">称号系统</span>
          </button>
        </div>
      </header>

      {/* Main Map Area */}
      <main 
        ref={mapRef}
        className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,rgba(13,242,242,0.05)_0%,transparent_70%)]"
        onMouseDown={(e) => {
          // Deselect if clicking directly on the map container or background layers
          const target = e.target as HTMLElement;
          const isMapBackground = target === mapRef.current || 
                                 target.getAttribute('data-map-bg') === 'true' ||
                                 target.classList.contains('rings-container');
          
          if (isMapBackground) {
            setSelectedProjectId(null);
          }
        }}
      >
        {/* Grid Background */}
        <div 
          data-map-bg="true"
          className="absolute inset-0 pointer-events-auto opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(13, 242, 242, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(13, 242, 242, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: `${40 * viewState.scale}px ${40 * viewState.scale}px`,
            backgroundPosition: `${viewState.x}px ${viewState.y}px`,
          }}
        />

        {/* Scanlines */}
        <div data-map-bg="true" className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />

        {/* Rings Container */}
        <motion.div
          animate={{ x: viewState.x, y: viewState.y, scale: viewState.scale }}
          className="absolute inset-0 rings-container"
          data-map-bg="true"
        >
          {/* Domains */}
          {domains.map(domain => (
            <DomainArea 
              key={domain.id} 
              domain={domain} 
              isProjectDragging={!!draggingProjectId}
              onAddProject={addNewProject}
              onDrag={handleDragDomain}
              onResize={handleResizeDomain}
              onUpdate={handleUpdateDomain}
            />
          ))}

          {projects.map((project) => (
            <Ring
              key={project.id}
              project={project}
              isSelected={selectedProjectId === project.id}
              onClick={() => setSelectedProjectId(project.id)}
              onDoubleClick={() => setEditingProjectId(project.id)}
              onDrag={handleDragRing}
              onDragStart={() => setDraggingProjectId(project.id)}
            />
          ))}
        </motion.div>

        {/* Map Controls */}
        <div className="absolute bottom-8 left-8 flex flex-col gap-2 z-30">
          <button 
            onClick={addNewDomain}
            title="开拓新领域"
            className="w-10 h-10 bg-background-dark/80 border border-secondary/30 rounded flex items-center justify-center text-secondary hover:bg-secondary hover:text-background-dark transition-all mb-2"
          >
            <Box size={18} />
          </button>
          
          {/* Ring Scaling - Only visible when a ring is selected */}
          {selectedProjectId && (
            <div className="flex flex-col gap-2 mb-4 p-2 bg-primary/10 backdrop-blur-md border border-primary/30 rounded-lg animate-in fade-in slide-in-from-left-4">
              <div className="flex items-center gap-2 px-1 mb-1">
                <Maximize2 size={12} className="text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">圆环缩放</span>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleScaleRing(selectedProjectId, 0.1)}
                  title="放大选中圆环"
                  className="w-10 h-10 bg-background-dark/80 border border-primary/30 rounded flex items-center justify-center text-primary hover:bg-primary hover:text-background-dark transition-all"
                >
                  <Plus size={18} />
                </button>
                <button 
                  onClick={() => handleScaleRing(selectedProjectId, -0.1)}
                  title="缩小选中圆环"
                  className="w-10 h-10 bg-background-dark/80 border border-primary/30 rounded flex items-center justify-center text-primary hover:bg-primary hover:text-background-dark transition-all"
                >
                  <Minus size={18} />
                </button>
              </div>
            </div>
          )}

          <button 
            onClick={() => zoom(0.1)}
            title="放大地图"
            className="w-10 h-10 bg-background-dark/80 backdrop-blur-md border border-primary/30 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-background-dark transition-all"
          >
            <Plus size={20} />
          </button>
          <button 
            onClick={() => zoom(-0.1)}
            title="缩小地图"
            className="w-10 h-10 bg-background-dark/80 backdrop-blur-md border border-primary/30 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-background-dark transition-all"
          >
            <Minus size={20} />
          </button>
          <button 
            onClick={() => setViewState({ x: 0, y: 0, scale: 1 })}
            title="重置视图"
            className="w-10 h-10 bg-background-dark/80 backdrop-blur-md border border-primary/30 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-background-dark transition-all mt-2"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Add Button */}
        <div className="absolute top-8 left-8 z-30">
          <button
            onClick={addNewProject}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark font-bold text-xs uppercase tracking-widest rounded shadow-[0_0_15px_rgba(13,242,242,0.4)] hover:bg-white transition-all"
          >
            <Plus size={16} />
            初始化新闭环
          </button>
        </div>
      </main>

      {/* Side Panel */}
      <SidePanel
        project={projects.find((p) => p.id === editingProjectId) || null}
        domains={domains}
        onClose={() => setEditingProjectId(null)}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={handleDeleteProject}
        onAddTask={() => setStats(prev => ({ ...prev, totalTasksCreated: prev.totalTasksCreated + 1 }))}
      />

      {/* Achievement Panel */}
      <AchievementPanel
        isOpen={isAchievementOpen}
        onClose={() => setIsAchievementOpen(false)}
        achievements={achievements}
      />

      {/* AI Terminal */}
      <AITerminal 
        projects={projects}
        messages={messages}
        setMessages={setMessages}
        onUpdateProjects={(newProjects) => {
          setProjects(newProjects);
          checkAchievements(newProjects);
        }}
      />

      {/* Bottom Nav */}
      <nav className="h-16 border-t border-primary/20 bg-background-dark/80 backdrop-blur-md px-6 flex items-center justify-center gap-12 z-40">
        <button 
          onClick={() => {
            setIsAchievementOpen(false);
            setIsArchiveOpen(false);
            setIsLogOpen(false);
          }}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            (!isAchievementOpen && !isArchiveOpen && !isLogOpen) ? "text-primary" : "text-white/40 hover:text-primary"
          )}
        >
          <Layers size={20} />
          <span className="text-[9px] uppercase font-bold tracking-widest">地图</span>
        </button>
        <button 
          onClick={() => {
            setIsAchievementOpen(true);
            setIsArchiveOpen(false);
            setIsLogOpen(false);
          }}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            isAchievementOpen ? "text-primary" : "text-white/40 hover:text-primary"
          )}
        >
          <Trophy size={20} />
          <span className="text-[9px] uppercase font-bold tracking-widest">成就</span>
        </button>
        <button 
          onClick={() => {
            setIsArchiveOpen(true);
            setIsAchievementOpen(false);
            setIsLogOpen(false);
          }}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            isArchiveOpen ? "text-primary" : "text-white/40 hover:text-primary"
          )}
        >
          <FileText size={20} />
          <span className="text-[9px] uppercase font-bold tracking-widest">档案</span>
        </button>
        <button 
          onClick={() => {
            setIsLogOpen(true);
            setIsAchievementOpen(false);
            setIsArchiveOpen(false);
            setIsProfileOpen(false);
          }}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            isLogOpen ? "text-primary" : "text-white/40 hover:text-primary"
          )}
        >
          <Activity size={20} />
          <span className="text-[9px] uppercase font-bold tracking-widest">日志</span>
        </button>
        <button 
          onClick={() => {
            setIsProfileOpen(true);
            setIsLogOpen(false);
            setIsAchievementOpen(false);
            setIsArchiveOpen(false);
          }}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            isProfileOpen ? "text-primary" : "text-white/40 hover:text-primary"
          )}
        >
          <UserIcon size={20} />
          <span className="text-[9px] uppercase font-bold tracking-widest">个人</span>
        </button>
      </nav>

      {/* System Archive */}
      <SystemArchive
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        projects={projects}
      />

      {/* System Log */}
      <SystemLog
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        logs={systemLogs}
      />

      {/* Profile Panel */}
      <ProfilePanel
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        stats={stats}
        achievements={achievements}
        onUpdateNickname={(nickname) => setStats(prev => ({ ...prev, nickname }))}
      />

      {/* Ambient Overlay */}
      <div className="fixed inset-0 pointer-events-none border-[20px] border-primary/5 z-50" />
    </div>
  );
}
