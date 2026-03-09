import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Domain, Project, TaskStatus } from '../types';
import { Circle, Home, Warehouse, Shield, Crown, ChevronRight } from 'lucide-react';

interface WorldMapProps {
  domains: Domain[];
  projects: Project[];
  onSelectDomain: (domainId: string) => void;
}

const WorldMap: React.FC<WorldMapProps> = ({ domains, projects, onSelectDomain }) => {
  const domainStats = useMemo(() => {
    return domains.map(domain => {
      const domainProjects = projects.filter(p => p.domainId === domain.id);
      const completedProjects = domainProjects.filter(p => 
        p.tasks.length > 0 && p.tasks.every(t => t.status === TaskStatus.DONE)
      );
      const totalTasks = domainProjects.reduce((acc, p) => acc + p.tasks.length, 0);
      const completedTasks = domainProjects.reduce((acc, p) => 
        acc + p.tasks.filter(t => t.status === TaskStatus.DONE).length, 0
      );
      
      const completedCount = completedProjects.length;
      let level = 1;
      let Icon = Circle;
      let levelName = "LV1 初始点";

      if (completedCount >= 20) {
        level = 5;
        Icon = Crown;
        levelName = "LV5 终极城堡";
      } else if (completedCount >= 10) {
        level = 4;
        Icon = Shield;
        levelName = "LV4 坚固要塞";
      } else if (completedCount >= 5) {
        level = 3;
        Icon = Warehouse;
        levelName = "LV3 繁荣工坊";
      } else if (completedCount >= 2) {
        level = 2;
        Icon = Home;
        levelName = "LV2 宁静居所";
      }

      return {
        ...domain,
        level,
        levelName,
        Icon,
        completedCount,
        totalTasks,
        completedTasks,
        progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      };
    });
  }, [domains, projects]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-background-dark/40 backdrop-blur-sm flex items-center justify-center">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #0df2f2 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative flex items-center gap-32 px-64 py-32 overflow-x-auto no-scrollbar">
        {/* Connection Line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            d={`M ${domainStats.map((_, i) => `${100 + i * 350} 50%`).join(' L ')}`}
            fill="none"
            stroke="rgba(13, 242, 242, 0.2)"
            strokeWidth="4"
            strokeDasharray="8 8"
          />
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
            d={`M ${domainStats.map((_, i) => `${100 + i * 350} 50%`).join(' L ')}`}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
          />
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0df2f2" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#0df2f2" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0df2f2" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>

        {domainStats.map((domain, index) => (
          <motion.div
            key={domain.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Node Info Card */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              onClick={() => onSelectDomain(domain.id)}
              className="group cursor-pointer flex flex-col items-center gap-4"
            >
              {/* Icon Container */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    fill="none"
                    stroke="rgba(13, 242, 242, 0.1)"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="44"
                    fill="none"
                    stroke={domain.color}
                    strokeWidth="4"
                    strokeDasharray="276.46"
                    initial={{ strokeDashoffset: 276.46 }}
                    animate={{ strokeDashoffset: 276.46 - (276.46 * domain.progress) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>

                {/* Evolution Icon */}
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.3)] border border-white/10 transition-all group-hover:shadow-[0_0_30px_rgba(13,242,242,0.4)]"
                  style={{ backgroundColor: domain.color + '20' }}
                >
                  <domain.Icon size={32} style={{ color: domain.color }} />
                </div>

                {/* Level Badge */}
                <div className="absolute -bottom-2 right-0 bg-background-dark border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-white/60 uppercase tracking-tighter">
                  {domain.levelName}
                </div>
              </div>

              {/* Text Info */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                  {domain.name}
                </h3>
                <div className="flex items-center justify-center gap-3 mt-1 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                  <span>完成: {domain.completedTasks}/{domain.totalTasks}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>进度: {Math.round(domain.progress)}%</span>
                </div>
              </div>

              {/* Enter Button */}
              <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 flex items-center gap-1 text-[10px] font-bold text-primary uppercase tracking-widest mt-2">
                进入领域 <ChevronRight size={12} />
              </div>
            </motion.div>
          </motion.div>
        ))}

        {/* Empty State / Add New Domain Placeholder */}
        {domains.length === 0 && (
          <div className="text-white/20 font-mono text-sm tracking-widest uppercase">
            暂无领域，请通过 AI 助手开启你的第一个领域
          </div>
        )}
      </div>
    </div>
  );
};

export default WorldMap;
