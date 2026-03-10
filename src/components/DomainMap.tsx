import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Domain, Project, TaskStatus } from '../types';
import { ArrowLeft, Plus, Minus, RotateCcw, LayoutGrid, ListFilter, Circle as CircleIcon, Grid3X3, Orbit, Shuffle } from 'lucide-react';
import { Ring } from './Ring';
import { cn } from '../lib/utils';

type LayoutMode = 'GRID' | 'CIRCLE' | 'SPIRAL' | 'ORGANIC';

interface DomainMapProps {
  domain: Domain;
  projects: Project[];
  selectedProjectId: string | null;
  onBack: () => void;
  onSelectProject: (id: string) => void;
  onEditProject: (id: string) => void;
  onAddProject: () => void;
}

const DomainMap: React.FC<DomainMapProps> = ({
  domain,
  projects,
  selectedProjectId,
  onBack,
  onSelectProject,
  onEditProject,
  onAddProject
}) => {
  const [layoutMode, setLayoutMode] = React.useState<LayoutMode>('CIRCLE');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [scale, setScale] = React.useState(1);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(prev * delta, 0.2), 3));
  };

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const isMobile = dimensions.width > 0 && dimensions.width < 768;

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const getProgress = (p: Project) => {
        const total = p.tasks.length;
        if (total === 0) return 0;
        const done = p.tasks.filter(t => t.status === TaskStatus.DONE).length;
        return done / total;
      };
      return getProgress(b) - getProgress(a);
    });
  }, [projects]);

  const layoutedProjects = useMemo(() => {
    const spacing = isMobile ? 150 : 220;

    return sortedProjects.map((project, index) => {
      let x = 0;
      let y = 0;

      switch (layoutMode) {
        case 'GRID': {
          const cols = Math.ceil(Math.sqrt(sortedProjects.length)) || 3;
          const col = index % cols;
          const row = Math.floor(index / cols);
          x = (col - (cols - 1) / 2) * spacing;
          y = (row - (Math.ceil(sortedProjects.length / cols) - 1) / 2) * spacing;
          break;
        }
        case 'CIRCLE': {
          if (sortedProjects.length === 1) {
            x = 0; y = 0;
          } else {
            const angle = (index / sortedProjects.length) * Math.PI * 2;
            const radius = isMobile 
              ? Math.max(120, sortedProjects.length * 25)
              : Math.max(200, sortedProjects.length * 40);
            x = Math.cos(angle) * radius;
            y = Math.sin(angle) * radius;
          }
          break;
        }
        case 'SPIRAL': {
          const angle = index * 0.8;
          const radius = index * (isMobile ? 40 : 60);
          x = Math.cos(angle) * radius;
          y = Math.sin(angle) * radius;
          break;
        }
        case 'ORGANIC': {
          const seed = project.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const angle = (seed % 360) * (Math.PI / 180);
          const radius = (isMobile ? 100 : 150) + (seed % (isMobile ? 150 : 300));
          x = Math.cos(angle) * radius;
          y = Math.sin(angle) * radius;
          break;
        }
      }

      return { ...project, x, y };
    });
  }, [sortedProjects, layoutMode, isMobile]);

  return (
    <div className="relative w-full h-full bg-background-dark/60 backdrop-blur-xl overflow-hidden flex flex-col">
      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-8 py-6 border-b border-white/5 bg-background-dark/40">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-primary hover:text-background-dark transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white tracking-tight">{domain.name}</h2>
              <span 
                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border"
                style={{ borderColor: domain.color + '40', color: domain.color, backgroundColor: domain.color + '10' }}
              >
                领域空间
              </span>
            </div>
            <p className="text-xs text-white/40 font-mono mt-1 uppercase tracking-widest">
              {projects.length} 个活跃圆环 / {projects.filter(p => p.tasks.length > 0 && p.tasks.every(t => t.status === TaskStatus.DONE)).length} 已完成
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Add Ring button removed as per user request, using global button instead */}
        </div>
      </header>

      {/* Map Content */}
      <main 
        ref={containerRef} 
        className="relative flex-1 overflow-hidden cursor-move active:cursor-grabbing"
        onWheel={handleWheel}
      >
        {/* Background Atmosphere */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ 
            background: `radial-gradient(circle at 50% 50%, ${domain.color}20 0%, transparent 70%)`,
          }} 
        />
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
             style={{ 
               backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', 
               backgroundSize: `${60 * scale}px ${60 * scale}px`,
               backgroundPosition: `${pan.x}px ${pan.y}px`
             }} 
        />

        {/* Rings Container */}
        <motion.div 
          drag
          dragMomentum={false}
          onDrag={(_, info) => setPan(prev => ({ x: prev.x + info.delta.x, y: prev.y + info.delta.y }))}
          className="absolute inset-0 flex items-center justify-center p-32"
        >
          <div 
            className="relative w-0 h-0"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
          >
            <AnimatePresence mode="popLayout">
              {layoutedProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, x: 0, y: 0 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isMobile ? 0.7 : 1, 
                    x: project.x - (isMobile ? 48 : 68), 
                    y: project.y - (isMobile ? 48 : 68) 
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 200,
                    damping: 25,
                    delay: index * 0.02 
                  }}
                  className="absolute"
                >
                  <Ring
                    project={project}
                    x={0}
                    y={0}
                    isSelected={selectedProjectId === project.id}
                    onClick={() => onSelectProject(project.id)}
                    onDoubleClick={() => onEditProject(project.id)}
                    onDrag={() => {}} 
                    isDraggable={false}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {projects.length === 0 && (
              <div className="flex flex-col items-center gap-4 text-white/20">
                <LayoutGrid size={48} strokeWidth={1} />
                <p className="font-mono text-sm tracking-[0.3em] uppercase">该领域尚无圆环</p>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer / Stats Bar */}
      <footer className="relative z-20 px-4 md:px-8 py-4 bg-background-dark/80 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Zoom Controls Overlay */}
        <div className="absolute bottom-24 right-8 flex flex-col gap-2 z-30">
          <button 
            onClick={() => setScale(prev => Math.min(prev + 0.2, 3))}
            className="w-10 h-10 bg-background-dark/80 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center text-white/60 hover:bg-primary hover:text-background-dark transition-all"
          >
            <Plus size={20} />
          </button>
          <button 
            onClick={() => setScale(prev => Math.max(prev - 0.2, 0.2))}
            className="w-10 h-10 bg-background-dark/80 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center text-white/60 hover:bg-primary hover:text-background-dark transition-all"
          >
            <Minus size={20} />
          </button>
          <button 
            onClick={() => { setPan({ x: 0, y: 0 }); setScale(1); }}
            className="w-10 h-10 bg-background-dark/80 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center text-white/60 hover:bg-primary hover:text-background-dark transition-all"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5 overflow-x-auto no-scrollbar max-w-[80vw]">
            <button 
              onClick={() => setLayoutMode('CIRCLE')}
              className={cn(
                "px-2 md:px-3 py-1.5 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap",
                layoutMode === 'CIRCLE' ? "bg-primary text-background-dark" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <Orbit size={12} /> 圆环
            </button>
            <button 
              onClick={() => setLayoutMode('GRID')}
              className={cn(
                "px-2 md:px-3 py-1.5 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap",
                layoutMode === 'GRID' ? "bg-primary text-background-dark" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <Grid3X3 size={12} /> 网格
            </button>
            <button 
              onClick={() => setLayoutMode('SPIRAL')}
              className={cn(
                "px-2 md:px-3 py-1.5 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap",
                layoutMode === 'SPIRAL' ? "bg-primary text-background-dark" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <ListFilter size={12} /> 螺旋
            </button>
            <button 
              onClick={() => setLayoutMode('ORGANIC')}
              className={cn(
                "px-2 md:px-3 py-1.5 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap",
                layoutMode === 'ORGANIC' ? "bg-primary text-background-dark" : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <Shuffle size={12} /> 散落
            </button>
          </div>

          <div className="hidden md:flex flex-col">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">领域覆盖率</span>
            <div className="w-32 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(projects.filter(p => p.tasks.every(t => t.status === TaskStatus.DONE)).length / (projects.length || 1)) * 100}%` }}
                className="h-full"
                style={{ backgroundColor: domain.color }}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
          <LayoutGrid size={12} />
          自动排版系统已激活
        </div>
      </footer>
    </div>
  );
};

export default DomainMap;
