import React, { useState } from 'react';
import { Settings, Zap, Cpu } from 'lucide-react';
import UmbraControlTool from './UmbraControlTool';
import UmbraConnectTool from './UmbraConnectTool';

const TABS = [
  { id: 'connect' as const, label: 'Umbra Connect', icon: Zap, desc: 'Transcrição de áudio via IA' },
  { id: 'control' as const, label: 'Umbra Control', icon: Settings, desc: 'Scanner de sequências de frames' },
] as const;

type TabId = typeof TABS[number]['id'];

const UmbraTurboHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('connect');

  return (
    <div className="animate-in fade-in duration-500 space-y-6">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
          <Cpu className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">Turbo Hub</h1>
          <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Sincronização e controle automático de fluxo</p>
        </div>
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div className="flex gap-1.5 bg-gray-100 border border-gray-200 p-1.5 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-white text-primary shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="animate-in fade-in duration-300">
        {activeTab === 'connect' && <UmbraConnectTool />}
        {activeTab === 'control' && <UmbraControlTool />}
      </div>
    </div>
  );
};

export default UmbraTurboHub;
