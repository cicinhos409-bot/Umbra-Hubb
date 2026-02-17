
import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail, signInWithPassword, signInWithGoogle } from '../services/authService';

interface LoginProps {
  onLoginSuccess: (email: string) => void;
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');

    const response = await signInWithGoogle();

    if (!response.success) {
      setIsLoading(false);
      setErrorMessage(response.message);
    }
    // Se sucesso, o usuário será redirecionado para o Google
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Modo cadastro
    if (isSignUp) {
      // Validação de senha
      if (!useMagicLink) {
        if (password.length < 6) {
          setIsLoading(false);
          setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
          return;
        }
        if (password !== confirmPassword) {
          setIsLoading(false);
          setErrorMessage('As senhas não coincidem.');
          return;
        }
      }

      const response = useMagicLink
        ? await signInWithEmail(email)
        : await signUpWithEmail(email, password);

      if (response.success) {
        setIsLoading(false);
        setSuccessMessage(response.message);
        setShowSuccess(true);

        // Se o usuário foi criado e logado automaticamente
        if (response.user && !useMagicLink) {
          setTimeout(() => {
            onLoginSuccess(email);
          }, 2000);
        }
      } else {
        setIsLoading(false);
        setErrorMessage(response.message);
      }
    }
    // Modo login
    else {
      const response = useMagicLink
        ? await signInWithEmail(email)
        : await signInWithPassword(email, password);

      if (response.success) {
        setIsLoading(false);
        setSuccessMessage(response.message);
        setShowSuccess(true);

        // Se login com senha foi bem sucedido, redirecionar
        if (response.user && !useMagicLink) {
          setTimeout(() => {
            onLoginSuccess(email);
          }, 1500);
        }
      } else {
        setIsLoading(false);
        setErrorMessage(response.message);
      }
    }
  };

  return (
    <div className="login-page min-h-screen flex items-center justify-center relative overflow-hidden font-space text-white bg-background-deep">
      {/* Animated orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {/* Success message popup */}
      <div className={`success-message ${showSuccess ? 'show' : ''}`}>
        ✓ {successMessage}
      </div>

      {/* Error message popup */}
      {errorMessage && (
        <div className="error-message show">
          ✗ {errorMessage}
        </div>
      )}

      <div className="container-login relative z-10 w-[90%] max-w-[480px] animate-in slide-in-from-bottom-8 duration-700">
        {/* Logo section */}
        <div className="logo-section text-center mb-12">
          <div className="logo-wrapper inline-block relative mb-4">
            <div className="logo-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] bg-brand-cyan/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="logo font-orbitron text-5xl font-black tracking-widest bg-gradient-to-br from-brand-cyan to-brand-purple bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(0,245,255,0.4)]">
              UMBRA
            </div>
          </div>
          <div className="tagline text-xs text-brand-cyan tracking-[0.3em] font-black uppercase opacity-90 mb-2">HUB</div>
          <div className="subtitle text-sm text-gray-500 font-medium leading-relaxed">Plataforma de Ferramentas para Canais Dark</div>
        </div>

        {/* Login card */}
        <div className="card-login bg-background-light/40 border border-white/10 rounded-[32px] p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Animated scan line at the top */}
          <div className="scan-line absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-cyan to-transparent animate-scan"></div>

          <div className="card-header mb-8">
            <h1 className="card-title font-orbitron text-xl font-bold mb-2">
              {isSignUp ? 'Criar Conta' : 'Acessar Plataforma'}
            </h1>
            <p className="card-description text-sm text-gray-500 leading-relaxed">
              {isSignUp
                ? 'Crie sua conta para acessar todas as ferramentas.'
                : 'Entre com suas credenciais ou use o Google.'}
            </p>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 font-bold py-4 px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 mb-6 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="font-bold text-sm">Continuar com Google</span>
          </button>

          <div className="divider text-center my-6 relative">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -z-10" />
            <span className="divider-text bg-background-light px-4 text-xs text-gray-600 font-bold uppercase">ou</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label htmlFor="email" className="block text-[10px] font-black text-brand-cyan uppercase tracking-widest mb-3">SEU EMAIL</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-background-deep/60 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-brand-cyan outline-none transition-all shadow-inner placeholder:text-gray-700"
              />
            </div>

            {/* Mostrar senha apenas se não estiver usando magic link */}
            {!useMagicLink && (
              <>
                <div className="form-group">
                  <label htmlFor="password" className="block text-[10px] font-black text-brand-cyan uppercase tracking-widest mb-3">SENHA</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-background-deep/60 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-brand-cyan outline-none transition-all shadow-inner placeholder:text-gray-700"
                  />
                </div>

                {isSignUp && (
                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="block text-[10px] font-black text-brand-cyan uppercase tracking-widest mb-3">CONFIRMAR SENHA</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full bg-background-deep/60 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-brand-cyan outline-none transition-all shadow-inner placeholder:text-gray-700"
                    />
                  </div>
                )}
              </>
            )}

            {/* Magic Link Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="magicLink"
                checked={useMagicLink}
                onChange={(e) => setUseMagicLink(e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-background-deep/60 text-brand-cyan focus:ring-brand-cyan"
              />
              <label htmlFor="magicLink" className="text-xs text-gray-400 cursor-pointer">
                Usar magic link (sem senha)
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`btn-login w-full py-5 rounded-2xl font-orbitron text-xs font-black tracking-[0.2em] uppercase transition-all shadow-2xl shadow-brand-cyan/20 flex items-center justify-center gap-3 relative overflow-hidden
                ${isLoading ? 'opacity-70 pointer-events-none' : 'bg-gradient-to-br from-brand-cyan to-brand-purple text-background-deep hover:scale-[1.02] active:scale-95'}
              `}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-background-deep/30 border-t-background-deep rounded-full animate-spin" />
              ) : (
                <>{isSignUp ? '🚀 CRIAR CONTA' : '🚀 ENTRAR NA PLATAFORMA'}</>
              )}
            </button>
          </form>

          <div className="divider text-center my-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -z-10" />
          </div>

          <div className="footer-links text-center space-y-4">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage('');
                setSuccessMessage('');
                setShowSuccess(false);
              }}
              className="text-brand-cyan hover:text-brand-purple text-xs font-bold transition-all"
            >
              {isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem conta? Criar agora'}
            </button>

            <div>
              <button
                onClick={onBack}
                className="text-gray-500 hover:text-brand-cyan text-xs font-bold transition-all flex items-center justify-center gap-2 mx-auto group"
              >
                Voltar para Home <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .login-page::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
              linear-gradient(90deg, rgba(0, 245, 255, 0.03) 1px, transparent 1px),
              linear-gradient(rgba(168, 85, 247, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridScroll 20s linear infinite;
          pointer-events: none;
        }

        @keyframes gridScroll {
          from { transform: translate(0, 0); }
          to { transform: translate(50px, 50px); }
        }

        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.2;
          pointer-events: none;
          animation: floatOrb 20s ease-in-out infinite;
        }

        .orb-1 { width: 400px; height: 400px; background: #00f5ff; top: -200px; left: -200px; animation-delay: 0s; }
        .orb-2 { width: 500px; height: 500px; background: #a855f7; bottom: -250px; right: -250px; animation-delay: -10s; }
        .orb-3 { width: 300px; height: 300px; background: #ec4899; top: 50%; right: -150px; animation-delay: -5s; }

        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 30px) scale(0.9); }
        }

        .success-message, .error-message {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 1rem 2rem;
          border-radius: 16px;
          font-weight: 800;
          font-size: 0.875rem;
          text-transform: uppercase;
          transform: translateX(400px);
          transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 1000;
        }

        .success-message {
          background: #10b981;
          color: #030308;
          box-shadow: 0 10px 40px rgba(16, 185, 129, 0.3);
        }

        .error-message {
          background: #ef4444;
          color: #ffffff;
          box-shadow: 0 10px 40px rgba(239, 68, 68, 0.3);
        }

        .success-message.show, .error-message.show { transform: translateX(0); }

        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-scan { animation: scan 3s linear infinite; }
      `}</style>
    </div>
  );
};

const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);

export default Login;
