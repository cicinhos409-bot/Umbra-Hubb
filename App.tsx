
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ToolsGrid from './components/ToolsGrid';
import Pricing from './components/Pricing';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { TESTIMONIALS } from './constants';
import { Star } from 'lucide-react';
import { onAuthStateChange, signOut, getUserProfile } from './services/authService';
import { ToolTier } from './types';
import type { User } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [view, setView] = useState<'landing' | 'login' | 'dashboard'>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [userTier, setUserTier] = useState<ToolTier>(ToolTier.FREE);
  const [isLoading, setIsLoading] = useState(true);

  // Listener para mudanças no estado de autenticação
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Buscar perfil do usuário para obter o tier
        const profile = await getUserProfile(currentUser.id);
        if (profile) {
          setUserTier(profile.tier);
        }
        setView('dashboard');
      } else {
        setView('landing');
        setUserTier(ToolTier.FREE);
      }
      setIsLoading(false);
    });

    // Cleanup: cancela a inscrição quando o componente é desmontado
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const goToLogin = () => setView('login');
  const goToLanding = () => setView('landing');

  const handleLoginSuccess = (email: string) => {
    // O onAuthStateChange já vai lidar com a mudança de view quando o usuário for autenticado
    // Esta função é mantida para compatibilidade, mas não é mais necessária
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setView('landing');
  };

  // Tela de carregamento enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-deep flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-bold">Carregando...</p>
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} onBack={goToLanding} />;
  }

  if (view === 'dashboard' && user) {
    return <Dashboard userName={user.email?.split('@')[0] || 'Criador'} userTier={userTier} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-background-deep font-rajdhani">
      <Header onLoginClick={goToLogin} />

      <main>
        <Hero onEnterDashboard={goToLogin} />

        {/* Why Umbra Hub Section */}
        <section className="py-24 border-t border-white/5 bg-background-mid/50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">Por que Umbra Hub?</h2>
              <p className="text-gray-400 text-lg font-medium">Tudo que você precisa para crescer rápido</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-10 bg-background-light border border-white/5 rounded-[40px] hover:border-brand-cyan/30 transition-all group shadow-xl">
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">🎬</div>
                <h3 className="text-2xl font-black mb-3 uppercase tracking-tight text-white group-hover:text-brand-cyan transition-colors">Produção Completa</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-medium">Scripts, vozes, thumbnails e prompts de vídeo — produza um canal completo com IA sem aparecer.</p>
              </div>
              <div className="p-10 bg-background-light border border-white/5 rounded-[40px] hover:border-brand-purple/30 transition-all group shadow-xl">
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">⚡</div>
                <h3 className="text-2xl font-black mb-3 uppercase tracking-tight text-white group-hover:text-brand-purple transition-colors">Escala em Lote</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-medium">Traduza, processe e gere dezenas de vídeos de uma vez. Multiplique sua produtividade.</p>
              </div>
              <div className="p-10 bg-background-light border border-white/5 rounded-[40px] hover:border-brand-pink/30 transition-all group shadow-xl">
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">📊</div>
                <h3 className="text-2xl font-black mb-3 uppercase tracking-tight text-white group-hover:text-brand-pink transition-colors">Análise Viral</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-medium">Descubra o que está viralizando, faça engenharia reversa e replique o sucesso dos maiores.</p>
              </div>
            </div>
          </div>
        </section>

        <ToolsGrid />

        <Pricing userEmail={user?.email || undefined} />

        {/* Testimonials */}
        <section className="py-24 bg-background-mid/30" id="depoimentos">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Quem usa, recomenda</h2>
              <p className="text-gray-400 text-lg font-medium">Mais de 500 criadores escalando seus negócios.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="p-10 bg-background-light border border-white/5 rounded-[40px] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/5 blur-3xl" />
                  <div className="flex gap-1 mb-8">
                    {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-5 h-5 text-brand-cyan fill-brand-cyan" />)}
                  </div>
                  <p className="text-gray-300 italic mb-10 text-lg leading-relaxed">"{t.content}"</p>
                  <div className="flex items-center gap-5 pt-6 border-t border-white/5">
                    <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-2xl border-2 border-brand-purple shadow-lg" />
                    <div>
                      <div className="font-black text-white uppercase tracking-tight">{t.name}</div>
                      <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <div className="bg-gradient-to-br from-brand-purple to-brand-pink p-16 md:p-24 rounded-[64px] shadow-2xl shadow-brand-purple/20 border border-white/10">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 uppercase tracking-tighter leading-none">Comece hoje.<br />Seu canal cresce amanhã.</h2>
              <p className="text-white/80 text-xl mb-12 max-w-xl mx-auto font-medium">Junte-se a centenas de criadores que já automatizaram sua produção com IA e estão faturando alto com canais dark.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={goToLogin} className="bg-white text-background-deep font-black px-12 py-5 rounded-[24px] hover:bg-gray-100 transition-all scale-100 active:scale-95 shadow-2xl text-xs tracking-[0.2em] uppercase">
                  QUERO ACESSO AGORA
                </button>
                <button onClick={goToLogin} className="bg-black/20 backdrop-blur-md border border-white/30 text-white font-black px-12 py-5 rounded-[24px] hover:bg-black/30 transition-all text-xs tracking-[0.2em] uppercase">
                  Ver Demonstração
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-white/5 bg-background-deep">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-12 text-sm text-gray-500 font-bold uppercase tracking-widest">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-purple rounded-xl flex items-center justify-center font-black text-white shadow-lg">U</div>
            <span className="text-xl font-black text-white tracking-tighter">Umbra<span className="text-brand-cyan">Hub</span></span>
          </div>
          <p className="text-[10px]">© 2025 Umbra Hub · Todos os direitos reservados</p>
          <div className="flex gap-8 text-[10px]">
            <a href="#" className="hover:text-white transition-colors">Termos</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
            <a href="#" className="hover:text-white transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
