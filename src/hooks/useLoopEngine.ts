import { useState, useCallback } from 'react';
import { Project, Domain } from '../types';

export const useLoopEngine = (initialProjects: Project[]) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null);

  const scaleRing = useCallback((id: string, delta: number) => {
    setProjects((prev) => {
      if (!prev) return [];
      return prev.map((p) => {
        if (p.id === id) {
          const newScale = Math.max(0.5, Math.min(3, p.scale + delta));
          return { ...p, scale: newScale };
        }
        return p;
      });
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => {
      if (!prev) return [];
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const dragRing = useCallback((id: string, x: number, y: number, domains: Domain[], onLog: (msg: string, target: string) => void, onXP: (xp: number, reason: string) => void) => {
    setProjects((prev) => {
      if (!prev) return [];
      return prev.map((p) => {
      if (p.id === id) {
        let newDomainId = null;
        let finalX = x;
        let finalY = y;
        
        const ringCenterX = x + 68;
        const ringCenterY = y + 68;
        
        const targetDomain = (domains || []).find(d => 
          ringCenterX >= d.x && ringCenterX <= d.x + d.width &&
          ringCenterY >= d.y && ringCenterY <= d.y + d.height
        );
        
        if (targetDomain) {
          if (targetDomain.id !== p.domainId) {
            onLog(`系统提示：闭环已绑定至 ${targetDomain.name}`, p.name);
            onXP(30, `闭环绑定至领域：${targetDomain.name}`);
          }
          newDomainId = targetDomain.id;
          // Store relative coordinates
          finalX = x - targetDomain.x;
          finalY = y - targetDomain.y;
        } else if (p.domainId) {
          const oldDomain = (domains || []).find(d => d.id === p.domainId);
          onLog(`系统提示：闭环已从 ${oldDomain?.name || '领域'} 解除绑定`, p.name);
          // When unbinding, x and y are already absolute from the drag event
        }
        
        return { ...p, x: finalX, y: finalY, domainId: newDomainId };
      }
      return p;
      });
    });
    setDraggingProjectId(null);
  }, []);

  return {
    projects,
    setProjects,
    draggingProjectId,
    setDraggingProjectId,
    scaleRing,
    deleteProject,
    dragRing
  };
};
