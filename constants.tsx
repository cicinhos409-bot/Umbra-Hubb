
import React from 'react';
import { Music, Zap, UserCircle } from 'lucide-react';
import { ToolTier, Tool, PricingPlan, Testimonial, ToolCategory } from './types';

export const TOOLS: Tool[] = [
  { id: 'meus-canais', name: 'Meus Canais', description: 'Gerencie todos os seus canais do YouTube em um só lugar', tier: ToolTier.FREE, icon: '📺', category: ToolCategory.WEB },

  { id: 'youtube-hub', name: 'YouTube Hub', description: 'Extrair transcrições, análise viral e busca de vídeos — tudo em um só lugar.', tier: ToolTier.PRO, icon: '🔬', category: ToolCategory.WEB },
  { id: 'prompt-vault', name: 'Umbra Prompt Vault', description: 'Biblioteca de prompts virais e templates inteligentes.', tier: ToolTier.PRO, icon: '🔐', category: ToolCategory.WEB },

  { id: 'srt', name: 'Ferramentas de Edição', description: 'Conversor SRT, Divisor de Texto e Contador de Palavras para Scripts.', tier: ToolTier.FREE, icon: '📝', category: ToolCategory.WEB },
  { id: 'screenshot', name: 'Tirador de Screenshots', description: 'Extraia screenshots de vídeos com detecção automática.', tier: ToolTier.FREE, icon: '📸', category: ToolCategory.WEB },

  { id: 'media-hub', name: 'Media Hub', description: 'Busca de mídia multi-API e ferramentas visuais premium.', tier: ToolTier.PRO, icon: '🎨', category: ToolCategory.WEB },
  { id: 'turbo-hub', name: 'Turbo Hub', description: 'Otimize seu fluxo de trabalho com sincronização e controle automático.', tier: ToolTier.PRO, icon: '⚙️', category: ToolCategory.TOOLS_2IN1 },

  { id: 'umbra-audios', name: 'Umbra Audios', description: 'Sintetização de Voz Neural via Google Cloud TTS.', tier: ToolTier.PRO, icon: '🎙️', category: ToolCategory.WEB },

{ id: 'material-bonus', name: 'Material Bônus', description: 'Ferramentas e recursos exclusivos para criadores de conteúdo Faceless.', icon: '🎁', category: ToolCategory.WEB, tier: ToolTier.PRO },
];

export const PLANS: PricingPlan[] = [
  {
    name: 'Pro',
    price: 'R$ 49,00',
    period: '/mês',
    popular: true,
    description: 'O arsenal completo. Acesso total a todas as ferramentas e automações premium.',
    features: [
      'Dashboard',
      'Academy',
      'Meus Canais',
      'Turbo Hub (Connect, Control)',
      'YouTube Hub',
      'Media Hub',
      'Umbra Áudios',
      'Screenshot Tool Automática',
      'Conversor SRT',
      'Divisor de palavras',
      'Contador de palavras',
      'Material Bônus',
      'Download Exclusivo',
      'Documentos do Site',
      'Gemini — Agentes',
      'ChatGPT — Agentes',
      '+30 Agentes de IA',
      '---',
      'Extensões Chrome (Todas Libertas)',
      '---',
      'Umbra Flow',
      'Umbra Vision',
      'Umbra TikTok Downloader',
      'Umbra Screen Recorder',
      'Umbra Printei',
      'Umbra Piclumen Prompter',
      'Umbra Image Download',
      'Umbra - Bloqueador YT',
      'Umbra ShopeeSave',
      'Umbra Unified Automation',
      'Umbra Grok AI',
      'Umbra Curiosity Finder Pro',
      '+Novas Extensões Futuras'
    ],
    cta: 'ASSINAR AGORA',
    ctaLink: 'https://pay.cakto.com.br/3dko6xr_769683',
    tier: ToolTier.PRO
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Alex Silva',
    role: 'Criador de Canais de Curiosidades',
    content: 'O Umbra Hub mudou meu fluxo de trabalho. O que levava 4 horas agora faço em 20 minutos.',
    avatar: '/avatars/alex.png',
    rating: 5
  },
  {
    name: 'Mariana Costa',
    role: 'Nicho de Horror & Mistério',
    content: 'As vozes neurais e o Umbra Script são surreais. Meus canais cresceram 300% em 2 meses.',
    avatar: '/avatars/mariana.png',
    rating: 5
  },
  {
    name: 'Ricardo Oliveira',
    role: 'Estrategista de Canais Faceless',
    content: 'Melhor investimento para quem quer escala. As ferramentas de automação são as mais completas.',
    avatar: '/avatars/ricardo.png',
    rating: 5
  }
];
