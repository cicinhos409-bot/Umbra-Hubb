import React from 'react';
import { ToolTier } from '../types';
import {
  ExternalLink,
  Download,
  Twitter,
  Youtube,
  Instagram,
  Zap,
  Lock,
  FileText,
  MessageSquare
} from 'lucide-react';

interface BonusMaterialToolProps {
  userTier: ToolTier;
}

const BonusMaterialTool: React.FC<BonusMaterialToolProps> = ({ userTier }) => {
  const isLocked = userTier === ToolTier.FREE;

  const ActionButton = ({ href, label, type, icon: Icon }: { href: string; label: string; type: 'gpt' | 'docs' | 'gem' | 'dl'; icon: any }) => {
    if (isLocked) {
      return (
        <button
          onClick={() => {
            alert('🔒 CONTEÚDO EXCLUSIVO\n\nEste material é reservado para assinantes PRO ou TURBO.\n\nFaça upgrade no seu perfil para liberar o acesso agora!');
          }}
          className="w-full flex flex-col items-center justify-center gap-1 py-4 rounded-2xl bg-white/5 text-gray-500 font-bold text-[10px] uppercase tracking-[0.2em] border border-white/10 hover:bg-white/10 transition-all shadow-inner group"
        >
          <span className="flex items-center gap-2 text-gray-400 group-hover:text-white transition-colors">
            <Lock className="w-3 h-3" /> BLOQUEADO
          </span>
          <span className="text-brand-purple animate-pulse">Fazer Upgrade</span>
        </button>
      );
    }

    const colorClasses = {
      gpt: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20',
      docs: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
      gem: 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20',
      dl: 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20',
    };

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${colorClasses[type] || 'bg-white/10 text-white'}`}
      >
        <Icon className="w-4 h-4" /> {label}
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090f] text-white font-['Sora',sans-serif] pb-24 overflow-x-hidden relative">
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_70%_50%_at_10%_10%,_rgba(255,0,80,0.1)_0%,_transparent_55%),radial-gradient(ellipse_60%_45%_at_90%_90%,_rgba(180,0,255,0.1)_0%,_transparent_55%),radial-gradient(ellipse_50%_40%_at_50%_50%,_rgba(255,60,0,0.06)_0%,_transparent_60%)]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 relative z-10 animate-in fade-in duration-700">

        {/* HERO */}
        <header className="text-center mb-16">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> TikTok
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider text-red-400">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> YouTube
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold uppercase tracking-wider text-purple-400">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" /> Instagram
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight tracking-tight">
            Material <span className="bg-gradient-to-r from-[#ff2d55] via-[#bf5af2] to-[#ff375f] bg-[length:200%] bg-clip-text text-fill-transparent text-transparent animate-shimmer">Bônus</span>
            <br />para Criadores Faceless
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-lg mx-auto font-medium leading-relaxed">
            Ferramentas e recursos para criar conteúdo viral sem aparecer — com o poder da Inteligência Artificial.
          </p>
        </header>

        {/* SECTION: FERRAMENTAS DE IA */}
        <div className="flex items-center gap-4 mb-8">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap">Ferramentas de IA</span>
          <div className="h-px w-full bg-white/5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">

          {/* ChatGPT Card */}
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 hover:bg-white/[0.08] hover:border-white/20 transition-all group relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-blue-500/15 border border-blue-500/25 rounded-2xl flex items-center justify-center text-blue-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 group-hover:text-white transition-colors">
                <ExternalLink className="w-4 h-4" />
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-1">ChatGPT — Agentes</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">OpenAI • Roteiros & Ganchos</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-6">
              <span className="text-[9px] font-bold bg-white/5 border border-white/10 text-gray-400 px-2 py-1 rounded-full uppercase tracking-tight">✦ Roteiros virais</span>
              <span className="text-[9px] font-bold bg-white/5 border border-white/10 text-gray-400 px-2 py-1 rounded-full uppercase tracking-tight">✦ Alto CTR</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-8">
              Crie roteiros virais e títulos magnéticos com agentes personalizados para seu nicho.
            </p>
            <ActionButton href="https://chatgpt.com" label="Acessar ChatGPT" type="gpt" icon={MessageSquare} />
          </div>

          {/* Gemini Card */}
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 hover:bg-white/[0.08] hover:border-white/20 transition-all group relative overflow-hidden group">
            <div className="absolute inset-0 bg-purple-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-purple-500/15 border border-purple-500/25 rounded-2xl flex items-center justify-center text-purple-400">
                <Zap className="w-6 h-6" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 group-hover:text-white transition-colors">
                <ExternalLink className="w-4 h-4" />
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-1">Gemini — Agentes</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Google • Tendências IA</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-6">
              <span className="text-[9px] font-bold bg-white/5 border border-white/10 text-gray-400 px-2 py-1 rounded-full uppercase tracking-tight">YouTube</span>
              <span className="text-[9px] font-bold bg-white/5 border border-white/10 text-gray-400 px-2 py-1 rounded-full uppercase tracking-tight">TikTok</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-8">
              Pesquise tendências e gere ideias de vídeos automatizados com os agentes do Gemini.
            </p>
            <ActionButton href="https://gemini.google.com" label="Acessar Gemini" type="gem" icon={Zap} />
          </div>

          {/* Docs Card */}
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 hover:bg-white/[0.08] hover:border-white/20 transition-all group relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/[0.05] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-emerald-500/15 border border-emerald-500/25 rounded-2xl flex items-center justify-center text-emerald-400">
                <FileText className="w-6 h-6" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 group-hover:text-white transition-colors">
                <ExternalLink className="w-4 h-4" />
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-1">Documentos do Curso</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Templates & Checklists</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-6">
              <span className="text-[9px] font-bold bg-white/5 border border-white/10 text-gray-400 px-2 py-1 rounded-full uppercase tracking-tight">Templates</span>
              <span className="text-[9px] font-bold bg-white/5 border border-white/10 text-gray-400 px-2 py-1 rounded-full uppercase tracking-tight">Aulas</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-8">
              Templates de roteiro e checklists de postagem em um só lugar.
            </p>
            <ActionButton href="https://docs.google.com" label="Abrir Documentos" type="docs" icon={FileText} />
          </div>

        </div>

        {/* SECTION: DOWNLOAD */}
        <div className="flex items-center gap-4 mb-8">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] whitespace-nowrap">Download Exclusivo</span>
          <div className="h-px w-full bg-white/5" />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-orange-500/[0.03] pointer-events-none" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-orange-500/15 border border-orange-500/25 rounded-3xl flex items-center justify-center text-orange-400 shadow-xl shadow-orange-500/5">
                <Download className="w-8 h-8" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-black text-white mb-1">Baixar Material TST</h3>
                <p className="text-sm text-gray-500 font-medium mb-3">Pack completo • TikTok, YouTube & Instagram Faceless</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-bold text-gray-400 border border-white/10 uppercase tracking-tight">TikTok</span>
                  <span className="px-3 py-1 rounded-full bg-red-500/10 text-[9px] font-bold text-red-400 border border-red-500/20 uppercase tracking-tight">YouTube</span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <ActionButton href="#" label="Baixar Agora" type="dl" icon={Download} />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-20 text-center text-gray-600 text-xs font-bold leading-loose uppercase tracking-widest">
          <p className="text-gray-500 mb-1">Material Bônus — Criadores Faceless</p>
          <p>TikTok • YouTube • Instagram • Powered by IA</p>
        </footer>

      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animate-shimmer {
          animation: shimmer 5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default BonusMaterialTool;
