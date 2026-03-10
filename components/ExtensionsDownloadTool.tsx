
import React from 'react';
import { Package, Download, Chrome } from 'lucide-react';

const ExtensionsDownloadTool: React.FC = () => {
  return (
    <div className="min-h-screen font-jetbrains text-white pb-24 relative overflow-hidden flex flex-col items-center">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --cyan: #00f5ff;
          --purple: #a855f7;
          --pink: #ec4899;
          --green: #10b981;
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
            {/* Extension 1 */}
            <article className="extension-card border border-white/5 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-green bg-brand-green/10 border border-brand-green/20 px-3 py-1.5 rounded-lg mb-4 inline-block">
                  Vídeo • Download
                </span>
                <h3 className="font-orbitron text-2xl font-black text-white group-hover:text-brand-cyan transition-colors">Umbra Fetch</h3>
                <span className="text-[10px] font-mono text-brand-purple bg-brand-purple/10 border border-brand-purple/10 px-2.5 py-1 rounded-md mt-2 inline-block">v1.0.0</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                Download em lote de vídeos gerados por IAs. Organize, selecione e baixe múltiplos resultados de forma rápida e assistida.
              </p>
              <a href="#" className="download-btn w-full inline-flex items-center justify-center gap-3 py-4 rounded-2xl text-background-deep font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-cyan/20 relative overflow-hidden">
                <Download className="w-4 h-4" /> Baixar extensão
              </a>
            </article>

            {/* Extension 2 */}
            <article className="extension-card border border-white/5 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-green bg-brand-green/10 border border-brand-green/20 px-3 py-1.5 rounded-lg mb-4 inline-block">
                  Vídeo • Download
                </span>
                <h3 className="font-orbitron text-2xl font-black text-white group-hover:text-brand-cyan transition-colors">Umbra Dispatch Pro</h3>
                <span className="text-[10px] font-mono text-brand-purple bg-brand-purple/10 border border-brand-purple/10 px-2.5 py-1 rounded-md mt-2 inline-block">v1.0.0</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                Disparo avançado de prompts com foco em consistência de personagens, estilos e variações controladas para geração de vídeos.
              </p>
              <a href="#" className="download-btn w-full inline-flex items-center justify-center gap-3 py-4 rounded-2xl text-background-deep font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-cyan/20 relative overflow-hidden">
                <Download className="w-4 h-4" /> Baixar extensão
              </a>
            </article>

            {/* Extension 3 */}
            <article className="extension-card border border-white/5 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-green bg-brand-green/10 border border-brand-green/20 px-3 py-1.5 rounded-lg mb-4 inline-block">
                  Vídeo • Download
                </span>
                <h3 className="font-orbitron text-2xl font-black text-white group-hover:text-brand-cyan transition-colors">Umbra Vision</h3>
                <span className="text-[10px] font-mono text-brand-purple bg-brand-purple/10 border border-brand-purple/10 px-2.5 py-1 rounded-md mt-2 inline-block">v1.0.0</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                Automatize a geração e o download em massa de imagens com Meta.ai e Google Whisk. Dispare centenas de prompts no piloto automático.
              </p>
              <a href="#" className="download-btn w-full inline-flex items-center justify-center gap-3 py-4 rounded-2xl text-background-deep font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-cyan/20 relative overflow-hidden">
                <Download className="w-4 h-4" /> Baixar extensão
              </a>
            </article>

            {/* Extension 4 */}
            <article className="extension-card border border-white/5 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group">
              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-green bg-brand-green/10 border border-brand-green/20 px-3 py-1.5 rounded-lg mb-4 inline-block">
                  TikTok • Download
                </span>
                <h3 className="font-orbitron text-2xl font-black text-white group-hover:text-brand-cyan transition-colors">Umbra TikTok Downloader</h3>
                <span className="text-[10px] font-mono text-brand-purple bg-brand-purple/10 border border-brand-purple/10 px-2.5 py-1 rounded-md mt-2 inline-block">v2.0.0</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                Baixe vídeos do TikTok sem marca d'água com painel flutuante
              </p>
              <a href="https://drive.google.com/drive/folders/1F4Bfm9Y3svf_hfOPFkxuBrytGL0YFMLV" target="_blank" rel="noopener noreferrer" className="download-btn w-full inline-flex items-center justify-center gap-3 py-4 rounded-2xl text-background-deep font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-cyan/20 relative overflow-hidden">
                <Download className="w-4 h-4" /> Baixar extensão
              </a>
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
              <a href="https://drive.google.com/drive/folders/1F4Bfm9Y3svf_hfOPFkxuBrytGL0YFMLV" target="_blank" rel="noopener noreferrer" className="download-btn w-full inline-flex items-center justify-center gap-3 py-4 rounded-2xl text-background-deep font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-cyan/20 relative overflow-hidden">
                <Download className="w-4 h-4" /> Baixar extensão
              </a>
            </article>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ExtensionsDownloadTool;
