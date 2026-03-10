import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Domain, Project, TaskStatus } from '../types';
import { Circle, Home, Warehouse, Shield, Crown, ChevronRight, Plus, Flag, Castle, Edit2, Check, X, Minus, RotateCcw } from 'lucide-react';

interface WorldMapProps {
  domains: Domain[];
  projects: Project[];
  onSelectDomain: (domainId: string) => void;
  onAddDomain: () => void;
  onUpdateDomain: (id: string, updates: Partial<Domain>) => void;
}

const WorldMap: React.FC<WorldMapProps> = ({ domains, projects, onSelectDomain, onAddDomain, onUpdateDomain }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = React.useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [editingDomainId, setEditingDomainId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");

  // Handle Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    setIsPanning(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setViewState(prev => ({
      ...prev,
      x: prev.x + e.movementX,
      y: prev.y + e.movementY
    }));
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewState(prev => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * delta, 0.2), 2)
    }));
  };

  const resetView = () => {
    if (domains.length === 0) {
      setViewState({ x: 0, y: 0, scale: 1 });
      return;
    }
    
    // Calculate bounding box of all domains
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    domains.forEach(d => {
      minX = Math.min(minX, d.x);
      minY = Math.min(minY, d.y);
      maxX = Math.max(maxX, d.x);
      maxY = Math.max(maxY, d.y);
    });

    // Add node size to bounds (nodes are 96px wide)
    maxX += 96;
    maxY += 96;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
    const containerHeight = containerRef.current?.clientHeight || window.innerHeight;

    setViewState({
      x: containerWidth / 2 - centerX,
      y: containerHeight / 2 - centerY,
      scale: 1
    });
  };

  const domainStats = useMemo(() => {
    return domains.map(domain => {
      const domainProjects = projects.filter(p => p.domainId === domain.id);
      const completedProjects = domainProjects.filter(p => 
        p.tasks.length > 0 && p.tasks.every(t => t.status === TaskStatus.DONE)
      );
      const totalTasks = domainProjects.reduce((acc, p) => acc + p.tasks.length, 0);
      const completedTasks = domainProjects.reduce((acc, p) => 
        acc + p.tasks.filter(t => t.status === TaskStatus.DONE).length, 0
      );
      
      const completedCount = completedProjects.length;
      let level = 1;
      let Icon = Circle;
      let levelName = "LV1 初始点";

      if (completedCount >= 20) {
        level = 5;
        Icon = Castle;
        levelName = "LV5 终极城堡";
      } else if (completedCount >= 10) {
        level = 4;
        Icon = Shield;
        levelName = "LV4 坚固要塞";
      } else if (completedCount >= 5) {
        level = 3;
        Icon = Home;
        levelName = "LV3 繁荣工坊";
      } else if (completedCount >= 2) {
        level = 2;
        Icon = Flag;
        levelName = "LV2 宁静居所";
      }

      return {
        ...domain,
        level,
        levelName,
        Icon,
        completedCount,
        totalTasks,
        completedTasks,
        progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      };
    });
  }, [domains, projects]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-background-dark/40 backdrop-blur-sm cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(circle, #0df2f2 1px, transparent 1px)', 
             backgroundSize: `${40 * viewState.scale}px ${40 * viewState.scale}px`,
             backgroundPosition: `${viewState.x}px ${viewState.y}px`
           }} />

      <motion.div 
        animate={{ x: viewState.x, y: viewState.y, scale: viewState.scale }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.5 }}
        className="relative w-full h-full"
      >
        {/* Connection Line Segments */}
        <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none z-0 overflow-visible">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0df2f2" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#0df2f2" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0df2f2" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          
          {domainStats.map((domain, i) => {
            if (i === 0) return null;
            const prevDomain = domainStats[i - 1];
            const x1 = prevDomain.x + 48; // Center of node
            const y1 = prevDomain.y + 48;
            const x2 = domain.x + 48;
            const y2 = domain.y + 48;
            
            return (
              <React.Fragment key={`segment-${domain.id}`}>
                {/* Background dashed line */}
                <motion.line
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, ease: "easeInOut", delay: i * 0.3 }}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="rgba(13, 242, 242, 0.15)"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
                {/* Animated glow line */}
                <motion.line
                  initial={{ pathLength: 0, opacity: 0, strokeWidth: 0 }}
                  animate={{ pathLength: 1, opacity: 1, strokeWidth: 2 }}
                  transition={{ 
                    pathLength: { duration: 1.5, ease: "easeOut", delay: i * 0.4 },
                    opacity: { duration: 0.5, delay: i * 0.4 },
                    strokeWidth: { duration: 0.3, delay: i * 0.4 }
                  }}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="url(#lineGradient)"
                  className="drop-shadow-[0_0_12px_rgba(13,242,242,0.8)]"
                />
                {/* Traveling pulse */}
                <motion.circle
                  r="4"
                  fill="#0df2f2"
                  initial={{ cx: x1, cy: y1, opacity: 0, scale: 0 }}
                  animate={{ 
                    cx: [x1, x2], 
                    cy: [y1, y2],
                    opacity: [0, 1, 1, 0],
                    scale: [0.5, 1.5, 1.5, 0.5]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: i * 0.6 
                  }}
                  className="drop-shadow-[0_0_15px_#0df2f2]"
                />
              </React.Fragment>
            );
          })}
        </svg>

        {domainStats.map((domain, index) => (
          <motion.div
            key={domain.id}
            initial={{ opacity: 0, scale: 0, x: domain.x, y: domain.y }}
            animate={{ opacity: 1, scale: 1, x: domain.x, y: domain.y }}
            transition={{ 
              type: "spring",
              stiffness: 100,
              damping: 15,
              delay: index * 0.3 + 0.5 
            }}
            className="absolute z-10 flex flex-col items-center"
            style={{ width: 96 }}
          >
            {/* Node Info Card */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="group cursor-pointer flex flex-col items-center gap-4"
            >
              {/* Icon Container */}
              <div 
                className="relative w-24 h-24 flex items-center justify-center"
                onClick={() => onSelectDomain(domain.id)}
              >
                {/* Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    fill="none"
                    stroke="rgba(13, 242, 242, 0.1)"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="44"
                    fill="none"
                    stroke={domain.color}
                    strokeWidth="4"
                    strokeDasharray="276.46"
                    initial={{ strokeDashoffset: 276.46 }}
                    animate={{ strokeDashoffset: 276.46 - (276.46 * domain.progress) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>

                {/* Evolution Icon */}
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.3)] border border-white/10 transition-all group-hover:shadow-[0_0_30px_rgba(13,242,242,0.4)]"
                  style={{ backgroundColor: domain.color + '20' }}
                >
                  <domain.Icon size={32} style={{ color: domain.color }} />
                </div>

                {/* Level Badge */}
                <div className="absolute -bottom-2 right-0 bg-background-dark border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-white/60 uppercase tracking-tighter">
                  {domain.levelName}
                </div>
              </div>

              {/* Text Info */}
              <div className="text-center min-w-[150px]">
                {editingDomainId === domain.id ? (
                  <div className="flex items-center gap-2 bg-background-dark/80 backdrop-blur-md border border-primary/30 rounded px-2 py-1">
                    <input
                      autoFocus
                      className="bg-transparent text-white text-sm font-bold outline-none w-24"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateDomain(domain.id, { name: editName });
                          setEditingDomainId(null);
                        }
                        if (e.key === 'Escape') setEditingDomainId(null);
                      }}
                    />
                    <button onClick={() => {
                      onUpdateDomain(domain.id, { name: editName });
                      setEditingDomainId(null);
                    }} className="text-primary hover:text-white">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingDomainId(null)} className="text-white/40 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="group/name flex items-center justify-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                      {domain.name}
                    </h3>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingDomainId(domain.id);
                        setEditName(domain.name);
                      }}
                      className="opacity-0 group-hover/name:opacity-100 text-white/40 hover:text-primary transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-center gap-3 mt-1 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  <span>完成: {domain.completedTasks}/{domain.totalTasks}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>进度: {Math.round(domain.progress)}%</span>
                </div>
              </div>

              {/* Enter Button */}
              <div 
                onClick={() => onSelectDomain(domain.id)}
                className="opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-widest mt-2"
              >
                进入领域 <ChevronRight size={12} />
              </div>
            </motion.div>
          </motion.div>
        ))}

        {/* Add New Domain Node */}
        {domainStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              x: domainStats[domainStats.length - 1].x + 300,
              y: domainStats[domainStats.length - 1].y
            }}
            transition={{ delay: domainStats.length * 0.1 }}
            className="absolute z-10 flex flex-col items-center"
            style={{ width: 96 }}
          >
            <button
              onClick={onAddDomain}
              className="group relative w-24 h-24 flex items-center justify-center rounded-full border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(13,242,242,0.2)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus size={32} className="text-primary/40 group-hover:text-primary group-hover:scale-110 transition-all" />
            </button>
            <div className="mt-4 text-center">
              <span className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">
                开拓新领域
              </span>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {domains.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={onAddDomain}
              className="group flex flex-col items-center gap-6 p-12 rounded-3xl border-2 border-dashed border-primary/20 hover:border-primary/50 transition-all bg-primary/5"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={40} className="text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">开启第一个领域</h3>
                <p className="text-white/40 text-sm font-mono uppercase tracking-widest">初始化你的闭环世界</p>
              </div>
            </button>
          </div>
        )}
      </motion.div>

      {/* Controls Overlay */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-2">
        <button 
          onClick={() => setViewState(prev => ({ ...prev, scale: Math.min(prev.scale + 0.2, 2) }))}
          className="w-10 h-10 bg-background-dark/80 backdrop-blur-md border border-primary/30 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-background-dark transition-all"
        >
          <Plus size={20} />
        </button>
        <button 
          onClick={() => setViewState(prev => ({ ...prev, scale: Math.max(prev.scale - 0.2, 0.2) }))}
          className="w-10 h-10 bg-background-dark/80 backdrop-blur-md border border-primary/30 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-background-dark transition-all"
        >
          <Minus size={20} />
        </button>
        <button 
          onClick={resetView}
          className="w-10 h-10 bg-background-dark/80 backdrop-blur-md border border-primary/30 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-background-dark transition-all"
        >
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
};

export default WorldMap;
