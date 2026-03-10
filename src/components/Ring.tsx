import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, TaskStatus } from '../types';
import { cn } from '../lib/utils';
import { soundManager } from '../services/soundService';

interface RingProps {
  project: Project;
  x: number;
  y: number;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onDrag: (id: string, x: number, y: number) => void;
  onDragStart?: () => void;
  isDraggable?: boolean;
}

export const Ring: React.FC<RingProps> = ({ project, x, y, isSelected, onClick, onDoubleClick, onDrag, onDragStart, isDraggable = true }) => {
  const radius = 60;
  const strokeWidth = 8;
  const center = radius + strokeWidth;
  const circumference = 2 * Math.PI * radius;

  const { totalEst, completedEst, segments } = useMemo(() => {
    const total = project.tasks.reduce((acc, t) => acc + t.estimatedTime, 0);
    const completed = project.tasks
      .filter((t) => t.status === TaskStatus.DONE)
      .reduce((acc, t) => acc + t.estimatedTime, 0);

    let currentOffset = 0;
    const segs = project.tasks.map((task) => {
      const length = total > 0 ? (task.estimatedTime / total) * circumference : 0;
      const offset = currentOffset;
      currentOffset += length;
      return {
        id: task.id,
        length,
        offset,
        isDone: task.status === TaskStatus.DONE,
      };
    });

    return { totalEst: total, completedEst: completed, segments: segs };
  }, [project.tasks, circumference]);

  const progressPercent = totalEst > 0 ? Math.round((completedEst / totalEst) * 100) : 0;
  const isComplete = progressPercent === 100 && project.tasks.length > 0;

  // Track if we should show the active completion animation (5s duration)
  const [showCelebration, setShowCelebration] = React.useState(false);
  const prevIsComplete = React.useRef(isComplete);

  React.useEffect(() => {
    // If it just became complete
    if (isComplete && !prevIsComplete.current) {
      soundManager.playCompletion();
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
    prevIsComplete.current = isComplete;
  }, [isComplete]);

  return (
    <motion.div
      drag={isDraggable}
      dragMomentum={false}
      onDragStart={() => {
        onDragStart?.();
      }}
      onDragEnd={(_, info) => {
        // The drag is relative to the current position (x, y)
        onDrag(project.id, x + info.offset.x, y + info.offset.y);
      }}
      initial={false}
      animate={{ x, y, scale: project.scale }}
      transition={{ 
        x: { duration: 0 }, 
        y: { duration: 0 },
        scale: { type: 'spring', stiffness: 300, damping: 30 }
      }}
      className={cn(
        "absolute cursor-grab active:cursor-grabbing transition-shadow ring-component",
        isSelected && "z-10"
      )}
      style={{ width: center * 2, height: center * 2 }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(); // Always just select
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
    >
      <svg width={center * 2} height={center * 2} className="overflow-visible">
        {/* Background Glow */}
        <filter id={`glow-${project.id}`}>
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Base Ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />

        {/* Segments */}
        {segments.map((seg) => (
          <motion.circle
            key={seg.id}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={seg.isDone ? project.color : 'rgba(255,255,255,0.1)'}
            strokeWidth={strokeWidth}
            strokeDasharray={`${seg.length} ${circumference}`}
            strokeDashoffset={-seg.offset}
            strokeLinecap="round"
            initial={false}
            animate={{
              stroke: seg.isDone ? project.color : 'rgba(255,255,255,0.1)',
              filter: seg.isDone ? `drop-shadow(0 0 8px ${project.color})` : 'none',
            }}
            transition={{ duration: 0.5 }}
          >
            {seg.isDone && (
              <motion.animate
                attributeName="stroke-width"
                values={`${strokeWidth};${strokeWidth + 4};${strokeWidth}`}
                dur="0.5s"
                repeatCount="1"
              />
            )}
          </motion.circle>
        ))}

        {/* Selection Highlight */}
        {isSelected && (
          <motion.circle
            cx={center}
            cy={center}
            r={radius + strokeWidth + 4}
            fill="none"
            stroke={project.color}
            strokeWidth={1}
            strokeDasharray="4 4"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 1, 0.5],
              rotate: 360
            }}
            transition={{
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 10, repeat: Infinity, ease: "linear" }
            }}
          />
        )}

        {/* Completion Effect - Only play pulse for 5 seconds after completion */}
        <AnimatePresence>
          {showCelebration && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={project.color}
                strokeWidth={strokeWidth}
                animate={{
                  opacity: [0, 0.8, 0],
                  scale: [1, 1.5, 2],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
              <motion.circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={project.color}
                strokeWidth={2}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [1, 1.2, 1.4],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                strokeDasharray="10 20"
              />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      {/* Label */}
      <motion.div 
        animate={{ scale: 1 / project.scale }}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      >
        <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
          {progressPercent}%
        </span>
        <span className="text-xs font-bold text-white text-center px-2 truncate max-w-full">
          {project.name}
        </span>
        <span className="text-[8px] text-white/20 uppercase mt-1">点击进入系统</span>
      </motion.div>
      {/* Completion Glow - Very subtle constant glow if completed */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          className="absolute inset-[-10px] rounded-full blur-2xl pointer-events-none"
          style={{ backgroundColor: project.color }}
        />
      )}
    </motion.div>
  );
};
