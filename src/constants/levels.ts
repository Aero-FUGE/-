export interface LevelInfo {
  level: number;
  identity: string;
  xpThreshold: number;
}

export const LEVEL_SYSTEM: LevelInfo[] = [
  { level: 1, identity: '系统觉醒者', xpThreshold: 0 },
  { level: 2, identity: '任务执行者', xpThreshold: 100 },
  { level: 3, identity: '秩序维护者', xpThreshold: 300 },
  { level: 4, identity: '闭环建造者', xpThreshold: 700 },
  { level: 5, identity: '系统操作者', xpThreshold: 1500 },
  { level: 6, identity: '领域管理者', xpThreshold: 3000 },
  { level: 7, identity: '高维规划者', xpThreshold: 6000 },
  { level: 8, identity: '世界构建者', xpThreshold: 12000 },
  { level: 9, identity: '领域统治者', xpThreshold: 25000 },
  { level: 10, identity: '系统之神', xpThreshold: 50000 },
];

export const getLevelFromXP = (xp: number): LevelInfo => {
  for (let i = LEVEL_SYSTEM.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_SYSTEM[i].xpThreshold) {
      return LEVEL_SYSTEM[i];
    }
  }
  return LEVEL_SYSTEM[0];
};

export const getNextLevelXP = (level: number): number => {
  const nextLevel = LEVEL_SYSTEM.find(l => l.level === level + 1);
  return nextLevel ? nextLevel.xpThreshold : LEVEL_SYSTEM[LEVEL_SYSTEM.length - 1].xpThreshold;
};
