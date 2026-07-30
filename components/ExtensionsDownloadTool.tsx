import React, { useState } from 'react';
import { Download, Chrome, Lock, Zap, Info, Package } from 'lucide-react';
import { ToolTier } from '../types';

interface ExtensionsDownloadToolProps {
  userTier: ToolTier;
}

interface Extension {
  name: string;
  version: string;
  tag: string;
  description: string;
  href: string;
  fileName: string;
  isFree?: boolean;
}

const EXTENSIONS: Extension[] = [
  {
    name: 'Umbra Flow',
    version: 'v1.2.0',
    tag: 'Vídeo • Automação',
    description: 'Consistência total e automação avançada de prompts. Gere séries de imagens e vídeos com controle absoluto de personagens e estilos.',
    href: '/extensoes/umbra-flow.zip',
    fileName: 'umbra-flow.zip'
  },
  {
    name: 'Umbra Vision',
    version: 'v4.0.0',
    tag: 'Vídeo • Download',
    description: 'Automatize a geração e o download em massa de imagens com Meta.ai e Google Whisk. Dispare centenas de prompts no piloto automático.',
    href: '/extensoes/umbra-vision.zip',
    fileName: 'umbra-vision.zip'
  },
  {
    name: 'Umbra TikTok Downloader',
    version: 'v2.0.2',
    tag: 'TikTok • Download',
    description: 'Baixe vídeos do TikTok sem marca d\'água com painel flutuante.',
    href: '/extensoes/umbra-tiktok.zip',
    fileName: 'umbra-tiktok.zip'
  },
  {
    name: 'Umbra Screen Recorder',
    version: 'v1.0.0',
    tag: 'Vídeo • Gravação',
    description: 'Grave vídeos da tela com painel flutuante arrastável. Powered by Tab Capture API.',
    href: '/extensoes/umbra-screen-recorder.zip',
    fileName: 'umbra-screen-recorder.zip'
  },
  {
    name: 'Umbra Printei',
    version: 'v1.0.0',
    tag: 'Utilidade • Screenshot',
    description: 'Capture screenshots de qualquer página, vídeo do YouTube, TikTok, Instagram e muito mais com alta precisão.',
    href: '/extensoes/umbra-printei.zip',
    fileName: 'umbra-printei.zip'
  },
  {
    name: 'Umbra Unified Automation',
    version: 'v2.4.0',
    tag: 'IA • Automação',
    description: 'Automatize prompts no ChatGPT e no Claude com filas, sequências, variáveis, anexos de imagem e links.',
    href: '/extensoes/umbra-unified.zip',
    fileName: 'umbra-unified.zip'
  },
  {
    name: 'Umbra Image Download',
    version: 'v2.7.0',
    tag: 'Web • Download',
    description: 'Baixe todas as imagens de qualquer página da web instantaneamente. Ferramenta essencial para curadoria de mídia.',
    href: '/extensoes/Umbra Image Download.zip',
    fileName: 'Umbra Image Download.zip'
  },
  {
    name: 'Umbra Bloqueador YT',
    version: 'v5.1.0',
    tag: 'Ferramentas • Foco',
    description: 'Oculta e censura distrações do YouTube e YouTube Studio para manter seu foco total na produção de conteúdo.',
    href: '/extensoes/Umbra - Bloqueador YouTube Studio.zip',
    fileName: 'Umbra - Bloqueador YouTube Studio.zip'
  },
  {
    name: 'Umbra ShopeeSave',
    version: 'v4.1.0',
    tag: 'Shopee • Download',
    description: 'Baixe imagens e vídeos de produtos da Shopee com o Umbra ShopeeSave.',
    href: '/extensoes/Umbrashopeesave.zip',
    fileName: 'Umbrashopeesave.zip',
    isFree: true
  }
];

const INSTALL_STEPS = [
  { step: '01', title: 'Baixar o arquivo', desc: 'Clique em "Baixar Extensão" e salve o arquivo .zip no seu computador.' },
  { step: '02', title: 'Extrair o ZIP',    desc: 'Descompacte o arquivo baixado em uma pasta fixa — não mova depois de instalar.' },
  { step: '03', title: 'Ativar no Chrome', desc: 'Acesse chrome://extensions → ative Modo desenvolvedor → clique em "Carregar sem compactação".' },
];

const ExtensionsDownloadTool: React.FC<ExtensionsDownloadToolProps> = ({ userTier }) => {
  const isLocked = userTier === ToolTier.FREE;
  const [lockedId, setLockedId] = useState<string | null>(null);

  return (
    <div className="max-w-5xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-4">
        <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
          <Chrome className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
              Chrome Extensions
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
              {EXTENSIONS.length} Extensões
            </span>
            {!isLocked && (
              <span className="px-3 py-1 rounded-full bg-green-50 border border-green-200 text-[10px] font-black text-green-700 uppercase tracking-[0.2em] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" /> Acesso PRO Ativo
              </span>
            )}
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Downloads &amp; Extensões</h1>
          <p className="text-gray-600 font-black mt-1">Ferramentas exclusivas para automatizar e potencializar seu fluxo de produção.</p>
        </div>
      </div>

      {/* ── COMO INSTALAR CARD ── */}
      <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Info className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">Como Instalar</h3>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Instalação manual · chrome://extensions</p>
          </div>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {INSTALL_STEPS.map(item => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-9 h-9 bg-gray-900 text-white rounded-xl flex items-center justify-center font-mono text-[11px] font-black shrink-0">
                  {item.step}
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-xs font-black text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION DIVIDER ── */}
      <div className="flex items-center gap-4">
        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 whitespace-nowrap">
          Extensões Disponíveis
        </h2>
        <div className="h-px flex-grow bg-gray-200" />
        <span className="text-xs font-black text-gray-400 whitespace-nowrap">
          {EXTENSIONS.length} extensões
        </span>
      </div>

      {/* ── EXTENSIONS GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXTENSIONS.map((ext) => {
          const canDownload = !isLocked || ext.isFree;
          const isShowingUpgrade = lockedId === ext.name;

          return (
            <article
              key={ext.name}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col hover:border-gray-300 hover:shadow-sm transition-all duration-200"
            >
              {/* Card header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-gray-900 leading-tight truncate">{ext.name}</h3>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{ext.version}</span>
                  </div>
                </div>
                <span className={`shrink-0 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                  ext.isFree
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-primary/10 border-primary/20 text-primary'
                }`}>
                  {ext.isFree ? 'Grátis' : 'PRO'}
                </span>
              </div>

              {/* Card body */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex-1 mb-5">
                  <span className="inline-block text-[9px] font-black uppercase tracking-widest text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg mb-3">
                    {ext.tag}
                  </span>
                  <p className="text-gray-500 text-xs font-black leading-relaxed">
                    {ext.description}
                  </p>
                </div>

                {canDownload ? (
                  <a
                    href={ext.href}
                    download={ext.fileName}
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-black text-white font-black text-xs uppercase tracking-widest hover:bg-gray-900 active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4" /> Baixar Extensão
                  </a>
                ) : (
                  <>
                    <button
                      onClick={() => setLockedId(isShowingUpgrade ? null : ext.name)}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 font-black text-xs uppercase tracking-[0.15em] hover:bg-gray-100 transition-all"
                    >
                      <Lock className="w-4 h-4" />
                      {isShowingUpgrade ? 'Fechar' : 'Exclusivo PRO'}
                    </button>

                    {isShowingUpgrade && (
                      <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200 text-center">
                        <p className="text-xs font-black text-gray-700 leading-relaxed mb-3">
                          Esta extensão é exclusiva para membros PRO.
                        </p>
                        <button
                          onClick={() => window.open('https://pay.cakto.com.br/3dko6xr_769683', '_blank')}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all"
                        >
                          <Zap className="w-3.5 h-3.5" /> Assinar PRO
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* ── FOOTER ── */}
      <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-black text-gray-900 italic uppercase tracking-tighter">Umbra Extensions</div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">
            Instalação manual · chrome://extensions → Modo desenvolvedor
          </p>
        </div>
        <div className="flex items-center gap-6">
          {[
            { label: 'Total',      value: `${EXTENSIONS.length}` },
            { label: 'Plataforma', value: 'Chrome' },
            { label: 'Acesso',     value: isLocked ? 'FREE' : 'PRO' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-lg font-black text-gray-900">{stat.value}</div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ExtensionsDownloadTool;
