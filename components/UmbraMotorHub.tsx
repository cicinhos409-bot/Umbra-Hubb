
import React, { useState } from 'react';
import { Sparkles, FileText, Gem, Mic } from 'lucide-react';
import TitleOptimizerTool from './TitleOptimizerTool';
import DescriptionBuilderTool from './DescriptionBuilderTool';
import UmbraScriptTool from './UmbraScriptTool';
import UmbraPromptTool from './UmbraPromptTool';

const TABS = [
    { id: 'prompt', label: 'Umbra Prompt', icon: Mic, color: 'from-brand-cyan to-blue-500' },
    { id: 'script', label: 'Umbra Script', icon: Gem, color: 'from-brand-purple to-brand-pink' },
    { id: 'title', label: 'Título Otimizado', icon: Sparkles, color: 'from-amber-500 to-orange-500' },
    { id: 'description', label: 'Description Builder', icon: FileText, color: 'from-emerald-500 to-green-500' },
] as const;

type TabId = typeof TABS[number]['id'];

const UmbraMotorHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('prompt');

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
                            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${isActive
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
                {activeTab === 'prompt' && <UmbraPromptTool />}
                {activeTab === 'script' && <UmbraScriptTool />}
                {activeTab === 'title' && <TitleOptimizerTool />}
                {activeTab === 'description' && <DescriptionBuilderTool />}
            </div>
        </div>
    );
};

export default UmbraMotorHub;
