import React, { useState } from 'react';
import {
  X, ChevronRight, ChevronLeft, Zap, Youtube, Cpu,
  FileText, BookOpen, Sparkles, Check
} from 'lucide-react';
import { trackOnboardingCompleted, trackOnboardingSkipped } from '../services/analytics';

const STORAGE_KEY = 'umbra_onboarding_v1';

interface Step {
  icon: React.ReactNode;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  tip?: string;
  action?: { label: string; tab: string };
}

const STEPS: Step[] = [
  {
    icon: <Zap className="w-10 h-10 text-white" />,
    emoji: '⚡',
    title: 'Bem-vindo ao Umbra PRO',
    subtitle: 'Arsenal completo desbloqueado',
    description: 'Você agora tem acesso a todas as ferramentas de IA, automações e recursos exclusivos para canais Faceless e Dark. Este guia mostra os pontos mais importantes em menos de 2 minutos.',
    tip: 'Você pode voltar a este guia clicando em "Guia PRO" no rodapé do menu lateral.',
  },
  {
    icon: <Youtube className="w-10 h-10 text-white" />,
    emoji: '📺',
    title: 'Meus Canais',
    subtitle: 'Central de operações',
    description: 'Gerencie todos os seus canais YouTube Faceless em um só lugar. Organize vídeos, escreva roteiros, adicione notas estratégicas e sincronize tudo automaticamente na nuvem.',
    tip: 'Os dados ficam salvos no Supabase — acesse de qualquer dispositivo sem perder nada.',
    action: { label: 'Abrir Meus Canais', tab: 'meus-canais' },
  },
  {
    icon: <Cpu className="w-10 h-10 text-white" />,
    emoji: '🚀',
    title: 'Umbra Turbo Hub',
    subtitle: 'Pesquisa e criação com IA',
    description: 'Busque vídeos virais, analise tendências, gere ideias de conteúdo e pesquise nichos — tudo com inteligência artificial integrada. A ferramenta mais completa do arsenal.',
    tip: 'Use a aba "Image Scout" para encontrar imagens cinematográficas gratuitas para thumbnails.',
    action: { label: 'Abrir Turbo Hub', tab: 'turbo-hub' },
  },
  {
    icon: <FileText className="w-10 h-10 text-white" />,
    emoji: '🎙️',
    title: 'Umbra Connect',
    subtitle: 'Transcrição de áudio com IA',
    description: 'Faça upload de qualquer arquivo de áudio (MP3, WAV, M4A) e receba a transcrição completa em segundos via Gemini. Envie o texto direto para um canal no Meus Canais.',
    tip: 'Ideal para transcrever narrações gravadas e transformar em roteiros editáveis.',
    action: { label: 'Abrir Umbra Connect', tab: 'umbra-connect' },
  },
  {
    icon: <BookOpen className="w-10 h-10 text-white" />,
    emoji: '🎓',
    title: 'Umbra Academy',
    subtitle: 'Acesso exclusivo PRO',
    description: 'Conteúdo estratégico sobre canais Faceless: como escalar, monetizar, escolher nichos lucrativos e produzir vídeos com IA sem aparecer. Atualizado continuamente.',
    tip: 'Assista as aulas na ordem — cada módulo constrói sobre o anterior.',
    action: { label: 'Acessar Academy', tab: 'academy' },
  },
  {
    icon: <Sparkles className="w-10 h-10 text-white" />,
    emoji: '🏆',
    title: 'Tudo pronto!',
    subtitle: 'Seu arsenal está ativo',
    description: 'Explore todas as ferramentas pelo menu lateral. Use o atalho Ctrl+K para buscar qualquer ferramenta rapidamente. Qualquer dúvida, acesse o suporte VIP via Telegram.',
    tip: 'Dica final: comece criando seu primeiro canal em Meus Canais e preencha a estratégia.',
  },
];

interface OnboardingGuideProps {
  userName: string;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ userName, onClose, onNavigate }) => {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, 'done');
    if (isLast) trackOnboardingCompleted();
    else trackOnboardingSkipped();
    onClose();
  };

  const handleAction = (tab: string) => {
    localStorage.setItem(STORAGE_KEY, 'done');
    onNavigate(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={finish} />

      <div className="relative bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-400">

        {/* BLACK HEADER */}
        <div className="bg-black px-8 py-7 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border border-white/20"
            style={{ background: 'rgba(255,255,255,0.1)' }}>
            {current.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">
              Guia PRO · Passo {step + 1} de {STEPS.length}
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">
              {current.title}
            </h2>
            <p className="text-[11px] font-black text-white/50 uppercase tracking-widest mt-1">
              {current.subtitle}
            </p>
          </div>
          <button
            onClick={finish}
            className="p-2.5 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all shrink-0"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="h-1 bg-gray-100 flex">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 transition-all duration-500 ${i <= step ? 'bg-black' : 'bg-transparent'}`}
            />
          ))}
        </div>

        {/* BODY */}
        <div className="px-8 py-8 space-y-6">
          {/* Emoji decoration */}
          <div className="text-5xl">{current.emoji}</div>

          {/* Description */}
          <p className="text-base text-gray-700 font-black leading-relaxed">
            {current.description}
          </p>

          {/* Tip */}
          {current.tip && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
              <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-sm font-black text-gray-600 leading-relaxed">{current.tip}</p>
            </div>
          )}

          {/* Quick action */}
          {current.action && (
            <button
              onClick={() => handleAction(current.action!.tab)}
              className="w-full py-4 bg-black text-white font-black rounded-2xl uppercase tracking-[0.2em] text-sm hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {current.action.label} <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-8 pb-8 flex items-center justify-between gap-4">
          {/* Step dots */}
          <div className="flex gap-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 h-2 bg-black' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex gap-3">
            {!isFirst && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-5 py-3 bg-gray-100 text-gray-900 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
            )}
            {isFirst && (
              <button
                onClick={finish}
                className="px-5 py-3 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-700 transition-all"
              >
                Pular guia
              </button>
            )}
            {!isLast ? (
              <button
                onClick={() => setStep(s => s + 1)}
                className="px-6 py-3 bg-black text-white font-black rounded-xl text-xs uppercase tracking-[0.2em] hover:bg-gray-900 active:scale-95 transition-all flex items-center gap-2"
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                className="px-6 py-3 bg-black text-white font-black rounded-xl text-xs uppercase tracking-[0.2em] hover:bg-gray-900 active:scale-95 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Concluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { STORAGE_KEY as ONBOARDING_STORAGE_KEY };
export default OnboardingGuide;
