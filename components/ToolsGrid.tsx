
import React from 'react';
import { TOOLS } from '../constants';
import { ToolTier } from '../types';

const ToolsGrid: React.FC = () => {
  return (
    <section className="py-24 bg-background-deep" id="ferramentas">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-16 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ferramentas Incluídas</h2>
          <p className="text-gray-400">Mais de 20 ferramentas prontas pra usar. Disponíveis via web + extensões Chrome.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOOLS.map((tool) => (
            <div 
              key={tool.id} 
              className="group p-6 bg-background-light/50 border border-white/5 rounded-2xl hover:bg-background-light hover:border-brand-purple/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{tool.icon}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                  tool.tier === ToolTier.FREE ? 'bg-brand-green/20 text-brand-green' :
                  tool.tier === ToolTier.PRO ? 'bg-brand-purple/20 text-brand-purple' : 'bg-brand-pink/20 text-brand-pink'
                }`}>
                  {tool.tier}
                </span>
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-brand-cyan transition-colors">{tool.name}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
            </div>
          ))}
          
          <div className="p-6 bg-brand-purple/5 border border-dashed border-brand-purple/20 rounded-2xl flex flex-col items-center justify-center text-center group cursor-help">
            <div className="text-brand-purple font-bold mb-1 group-hover:text-brand-pink transition-colors">+ Novas Semanalmente</div>
            <p className="text-xs text-gray-500">Estamos sempre adicionando novas ferramentas de ponta.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ToolsGrid;
