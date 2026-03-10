import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Bell, X } from 'lucide-react';
import { Project, Task, TaskStatus } from '../types';
import { cn } from '../lib/utils';

interface DeadlineAlertProps {
  projects: Project[];
  onDismissTask: (projectId: string, taskId: string) => void;
  onDismissProject: (projectId: string) => void;
}

interface AlertItem {
  id: string;
  type: 'TASK' | 'PROJECT';
  name: string;
  deadline: number;
  projectId: string;
  taskId?: string;
  severity: 'CRITICAL' | 'WARNING';
}

export const DeadlineAlert: React.FC<DeadlineAlertProps> = ({
  projects,
  onDismissTask,
  onDismissProject,
}) => {
  const [activeAlerts, setActiveAlerts] = useState<AlertItem[]>([]);
  const [now, setNow] = useState(Date.now());

  // Update time every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const newAlerts: AlertItem[] = [];
    const DISMISS_COOLDOWN = 5 * 60 * 1000; // 5 minutes

    projects.forEach(project => {
      // Check Project Deadline
      if (project.deadline && !project.tasks.every(t => t.status === TaskStatus.DONE)) {
        const isDismissed = project.lastAlertDismissedAt && (now - project.lastAlertDismissedAt < DISMISS_COOLDOWN);
        
        if (!isDismissed) {
          const remainingTime = project.tasks
            .filter(t => t.status !== TaskStatus.DONE)
            .reduce((acc, t) => acc + t.estimatedTime, 0);
          
          const timeToDeadline = project.deadline - now;
          const riskThreshold = remainingTime * 60 * 1000;

          if (timeToDeadline < 0) {
            newAlerts.push({
              id: `project-${project.id}`,
              type: 'PROJECT',
              name: project.name,
              deadline: project.deadline,
              projectId: project.id,
              severity: 'CRITICAL'
            });
          } else if (timeToDeadline < riskThreshold || timeToDeadline < 30 * 60 * 1000) {
            newAlerts.push({
              id: `project-${project.id}`,
              type: 'PROJECT',
              name: project.name,
              deadline: project.deadline,
              projectId: project.id,
              severity: 'WARNING'
            });
          }
        }
      }

      // Check Task Deadlines
      project.tasks.forEach(task => {
        if (task.deadline && task.status !== TaskStatus.DONE) {
          const isDismissed = task.lastAlertDismissedAt && (now - task.lastAlertDismissedAt < DISMISS_COOLDOWN);
          
          if (!isDismissed) {
            const timeToDeadline = task.deadline - now;
            const riskThreshold = task.estimatedTime * 60 * 1000;

            if (timeToDeadline < 0) {
              newAlerts.push({
                id: `task-${task.id}`,
                type: 'TASK',
                name: task.name,
                deadline: task.deadline,
                projectId: project.id,
                taskId: task.id,
                severity: 'CRITICAL'
              });
            } else if (timeToDeadline < riskThreshold || timeToDeadline < 15 * 60 * 1000) {
              newAlerts.push({
                id: `task-${task.id}`,
                type: 'TASK',
                name: task.name,
                deadline: task.deadline,
                projectId: project.id,
                taskId: task.id,
                severity: 'WARNING'
              });
            }
          }
        }
      });
    });

    setActiveAlerts(newAlerts);
  }, [projects, now]);

  if (activeAlerts.length === 0) return null;

  const currentAlert = activeAlerts[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="w-full max-w-md bg-red-950/90 backdrop-blur-xl border-2 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)] rounded-2xl p-8 pointer-events-auto relative overflow-hidden">
          {/* Animated Background Pulse */}
          <motion.div 
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-red-500/20"
          />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6 border-2 border-red-500 animate-pulse">
              <AlertTriangle size={40} className="text-red-500" />
            </div>

            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
              {currentAlert.severity === 'CRITICAL' ? '紧急警报：已逾期' : '系统警告：即将截止'}
            </h2>
            
            <p className="text-red-200 text-sm mb-6 font-medium">
              检测到{currentAlert.type === 'PROJECT' ? '圆环系统' : '神经任务'} <span className="text-white font-bold">[{currentAlert.name}]</span> {currentAlert.severity === 'CRITICAL' ? '已超过预设截止时间' : '预估完成时间已临近截止点'}。
            </p>

            <div className="flex flex-col w-full gap-3">
              <button
                onClick={() => {
                  if (currentAlert.type === 'PROJECT') {
                    onDismissProject(currentAlert.projectId);
                  } else if (currentAlert.taskId) {
                    onDismissTask(currentAlert.projectId, currentAlert.taskId);
                  }
                }}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95"
              >
                我知道了 (暂时解除)
              </button>
              
              <div className="text-[10px] text-red-400/60 uppercase tracking-widest font-bold">
                警报将在 5 分钟后若未完成则再次同步
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
