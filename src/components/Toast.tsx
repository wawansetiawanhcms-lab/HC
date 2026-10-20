import React from 'react';
import { Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'info' | 'success' | 'error';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info' }) => {
  if (!message) return null;

  const icons = {
    info: <Info className="w-5 h-5 text-[#00C4CC]" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400" />,
  };

  return (
    <div className="fixed bottom-5 right-5 z-[150] flex items-center gap-3 px-5 py-3.5 bg-slate-900/95 dark:bg-slate-800/95 text-white text-sm font-medium rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      {icons[type]}
      <span>{message}</span>
    </div>
  );
};
