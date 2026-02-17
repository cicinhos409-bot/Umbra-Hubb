
import React, { useState } from 'react';
import { signInWithEmail } from '../services/authService';

interface LoginProps {
  onLoginSuccess: (email: string) => void;
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setErrorMessage('');

    // Autenticação real com Supabase
    const response = await signInWithEmail(email);

    if (response.success) {
      setIsLoading(false);
      setShowSuccess(true);
    } else {
      setIsLoading(false);
      setErrorMessage(response.message);
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
        ✓ Magic link enviado! Verifique seu email.
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
            <h1 className="card-title font-orbitron text-xl font-bold mb-2">Acessar Plataforma</h1>
            <p className="card-description text-sm text-gray-500 leading-relaxed">Entre com seu email para receber um link de acesso.</p>
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
                <>🚀 ENTRAR NA PLATAFORMA</>
              )}
            </button>
          </form>

          <div className="divider text-center my-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 -z-10" />
            <span className="divider-text bg-background-light px-4 text-xs text-gray-600 font-bold uppercase">ou</span>
          </div>

          <div className="footer-link text-center">
            <button
              onClick={onBack}
              className="text-brand-cyan hover:text-brand-purple text-xs font-bold transition-all flex items-center justify-center gap-2 mx-auto group"
            >
              Voltar para Home <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
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
