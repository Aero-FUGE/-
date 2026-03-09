import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, CheckCircle2, Circle, Trash2, Plus, Minus, Maximize2, FileText, ChevronRight, Play, Pause, Square } from 'lucide-react';
import { Project, Task, TaskStatus, Domain } from '../types';
import { cn } from '../lib/utils';
import { NoteEditor } from './NoteEditor';
import { soundManager } from '../services/soundService';

interface SidePanelProps {
  project: Project | null;
  domains: Domain[];
  onClose: () => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onAddTask: () => void;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  project,
  domains,
  onClose,
  onUpdateProject,
  onDeleteProject,
  onAddTask,
}) => {
  const [editingNoteTask, setEditingNoteTask] = useState<Task | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const activeTask = project?.tasks.find(t => t.isTimerRunning);
    
    if (activeTask && activeTask.timerStartTime) {
      setActiveTaskId(activeTask.id);
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeTask.timerStartTime!) / 1000);
        setCurrentTime((activeTask.timerAccumulatedTime || 0) + elapsed);
      }, 1000);
    } else {
      setActiveTaskId(null);
      setCurrentTime(0);
    }

    return () => clearInterval(interval);
  }, [project?.tasks]);

  if (!project) return null;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startTimer = (taskId: string) => {
    const updatedTasks = project.tasks.map((t) => {
      // Pause any other running timer
      if (t.isTimerRunning && t.id !== taskId) {
        const elapsed = Math.floor((Date.now() - (t.timerStartTime || Date.now())) / 1000);
        return {
          ...t,
          isTimerRunning: false,
          timerAccumulatedTime: (t.timerAccumulatedTime || 0) + elapsed,
          timerStartTime: undefined,
        };
      }
      if (t.id === taskId) {
        return {
          ...t,
          isTimerRunning: true,
          timerStartTime: Date.now(),
          status: TaskStatus.IN_PROGRESS,
        };
      }
      return t;
    });
    onUpdateProject({ ...project, tasks: updatedTasks });
  };

  const pauseTimer = (taskId: string) => {
    const updatedTasks = project.tasks.map((t) => {
      if (t.id === taskId && t.isTimerRunning) {
        const elapsed = Math.floor((Date.now() - (t.timerStartTime || Date.now())) / 1000);
        return {
          ...t,
          isTimerRunning: false,
          timerAccumulatedTime: (t.timerAccumulatedTime || 0) + elapsed,
          timerStartTime: undefined,
        };
      }
      return t;
    });
    onUpdateProject({ ...project, tasks: updatedTasks });
  };

  const endTimer = (taskId: string) => {
    const updatedTasks = project.tasks.map((t) => {
      if (t.id === taskId) {
        let finalAccumulated = t.timerAccumulatedTime || 0;
        if (t.isTimerRunning && t.timerStartTime) {
          finalAccumulated += Math.floor((Date.now() - t.timerStartTime) / 1000);
        }
        
        // Convert seconds to minutes for actualTime
        const additionalMinutes = Math.floor(finalAccumulated / 60);
        
        return {
          ...t,
          isTimerRunning: false,
          timerStartTime: undefined,
          timerAccumulatedTime: 0, // Reset for next time or just keep it 0
          actualTime: t.actualTime + additionalMinutes,
          status: TaskStatus.DONE,
          completedAt: Date.now(),
        };
      }
      return t;
    });
    onUpdateProject({ ...project, tasks: updatedTasks });
  };

  const totalTime = project.tasks.reduce((acc, t) => acc + t.estimatedTime, 0);
  const remainingTime = project.tasks
    .filter((t) => t.status !== TaskStatus.DONE)
    .reduce((acc, t) => acc + t.estimatedTime, 0);

  const toggleTaskStatus = (taskId: string) => {
    const updatedTasks = project.tasks.map((t) => {
      if (t.id === taskId) {
        const isDone = t.status !== TaskStatus.DONE;
        return {
          ...t,
          status: isDone ? TaskStatus.DONE : TaskStatus.TODO,
          completedAt: isDone ? Date.now() : undefined,
        };
      }
      return t;
    });
    onUpdateProject({ ...project, tasks: updatedTasks });
  };

  const addTask = () => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新任务',
      estimatedTime: 60,
      actualTime: 0,
      status: TaskStatus.TODO,
      order: project.tasks.length,
    };
    onUpdateProject({ ...project, tasks: [...project.tasks, newTask] });
    onAddTask();
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updatedTasks = project.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
    onUpdateProject({ ...project, tasks: updatedTasks });
  };

  const deleteTask = (taskId: string) => {
    onUpdateProject({
      ...project,
      tasks: project.tasks.filter((t) => t.id !== taskId),
    });
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 h-[100dvh] w-full max-w-md bg-background-dark/60 backdrop-blur-2xl border-l border-primary/20 z-50 flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 border-b border-primary/20 flex items-center justify-between bg-primary/5">
        <div>
          <input
            value={project.name}
            onChange={(e) => onUpdateProject({ ...project, name: e.target.value })}
            className="bg-transparent border-none text-xl font-bold text-primary focus:ring-0 p-0 w-full"
          />

          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1 text-[10px] text-white/40 uppercase tracking-widest">
              <Clock size={10} />
              <span>总计: {Math.floor(totalTime / 60)}h {totalTime % 60}m</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-primary uppercase tracking-widest">
              <Clock size={10} />
              <span>剩余: {Math.floor(remainingTime / 60)}h {remainingTime % 60}m</span>
            </div>
          </div>

          {/* Domain Selector */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[8px] text-white/20 uppercase tracking-widest font-bold">所属领域:</span>
            <select
              value={project.domainId || ''}
              onChange={(e) => onUpdateProject({ ...project, domainId: e.target.value || undefined })}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] text-white/60 focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">未分类</option>
              {domains.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">任务序列</h3>
          <button
            onClick={addTask}
            className="flex items-center gap-1 text-[10px] font-bold text-primary border border-primary/30 px-2 py-1 rounded hover:bg-primary/10 transition-colors"
          >
            <Plus size={12} />
            新增
          </button>
        </div>

        <AnimatePresence initial={false}>
          {project.tasks
            .sort((a, b) => a.order - b.order)
            .map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "group relative bg-white/5 border border-white/5 rounded-lg p-4 transition-all hover:border-primary/30",
                  task.status === TaskStatus.DONE && "opacity-60"
                )}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTaskStatus(task.id)}
                    className={cn(
                      "mt-1 transition-colors",
                      task.status === TaskStatus.DONE ? "text-primary" : "text-white/20 hover:text-primary/60"
                    )}
                  >
                    {task.status === TaskStatus.DONE ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>
                  <div className="flex-1 space-y-2">
                    <input
                      value={task.name}
                      onChange={(e) => updateTask(task.id, { name: e.target.value })}
                      className={cn(
                        "bg-transparent border-none p-0 text-sm font-medium w-full focus:ring-0",
                        task.status === TaskStatus.DONE && "line-through text-white/40"
                      )}
                    />
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-white/40 uppercase tracking-tighter">预计</span>
                        <input
                          type="number"
                          value={task.estimatedTime}
                          onChange={(e) => updateTask(task.id, { estimatedTime: parseInt(e.target.value) || 0 })}
                          className="bg-transparent border-none p-0 text-[10px] text-primary w-12 focus:ring-0 font-mono"
                        />
                        <span className="text-[10px] text-white/40 uppercase tracking-tighter">min</span>
                      </div>

                      {/* Timer UI */}
                      <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                        {task.status !== TaskStatus.DONE && (
                          <>
                            {task.isTimerRunning ? (
                              <button 
                                onClick={() => pauseTimer(task.id)}
                                className="p-2 text-yellow-400 hover:bg-yellow-400/10 rounded transition-colors"
                                title="暂停计时"
                              >
                                <Pause size={14} fill="currentColor" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => startTimer(task.id)}
                                className="p-2 text-green-400 hover:bg-green-400/10 rounded transition-colors"
                                title="开始计时"
                              >
                                <Play size={14} fill="currentColor" />
                              </button>
                            )}
                            <button 
                              onClick={() => endTimer(task.id)}
                              className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                              title="结束并完成"
                            >
                              <Square size={14} fill="currentColor" />
                            </button>
                          </>
                        )}
                        <span className={cn(
                          "text-[10px] font-mono tracking-tighter",
                          task.isTimerRunning ? "text-primary animate-pulse" : "text-white/40"
                        )}>
                          {task.id === activeTaskId ? formatTime(currentTime) : formatTime(task.timerAccumulatedTime || 0)}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => setEditingNoteTask(task)}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-0.5 rounded border transition-all",
                          task.notes 
                            ? "bg-primary/10 border-primary/30 text-primary" 
                            : "bg-white/5 border-white/10 text-white/40 hover:border-primary/30 hover:text-primary"
                        )}
                      >
                        <FileText size={10} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {task.notes ? "编辑备注" : "添加备注"}
                        </span>
                        <ChevronRight size={10} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-primary/20 bg-background-dark">
        <button
          onClick={() => {
            if (confirm('确定要删除这个圆环系统吗？')) {
              onDeleteProject(project.id);
            }
          }}
          className="w-full py-3 border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-widest rounded hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={14} />
          销毁系统
        </button>
      </div>

      {/* Note Editor Modal */}
      <NoteEditor
        isOpen={!!editingNoteTask}
        onClose={() => setEditingNoteTask(null)}
        title={editingNoteTask?.name || ''}
        content={editingNoteTask?.notes || ''}
        onSave={(newNotes) => {
          if (editingNoteTask) {
            updateTask(editingNoteTask.id, { notes: newNotes });
          }
        }}
      />
    </motion.div>
  );
};
