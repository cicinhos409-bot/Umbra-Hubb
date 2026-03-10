
import React, { useState } from 'react';
import { Settings, Zap } from 'lucide-react';
import UmbraControlTool from './UmbraControlTool';
import UmbraConnectTool from './UmbraConnectTool';

const TABS = [
    { id: 'connect', label: 'Umbra Connect', icon: Zap, color: 'from-brand-pink to-brand-purple' },
    { id: 'control', label: 'Umbra Control', icon: Settings, color: 'from-brand-purple to-indigo-500' },
] as const;

type TabId = typeof TABS[number]['id'];

const UmbraTurboHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('connect');

    return (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 p-1.5 bg-background-mid rounded-2xl border border-white/5">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${isActive
                                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-[1.02]`
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'connect' && <UmbraConnectTool />}
                {activeTab === 'control' && <UmbraControlTool />}
            </div>
        </div>
    );
};

export default UmbraTurboHub;
