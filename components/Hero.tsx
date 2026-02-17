
import React from 'react';

interface HeroProps {
  onEnterDashboard: () => void;
}

const Hero: React.FC<HeroProps> = ({ onEnterDashboard }) => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-background-deep">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-grid -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-purple/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-cyan/5 blur-[100px] rounded-full -z-10" />
      
      <div className="max-w-5xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-purple/10 border border-brand-purple/30 px-3 py-1 rounded-full text-[10px] font-bold text-brand-purple mb-8 tracking-widest uppercase">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-purple opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-purple"></span>
          </span>
          MAIS DE 500 CRIADORES JÁ USAM
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-[1.1]">
          O Arsenal Definitivo <br />
          <span className="bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink bg-clip-text text-transparent">
            Para Canais Dark
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Mais de 20 ferramentas com IA para criar, automatizar e escalar seus canais Dark no YouTube — tudo em um só lugar.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={onEnterDashboard} className="w-full sm:w-auto bg-brand-purple hover:bg-brand-purple/90 text-white text-lg font-bold px-10 py-4 rounded-xl transition-all shadow-xl shadow-brand-purple/30 scale-100 active:scale-95">
            Dashboard
          </button>
          <button onClick={onEnterDashboard} className="w-full sm:w-auto bg-background-light border border-white/10 hover:border-white/20 text-white text-lg font-bold px-10 py-4 rounded-xl transition-all">
            Falar com Suporte
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 border-t border-white/5 pt-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">20+</div>
            <div className="text-sm text-gray-500 font-medium tracking-tight">Ferramentas IA</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">500+</div>
            <div className="text-sm text-gray-500 font-medium tracking-tight">Usuários Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1 text-brand-cyan">10k+</div>
            <div className="text-sm text-gray-500 font-medium tracking-tight">Vídeos Gerados</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1 leading-none tracking-tighter">R$19</div>
            <div className="text-sm text-gray-500 font-medium tracking-tight">A partir de</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
