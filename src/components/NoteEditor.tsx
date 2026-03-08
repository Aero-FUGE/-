import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Save, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  onSave: (content: string) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  isOpen,
  onClose,
  title,
  content,
  onSave,
}) => {
  const [text, setText] = React.useState(content);
  const [isFullScreen, setIsFullScreen] = React.useState(false);

  React.useEffect(() => {
    setText(content);
  }, [content]);

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn(
            "fixed z-[100] bg-background-dark/95 backdrop-blur-3xl border border-primary/30 shadow-2xl flex flex-col overflow-hidden transition-all duration-300",
            isFullScreen 
              ? "inset-4 rounded-2xl" 
              : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[70vh] rounded-xl"
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-primary/20 bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="text-primary" size={18} />
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest truncate max-w-[200px]">
                任务备注: {title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"
                title={isFullScreen ? "退出全屏" : "全屏模式"}
              >
                {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-1.5 bg-primary text-background-dark rounded font-bold text-xs uppercase tracking-widest hover:bg-primary/80 transition-all"
              >
                <Save size={14} />
                保存
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 p-6 flex flex-col">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="在此输入详细的任务说明、灵感或进度记录..."
              className="flex-1 bg-transparent border-none outline-none text-white/90 leading-relaxed resize-none font-sans text-lg placeholder:text-white/10"
              autoFocus
            />
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-primary/10 bg-primary/5 flex justify-between items-center">
            <span className="text-[10px] text-white/20 uppercase tracking-widest">
              系统自动保存已开启 | 字符数: {text.length}
            </span>
            <div className="flex gap-4">
              <div className="flex items-center gap-1 text-[10px] text-primary/40 uppercase">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                神经链路同步中
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
