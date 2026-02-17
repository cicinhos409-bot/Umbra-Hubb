
import React from 'react';

interface HeaderProps {
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  const scrollToPricing = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('precos');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTestimonials = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('depoimentos');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background-deep/80 backdrop-blur-md border-b border-white/5 font-rajdhani">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 bg-brand-purple rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-brand-purple/20">U</div>
          <span className="text-xl font-extrabold tracking-tight">Umbra<span className="text-brand-cyan">Hub</span></span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-gray-500">
          <a href="#precos" onClick={scrollToPricing} className="hover:text-white transition-colors">Planos</a>
          <a href="#depoimentos" onClick={scrollToTestimonials} className="hover:text-white transition-colors">Depoimentos</a>
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={onLoginClick} className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-brand-cyan px-4 py-2 transition-all">Login</button>
          <button onClick={scrollToPricing} className="bg-brand-purple hover:bg-brand-purple/90 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-full transition-all shadow-lg shadow-brand-purple/25 active:scale-95">
            VER PLANOS
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
