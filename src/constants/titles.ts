import { Achievement } from '../types';

export const ALL_TITLES: Achievement[] = [
  // 系统觉醒阶段
  { id: 'awakening_1', category: '觉醒', title: '系统绑定者', description: '首次进入系统并创建第一个闭环', icon: 'link' },
  { id: 'awakening_2', category: '觉醒', title: '任务探索者', description: '创建三个闭环任务', icon: 'search' },
  { id: 'awakening_3', category: '觉醒', title: '闭环学徒', description: '完成第一个闭环', icon: 'book-open' },
  { id: 'awakening_4', category: '觉醒', title: '系统适配者', description: '成功连续三天推进任务', icon: 'cpu' },

  // 执行者阶段
  { id: 'executor_1', category: '执行', title: '执行者', description: '累计完成三个闭环', icon: 'zap' },
  { id: 'executor_2', category: '执行', title: '推进者', description: '累计完成五个闭环', icon: 'fast-forward' },
  { id: 'executor_3', category: '执行', title: '高效执行者', description: '单日推进进度超过30%', icon: 'trending-up' },
  { id: 'executor_4', category: '执行', title: '时间管理者', description: '任务实际用时全部低于预计时间', icon: 'clock' },
  { id: 'executor_5', category: '执行', title: '系统熟练者', description: '连续七天推进任务', icon: 'activity' },

  // 掌控阶段
  { id: 'control_1', category: '掌控', title: '闭环掌控者', description: '累计完成十个闭环', icon: 'target' },
  { id: 'control_2', category: '掌控', title: '系统调度者', description: '地图上同时存在十个闭环', icon: 'layers' },
  { id: 'control_3', category: '掌控', title: '效率统筹者', description: '单日完成两个闭环', icon: 'bar-chart' },
  { id: 'control_4', category: '掌控', title: '时间支配者', description: '累计完成一百个任务节点', icon: 'hourglass' },
  { id: 'control_5', category: '掌控', title: '任务指挥官', description: '连续十天推进任务', icon: 'shield' },

  // 统治阶段
  { id: 'rule_1', category: '统治', title: '闭环统治者', description: '累计完成二十个闭环', icon: 'crown' },
  { id: 'rule_2', category: '统治', title: '版图扩张者', description: '地图上创建三十个闭环', icon: 'map' },
  { id: 'rule_3', category: '统治', title: '系统征服者', description: '累计完成三百个任务节点', icon: 'swords' },
  { id: 'rule_4', category: '统治', title: '效率暴君', description: '单日推进进度超过70%', icon: 'flame' },
  { id: 'rule_5', category: '统治', title: '时间领主', description: '连续三十天推进任务', icon: 'infinity' },

  // 传奇阶段
  { id: 'legend_1', category: '传奇', title: '闭环之王', description: '累计完成五十个闭环', icon: 'gem' },
  { id: 'legend_2', category: '传奇', title: '系统建筑师', description: '创建五十个闭环项目', icon: 'hammer' },
  { id: 'legend_3', category: '传奇', title: '效率奇迹', description: '单日完成三个闭环', icon: 'sparkles' },
  { id: 'legend_4', category: '传奇', title: '时间主宰', description: '累计完成五百个任务节点', icon: 'sun' },
  { id: 'legend_5', category: '传奇', title: '永恒执行者', description: '连续六十天推进任务', icon: 'history' },

  // 神话阶段
  { id: 'myth_1', category: '神话', title: '世界构建者', description: '累计完成一百个闭环', icon: 'globe' },
  { id: 'myth_2', category: '神话', title: '任务神话', description: '累计完成一千个任务节点', icon: 'ghost' },
  { id: 'myth_3', category: '神话', title: '系统核心', description: '连续一百天推进任务', icon: 'hard-drive' },
  { id: 'myth_4', category: '神话', title: '时间神权', description: '累计投入工作时间超过一千小时', icon: 'key' },
  { id: 'myth_5', category: '神话', title: '秩序之主', description: '地图上拥有一百个完成闭环', icon: 'command' },

  // 隐藏称号
  { id: 'hidden_1', category: '隐藏', title: '破晓执行者', description: '凌晨四点完成闭环', icon: 'sunrise' },
  { id: 'hidden_2', category: '隐藏', title: '夜幕工作者', description: '凌晨一点仍在推进任务', icon: 'moon' },
  { id: 'hidden_3', category: '隐藏', title: '孤勇推进者', description: '一天内完成一个超大型闭环', icon: 'user' },
  { id: 'hidden_4', category: '隐藏', title: '系统信徒', description: '连续打开系统三十天', icon: 'heart' },
  { id: 'hidden_5', category: '隐藏', title: '命运改写者', description: '完成第一个史诗级闭环（预计时间超过100小时）', icon: 'wand-2' },
];
