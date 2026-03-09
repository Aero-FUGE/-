import { supabase } from '../lib/supabase';
import { Domain, Project, SystemLogEntry, UserStats, TaskStatus } from '../types';

const USER_ID = 'default-user'; // In a real app, this would come from auth

export const syncService = {
  async fetchInitialData() {
    try {
      const [
        { data: domains },
        { data: projects },
        { data: tasks },
        { data: logs }
      ] = await Promise.all([
        supabase.from('domains').select('*').eq('user_id', USER_ID),
        supabase.from('projects').select('*').eq('user_id', USER_ID),
        supabase.from('tasks').select('*').eq('user_id', USER_ID),
        supabase.from('logs').select('*').eq('user_id', USER_ID).order('timestamp', { ascending: false })
      ]);

      // Reconstruct projects with tasks
      const projectsWithTasks = (projects || []).map(p => ({
        ...p,
        tasks: (tasks || [])
          .filter(t => t.project_id === p.id)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(t => ({
            id: t.id,
            name: t.name,
            estimatedTime: t.estimated_time,
            actualTime: t.actual_time,
            status: t.status as TaskStatus,
            order: t.order
          }))
      }));

      return {
        domains: domains || [],
        projects: projectsWithTasks,
        logs: logs || [],
        stats: null // Stats table removed
      };
    } catch (error) {
      console.error('Error fetching initial data:', error);
      return null;
    }
  },

  async upsertDomain(domain: Domain) {
    const { error } = await supabase.from('domains').upsert({
      id: domain.id,
      user_id: USER_ID,
      name: domain.name,
      color: domain.color,
      x: domain.x,
      y: domain.y,
      width: domain.width,
      height: domain.height
    });
    if (error) console.error('Error upserting domain:', error);
  },

  async deleteDomain(id: string) {
    const { error } = await supabase.from('domains').delete().eq('id', id);
    if (error) console.error('Error deleting domain:', error);
  },

  async upsertProject(project: Project) {
    // 1. Upsert project
    const { error: pError } = await supabase.from('projects').upsert({
      id: project.id,
      user_id: USER_ID,
      name: project.name,
      x: project.x,
      y: project.y,
      scale: project.scale,
      color: project.color,
      domain_id: project.domainId
    });
    if (pError) {
      console.error('Error upserting project:', pError);
      return;
    }

    // 2. Sync tasks
    // Delete existing tasks for this project first to ensure consistency
    await supabase.from('tasks').delete().eq('project_id', project.id);
    
    if (project.tasks.length > 0) {
      const { error: tError } = await supabase.from('tasks').insert(
        project.tasks.map((t, idx) => ({
          id: t.id,
          user_id: USER_ID,
          project_id: project.id,
          name: t.name,
          estimated_time: t.estimatedTime,
          actual_time: t.actualTime,
          status: t.status,
          order: idx
        }))
      );
      if (tError) console.error('Error inserting tasks:', tError);
    }
  },

  async deleteProject(id: string) {
    // Tasks will be deleted via cascade if set up, or manually
    await supabase.from('tasks').delete().eq('project_id', id);
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) console.error('Error deleting project:', error);
  },

  async upsertLog(log: SystemLogEntry) {
    const { error } = await supabase.from('logs').upsert({
      id: log.id,
      user_id: USER_ID,
      timestamp: log.timestamp,
      type: log.type,
      event_name: log.eventName,
      target_name: log.targetName,
      xp_amount: log.xpAmount
    });
    if (error) console.error('Error upserting log:', error);
  }
};
