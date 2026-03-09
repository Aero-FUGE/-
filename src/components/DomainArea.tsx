import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Domain, Project } from '../types';
import { cn } from '../lib/utils';
import { Box, Plus, Edit2, Check, Maximize2, X, Activity } from 'lucide-react';
import { Ring } from './Ring';
import { AnimatePresence } from 'motion/react';

interface DomainAreaProps {
  domain: Domain;
  projects: Project[];
  selectedProjectId: string | null;
  isProjectDragging: boolean;
  onAddProject: (domainId: string) => void;
  onDrag: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onUpdate: (id: string, updates: Partial<Domain>) => void;
  onRingClick: (id: string) => void;
  onRingDoubleClick: (id: string) => void;
  onRingDrag: (id: string, x: number, y: number) => void;
  onRingDragStart: (id: string) => void;
  onDeleteDomain: (id: string) => void;
}

export const DomainArea: React.FC<DomainAreaProps> = ({ 
  domain, 
  projects,
  selectedProjectId,
  isProjectDragging,
  onAddProject, 
  onDrag,
  onResize,
  onUpdate,
  onRingClick,
  onRingDoubleClick,
  onRingDrag,
  onRingDragStart,
  onDeleteDomain
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(domain.name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveName = () => {
    onUpdate(domain.id, { name: tempName });
    setIsEditing(false);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={(_, info) => {
        onDrag(domain.id, domain.x + info.offset.x, domain.y + info.offset.y);
      }}
      initial={false}
      animate={{ 
        x: domain.x, 
        y: domain.y, 
        width: domain.width, 
        height: domain.height,
        borderColor: isProjectDragging ? `${domain.color}80` : `${domain.color}30`,
        backgroundColor: isProjectDragging ? `${domain.color}10` : `${domain.color}05`,
      }}
      transition={{
        x: { duration: 0 },
        y: { duration: 0 },
        width: { type: 'spring', stiffness: 300, damping: 30 },
        height: { type: 'spring', stiffness: 300, damping: 30 },
      }}
      className={cn(
        "absolute border-2 border-dashed rounded-[40px] cursor-grab active:cursor-grabbing group domain-area",
      )}
    >
      {/* Domain Label */}
      <div 
        className="absolute -top-10 left-0 flex items-center gap-3 pointer-events-auto cursor-default"
        onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when interacting with label
      >
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-background-dark shadow-lg"
          style={{ backgroundColor: domain.color }}
        >
          <Box size={18} />
        </div>
        <div className="flex flex-col">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="bg-white/10 border border-primary/30 rounded px-1 text-xs text-white outline-none"
                autoFocus
              />
              <button onClick={handleSaveName} className="text-primary"><Check size={14} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group/label">
              <span className="text-xs font-bold text-white uppercase tracking-widest drop-shadow-md">
                领域：{domain.name}
              </span>
              <button 
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover/label:opacity-100 text-white/40 hover:text-primary transition-opacity"
              >
                <Edit2 size={12} />
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="opacity-0 group-hover/label:opacity-100 text-white/40 hover:text-red-500 transition-opacity"
                title="删除领域"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <span className="text-[8px] text-white/40 uppercase tracking-tighter">
            DOMAIN IDENTIFIED
          </span>
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-background-dark/80 backdrop-blur-sm rounded-[40px] border-2 border-red-500/30"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-4 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-2">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1">删除领域？</h3>
                <p className="text-[10px] text-white/60 uppercase tracking-tighter">此操作将永久移除领域及其绑定的所有闭环系统。</p>
              </div>
              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded bg-white/5 border border-white/10 text-[10px] text-white/60 uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    onDeleteDomain(domain.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="px-4 py-2 rounded bg-red-500/20 border border-red-500/40 text-[10px] text-red-500 uppercase tracking-widest hover:bg-red-500/40 transition-colors"
                >
                  确认删除
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bound Projects */}
      <div className="absolute inset-0 pointer-events-none">
        {projects.map((project) => (
          <div 
            key={project.id}
            className="absolute pointer-events-auto"
            style={{ 
              left: project.x, 
              top: project.y,
              // project.x and project.y are now relative to the domain
            }}
            onMouseDown={(e) => e.stopPropagation()} // Prevent dragging domain when dragging ring
          >
            <Ring
              project={project}
              x={0}
              y={0}
              isSelected={selectedProjectId === project.id}
              onClick={() => onRingClick(project.id)}
              onDoubleClick={() => onRingDoubleClick(project.id)}
              onDrag={(id, x, y) => onRingDrag(id, x + domain.x, y + domain.y)}
              onDragStart={() => onRingDragStart(project.id)}
            />
          </div>
        ))}
      </div>

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize flex items-center justify-center text-white/20 hover:text-primary transition-colors"
        onMouseDown={(e) => {
          e.stopPropagation();
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = domain.width;
          const startHeight = domain.height;

          const onMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(200, startWidth + (moveEvent.clientX - startX));
            const newHeight = Math.max(200, startHeight + (moveEvent.clientY - startY));
            onResize(domain.id, newWidth, newHeight);
          };

          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          };

          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        }}
      >
        <Maximize2 size={16} className="rotate-90" />
      </div>

      {/* Add Project Button in Domain */}
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => onAddProject(domain.id)}
        className="absolute bottom-4 right-12 w-10 h-10 rounded-full bg-background-dark/80 border border-primary/30 flex items-center justify-center text-primary hover:bg-primary hover:text-background-dark transition-all opacity-0 group-hover:opacity-100 shadow-xl"
        title={`在 ${domain.name} 领域创建闭环`}
      >
        <Plus size={20} />
      </button>

      {/* Drop Hint */}
      {isProjectDragging && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="px-4 py-2 bg-primary/20 border border-primary/40 rounded-full text-[10px] text-primary font-bold uppercase tracking-widest animate-pulse">
            释放以绑定至此领域
          </div>
        </div>
      )}

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-[40px] pointer-events-none" style={{ borderColor: domain.color }} />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 rounded-tr-[40px] pointer-events-none" style={{ borderColor: domain.color }} />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 rounded-bl-[40px] pointer-events-none" style={{ borderColor: domain.color }} />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-[40px] pointer-events-none" style={{ borderColor: domain.color }} />

      {/* Scanning Line Effect */}
      <motion.div 
        className="absolute left-0 right-0 h-[1px] pointer-events-none opacity-20"
        style={{ 
          background: `linear-gradient(90deg, transparent, ${domain.color}, transparent)`,
          top: 0
        }}
        animate={{
          top: ['0%', '100%', '0%']
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </motion.div>
  );
};
