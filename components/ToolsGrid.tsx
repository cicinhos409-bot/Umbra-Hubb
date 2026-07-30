
import React from 'react';
import { TOOLS } from '../constants';
import { ToolTier } from '../types';
import { Plus } from 'lucide-react';

const tierBadge = (tier: ToolTier) => {
  if (tier === ToolTier.FREE) return 'bg-gray-100 text-gray-500 border-gray-200';
  if (tier === ToolTier.PRO)  return 'bg-gray-900 text-white border-gray-900';
  return 'bg-black text-white border-black';
};

const ToolsGrid: React.FC = () => {
  return (
    <section className="py-24 bg-white" id="ferramentas">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-4 py-2 rounded-full text-[10px] font-black text-gray-600 mb-6 uppercase tracking-widest">
            Arsenal Completo
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 mb-3">Ferramentas Incluídas</h2>
          <p className="text-gray-500 font-black text-base">Mais de 20 ferramentas prontas pra usar — web + extensões Chrome.</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TOOLS.map((tool) => (
            <div
              key={tool.id}
              className="group p-5 bg-white border border-gray-200 rounded-2xl hover:border-gray-400 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{tool.icon}</span>
                <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border ${tierBadge(tool.tier)}`}>
                  {tool.tier}
                </span>
              </div>
              <h3 className="font-black text-base mb-1.5 text-gray-900 group-hover:text-gray-700 transition-colors leading-tight">{tool.name}</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-black">{tool.description}</p>
            </div>
          ))}

          {/* "Novas Semanalmente" card */}
          <div className="p-5 bg-gray-50 border border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:border-gray-400 transition-all cursor-default">
            <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center mb-1">
              <Plus className="w-5 h-5 text-gray-600" />
            </div>
            <div className="text-sm font-black text-gray-900">+ Novas Semanalmente</div>
            <p className="text-[11px] text-gray-500 font-black leading-relaxed">Sempre adicionando ferramentas de ponta.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ToolsGrid;
