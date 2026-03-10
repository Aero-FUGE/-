import React, { useCallback } from 'react';
import { Project, TaskStatus, Domain } from '../types';

export const useTaskEngine = (
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  domains: Domain[],
  onLog: (type: any, event: string, target: string) => void,
  onXP: (xp: number, reason: string) => void,
  onCheckAchievements: (projects: Project[]) => void,
  onAddTimeSpent: (minutes: number) => void
) => {
  const updateProject = useCallback((updatedProject: Project) => {
    const oldProject = projects.find(p => p.id === updatedProject.id);
    if (!oldProject) return;

    const isComplete = updatedProject.tasks.length > 0 && 
                      updatedProject.tasks.every(t => t.status === TaskStatus.DONE);
    
    // 1. Handle Task Side Effects
    updatedProject.tasks.forEach(newTask => {
      const oldTask = oldProject.tasks.find(t => t.id === newTask.id);
      
      if (newTask.actualTime > (oldTask?.actualTime || 0)) {
        onAddTimeSpent(newTask.actualTime - (oldTask?.actualTime || 0));
      }
      
      if (newTask.status === TaskStatus.DONE && oldTask?.status !== TaskStatus.DONE) {
        onLog('TASK_COMPLETED', '系统记录：检测到任务推进', `${updatedProject.name} > ${newTask.name}`);
        let xp = 10;
        if (newTask.estimatedTime >= 180) xp = 50;
        else if (newTask.estimatedTime >= 60) xp = 20;
        onXP(xp, `完成任务：${newTask.name}`);
      } else if (newTask.status === TaskStatus.IN_PROGRESS && oldTask?.status === TaskStatus.TODO) {
        onLog('TASK_PROGRESS', '系统记录：任务进入执行阶段', `${updatedProject.name} > ${newTask.name}`);
      }
    });

    // 2. Handle Project Completion Side Effects
    if (isComplete && !oldProject.isCompleted) {
      onLog('RING_COMPLETED', '系统提示：闭环系统已达成', updatedProject.name);
      onXP(100, `达成闭环：${updatedProject.name}`);
      
      if (updatedProject.domainId) {
        const domain = (domains || []).find(d => d.id === updatedProject.domainId);
        if (domain) {
          const otherProjectsInDomain = projects.filter(proj => proj.id !== updatedProject.id && proj.domainId === domain.id);
          const allOthersComplete = otherProjectsInDomain.length > 0 && otherProjectsInDomain.every(proj => 
            proj.tasks.length > 0 && proj.tasks.every(t => t.status === TaskStatus.DONE)
          );
          
          if (allOthersComplete) {
            onLog('DOMAIN_PROGRESS', `系统提示：${domain.name}领域全部闭环达成`, `领域统治力提升`);
            onXP(500, `领域全部闭环：${domain.name}`);
          } else {
            onLog('DOMAIN_PROGRESS', `系统提示：${domain.name}领域完成度提升`, `检测到闭环系统达成`);
          }
        }
      }
    } else if (!isComplete && oldProject.isCompleted) {
      // If it was complete but now isn't (e.g. added a new task)
    }

    // 3. Update State
    setProjects((prev) => {
      const next = prev.map((p) => p.id === updatedProject.id ? { ...updatedProject, isCompleted: isComplete } : p);
      // Trigger achievement check with the new state
      setTimeout(() => onCheckAchievements(next), 0);
      return next;
    });
  }, [projects, domains, onLog, onXP, onCheckAchievements, onAddTimeSpent, setProjects]);

  return { updateProject };
};
