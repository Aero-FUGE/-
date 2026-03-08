import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Award, Zap, Calendar, Star, Link, Search, BookOpen, Cpu, FastForward, TrendingUp, Clock, Activity, Target, Layers, BarChart, Hourglass, Shield, Crown, Map, Swords, Flame, Infinity, Gem, Hammer, Sparkles, Sun, History, Globe, Ghost, HardDrive, Key, Command, Sunrise, Moon, User, Heart, Wand2 } from 'lucide-react';
import { Achievement } from '../types';
import { cn } from '../lib/utils';

const IconMap: Record<string, any> = {
  'link': Link, 'search': Search, 'book-open': BookOpen, 'cpu': Cpu,
  'zap': Zap, 'fast-forward': FastForward, 'trending-up': TrendingUp, 'clock': Clock, 'activity': Activity,
  'target': Target, 'layers': Layers, 'bar-chart': BarChart, 'hourglass': Hourglass, 'shield': Shield,
  'crown': Crown, 'map': Map, 'swords': Swords, 'flame': Flame, 'infinity': Infinity,
  'gem': Gem, 'hammer': Hammer, 'sparkles': Sparkles, 'sun': Sun, 'history': History,
  'globe': Globe, 'ghost': Ghost, 'hard-drive': HardDrive, 'key': Key, 'command': Command,
  'sunrise': Sunrise, 'moon': Moon, 'user': User, 'heart': Heart, 'wand-2': Wand2,
  'award': Award, 'calendar': Calendar, 'star': Star
};

interface AchievementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

export const AchievementPanel: React.FC<AchievementPanelProps> = ({
  isOpen,
  onClose,
  achievements,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className="fixed top-0 left-0 h-full w-full max-w-md bg-background-dark/95 backdrop-blur-2xl border-r border-primary/20 z-[70] flex flex-col shadow-2xl"
        >
          <div className="p-6 border-b border-primary/20 flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-3">
              <Trophy className="text-primary" />
              <h2 className="text-xl font-bold text-primary tracking-tighter uppercase">系统成就</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {['觉醒', '执行', '掌控', '统治', '传奇', '神话', '隐藏'].map(category => {
              const categoryAchievements = achievements.filter(a => a.category === category);
              if (categoryAchievements.length === 0) return null;

              return (
                <div key={category} className="space-y-4">
                  <h3 className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.3em] border-l-2 border-primary/40 pl-3">
                    {category}阶段
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {categoryAchievements.map((achievement) => {
                      const isUnlocked = !!achievement.unlockedAt;
                      const Icon = IconMap[achievement.icon] || Trophy;
                      return (
                        <div
                          key={achievement.id}
                          className={cn(
                            "relative p-4 rounded-xl border transition-all duration-500",
                            isUnlocked 
                              ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(13,242,242,0.1)]" 
                              : "bg-white/5 border-white/5 opacity-40 grayscale"
                          )}
                        >
                          <div className="flex gap-4">
                            <div className={cn(
                              "size-10 rounded-lg flex items-center justify-center shrink-0",
                              isUnlocked ? "bg-primary/20 text-primary" : "bg-white/10 text-white/20"
                            )}>
                              <Icon size={20} />
                            </div>
                            <div className="flex-1">
                              <h3 className={cn(
                                "font-bold text-xs uppercase tracking-wider",
                                isUnlocked ? "text-white" : "text-white/40"
                              )}>
                                {achievement.title}
                              </h3>
                              <p className="text-[10px] text-white/40 mt-1 leading-relaxed">
                                {achievement.description}
                              </p>
                              {isUnlocked && (
                                <div className="mt-2 text-[8px] font-mono text-primary/60 uppercase tracking-widest">
                                  已激活: {new Date(achievement.unlockedAt!).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 border-t border-primary/20 bg-background-dark/50">
            <div className="flex justify-between items-center text-[10px] text-white/40 uppercase tracking-[0.2em]">
              <span>系统同步率</span>
              <span className="text-primary">
                {Math.round((achievements.filter(a => a.unlockedAt).length / achievements.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(achievements.filter(a => a.unlockedAt).length / achievements.length) * 100}%` }}
                className="h-full bg-primary"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
