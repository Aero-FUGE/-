import { Achievement } from '../types';

export const ALL_TITLES: Achievement[] = [
  // 用户指定成就
  { id: 'first_ring', category: '觉醒', title: '首次闭环', description: '完成第一个完整闭环', icon: 'link', xpReward: 50 },
  { id: 'streak_3', category: '执行', title: '连续三天完成任务', description: '连续三天推进系统任务', icon: 'activity', xpReward: 100 },
  { id: 'daily_5', category: '执行', title: '单日完成任务超过5个', description: '在一天内完成5个以上的任务节点', icon: 'zap', xpReward: 150 },
  { id: 'first_domain', category: '掌控', title: '首次完成领域', description: '完成一个领域内的所有闭环', icon: 'box', xpReward: 200 },
  { id: 'rings_10', category: '掌控', title: '完成10个闭环', description: '累计完成10个闭环项目', icon: 'target', xpReward: 300 },
  { id: 'tasks_50', category: '执行', title: '完成50个任务', description: '累计完成50个任务节点', icon: 'check-circle', xpReward: 300 },
  { id: 'tasks_100', category: '掌控', title: '完成100个任务', description: '累计完成100个任务节点', icon: 'award', xpReward: 500 },
  { id: 'streak_7', category: '掌控', title: '七日连续完成任务', description: '连续七天推进系统任务', icon: 'calendar', xpReward: 500 },
  { id: 'domain_complete', category: '统治', title: '领域全部闭环', description: '完成所有领域的全部闭环', icon: 'crown', xpReward: 1000 },

  // 系统觉醒阶段
  { id: 'awakening_1', category: '觉醒', title: '系统绑定者', description: '首次进入系统并创建第一个闭环', icon: 'link', xpReward: 20 },
  { id: 'awakening_2', category: '觉醒', title: '任务探索者', description: '创建三个闭环任务', icon: 'search', xpReward: 20 },
  { id: 'awakening_4', category: '觉醒', title: '系统适配者', description: '成功连续三天推进任务', icon: 'cpu', xpReward: 50 },

  // 执行者阶段
  { id: 'executor_1', category: '执行', title: '执行者', description: '累计完成三个闭环', icon: 'zap', xpReward: 100 },
  { id: 'executor_3', category: '执行', title: '高效执行者', description: '单日推进进度超过30%', icon: 'trending-up', xpReward: 100 },
  { id: 'executor_4', category: '执行', title: '时间管理者', description: '任务实际用时全部低于预计时间', icon: 'clock', xpReward: 100 },

  // 掌控阶段
  { id: 'control_2', category: '掌控', title: '系统调度者', description: '地图上同时存在十个闭环', icon: 'layers', xpReward: 200 },
  { id: 'control_3', category: '掌控', title: '效率统筹者', description: '单日完成两个闭环', icon: 'bar-chart', xpReward: 200 },

  // 统治阶段
  { id: 'rule_2', category: '统治', title: '版图扩张者', description: '地图上创建三十个闭环', icon: 'map', xpReward: 500 },
  { id: 'rule_4', category: '统治', title: '效率暴君', description: '单日推进进度超过70%', icon: 'flame', xpReward: 500 },

  // 传奇阶段
  { id: 'legend_2', category: '传奇', title: '系统建筑师', description: '创建五十个闭环项目', icon: 'hammer', xpReward: 1000 },
  { id: 'legend_3', category: '传奇', title: '效率奇迹', description: '单日完成三个闭环', icon: 'sparkles', xpReward: 1000 },

  // 神话阶段
  { id: 'myth_1', category: '神话', title: '世界构建者', description: '累计完成一百个闭环', icon: 'globe', xpReward: 5000 },
  { id: 'myth_2', category: '神话', title: '任务神话', description: '累计完成一千个任务节点', icon: 'ghost', xpReward: 5000 },

  // 隐藏称号
  { id: 'hidden_1', category: '隐藏', title: '破晓执行者', description: '凌晨四点完成闭环', icon: 'sunrise', xpReward: 500 },
  { id: 'hidden_2', category: '隐藏', title: '夜幕工作者', description: '凌晨一点仍在推进任务', icon: 'moon', xpReward: 500 },
];
