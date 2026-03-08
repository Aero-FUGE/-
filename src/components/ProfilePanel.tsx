import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Trophy, BarChart3, Clock, Calendar, Edit2, Check, Shield } from 'lucide-react';
import { Achievement, UserStats } from '../types';
import { cn } from '../lib/utils';

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
  achievements: Achievement[];
  onUpdateNickname: (name: string) => void;
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({
  isOpen,
  onClose,
  stats,
  achievements,
  onUpdateNickname,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempNickname, setTempNickname] = React.useState(stats.nickname);

  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const currentTitle = unlockedAchievements.length > 0 
    ? unlockedAchievements[unlockedAchievements.length - 1].title 
    : '系统绑定者';

  const handleSaveNickname = () => {
    onUpdateNickname(tempNickname);
    setIsEditing(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className="fixed top-0 left-0 h-full w-full max-w-md bg-background-dark/95 backdrop-blur-3xl border-r border-primary/20 z-[80] flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-primary/20 flex items-center justify-between bg-primary/5">
            <div className="flex items-center gap-3">
              <User className="text-primary" />
              <h2 className="text-xl font-bold text-primary tracking-tighter uppercase">个人档案 <span className="text-white/20 font-light ml-2">USER PROFILE</span></h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Identity Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Shield size={80} className="text-primary" />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                    <User size={32} />
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={tempNickname}
                          onChange={(e) => setTempNickname(e.target.value)}
                          className="bg-white/10 border border-primary/30 rounded px-2 py-1 text-white text-lg font-bold outline-none w-full"
                          autoFocus
                        />
                        <button onClick={handleSaveNickname} className="p-1.5 bg-primary text-background-dark rounded">
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">{stats.nickname}</h3>
                        <button onClick={() => setIsEditing(true)} className="text-white/20 hover:text-primary transition-colors">
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                    <div className="text-primary/60 text-xs font-bold uppercase tracking-widest mt-1">
                      {currentTitle}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/40">
                    <span>系统同步率</span>
                    <span>{Math.round((unlockedAchievements.length / achievements.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(unlockedAchievements.length / achievements.length) * 100}%` }}
                      className="h-full bg-primary shadow-[0_0_10px_rgba(13,242,242,0.5)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/40 mb-2">
                  <BarChart3 size={14} />
                  <span className="text-[10px] uppercase tracking-widest">累计闭环</span>
                </div>
                <div className="text-2xl font-bold text-primary">{stats.totalRingsCompleted}</div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/40 mb-2">
                  <Trophy size={14} />
                  <span className="text-[10px] uppercase tracking-widest">累计任务</span>
                </div>
                <div className="text-2xl font-bold text-primary">{stats.totalTasksCompleted}</div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/40 mb-2">
                  <Clock size={14} />
                  <span className="text-[10px] uppercase tracking-widest">推进时间</span>
                </div>
                <div className="text-2xl font-bold text-primary">{Math.round(stats.totalTimeSpent / 60)}h</div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/40 mb-2">
                  <Calendar size={14} />
                  <span className="text-[10px] uppercase tracking-widest">连续天数</span>
                </div>
                <div className="text-2xl font-bold text-primary">{stats.streakDays}d</div>
              </div>
            </div>

            {/* Achievements List */}
            <div className="space-y-4">
              <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-bold flex items-center gap-2">
                <Trophy size={12} />
                已获得成就 ({unlockedAchievements.length})
              </h4>
              <div className="grid grid-cols-4 gap-3">
                {unlockedAchievements.map(a => (
                  <div 
                    key={a.id} 
                    className="aspect-square bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-center text-primary group relative"
                    title={a.title}
                  >
                    <span className="text-xl">{a.icon}</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-background-dark border border-primary/30 rounded text-[8px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      <div className="font-bold text-primary mb-1">{a.title}</div>
                      <div className="text-white/60">{a.description}</div>
                    </div>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 8 - unlockedAchievements.length) }).map((_, i) => (
                  <div key={i} className="aspect-square bg-white/5 border border-white/5 rounded-lg flex items-center justify-center text-white/10">
                    <Trophy size={16} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-primary/20 bg-background-dark/50">
            <div className="flex items-center gap-2 text-[10px] text-primary/40 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              身份识别完成 | 神经链路已同步
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
