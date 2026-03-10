
import React, { useState } from 'react';
import { Search, Palette } from 'lucide-react';
import UmbraSearchTool from './UmbraSearchTool';
import ImageScoutTool from './ImageScoutTool';

const TABS = [
    { id: 'search', label: 'Umbra Search', icon: Search, color: 'from-brand-purple to-brand-pink' },
    { id: 'scout', label: 'Image Scout', icon: Palette, color: 'from-amber-500 to-orange-500' },
] as const;

type TabId = typeof TABS[number]['id'];

const UmbraMediaHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('search');

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
                {activeTab === 'search' && <UmbraSearchTool />}
                {activeTab === 'scout' && <ImageScoutTool />}
            </div>
        </div>
    );
};

export default UmbraMediaHub;
