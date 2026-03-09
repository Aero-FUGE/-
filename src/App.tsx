import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, RotateCcw, Target, Layers, BarChart3, User as UserIcon, Trophy, Maximize2, Activity, FileText, Box, Globe } from 'lucide-react';
import { AchievementPanel } from './components/AchievementPanel';
import { SystemArchive } from './components/SystemArchive';
import { SystemLog } from './components/SystemLog';
import { ProfilePanel } from './components/ProfilePanel';
import { DomainArea } from './components/DomainArea';
import { LoadingScreen } from './components/LoadingScreen';
import { cn } from './lib/utils';
import { ALL_TITLES } from './constants/titles';
import { getLevelFromXP, getNextLevelXP } from './constants/levels';
import { ChatMessage, Project, TaskStatus, Achievement, UserStats, SystemLogEntry, Domain } from './types';
import { Ring } from './components/Ring';
import { SidePanel } from './components/SidePanel';
import { AITerminal } from './components/AITerminal';
import WorldMap from './components/WorldMap';
import DomainMap from './components/DomainMap';

// Import Engines
import { useMapEngine } from './hooks/useMapEngine';
import { useLoopEngine } from './hooks/useLoopEngine';
import { useTaskEngine } from './hooks/useTaskEngine';
import { useProgressEngine } from './hooks/useProgressEngine';

import { syncService } from './services/syncService';
import { soundManager } from './services/soundService';

const INITIAL_DOMAINS: Domain[] = [];
const INITIAL_PROJECTS: Project[] = [];

const CLICK_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
const COMPLETE_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3';

import WorldMap from './components/WorldMap';
import DomainMap from './components/DomainMap';

export default function App() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [sessionStartTime] = useState(Date.now());
  const [uptime, setUptime] = useState('00:00:00');

  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - sessionStartTime) / 1000);
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      setUptime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // 1. Progress Engine
  const { 
    stats, setStats, achievements, systemLogs, setSystemLogs,
    addLogEntry, gainXP, checkAchievements, addTimeSpent 
  } = useProgressEngine({
    nickname: '系统绑定者',
    totalRingsCompleted: 0,
    totalTasksCompleted: 0,
    totalTimeSpent: 0,
    dailyRingsCompleted: 0,
    dailyProgress: 0,
    maxDailyProgress: 0,
    streakDays: 1,
    totalRingsCreated: 2,
    totalTasksCreated: 5,
    lastActiveDate: new Date().toISOString().split('T')[0],
    xp: 0,
    level: 1,
    soundEnabled: true,
  });

  // 2. Map Engine
  const { 
    viewState, setViewState, isPanning, 
    handleMouseDown, handleMouseMove, handleMouseUp, 
    zoom, resetView, screenToMap 
  } = useMapEngine(mapRef);

  // 3. Loop Engine
  const { 
    projects, setProjects, draggingProjectId, setDraggingProjectId, 
    scaleRing, deleteProject, dragRing 
  } = useLoopEngine(INITIAL_PROJECTS);

  const [domains, setDomains] = useState<Domain[]>(INITIAL_DOMAINS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentView, setCurrentView] = useState<'legacy' | 'world' | 'domain'>('world');
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  
  // UI States
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReconstructing, setIsReconstructing] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const reconstructionAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    reconstructionAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3');
    reconstructionAudioRef.current.volume = 0.4;
  }, []);

  const triggerReconstruction = () => {
    setIsReconstructing(true);
    if (stats.soundEnabled && reconstructionAudioRef.current) {
      reconstructionAudioRef.current.currentTime = 0;
      reconstructionAudioRef.current.play().catch(() => {});
    }
    setTimeout(() => setIsReconstructing(false), 1500);
  };

  const handleFocusOn = (id: string, type: 'RING' | 'DOMAIN') => {
    if (type === 'RING') {
      const ring = projects.find(p => p.id === id);
      if (ring) {
        setViewState({ x: -ring.x + window.innerWidth / 2, y: -ring.y + window.innerHeight / 2, zoom: 1 });
        setSelectedProjectId(id);
      }
    } else {
      const domain = domains.find(d => d.id === id);
      if (domain) {
        setViewState({ x: -domain.x + window.innerWidth / 2, y: -domain.y + window.innerHeight / 2, zoom: 0.8 });
      }
    }
  };

  // Auto-hide loading screen after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500); // Slightly longer than LoadingScreen's internal 3s to ensure it finishes its animation
    
    return () => clearTimeout(timer);
  }, []);

  // 4. Task Engine
  const { updateProject } = useTaskEngine(
    setProjects,
    domains,
    addLogEntry,
    (amount, reason) => gainXP(amount, reason, (msg) => setMessages(prev => [...prev, msg])),
    (updatedProjects) => {
      const newlyUnlocked = checkAchievements(updatedProjects, stats);
      if (newlyUnlocked.length > 0) {
        const broadcastMessages: ChatMessage[] = newlyUnlocked.map(a => ({
          id: `broadcast-${a.id}-${Date.now()}`,
          role: 'assistant',
          content: `【系统提示】检测到称号解锁：\n【${a.title}】\n${a.description}`,
          timestamp: Date.now(),
        }));
        setMessages(prevMsgs => [...prevMsgs, ...broadcastMessages]);
      }
    },
    addTimeSpent
  );

  useEffect(() => {
    addLogEntry('SYSTEM_AWAKENED', '系统提示：神经链路已建立', '系统觉醒阶段：初始化完成');

    // Supabase Initial Load with LocalStorage Fallback
    const loadData = async () => {
      try {
        const data = await syncService.fetchInitialData();
        if (data && (data.domains.length > 0 || data.projects.length > 0)) {
          setDomains(data.domains);
          setProjects(data.projects);
          setSystemLogs(data.logs);
          if (data.stats) setStats(data.stats);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error('Supabase load failed, falling back to local storage');
      }

      // Fallback to localStorage
      const localDomains = localStorage.getItem('system_domains');
      const localProjects = localStorage.getItem('system_projects');
      const localStats = localStorage.getItem('system_stats');
      const localLogs = localStorage.getItem('system_logs');
      
      if (localDomains) setDomains(JSON.parse(localDomains));
      if (localProjects) setProjects(JSON.parse(localProjects));
      if (localStats) setStats(JSON.parse(localStats));
      if (localLogs) setSystemLogs(JSON.parse(localLogs));
      setIsLoading(false);
    };
    loadData();
  }, []); // Only on mount

  useEffect(() => {
    soundManager.setEnabled(stats.soundEnabled);
  }, [stats.soundEnabled]);

  // Global Click Sound Listener
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      soundManager.unlock();
      const target = e.target as HTMLElement;
      
      // Define what counts as an interactive element
      const interactiveSelectors = [
        'button',
        'a',
        'input',
        'select',
        'textarea',
        '[role="button"]',
        '[onclick]',
        '.cursor-pointer',
        '.task-item',
        '.grid-item',
        '.toggle',
        'svg',
        'path',
        'circle',
        'rect'
      ];

      const isInteractive = interactiveSelectors.some(selector => 
        target.closest(selector) !== null
      );

      if (stats.soundEnabled) {
        soundManager.playClick(isInteractive);
      }

      // Console logging as requested
      if (isInteractive) {
        console.log(`[SoundEngine] Interactive element clicked: <${target.tagName.toLowerCase()}>`, target);
      } else {
        console.log(`[SoundEngine] Non-interactive area clicked: <${target.tagName.toLowerCase()}>`);
      }

      // Ripple effect
      const newRipple = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
      };
      setRipples(prev => [...prev, newRipple]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 1000);
    };

    const handleOnline = () => {
      // Sync local data to Supabase when back online
      const localDomains = localStorage.getItem('system_domains');
      const localProjects = localStorage.getItem('system_projects');
      
      if (localDomains) JSON.parse(localDomains).forEach((d: any) => syncService.upsertDomain(d));
      if (localProjects) JSON.parse(localProjects).forEach((p: any) => syncService.upsertProject(p));
    };

    // Use window and capture phase for ripple and sound
    window.addEventListener('click', handleGlobalClick, true);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('click', handleGlobalClick, true);
      window.removeEventListener('online', handleOnline);
    };
  }, [stats.soundEnabled]);

  // Sync to LocalStorage and Supabase
  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('system_domains', JSON.stringify(domains));
    domains.forEach(d => syncService.upsertDomain(d));
  }, [domains, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('system_projects', JSON.stringify(projects));
    projects.forEach(p => syncService.upsertProject(p));
    
    // Check for completion sound
    const completedCount = projects.filter(p => p.tasks.length > 0 && p.tasks.every(t => t.status === TaskStatus.DONE)).length;
    if (completedCount > stats.totalRingsCompleted && stats.soundEnabled) {
      soundManager.playCompletion();
      
      // Update stats to prevent re-triggering and track progress
      setStats(prev => ({ ...prev, totalRingsCompleted: completedCount }));
    }
  }, [projects, isLoading, stats.totalRingsCompleted, stats.soundEnabled]);

  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('system_stats', JSON.stringify(stats));
  }, [stats, isLoading]);

  useEffect(() => {
    if (isLoading || systemLogs.length === 0) return;
    localStorage.setItem('system_logs', JSON.stringify(systemLogs));
    syncService.upsertLog(systemLogs[0]);
  }, [systemLogs, isLoading]);

  const addNewProject = (domainId?: string) => {
    const domain = domains.find(d => d.id === domainId);
    const rect = mapRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : window.innerWidth / 2;
    const centerY = rect ? rect.height / 2 : window.innerHeight / 2;
    const { x: mapX, y: mapY } = screenToMap(centerX, centerY);

    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新闭环系统',
      x: domain ? 50 : mapX - 68,
      y: domain ? 50 : mapY - 68,
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
    gainXP(20, `初始化闭环：${newProject.name}`);
  };

  const addNewDomain = () => {
    const names = ['音乐创作', '粉丝运营', '视频制作', '个人成长', '知识学习'];
    const colors = ['#0df2f2', '#ff00ff', '#00ff00', '#ffff00', '#ff4500'];
    const idx = Math.floor(Math.random() * names.length);
    const rect = mapRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : window.innerWidth / 2;
    const centerY = rect ? rect.height / 2 : window.innerHeight / 2;
    const { x: mapX, y: mapY } = screenToMap(centerX, centerY);
    
    const newDomain: Domain = {
      id: Math.random().toString(36).substr(2, 9),
      name: names[idx],
      color: colors[idx],
      x: mapX - 200,
      y: mapY - 200,
      width: 400,
      height: 400,
    };
    setDomains(prev => [...prev, newDomain]);
    addLogEntry('DOMAIN_CREATED', '系统提示：新领域已被开拓', newDomain.name);
    gainXP(50, `开拓领域：${newDomain.name}`);
  };

  const handleDragDomain = useCallback((id: string, x: number, y: number) => {
    setDomains((prev) => prev.map((d) => {
      if (d.id === id) {
        return { ...d, x, y };
      }
      return d;
    }));
  }, []);

  const handleDeleteDomain = (id: string) => {
    const domain = domains.find(d => d.id === id);
    if (!domain) return;

    setDomains(prev => prev.filter(d => d.id !== id));
    // Unbind projects
    setProjects(prev => prev.map(p => p.domainId === id ? { ...p, domainId: undefined } : p));
    
    syncService.deleteDomain(id);
    addLogEntry('DOMAIN_DELETED', '系统提示：领域已被移除', domain.name);
  };

  const levelInfo = getLevelFromXP(stats.xp);
  const nextLevelXP = getNextLevelXP(levelInfo.level);
  const currentLevelThreshold = levelInfo.xpThreshold;
  const progressInLevel = stats.xp - currentLevelThreshold;
  const totalInLevel = nextLevelXP - currentLevelThreshold;
  const xpProgressPercent = totalInLevel > 0 ? Math.min(100, (progressInLevel / totalInLevel) * 100) : 100;

  return (
    <div className="h-[100dvh] w-screen bg-background-dark overflow-hidden flex flex-col font-display selection:bg-primary selection:text-background-dark">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999]"
          >
            <LoadingScreen onLoadingComplete={() => setIsLoading(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full w-full flex flex-col relative"
          >
            {/* HUD Header */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-primary/20 bg-background-dark/80 backdrop-blur-md z-40 hud-panel">
        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer group" onClick={() => setIsProfileOpen(true)}>
            <div className="text-primary flex items-center justify-center p-2 border border-primary/30 rounded bg-primary/5 group-hover:bg-primary/20 transition-colors">
              <UserIcon size={24} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background-dark border border-primary rounded-full flex items-center justify-center text-[8px] font-bold text-primary">
              {levelInfo.level}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tighter uppercase text-primary">
                {stats.nickname} <span className="text-white/20 font-light ml-1">#256324</span>
              </h1>
              <div className="px-2 py-0.5 bg-primary/20 border border-primary/40 rounded text-[8px] text-primary font-bold uppercase tracking-widest">
                {levelInfo.identity}
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-primary/60">
              <div className="flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                神经连接：已建立
              </div>
              <div className="flex items-center gap-2">
                <span>XP: {stats.xp} / {nextLevelXP}</span>
                <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgressPercent}%` }}
                    className="h-full bg-primary" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <div className="flex flex-col items-center px-4 border-x border-primary/10">
            <span className="text-[8px] text-white/20 uppercase tracking-[0.2em] mb-1">系统运行时间</span>
            <span className="text-xs font-mono text-primary tracking-widest">{uptime}</span>
          </div>
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
            onClick={() => {
              setIsAchievementOpen(true);
            }}
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
        className={cn(
          "flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,rgba(13,242,242,0.05)_0%,transparent_70%)]",
          isPanning ? "cursor-grabbing" : "cursor-default"
        )}
        onMouseDown={(e) => handleMouseDown(e, () => setSelectedProjectId(null))}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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

        {currentView === 'world' ? (
          <WorldMap 
            domains={domains}
            projects={projects}
            onSelectDomain={(id) => {
              setActiveDomainId(id);
              setCurrentView('domain');
            }}
          />
        ) : currentView === 'domain' ? (
          <DomainMap 
            domain={domains.find(d => d.id === activeDomainId)!}
            projects={projects.filter(p => p.domainId === activeDomainId)}
            selectedProjectId={selectedProjectId}
            onBack={() => setCurrentView('world')}
            onSelectProject={setSelectedProjectId}
            onEditProject={setEditingProjectId}
            onDragProject={dragRing}
            onAddProject={() => addNewProject(activeDomainId || undefined)}
          />
        ) : (
          <motion.div
            animate={{ x: viewState.x, y: viewState.y, scale: viewState.scale }}
            transition={{
              x: { duration: 0 },
              y: { duration: 0 },
              scale: { type: 'spring', stiffness: 300, damping: 30 }
            }}
            className="absolute inset-0 rings-container"
            data-map-bg="true"
          >
            {/* Domains */}
            {domains.map(domain => (
              <DomainArea 
                key={domain.id} 
                domain={domain} 
                projects={projects.filter(p => p.domainId === domain.id)}
                selectedProjectId={selectedProjectId}
                isProjectDragging={!!draggingProjectId}
                onAddProject={addNewProject}
                onDrag={handleDragDomain}
                onResize={(id, w, h) => setDomains(prev => prev.map(d => d.id === id ? { ...d, width: w, height: h } : d))}
                onUpdate={(id, up) => setDomains(prev => prev.map(d => d.id === id ? { ...d, ...up } : d))}
                onRingClick={setSelectedProjectId}
                onRingDoubleClick={setEditingProjectId}
                onRingDrag={(id, x, y) => dragRing(id, x, y, domains, (m, t) => addLogEntry('DOMAIN_PROGRESS', m, t), gainXP)}
                onRingDragStart={setDraggingProjectId}
                onDeleteDomain={handleDeleteDomain}
              />
            ))}

            {/* Unbound Projects */}
            {projects.filter(p => !p.domainId).map((project) => (
              <Ring
                key={project.id}
                project={project}
                x={project.x}
                y={project.y}
                isSelected={selectedProjectId === project.id}
                onClick={() => setSelectedProjectId(project.id)}
                onDoubleClick={() => setEditingProjectId(project.id)}
                onDrag={(id, x, y) => dragRing(id, x, y, domains, (m, t) => addLogEntry('DOMAIN_PROGRESS', m, t), gainXP)}
                onDragStart={() => setDraggingProjectId(project.id)}
              />
            ))}
          </motion.div>
        )}

        {/* Map Controls */}
        <div className="absolute bottom-8 left-8 flex flex-col gap-2 z-30 hud-panel">
          <button 
            onClick={() => setCurrentView(prev => prev === 'legacy' ? 'world' : 'legacy')}
            title={currentView === 'legacy' ? "切换到世界地图" : "切换到自由地图"}
            className={`w-10 h-10 border rounded flex items-center justify-center transition-all mb-2 ${
              currentView !== 'legacy' ? 'bg-primary text-background-dark border-primary shadow-[0_0_10px_rgba(13,242,242,0.4)]' : 'bg-background-dark/80 border-secondary/30 text-secondary hover:bg-secondary hover:text-background-dark'
            }`}
          >
            <Globe size={18} />
          </button>

          <button 
            onClick={addNewDomain}
            title="开拓新领域"
            className="w-10 h-10 bg-background-dark/80 border border-secondary/30 rounded flex items-center justify-center text-secondary hover:bg-secondary hover:text-background-dark transition-all mb-2"
          >
            <Box size={18} />
          </button>
          
          {selectedProjectId && (
            <div className="flex flex-col gap-2 mb-4 p-2 bg-primary/10 backdrop-blur-md border border-primary/30 rounded-lg animate-in fade-in slide-in-from-left-4">
              <div className="flex items-center gap-2 px-1 mb-1">
                <Maximize2 size={12} className="text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">圆环缩放</span>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => scaleRing(selectedProjectId, 0.1)}
                  className="w-10 h-10 bg-background-dark/80 border border-primary/30 rounded flex items-center justify-center text-primary hover:bg-primary hover:text-background-dark transition-all"
                >
                  <Plus size={18} />
                </button>
                <button 
                  onClick={() => scaleRing(selectedProjectId, -0.1)}
                  className="w-10 h-10 bg-background-dark/80 border border-primary/30 rounded flex items-center justify-center text-primary hover:bg-primary hover:text-background-dark transition-all"
                >
                  <Minus size={18} />
                </button>
              </div>
            </div>
          )}

          <button onClick={() => zoom(0.1)} className="w-10 h-10 bg-background-dark/80 backdrop-blur-md border border-primary/30 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-background-dark transition-all">
            <Plus size={20} />
          </button>
          <button onClick={() => zoom(-0.1)} className="w-10 h-10 bg-background-dark/80 backdrop-blur-md border border-primary/30 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-background-dark transition-all">
            <Minus size={20} />
          </button>
          <button onClick={resetView} className="w-10 h-10 bg-background-dark/80 backdrop-blur-md border border-primary/30 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-background-dark transition-all mt-2">
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Add Button */}
        <div className="absolute top-8 left-8 z-30 hud-panel">
          <button
            onClick={() => addNewProject()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark font-bold text-xs uppercase tracking-widest rounded shadow-[0_0_15px_rgba(13,242,242,0.4)] hover:bg-white transition-all"
          >
            <Plus size={16} />
            创建新闭环
          </button>
        </div>
      </main>

      {/* Side Panel */}
      <SidePanel
        project={projects.find((p) => p.id === editingProjectId) || null}
        domains={domains}
        onClose={() => setEditingProjectId(null)}
        onUpdateProject={updateProject}
        onDeleteProject={(id) => {
          const projectToDelete = projects.find(p => p.id === id);
          if (projectToDelete) {
            addLogEntry('RING_COMPLETED', '系统记录：闭环系统已销毁', projectToDelete.name);
            // Optionally subtract from totalRingsCreated if desired, but usually we just log it
          }
          deleteProject(id);
          setSelectedProjectId(null);
          setEditingProjectId(null);
        }}
        onAddTask={() => setStats(prev => ({ ...prev, totalTasksCreated: prev.totalTasksCreated + 1 }))}
      />

      {/* Reconstruction Overlay */}
      <AnimatePresence>
        {isReconstructing && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center bg-primary/5"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="text-primary font-mono text-xl tracking-[0.5em] uppercase"
            >
              System Reconstructing...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Ripple Effect */}
      <div className="fixed inset-0 pointer-events-none z-[999]">
        <AnimatePresence>
          {ripples.map(ripple => (
            <motion.div
              key={ripple.id}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                position: 'absolute',
                left: ripple.x,
                top: ripple.y,
                width: 40,
                height: 40,
                marginLeft: -20,
                marginTop: -20,
                borderRadius: '50%',
                border: '1px solid rgba(13, 242, 242, 0.5)',
                background: 'radial-gradient(circle, rgba(13, 242, 242, 0.2) 0%, transparent 70%)',
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Achievement Panel */}
      <AchievementPanel
        isOpen={isAchievementOpen}
        onClose={() => setIsAchievementOpen(false)}
        achievements={achievements}
      />

      {/* AI Terminal */}
      <AITerminal 
        projects={projects}
        domains={domains}
        messages={messages}
        setMessages={setMessages}
        onUpdateProjects={(newProjects) => {
          setProjects(newProjects);
          checkAchievements(newProjects, stats);
        }}
        onUpdateDomains={setDomains}
        screenToMap={screenToMap}
        addLogEntry={addLogEntry}
        gainXP={(amount, reason) => gainXP(amount, reason, (msg) => setMessages(prev => [...prev, msg]))}
        soundEnabled={stats.soundEnabled}
        onTriggerReconstruction={triggerReconstruction}
        onFocusOn={handleFocusOn}
      />

      {/* Bottom Nav */}
      <nav className="h-16 border-t border-primary/20 bg-background-dark/80 backdrop-blur-md px-6 flex items-center justify-center gap-12 z-40">
        <button 
          onClick={() => {
            setIsAchievementOpen(false);
            setIsArchiveOpen(false);
            setIsLogOpen(false);
            setIsProfileOpen(false);
          }}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            (!isAchievementOpen && !isArchiveOpen && !isLogOpen && !isProfileOpen) ? "text-primary" : "text-white/40 hover:text-primary"
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
            setIsProfileOpen(false);
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
            setIsProfileOpen(false);
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

      <SystemArchive
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        projects={projects}
      />

      <SystemLog
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        logs={systemLogs}
      />

      <ProfilePanel
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
        }}
        stats={stats}
        achievements={achievements}
        onUpdateNickname={(nickname) => setStats(prev => ({ ...prev, nickname }))}
        onToggleSound={(enabled) => {
          setStats(prev => ({ ...prev, soundEnabled: enabled }));
        }}
      />

      {/* Ambient Overlay */}
      <div className="fixed inset-0 pointer-events-none border-[20px] border-primary/5 z-50" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
