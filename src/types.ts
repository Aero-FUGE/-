/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export interface Task {
  id: string;
  name: string;
  estimatedTime: number; // in minutes
  actualTime: number; // in minutes
  status: TaskStatus;
  notes?: string;
  completedAt?: number; // timestamp
  order: number;
  timerStartTime?: number; // timestamp when timer started/resumed
  timerAccumulatedTime?: number; // in seconds
  isTimerRunning?: boolean;
  deadline?: number; // timestamp
  lastAlertDismissedAt?: number; // timestamp
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: '觉醒' | '执行' | '掌控' | '统治' | '传奇' | '神话' | '隐藏';
  unlockedAt?: number;
  xpReward: number;
}

export interface SystemLogEntry {
  id: string;
  timestamp: number;
  type: 'TASK_COMPLETED' | 'TASK_PROGRESS' | 'RING_CREATED' | 'RING_COMPLETED' | 'SYSTEM_AWAKENED' | 'DOMAIN_CREATED' | 'DOMAIN_PROGRESS' | 'LEVEL_UP' | 'XP_GAIN';
  eventName: string;
  targetName: string;
  xpAmount?: number;
}

export interface UserStats {
  nickname: string;
  totalRingsCompleted: number;
  totalTasksCompleted: number;
  totalTimeSpent: number; // in minutes
  dailyRingsCompleted: number;
  dailyProgress: number; // percentage
  maxDailyProgress: number;
  streakDays: number;
  totalRingsCreated: number;
  totalTasksCreated: number;
  lastActiveDate: string; // YYYY-MM-DD
  xp: number;
  level: number;
  soundEnabled: boolean;
}

export interface Domain {
  id: string;
  name: string;
  color: string;
  themeColor?: string;
  description?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  deadline?: number; // Added for domain-level deadline if needed, but user asked for Ring and Task
}

export interface Project {
  id: string;
  name: string;
  tasks: Task[];
  x: number;
  y: number;
  scale: number;
  color: string;
  isCompleted?: boolean; // Track if completion effect has been triggered
  domainId?: string;
  deadline?: number; // timestamp
  lastAlertDismissedAt?: number; // timestamp
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
