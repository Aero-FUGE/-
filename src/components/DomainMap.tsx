import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Domain, Project, TaskStatus } from '../types';
import { ArrowLeft, Plus, LayoutGrid, ListFilter } from 'lucide-react';
import Ring from './Ring';

interface DomainMapProps {
  domain: Domain;
  projects: Project[];
  selectedProjectId: string | null;
  onBack: () => void;
  onSelectProject: (id: string) => void;
  onEditProject: (id: string) => void;
  onDragProject: (id: string, x: number, y: number) => void;
  onAddProject: () => void;
}

const DomainMap: React.FC<DomainMapProps> = ({
  domain,
  projects,
  selectedProjectId,
  onBack,
  onSelectProject,
  onEditProject,
  onDragProject,
  onAddProject
}) => {
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
              {projects.length} 个活跃圆环 / {projects.filter(p => p.tasks.every(t => t.status === TaskStatus.DONE)).length} 已完成
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onAddProject}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-background-dark font-bold text-xs uppercase tracking-widest rounded shadow-[0_0_15px_rgba(13,242,242,0.4)] hover:bg-white transition-all"
          >
            <Plus size={16} />
            新增圆环
          </button>
        </div>
      </header>

      {/* Map Content */}
      <main className="relative flex-1 overflow-hidden">
        {/* Background Atmosphere */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ 
            background: `radial-gradient(circle at 50% 50%, ${domain.color}20 0%, transparent 70%)`,
          }} 
        />
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

        {/* Rings Container */}
        <div className="absolute inset-0 overflow-auto p-32 no-scrollbar">
          <div className="relative min-w-full min-h-full flex flex-wrap gap-32 items-center justify-center">
            <AnimatePresence mode="popLayout">
              {sortedProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <Ring
                    project={project}
                    x={0} // Using relative positioning in this layout
                    y={0}
                    isSelected={selectedProjectId === project.id}
                    onClick={() => onSelectProject(project.id)}
                    onDoubleClick={() => onEditProject(project.id)}
                    onDrag={(id, x, y) => onDragProject(id, x, y)}
                    // Note: The Ring component might need adjustment if it uses absolute positioning internally
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
        </div>
      </main>

      {/* Footer / Stats Bar */}
      <footer className="relative z-20 px-8 py-4 bg-background-dark/80 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
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
          <ListFilter size={12} />
          按进度自动排序
        </div>
      </footer>
    </div>
  );
};

export default DomainMap;
