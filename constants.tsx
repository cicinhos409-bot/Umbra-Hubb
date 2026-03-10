
import React from 'react';
import { ToolTier, Tool, PricingPlan, Testimonial, ToolCategory } from './types';

export const TOOLS: Tool[] = [
  { id: 'meus-canais', name: 'Meus Canais', description: 'Gerencie todos os seus canais do YouTube em um só lugar', tier: ToolTier.FREE, icon: '📺', category: ToolCategory.WEB },

  { id: 'youtube-hub', name: 'YouTube Hub', description: 'Extrair transcrições, análise viral e busca de vídeos — tudo em um só lugar.', tier: ToolTier.FREE, icon: '🔬', category: ToolCategory.WEB },
  { id: 'prompt-vault', name: 'Umbra Prompt Vault', description: 'Salve e organize seus melhores prompts.', tier: ToolTier.FREE, icon: '🔐', category: ToolCategory.WEB },

  { id: 'srt', name: 'Ferramentas de Edição', description: 'Conversor SRT, Divisor de Texto e Contador de Palavras para Scripts.', tier: ToolTier.FREE, icon: '📝', category: ToolCategory.WEB },
  { id: 'screenshot', name: 'Tirador de Screenshots', description: 'Extraia screenshots de vídeos com detecção automática.', tier: ToolTier.FREE, icon: '📸', category: ToolCategory.WEB },
  { id: 'downloader-hub', name: 'Downloader Hub', description: 'Baixe vídeos do TikTok e Sora AI sem marcas d\'água.', tier: ToolTier.FREE, icon: '📥', category: ToolCategory.WEB },




  { id: 'umbra-prompt', name: 'Umbra Prompt', description: 'Geração de prompts Veo 3 via áudio (io.net + Mistral).', tier: ToolTier.FREE, icon: '🎙️', category: ToolCategory.MOTOR_SUPREMO },
  { id: 'description-builder', name: 'Umbra Description Builder', description: 'Crie descrições otimizadas para seus vídeos com SEO, Timestamps e Hashtags.', tier: ToolTier.PRO, icon: '📋', category: ToolCategory.MOTOR_SUPREMO },

  { id: 'umbra-search', name: 'Umbra Search', description: 'Busca e Download de Mídia', tier: ToolTier.PRO, icon: '🔍', category: ToolCategory.WEB },
  { id: 'title-opt', name: 'Umbra Titulo Otimizado', description: 'Otimize títulos para máximo engajamento.', tier: ToolTier.PRO, icon: '✨', category: ToolCategory.MOTOR_SUPREMO },


  { id: 'umbra-script', name: 'Umbra Script', description: 'Sistema v2.0 — Engenharia Reversa. Viral Script Reverse Engineering Engine', tier: ToolTier.PRO, icon: '💎', category: ToolCategory.MOTOR_SUPREMO },
  { id: 'umbra-connect', name: 'Umbra Connect', description: 'Sincroniza automaticamente seu áudio com os prompts de vídeo, gerando instruções perfeitamente alinhadas com cada momento da narração.', tier: ToolTier.TURBO, icon: '⚙️', category: ToolCategory.TOOLS_2IN1 },
  { id: 'umbra-control', name: 'Umbra Control', description: 'Identifica automaticamente quais vídeos faltaram gerar após uma sessão. Separa os prompts pendentes para você regenerar apenas o necessário.', tier: ToolTier.TURBO, icon: '🎛️', category: ToolCategory.TOOLS_2IN1 },


  { id: 'umbra-image-scout', name: 'Umbra Image Scout', description: 'Busca e download de mídia multi-API com visualização premium.', tier: ToolTier.PRO, icon: '🎨', category: ToolCategory.WEB },

];

export const PLANS: PricingPlan[] = [
  {
    name: 'Básico',
    price: 'Free',
    period: '',
    description: 'Para iniciantes que querem acelerar a criação de vídeos para canais Dark.',
    features: [
      'Dashboard & Perfil',
      'Academy (Introdutório)',
      'Meus Canais (Limitado)',
      'Prompt Vault (1 grupo)',
      'Conversor SRT',
      'Tirador de Screenshots',
      'Downloader Hub'
    ],
    cta: 'COMEÇAR GRÁTIS',
    tier: ToolTier.FREE
  },
  {
    name: 'Pro',
    price: 'R$ 19,90',
    period: '/mês',
    popular: true,
    description: 'Use ferramentas poderosas e leve o crescimento do seu canal para o próximo nível.',
    features: [
      'Tudo do Básico +',
      'Umbra Search & Mídia',
      'Título Otimizado',
      'Description Builder',

      'RevAI (Limite maior)',
      'Tube Finder & Reverse',
      'Umbra Script (Motor Supremo)'
    ],
    cta: 'ASSINAR PRO',
    ctaLink: 'https://pay.cakto.com.br/3dko6xr_769683',
    tier: ToolTier.PRO
  },
  {
    name: 'Turbo',
    price: 'R$ 49,90',
    period: '/mês',
    description: 'Para quem gerencia vários canais ou quer postar vídeos em massa diariamente.',
    features: [
      'Tudo do Pro +',
      'Umbra Connect (Sincronia)',
      'Umbra Control (Regeneração)',
      'Motor Cinematográfico Otimizado',
      'Meus Canais (Ilimitado)',
      'Produção em Lote Total',
      'Limites máximos de IA',
      'Prioridade no Processamento',
      'Acesso antecipado a ferramentas'
    ],
    cta: 'ACELERAR AGORA',
    ctaLink: 'https://pay.cakto.com.br/36m5p68',
    tier: ToolTier.TURBO
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Alex Silva',
    role: 'Criador de Canais de Curiosidades',
    content: 'O Umbra Hub mudou meu fluxo de trabalho. O que levava 4 horas agora faço em 20 minutos.',
    avatar: 'https://i.pravatar.cc/150?u=alex',
    rating: 5
  },
  {
    name: 'Mariana Costa',
    role: 'Nicho de Horror & Mistério',
    content: 'As vozes neurais e o Umbra Script são surreais. Meus canais cresceram 300% em 2 meses.',
    avatar: 'https://i.pravatar.cc/150?u=mariana',
    rating: 5
  },
  {
    name: 'Ricardo Oliveira',
    role: 'Estrategista de Canais Dark',
    content: 'Melhor investimento para quem quer escala. As ferramentas de automação são as mais completas.',
    avatar: 'https://i.pravatar.cc/150?u=ricardo',
    rating: 5
  }
];
