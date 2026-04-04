import React, { useState } from 'react';
import { Package, Download, Chrome, Lock, Zap } from 'lucide-react';
import { ToolTier } from '../types';

interface ExtensionsDownloadToolProps {
  userTier: ToolTier;
}

const ExtensionsDownloadTool: React.FC<ExtensionsDownloadToolProps> = ({ userTier }) => {
  const isLocked = userTier === ToolTier.FREE;

  const DownloadButton = ({ href, fileName, isFree = false }: { href: string; fileName: string; isFree?: boolean }) => {
    if (isLocked && !isFree) {
      return (
        <button
          onClick={() => {
            alert('🔒 ESSA EXTENSÃO É EXCLUSIVA\n\nEsta ferramenta é reservada para assinantes PRO ou TURBO.\n\nFaça upgrade no seu perfil para liberar o download agora!');
          }}
          className="download-btn w-full inline-flex flex-col items-center justify-center gap-1 py-4 rounded-2xl bg-white/5 text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] cursor-pointer border border-white/10 hover:bg-white/10 transition-all shadow-inner"
        >
          <span className="text-lg">🔒 BLOQUEADO</span>
          <span className="text-brand-purple animate-pulse">Fazer Upgrade</span>
        </button>
      );
    }

    return (
      <a
        href={href}
        download={fileName}
        className="download-btn w-full inline-flex items-center justify-center gap-3 py-4 rounded-2xl text-background-deep font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-cyan/20 relative overflow-hidden"
      >
        <Download className="w-4 h-4" /> Baixar extensão
      </a>
    );
  };

  return (
    <div className="min-h-screen font-jetbrains text-white pb-24 relative flex flex-col items-center">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --cyan: #00f5ff;
          --purple: #a855f7;
          --pink: #ec4899;
          --green: #10b981;
          --orange: #ff4d2d;
        }

        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        .font-jetbrains { font-family: 'JetBrains Mono', monospace; }

        .bg-shift::before {
          content: '';
          position: fixed;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 30% 50%, rgba(168, 85, 247, 0.05) 0%, transparent 50%),
                      radial-gradient(circle at 70% 80%, rgba(0, 245, 255, 0.05) 0%, transparent 50%),
                      radial-gradient(circle at 50% 20%, rgba(236, 72, 153, 0.05) 0%, transparent 50%);
          animation: backgroundShift 20s ease-in-out infinite;
          z-index: 0;
          pointer-events: none;
        }

        @keyframes backgroundShift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(5%, 5%) rotate(5deg); }
        }

        .glow-text {
          background: linear-gradient(135deg, var(--cyan) 0%, var(--purple) 50%, var(--pink) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glow-line::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--cyan), transparent);
          animation: glowPulse 2s ease-in-out infinite;
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; box-shadow: 0 0 10px var(--cyan); }
          50% { opacity: 1; box-shadow: 0 0 20px var(--cyan); }
        }

        .extension-card {
          background: linear-gradient(135deg, rgba(18, 18, 31, 0.8) 0%, rgba(10, 10, 18, 0.6) 100%);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .extension-card:hover {
          transform: translateY(-8px);
          border-color: var(--cyan);
          box-shadow: 0 20px 60px rgba(0, 245, 255, 0.2), 0 0 40px rgba(168, 85, 247, 0.1);
        }

        .download-btn {
          background: linear-gradient(135deg, var(--cyan) 0%, var(--purple) 100%);
          transition: all 0.3s ease;
        }

        .download-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s ease;
        }

        .download-btn:hover::before {
          left: 100%;
        }

        .decorative-grid {
          background-image: linear-gradient(rgba(0, 245, 255, 0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0, 245, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        .scroll-indicator::before {
          content: '';
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 8px;
          background: var(--cyan);
          border-radius: 2px;
          animation: scrollDot 2s infinite;
        }

        @keyframes scrollDot {
          0%, 100% { top: 8px; opacity: 1; }
          50% { top: 24px; opacity: 0; }
        }
      `}</style>

      <div className="decorative-grid fixed inset-0 pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10 w-full animate-in fade-in duration-700">
        <header className="text-center mb-20">
          <h1 className="font-orbitron text-5xl md:text-7xl font-black mb-4 glow-text leading-tight glow-line relative inline-block uppercase tracking-tighter">
            Downloads Extensões
          </h1>
        </header>

        <main>
          <div className="flex items-center gap-4 mb-12">
            <span className="p-3 bg-brand-cyan/10 rounded-2xl border border-brand-cyan/20">
              <Chrome className="w-8 h-8 text-brand-cyan" />
            </span>
            <h2 className="font-orbitron text-2xl md:text-3xl font-bold text-brand-cyan uppercase tracking-tight">
              Extensões Chrome
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Extension 1 - Renamed from Dispatch Pro */}
            <article className="extension-card border border-white/5 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-green bg-brand-green/10 border border-brand-green/20 px-3 py-1.5 rounded-lg mb-4 inline-block">
                  Vídeo • Automação
                </span>
                <h3 className="font-orbitron text-2xl font-black text-white group-hover:text-brand-cyan transition-colors">Umbra Flow</h3>
                <span className="text-[10px] font-mono text-brand-purple bg-brand-purple/10 border border-brand-purple/10 px-2.5 py-1 rounded-md mt-2 inline-block">v1.2.0</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                Consistência total e automação avançada de prompts. Gere séries de imagens e vídeos com controle absoluto de personagens e estilos.
              </p>
              <DownloadButton href="/extensoes/umbra-flow.zip" fileName="umbra-flow.zip" />
            </article>

            {/* Extension 3 */}
            <article className="extension-card border border-white/5 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-green bg-brand-green/10 border border-brand-green/20 px-3 py-1.5 rounded-lg mb-4 inline-block">
                  Vídeo • Download
                </span>
                <h3 className="font-orbitron text-2xl font-black text-white group-hover:text-brand-cyan transition-colors">Umbra Vision</h3>
                <span className="text-[10px] font-mono text-brand-purple bg-brand-purple/10 border border-brand-purple/10 px-2.5 py-1 rounded-md mt-2 inline-block">v4.0.0</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                Automatize a geração e o download em massa de imagens com Meta.ai e Google Whisk. Dispare centenas de prompts no piloto automático.
              </p>
              <DownloadButton href="/extensoes/umbra-vision.zip" fileName="umbra-vision.zip" />
            </article>

            {/* Extension 4 */}
            <article className="extension-card border border-white/5 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-green bg-brand-green/10 border border-brand-green/20 px-3 py-1.5 rounded-lg mb-4 inline-block">
                  TikTok • Download
                </span>
                <h3 className="font-orbitron text-2xl font-black text-white group-hover:text-brand-cyan transition-colors">Umbra TikTok Downloader</h3>
                <span className="text-[10px] font-mono text-brand-purple bg-brand-purple/10 border border-brand-purple/10 px-2.5 py-1 rounded-md mt-2 inline-block">v2.0.2</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                Baixe vídeos do TikTok sem marca d'água com painel flutuante
              </p>
              <DownloadButton href="/extensoes/umbra-tiktok.zip" fileName="umbra-tiktok.zip" />
            </article>

            {/* Extension 5 */}
            <article className="extension-card border border-white/5 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-green bg-brand-green/10 border border-brand-green/20 px-3 py-1.5 rounded-lg mb-4 inline-block">
                  Video • Recording
                </span>
                <h3 className="font-orbitron text-2xl font-black text-white group-hover:text-brand-cyan transition-colors">Umbra Screen Recorder</h3>
                <span className="text-[10px] font-mono text-brand-purple bg-brand-purple/10 border border-brand-purple/10 px-2.5 py-1 rounded-md mt-2 inline-block">v1.0.0</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                Grave vídeos da tela com painel flutuante arrastável. Powered by Tab Capture API.
              </p>
              <DownloadButton href="/extensoes/umbra-screen-recorder.zip" fileName="umbra-screen-recorder.zip" />
            </article>

            {/* Extension 6 - NEW */}
            <article className="extension-card border border-white/5 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 px-3 py-1.5 rounded-lg mb-4 inline-block">
                  Utility • Screenshot
                </span>
                <h3 className="font-orbitron text-2xl font-black text-white group-hover:text-brand-cyan transition-colors">Umbra Printei</h3>
                <span className="text-[10px] font-mono text-brand-purple bg-brand-purple/10 border border-brand-purple/10 px-2.5 py-1 rounded-md mt-2 inline-block">v1.0.0</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                Capture screenshots de qualquer página, vídeo do YouTube, TikTok, Instagram e muito mais com alta precisão.
              </p>
              <DownloadButton href="/extensoes/umbra-printei.zip" fileName="umbra-printei.zip" />
            </article>

            {/* Extension 7 - NEW */}
            <article className="extension-card border border-white/5 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-pink bg-brand-pink/10 border border-brand-pink/20 px-3 py-1.5 rounded-lg mb-4 inline-block">
                  AI • Prompting
                </span>
                <h3 className="font-orbitron text-2xl font-black text-white group-hover:text-brand-cyan transition-colors">Umbra Piclumen Prompter</h3>
                <span className="text-[10px] font-mono text-brand-purple bg-brand-purple/10 border border-brand-purple/10 px-2.5 py-1 rounded-md mt-2 inline-block">v1.0.0</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                Auto Prompt sender for Piclumen — dark, powerful, and precise automation for your AI image workflow.
              </p>
              <DownloadButton href="/extensoes/umbra-piclumen-prompter.zip" fileName="umbra-piclumen-prompter.zip" />
            </article>

            {/* Extension 8 - NEW */}
            <article className="extension-card border border-white/5 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-purple bg-brand-purple/10 border border-brand-purple/20 px-3 py-1.5 rounded-lg mb-4 inline-block">
                  Web • Download
                </span>
                <h3 className="font-orbitron text-2xl font-black text-white group-hover:text-brand-cyan transition-colors">Umbra Image Download</h3>
                <span className="text-[10px] font-mono text-brand-purple bg-brand-purple/10 border border-brand-purple/10 px-2.5 py-1 rounded-md mt-2 inline-block">v2.6.0</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                Baixe todas as imagens de qualquer página da web instantaneamente. Ferramenta essencial para curadoria de mídia.
              </p>
              <DownloadButton href="/extensoes/Umbra-Image-Download.zip" fileName="Umbra-Image-Download.zip" />
            </article>

            {/* Extension 9 - NEW */}
            <article className="extension-card border border-white/5 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg mb-4 inline-block">
                  Tools • Focus
                </span>
                <h3 className="font-orbitron text-2xl font-black text-white group-hover:text-brand-cyan transition-colors">Umbra - Bloqueador YT</h3>
                <span className="text-[10px] font-mono text-brand-purple bg-brand-purple/10 border border-brand-purple/10 px-2.5 py-1 rounded-md mt-2 inline-block">v5.1.0</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                Oculta e censura distrações do YouTube e YouTube Studio para manter seu foco total na produção de conteúdo.
              </p>
              <DownloadButton href="/extensoes/Umbra - Bloqueador YouTube Studio.zip" fileName="Umbra - Bloqueador YouTube Studio.zip" />
            </article>

            {/* Extension 10 - NEW */}
            <article className="extension-card border border-white/5 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-purple bg-brand-purple/10 border border-brand-purple/20 px-3 py-1.5 rounded-lg mb-4 inline-block">
                  AI • Automation
                </span>
                <h3 className="font-orbitron text-2xl font-black text-white group-hover:text-brand-cyan transition-colors">Umbra Chat Automation</h3>
                <span className="text-[10px] font-mono text-brand-purple bg-brand-purple/10 border border-brand-purple/10 px-2.5 py-1 rounded-md mt-2 inline-block">v1.0.0</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                Automatize prompts do ChatGPT com cadeias de prompts e filas para interações eficientes que economizam tempo.
              </p>
              <DownloadButton href="/extensoes/umbra-chat-automation.zip" fileName="umbra-chat-automation.zip" />
            </article>

            {/* Extension 11 - NEW */}
            <article className="extension-card border border-white/5 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-purple bg-brand-purple/10 border border-brand-purple/20 px-3 py-1.5 rounded-lg mb-4 inline-block">
                  AI • Automation
                </span>
                <h3 className="font-orbitron text-2xl font-black text-white group-hover:text-brand-cyan transition-colors">Umbra Claude Automation</h3>
                <span className="text-[10px] font-mono text-brand-purple bg-brand-purple/10 border border-brand-purple/10 px-2.5 py-1 rounded-md mt-2 inline-block">v1.0.0</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                Automatize prompts do Claude com cadeias de prompts e filas para interações eficientes que economizam tempo.
              </p>
              <DownloadButton href="/extensoes/umbra-claude-extension.zip" fileName="umbra-claude-extension.zip" />
            </article>

            {/* Extension 12 - ShopeeSave (FREE) */}
            <article className="extension-card border border-white/5 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg mb-4 inline-block">
                  Shopee • Download
                </span>
                <h3 className="font-orbitron text-2xl font-black text-white group-hover:text-brand-cyan transition-colors">Umbra ShopeeSave</h3>
                <span className="text-[10px] font-mono text-brand-purple bg-brand-purple/10 border border-brand-purple/10 px-2.5 py-1 rounded-md mt-2 inline-block">v4.1.0</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                Baixe imagens e vídeos de produtos da Shopee com o Umbra ShopeeSave.
              </p>
              <DownloadButton href="/extensoes/Umbrashopeesave.zip" fileName="Umbrashopeesave.zip" isFree={true} />
            </article>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExtensionsDownloadTool;
