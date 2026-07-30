import React from 'react';
import { ToolTier } from '../types';
import {
  ExternalLink,
  Download,
  Zap,
  Lock,
  FileText,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Library,
  Layers,
  Clapperboard,
  Bot,
  Gift,
} from 'lucide-react';

interface BonusMaterialToolProps {
  userTier: ToolTier;
}

const iconColorMap: Record<string, string> = {
  default: 'text-gray-500',
  gpt:     'text-blue-500',
  gem:     'text-purple-500',
  docs:    'text-emerald-500',
  dl:      'text-orange-500',
  ext:     'text-primary',
};

type CardType = 'default' | 'gpt' | 'gem' | 'docs' | 'dl' | 'ext';

interface PremiumCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  href: string;
  tags: string[];
  type?: CardType;
  isLocked: boolean;
}

const PremiumCard: React.FC<PremiumCardProps> = ({
  title, subtitle, description, icon: Icon, href, tags, type = 'default', isLocked,
}) => {
  const iconColor = iconColorMap[type] ?? iconColorMap.default;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-gray-900 truncate">{title}</h3>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end shrink-0">
          {tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-[9px] font-black uppercase tracking-widest text-gray-500">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <p className="text-gray-600 text-sm font-black leading-relaxed flex-grow mb-5">
          {description}
        </p>

        {isLocked ? (
          <button
            onClick={() => alert('Conteúdo exclusivo para assinantes PRO. Faça upgrade para liberar o acesso!')}
            className="w-full py-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <Lock className="w-3.5 h-3.5" /> Conteúdo Bloqueado
          </button>
        ) : (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-primary text-white flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/90 transition-all"
          >
            {type === 'dl' ? <Download className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
            {type === 'dl' ? 'Baixar Material' : 'Acessar Agora'}
          </a>
        )}
      </div>
    </div>
  );
};

const SEQUENCES = [
  {
    title: 'Títulos Magnéticos',
    description: 'Gera 40 títulos em 4 categorias (curiosidade, emoção, número e contradição). Ranqueia os melhores e refina versões de alta urgência.',
    Icon: Layers,
    badge: 'Hook Set',
    BadgeIcon: Library,
    href: '/Sequencia%20Extensao-Umbra%20Unified%20Automation/SEQUENCIA-CRIACAO-TITULOS.md',
    label: 'Baixar Sequência',
  },
  {
    title: 'Every ___ Explained.',
    description: 'Domina o formato viral com maior CTR do YouTube. Gera titles, pacote de produção (thumb, hook, estrutura) e variações.',
    Icon: Smartphone,
    badge: 'Viral Master',
    BadgeIcon: Zap,
    href: '/Sequencia%20Extensao-Umbra%20Unified%20Automation/SEQUENCIA-EVERY-EXPLAINED-TITLES.md',
    label: 'Baixar Master',
  },
  {
    title: 'Roteiro Cinematográfico',
    description: 'Transforma ideias em roteiros profissionais com estrutura de 3 atos, personagens e filtro de humanização anti-IA.',
    Icon: Clapperboard,
    badge: 'Storytelling',
    BadgeIcon: ShieldCheck,
    href: '/Sequencia%20Extensao-Umbra%20Unified%20Automation/SEQUENCIA-ROTEIRO-CINEMATOGRAFICO.md',
    label: 'Baixar Roteiro',
  },
  {
    title: 'Umbra Prompt',
    description: 'Agente especializado em produzir prompts sincronizados, localizar lacunas e otimizar versões para resultados extremos.',
    Icon: Bot,
    badge: 'Agent Intel',
    BadgeIcon: Sparkles,
    href: '/Sequencia%20Extensao-Umbra%20Unified%20Automation/UMBRA-PROMPTS.md',
    label: 'Baixar Agente',
  },
  {
    title: 'Kit Criador de Conteúdo',
    description: 'Sequência completa de 5 prompts para montar um vídeo do zero em uma única automação. Gera ganchos, roteiro dark, títulos clicáveis, encerramento humanizado e reescreve seus prompts com técnicas avançadas.',
    Icon: Clapperboard,
    badge: 'Full Pipeline',
    BadgeIcon: Zap,
    href: '/Sequencia%20Extensao-Umbra%20Unified%20Automation/TST-KIT-CRIADOR-CONTEUDO.md',
    label: 'Baixar Kit Completo',
  },
];

const BonusMaterialTool: React.FC<BonusMaterialToolProps> = ({ userTier }) => {
  const isLocked = userTier === ToolTier.FREE;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">Material Bônus</h1>
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Arsenal exclusivo para criadores Faceless</p>
          </div>
        </div>
        {isLocked && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Plano PRO</span>
          </div>
        )}
      </div>

      {/* ── PRO UPGRADE BANNER ── */}
      {isLocked && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Conteúdo Exclusivo PRO</h3>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Faça upgrade para liberar todo o arsenal</p>
            </div>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {['Viralização', 'Automação', 'Storytelling', 'IA Avançada'].map(item => (
                <div key={item} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-black text-gray-700">{item}</span>
                </div>
              ))}
            </div>
            <button className="w-full py-3.5 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> Fazer Upgrade para PRO
            </button>
          </div>
        </div>
      )}

      {/* ── FEATURED: PACK TST ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Download Consolidado</h3>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pack completo atualizado</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest">Masterclass</span>
            <span className="px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-[9px] font-black text-gray-500 uppercase tracking-widest">Update 2024</span>
          </div>
        </div>
        <div className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-grow">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase mb-2">Pack Material TST v2.0</h3>
              <p className="text-sm font-black text-gray-600 leading-relaxed max-w-xl">
                O arsenal completo e definitivo. Inclui todos os roteiros, checklists de postagem, guias de nicho e o mapa mental da estratégia TST para escala global.
              </p>
            </div>
            <div className="w-full md:w-auto shrink-0">
              {isLocked ? (
                <button
                  onClick={() => alert('Conteúdo exclusivo para assinantes PRO. Faça upgrade para liberar o acesso!')}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 hover:text-gray-700 transition-all"
                >
                  <Lock className="w-4 h-4" /> Conteúdo Exclusivo
                </button>
              ) : (
                <a href="#" className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-primary/90 transition-all">
                  <Download className="w-4 h-4" /> Iniciar Download
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── INTELIGÊNCIA & TEMPLATES ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-500 shrink-0">Inteligência & Templates</span>
          <div className="h-px flex-grow bg-gray-200" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <PremiumCard
            title="ChatGPT Agents"
            subtitle="OpenAI • Prompt Engineering"
            description="Roteiristas de IA treinados para converter hooks em vídeos virais. Estrutura otimizada para o algoritmo 2024."
            icon={MessageSquare}
            href="https://chatgpt.com"
            tags={['Scripts', 'Engajamento']}
            type="gpt"
            isLocked={isLocked}
          />
          <PremiumCard
            title="AIDA TikTok Gem"
            subtitle="Gemini • Roteiros de Compra"
            description="Especialista em roteiros virais de alta conversão para TikTok Shop usando o método AIDA: Atenção, Interesse, Desejo e Ação."
            icon={Zap}
            href="https://gemini.google.com/gem/1s2uVz-mP67OXG6trStYe-Sjd-sRHaKRR?usp=sharing"
            tags={['Sales', 'Conversion']}
            type="gem"
            isLocked={isLocked}
          />
          <PremiumCard
            title="Gemini Power"
            subtitle="Google • Pesquisa de Nichos"
            description="Acesse o poder do Gemini para mapear tendências antes de todo mundo e gerar roteiros informativos densos."
            icon={Smartphone}
            href="https://gemini.google.com"
            tags={['Tendências', 'SEO']}
            type="gem"
            isLocked={isLocked}
          />
          <PremiumCard
            title="Central de Docs"
            subtitle="Umbra • Materiais Auxiliares"
            description="Repositório com todos os documentos do site, guias rápidos e checklists em PDF para download."
            icon={FileText}
            href="https://docs.google.com"
            tags={['Templates', 'Checklists']}
            type="docs"
            isLocked={isLocked}
          />
        </div>
      </div>

      {/* ── AUTOMAÇÃO DE SEQUÊNCIA ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-500 shrink-0">Automação de Sequência</span>
          <div className="h-px flex-grow bg-gray-200" />
          <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest shrink-0">Umbra Unified</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden divide-y divide-gray-100">
          {SEQUENCES.map((seq, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6 hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
                <seq.Icon className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">{seq.title}</h3>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                    <seq.BadgeIcon className="w-2.5 h-2.5" /> {seq.badge}
                  </span>
                </div>
                <p className="text-xs font-black text-gray-500 leading-relaxed">{seq.description}</p>
              </div>

              {isLocked ? (
                <button
                  onClick={() => alert('Conteúdo exclusivo para assinantes PRO.')}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                >
                  <Lock className="w-3.5 h-3.5" /> Bloqueado
                </button>
              ) : (
                <a
                  href={seq.href}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all"
                >
                  {seq.label} <ArrowRight className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
          Todas as sequências são compatíveis com o módulo Umbra Unified Automation
        </p>
      </div>

    </div>
  );
};

export default BonusMaterialTool;
