import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Activity, Terminal, Calendar, Zap, CheckCircle2, PlusCircle, Trophy } from 'lucide-react';
import { SystemLogEntry } from '../types';
import { cn } from '../lib/utils';
import { soundManager } from '../services/soundService';

interface SystemLogProps {
  isOpen: boolean;
  onClose: () => void;
  logs: SystemLogEntry[];
}

export const SystemLog: React.FC<SystemLogProps> = ({
  isOpen,
  onClose,
  logs,
}) => {
  // Group logs by day
  const groupedLogs = React.useMemo(() => {
    const groups: Record<string, SystemLogEntry[]> = {};
    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString('zh-CN');
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    
    // Sort groups by date descending
    return Object.entries(groups).sort((a, b) => {
      return new Date(b[0]).getTime() - new Date(a[0]).getTime();
    });
  }, [logs]);

  const getDailySummary = (dayLogs: SystemLogEntry[]) => {
    const completed = dayLogs.filter(l => l.type === 'TASK_COMPLETED').length;
    const progressed = dayLogs.filter(l => l.type === 'TASK_PROGRESS').length;
    const newRings = dayLogs.filter(l => l.type === 'RING_CREATED').length;
    const completedRings = dayLogs.filter(l => l.type === 'RING_COMPLETED').length;

    return { completed, progressed, newRings, completedRings };
  };

  const getIcon = (type: SystemLogEntry['type']) => {
    switch (type) {
      case 'TASK_COMPLETED': return <CheckCircle2 size={14} className="text-primary" />;
      case 'TASK_PROGRESS': return <Zap size={14} className="text-yellow-400" />;
      case 'RING_CREATED': return <PlusCircle size={14} className="text-secondary" />;
      case 'RING_COMPLETED': return <CheckCircle2 size={14} className="text-primary" />;
      case 'LEVEL_UP': return <Trophy size={14} className="text-primary" />;
      case 'XP_GAIN': return <Zap size={14} className="text-primary" />;
      default: return <Terminal size={14} className="text-white/40" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[60vh] bg-background-dark/95 backdrop-blur-3xl border border-primary/20 z-[80] flex flex-col shadow-2xl rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-primary/20 flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-3">
              <Activity className="text-primary" size={18} />
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest">系统日志 <span className="text-white/20 font-light ml-2">SYSTEM LOGS</span></h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 font-mono">
            {groupedLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                <Terminal size={48} className="mb-4" />
                <p className="text-xs uppercase tracking-widest">暂无系统记录</p>
              </div>
            ) : (
              groupedLogs.map(([date, dayLogs]) => {
                const summary = getDailySummary(dayLogs);
                return (
                  <div key={date} className="space-y-4">
                    {/* Daily Summary Header */}
                    <div className="sticky top-0 z-10 bg-background-dark/80 backdrop-blur-sm py-2 border-b border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-primary">
                          <Calendar size={14} />
                          <span className="text-xs font-bold tracking-tighter">{date}</span>
                        </div>
                        <span className="text-[10px] text-white/20 uppercase tracking-widest">今日系统记录</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-white/5 p-2 rounded border border-white/5">
                          <div className="text-[8px] text-white/40 uppercase mb-1">完成任务</div>
                          <div className="text-sm text-primary font-bold">{summary.completed}</div>
                        </div>
                        <div className="bg-white/5 p-2 rounded border border-white/5">
                          <div className="text-[8px] text-white/40 uppercase mb-1">推进任务</div>
                          <div className="text-sm text-yellow-400 font-bold">{summary.progressed}</div>
                        </div>
                        <div className="bg-white/5 p-2 rounded border border-white/5">
                          <div className="text-[8px] text-white/40 uppercase mb-1">新增闭环</div>
                          <div className="text-sm text-secondary font-bold">{summary.newRings}</div>
                        </div>
                        <div className="bg-white/5 p-2 rounded border border-white/5">
                          <div className="text-[8px] text-white/40 uppercase mb-1">闭环达成</div>
                          <div className="text-sm text-primary font-bold">{summary.completedRings}</div>
                        </div>
                      </div>
                    </div>

                    {/* Log Entries */}
                    <div className="space-y-2 pl-4 border-l border-white/5">
                      {dayLogs.sort((a, b) => b.timestamp - a.timestamp).map((log) => (
                        <div key={log.id} className="flex items-start gap-3 group">
                          <div className="mt-1 shrink-0">
                            {getIcon(log.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-white/20">
                                {new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                              <span className="text-[10px] text-primary/60 uppercase tracking-tighter font-bold">
                                {log.eventName}
                              </span>
                              {log.xpAmount && (
                                <span className="text-[8px] px-1 bg-primary/20 border border-primary/30 text-primary rounded font-bold">
                                  +{log.xpAmount} XP
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-white/80 mt-0.5">
                              {log.targetName}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-primary/20 bg-background-dark/50 flex justify-between items-center">
            <div className="flex items-center gap-2 text-[10px] text-primary/40 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              实时日志流已建立
            </div>
            <span className="text-[10px] text-white/20 uppercase tracking-widest">
              Total Entries: {logs.length}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
