
import React, { useState } from 'react';
import { Scissors, Search, TrendingUp } from 'lucide-react';
import UmbraExtrairTool from './UmbraExtrairTool';
import UmbraReverseTool from './UmbraReverseTool';
import UmbraTubeFinderTool from './UmbraTubeFinderTool';

const TABS = [
    { id: 'extrair', label: 'Extrair Transcrição', icon: Scissors, color: 'from-brand-cyan to-blue-500' },
    { id: 'reverse', label: 'Análise Viral', icon: TrendingUp, color: 'from-brand-purple to-brand-pink' },
    { id: 'finder', label: 'Tube Finder', icon: Search, color: 'from-orange-500 to-red-500' },
] as const;

type TabId = typeof TABS[number]['id'];

const UmbraYouTubeHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('extrair');

    return (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-background-mid rounded-2xl border border-white/5">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${isActive
                                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-[1.02]`
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'extrair' && <UmbraExtrairTool />}
                {activeTab === 'reverse' && <UmbraReverseTool />}
                {activeTab === 'finder' && <UmbraTubeFinderTool />}
            </div>
        </div>
    );
};

export default UmbraYouTubeHub;
