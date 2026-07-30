import React from 'react';
import { Shield, Radio, Activity, X } from 'lucide-react';

export const AgentStatusBar: React.FC<{
  channelCount: number;
  totalCount: number;
  isLoading?: boolean;
}> = ({ channelCount, totalCount, isLoading }) => {
  const [timeLeft, setTimeLeft] = React.useState('');

  React.useEffect(() => {
    const update = () => {
      const now = new Date();
      const hours = 2 - (now.getHours() % 3);
      const mins = 59 - now.getMinutes();
      const secs = 59 - now.getSeconds();
      setTimeLeft(`${hours}h ${mins}m ${secs}s`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 px-6 py-4 bg-black rounded-xl">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 border border-white/20">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-black" />
        </div>
        <div>
          <h2 className="text-[9px] font-black text-white uppercase tracking-[0.2em] leading-none mb-1">Phantom Agent Active</h2>
          <p className="text-[9px] font-black text-white/40 uppercase tracking-wider">Scanning Engine v4.2.0</p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="text-right">
          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Canais Filtrados</p>
          <div className="flex items-center justify-end gap-2">
            <Radio className={`w-3 h-3 text-white/50 ${isLoading ? 'animate-pulse text-white' : ''}`} />
            <span className="text-base font-black text-white leading-none">
              {channelCount} <span className="text-[10px] font-black text-white/40">/ {totalCount}</span>
            </span>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Próximo Ciclo Em</p>
          <div className="flex items-center justify-end gap-2">
            <Activity className="w-3 h-3 text-white/50" />
            <span className="text-base font-black text-white leading-none">{timeLeft}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NetworkAlertBanner: React.FC<{ onDismiss: () => void }> = ({ onDismiss }) => (
  <div className="mb-4 bg-white border-l-4 border-black rounded-xl p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-black animate-ping shrink-0" />
      <p className="text-xs font-black text-gray-900">
        <span className="font-black text-black uppercase tracking-widest">Network Detectada —</span>{' '}
        Cluster de 5 canais operando com o mesmo padrão de assets encontrado.
      </p>
    </div>
    <button onClick={onDismiss} className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all shrink-0">
      <X className="w-3.5 h-3.5 text-gray-500" />
    </button>
  </div>
);

export const NicheAlertBanner: React.FC<{ niche: string; count: number; onDismiss: () => void }> = ({ niche, count, onDismiss }) => (
  <div className="mb-4 bg-white border-l-4 border-black rounded-xl p-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-black animate-ping shrink-0" />
      <p className="text-xs font-black text-gray-900">
        <span className="font-black text-black uppercase tracking-widest">Nicho Emergente —</span>{' '}
        O nicho <span className="uppercase font-black">"{niche}"</span> apresentou {count} novas anomalias de crescimento nas últimas 48h.
      </p>
    </div>
    <button onClick={onDismiss} className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all shrink-0">
      <X className="w-3.5 h-3.5 text-gray-500" />
    </button>
  </div>
);

export const getExpiryColor = (h: number) => h < 24 ? '#ef4444' : h < 72 ? '#f59e0b' : '#9ca3af';
export const getWindowColor = (s: string) => s === 'ABERTA' ? '#2ecc71' : s === 'FECHANDO' ? '#f39c12' : '#e63946';
export const getVerdictStyle = (t: string) => {
  switch (t) {
    case 'replicate': return { color: '#2ecc71', bg: 'rgba(46,204,113,0.1)', border: 'rgba(46,204,113,0.3)' };
    case 'adapt': return { color: '#3498db', bg: 'rgba(52,152,219,0.1)', border: 'rgba(52,152,219,0.3)' };
    case 'inspire': return { color: '#f39c12', bg: 'rgba(243,156,18,0.1)', border: 'rgba(243,156,18,0.3)' };
    default: return { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.3)' };
  }
};
export const getFacelessColor = (code: string) => {
  const colors: Record<string, string> = {
    F1: '#7c3aed', F2: '#3498db', F3: '#2ecc71', F4: '#f39c12',
    F5: '#06b6d4', F6: '#7c3aed', F7: '#3498db', F8: '#991b1b',
    F9: '#991b1b', F10: '#ea580c', F11: '#ea580c', F12: '#f39c12'
  };
  return colors[code] || '#9ca3af';
};
