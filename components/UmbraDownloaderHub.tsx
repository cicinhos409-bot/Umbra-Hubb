
import React, { useState } from 'react';
import { Download, Film } from 'lucide-react';
import TiktokDownloaderTool from './TiktokDownloaderTool';
import SoraDownTool from './SoraDownTool';
import PinterestDownloaderTool from './PinterestDownloaderTool';
import FacebookDownloaderTool from './FacebookDownloaderTool';
import YouTubeDownloaderTool from './YouTubeDownloaderTool';

const TABS = [
    { id: 'tiktok', label: 'TikTok Downloader', icon: Download, color: 'from-pink-500 to-red-500' },
    { id: 'pinterest', label: 'Pinterest Down', icon: Download, color: 'from-red-600 to-red-500' },
    { id: 'facebook', label: 'Facebook Down', icon: Download, color: 'from-blue-700 to-blue-600' },
    { id: 'youtube', label: 'YouTube Down', icon: Download, color: 'from-red-600 to-red-400' },
    { id: 'sora', label: 'Sora AI Down', icon: Film, color: 'from-brand-cyan to-blue-500' },
] as const;

type TabId = typeof TABS[number]['id'];

const UmbraDownloaderHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabId>('tiktok');

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
                {activeTab === 'tiktok' && <TiktokDownloaderTool />}
                {activeTab === 'pinterest' && <PinterestDownloaderTool />}
                {activeTab === 'facebook' && <FacebookDownloaderTool />}
                {activeTab === 'youtube' && <YouTubeDownloaderTool />}
                {activeTab === 'sora' && <SoraDownTool />}
            </div>
        </div>
    );
};

export default UmbraDownloaderHub;
