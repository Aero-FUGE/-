import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Archive, Calendar, Clock, FileText, Search, Filter } from 'lucide-react';
import { Project, Task, TaskStatus } from '../types';
import { cn } from '../lib/utils';
import { soundManager } from '../services/soundService';

interface SystemArchiveProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
}

export const SystemArchive: React.FC<SystemArchiveProps> = ({
  isOpen,
  onClose,
  projects,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  // Flatten all tasks with notes or completion info
  const allRecords = React.useMemo(() => {
    const records: { project: Project; task: Task }[] = [];
    projects.forEach(project => {
      project.tasks.forEach(task => {
        if (task.notes || task.completedAt) {
          records.push({ project, task });
        }
      });
    });

    // Sort by completion time (most recent first) or creation order if not completed
    return records.sort((a, b) => {
      const timeA = a.task.completedAt || 0;
      const timeB = b.task.completedAt || 0;
      return timeB - timeA;
    });
  }, [projects]);

  const filteredRecords = allRecords.filter(r => 
    r.task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.task.notes && r.task.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
    r.project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed top-0 right-0 h-[100dvh] w-full max-w-2xl bg-background-dark/95 backdrop-blur-3xl border-l border-primary/20 z-[80] flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-primary/20 flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-3">
              <Archive className="text-primary" />
              <h2 className="text-xl font-bold text-primary tracking-tighter uppercase">系统档案 <span className="text-white/20 font-light ml-2">SYSTEM ARCHIVE</span></h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-primary/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索任务、备注或项目名称..."
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {filteredRecords.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                <Archive size={48} className="mb-4" />
                <p className="text-sm uppercase tracking-widest">暂无档案记录</p>
              </div>
            ) : (
              filteredRecords.map(({ project, task }, idx) => (
                <motion.div
                  key={`${project.id}-${task.id}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/5 border border-white/5 rounded-xl p-5 hover:border-primary/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        {project.name}
                      </span>
                    </div>
                    {task.completedAt && (
                      <div className="flex items-center gap-1.5 text-[10px] text-primary/60 font-mono">
                        <Calendar size={10} />
                        {formatDate(task.completedAt)}
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                    {task.name}
                    {task.status === TaskStatus.DONE && (
                      <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-tighter">
                        已完成
                      </span>
                    )}
                  </h3>

                  {task.notes ? (
                    <div className="relative mt-4 p-4 bg-black/20 rounded-lg border-l-2 border-primary/30">
                      <FileText className="absolute top-3 right-3 text-white/5" size={24} />
                      <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap font-sans">
                        {task.notes}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-white/20 italic">无详细备注内容</p>
                  )}
                </motion.div>
              ))
            )}
          </div>

          <div className="p-6 border-t border-primary/20 bg-background-dark/50">
            <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-widest">
              <span>档案总数: {allRecords.length}</span>
              <span>系统版本: v2.4.0-ARCHIVE</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
