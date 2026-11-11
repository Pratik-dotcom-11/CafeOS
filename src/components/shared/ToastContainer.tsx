import React from 'react';
import { useCafe } from '../../context/CafeContext';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useCafe();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
          warning: <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
          error: <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
          info: <Info className="w-5 h-5 text-cafe-accent shrink-0 mt-0.5" />,
        };

        const borderStyles = {
          success: 'border-l-4 border-l-emerald-500',
          warning: 'border-l-4 border-l-amber-500',
          error: 'border-l-4 border-l-rose-500',
          info: 'border-l-4 border-l-cafe-accent',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 bg-white/95 dark:bg-cafe-surface-dark/95 backdrop-blur shadow-warm-lg rounded-xl border border-cafe-border/80 dark:border-cafe-border-dark ${borderStyles[toast.type]} transition-all animate-in fade-in slide-in-from-bottom-2 duration-200`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-cafe-primary dark:text-cafe-cream">
                {toast.title}
              </h4>
              {toast.message && (
                <p className="text-xs text-cafe-muted dark:text-stone-400 mt-0.5 leading-relaxed">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-stone-400 hover:text-cafe-primary dark:hover:text-white p-1 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

