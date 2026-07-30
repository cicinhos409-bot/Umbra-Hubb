import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

interface Toast { id: string; msg: string; type: 'success' | 'error' | 'info'; }

interface ToastContextValue {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto animate-in slide-in-from-right-8 fade-in duration-300">
            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border-l-4 bg-white ${
              toast.type === 'success' ? 'border-black'
              : toast.type === 'error'   ? 'border-red-500'
              : 'border-blue-500'
            }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                toast.type === 'success' ? 'bg-black text-white'
                : toast.type === 'error'   ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
              }`}>
                {toast.type === 'success' ? <Check className="w-5 h-5" />
                  : toast.type === 'error' ? <AlertCircle className="w-5 h-5" />
                  : <Info className="w-5 h-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em]">Umbra Hub</div>
                <div className="text-sm font-black text-gray-900 leading-snug">{toast.msg}</div>
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-all shrink-0"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
