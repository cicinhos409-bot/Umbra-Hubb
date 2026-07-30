import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ToolsGrid from './components/ToolsGrid';
import Pricing from './components/Pricing';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import UmbraStories from './components/UmbraStories';
import BeforeAfter from './components/BeforeAfter';
import WhyUmbra from './components/WhyUmbra';
import ResultsMarquee from './components/ResultsMarquee';
import FAQ from './components/FAQ';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import { supabase, onAuthStateChange, signOut, getUserProfile } from './services/authService';
import { identifyUser, resetUser, trackSignIn, trackSignOut } from './services/analytics';
import { setSentryUser, clearSentryUser } from './services/errorTracking';
import { ToolTier } from './types';
import type { User } from '@supabase/supabase-js';

// Máximo de tentativas de polling antes de desistir (evita loop infinito)
const POLL_MAX_ATTEMPTS = 30; // 30 × 2s = 1 minuto
const POLL_INTERVAL_MS  = 2000;

const App: React.FC = () => {
  const [view, setView]       = useState<'landing' | 'login' | 'dashboard' | 'terms' | 'privacy'>('landing');
  const [user, setUser]       = useState<User | null>(null);
  const [userTier, setUserTier] = useState<ToolTier>(ToolTier.FREE);
  const [isLoading, setIsLoading] = useState(true);

  // Theme: shared with Dashboard via localStorage
  const [isDark, setIsDark] = useState<boolean>(() => localStorage.getItem('umbra_theme') === 'dark');
  const toggleTheme = () => setIsDark(prev => !prev);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('umbra_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('umbra_theme', 'light');
    }
  }, [isDark]);

  // Polling para callback OAuth via servidor local (Electron / fallback)
  // Para quando o redirect do Supabase não dispara o listener normalmente.
  useEffect(() => {
    if (view !== 'login' && view !== 'landing') return;

    let attempts = 0;
    let intervalId: ReturnType<typeof setInterval>;

    const pollAuth = async () => {
      if (attempts >= POLL_MAX_ATTEMPTS) {
        clearInterval(intervalId);
        return;
      }
      attempts++;

      try {
        const response = await fetch('http://localhost:3001/api/poll-auth', { signal: AbortSignal.timeout(1500) });
        if (!response.ok) return;
        const data = await response.json();

        if (data.session) {
          clearInterval(intervalId);
          const params    = new URLSearchParams(data.session);
          const accessToken  = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const code         = params.get('code');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          } else if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          }
          // onAuthStateChange vai redirecionar para dashboard automaticamente
        }
      } catch {
        // Servidor local não disponível — silencioso
      }
    };

    intervalId = setInterval(pollAuth, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [view]);

  // Listener principal de autenticação Supabase
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const profile = await getUserProfile(currentUser.id);
        const tier = profile?.tier as ToolTier ?? ToolTier.FREE;
        if (profile) setUserTier(tier);
        // Analytics + Error tracking: identifica o usuário
        identifyUser(currentUser.id, {
          email:     currentUser.email ?? '',
          tier,
          createdAt: currentUser.created_at,
        });
        setSentryUser(currentUser.id, currentUser.email ?? '', tier);
        trackSignIn(tier);
        setView('dashboard');
      } else {
        resetUser();
        clearSentryUser();
        setView('landing');
        setUserTier(ToolTier.FREE);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = useCallback(async () => {
    trackSignOut();
    resetUser();
    clearSentryUser();
    await signOut();
    setUser(null);
    setView('landing');
  }, []);

  const handleUpgradeClick = useCallback(() => {
    setView('landing');
    setTimeout(() => {
      document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto" />
          <p className="text-gray-900 font-black text-sm uppercase tracking-widest">Carregando...</p>
        </div>
      </div>
    );
  }

  if (view === 'terms')   return <TermsPage   onBack={() => setView('landing')} />;
  if (view === 'privacy') return <PrivacyPage onBack={() => setView('landing')} />;

  if (view === 'login') {
    return <Login onLoginSuccess={() => {}} onBack={() => setView('landing')} />;
  }

  if (view === 'dashboard' && user) {
    return (
      <Dashboard
        userName={user.email?.split('@')[0] || 'Criador'}
        userTier={userTier}
        userEmail={user.email || ''}
        userCreatedAt={user.created_at || ''}
        onLogout={handleLogout}
        onUpgradeClick={handleUpgradeClick}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white font-rajdhani">
      <Header onLoginClick={() => setView('login')} isDark={isDark} onToggleTheme={toggleTheme} />
      <main>
        <Hero onEnterDashboard={() => setView('login')} />
        <WhyUmbra />
        <UmbraStories />
        <BeforeAfter />
        <ToolsGrid />
        <ResultsMarquee />
        <div id="pricing-section">
          <Pricing userEmail={user?.email ?? undefined} />
        </div>
        <FAQ />
      </main>
      <footer className="py-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center font-black text-white text-xl">U</div>
            <span className="text-xl font-black text-gray-900 tracking-tight">Umbra<span className="text-gray-400">Hub</span></span>
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">© 2025 Umbra Hub · Todos os direitos reservados</p>
          <div className="flex gap-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <button onClick={() => setView('terms')}   className="hover:text-gray-900 transition-colors">Termos</button>
            <button onClick={() => setView('privacy')} className="hover:text-gray-900 transition-colors">Privacidade</button>
            <a href="https://wa.me/seu-numero" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
