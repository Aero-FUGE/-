import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Zap, Shield, Activity } from 'lucide-react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LOADING_STEPS = [
  { text: 'INITIALIZING CORE...', icon: Cpu },
  { text: 'ESTABLISHING NEURAL LINK...', icon: Activity },
  { text: 'SYNCING SYSTEM PROTOCOLS...', icon: Shield },
  { text: 'POWERING UP HUD INTERFACE...', icon: Zap },
  { text: 'ACCESS GRANTED.', icon: Shield },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 800);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          // Small delay before calling complete to show 100%
          setTimeout(onLoadingComplete, 500);
          return 100;
        }
        return prev + 1;
      });
    }, 20); // Faster progress

    const timeout = setTimeout(() => {
      onLoadingComplete();
    }, 3000); // Fail-safe

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [onLoadingComplete]);

  const CurrentIcon = LOADING_STEPS[currentStep].icon;

  return (
    <div className="fixed inset-0 bg-background-dark z-[9999] flex flex-col items-center justify-center overflow-hidden font-mono">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #00f2ff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      {/* Scanning Line */}
      <motion.div 
        className="absolute left-0 right-0 h-[2px] bg-primary/30 shadow-[0_0_15px_rgba(0,242,255,0.5)] z-10"
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative w-full max-w-md px-8">
        {/* Logo/Icon Area */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 border-2 border-dashed border-primary/30 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-24 h-24 border-2 border-dotted border-primary/20 rounded-full scale-125"
            />
            <div className="absolute inset-0 flex items-center justify-center text-primary">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CurrentIcon size={40} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="mb-8 text-center">
          <div className="text-primary text-xs tracking-[0.3em] mb-2 font-bold uppercase">
            System Initialization
          </div>
          <div className="h-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="text-white text-sm tracking-widest"
              >
                {LOADING_STEPS[currentStep].text}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-1 bg-white/5 border border-white/10 rounded-full overflow-hidden mb-4">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_10px_#00f2ff]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-white/30 tracking-tighter">
          <span>STATUS: SYNCING</span>
          <span>{progress}% COMPLETE</span>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-20">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-8 h-[1px] bg-primary" />
          ))}
        </div>
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-20">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-8 h-[1px] bg-primary" />
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-8 left-0 right-0 px-12 flex justify-between items-end opacity-40">
        <div className="text-[8px] text-white/50 space-y-1">
          <p>KERNEL: 0.9.4-STABLE</p>
          <p>ENCRYPTION: AES-256-GCM</p>
          <p>LOCATION: UNKNOWN_SECTOR</p>
        </div>
        <div className="text-[8px] text-white/50 text-right space-y-1">
          <p>NEURAL_LINK: ACTIVE</p>
          <p>LATENCY: 4ms</p>
          <p>USER: SYSTEM_BINDER</p>
        </div>
      </div>
    </div>
  );
};
