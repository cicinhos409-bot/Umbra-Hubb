
import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface HeaderProps {
  onLoginClick: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick, isDark, onToggleTheme }) => {
  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 font-rajdhani">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between" style={{ height: 72 }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center font-black text-xl text-white shadow-sm">U</div>
          <span className="text-xl font-black tracking-tight text-gray-900">Umbra<span className="text-gray-400">Hub</span></span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-gray-500">
          <a href="#precos"     onClick={scrollTo('precos')}     className="hover:text-gray-900 transition-colors">Planos</a>
          <a href="#resultados" onClick={scrollTo('resultados')} className="hover:text-gray-900 transition-colors">Resultados</a>
          <a href="#ai-stories" onClick={scrollTo('ai-stories')} className="hover:text-gray-900 transition-colors">AI Stories</a>
          <a href="#faq"        onClick={scrollTo('faq')}        className="hover:text-gray-900 transition-colors">FAQ</a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            title={isDark ? 'Modo claro' : 'Modo escuro'}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-all"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onLoginClick}
            className="text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 px-4 py-2 transition-colors"
          >
            Login
          </button>

          <button
            onClick={scrollTo('precos')}
            className="bg-black hover:bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            Ver Planos
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
