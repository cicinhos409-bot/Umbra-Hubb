
import React from 'react';
import { ToolTier, Tool, PricingPlan, Testimonial, ToolCategory } from './types';

export const TOOLS: Tool[] = [
  { id: 'meus-canais', name: 'Meus Canais', description: 'Gerencie todos os seus canais do YouTube em um só lugar', tier: ToolTier.FREE, icon: '📺', category: ToolCategory.WEB },

  { id: 'youtube-hub', name: 'YouTube Hub', description: 'Extrair transcrições, análise viral e busca de vídeos — tudo em um só lugar.', tier: ToolTier.PRO, icon: '🔬', category: ToolCategory.WEB },
  { id: 'prompt-vault', name: 'Umbra Prompt Vault', description: 'Salve e organize seus melhores prompts.', tier: ToolTier.PRO, icon: '🔐', category: ToolCategory.WEB },

  { id: 'srt', name: 'Ferramentas de Edição', description: 'Conversor SRT, Divisor de Texto e Contador de Palavras para Scripts.', tier: ToolTier.FREE, icon: '📝', category: ToolCategory.WEB },
  { id: 'screenshot', name: 'Tirador de Screenshots', description: 'Extraia screenshots de vídeos com detecção automática.', tier: ToolTier.FREE, icon: '📸', category: ToolCategory.WEB },
  { id: 'downloader-hub', name: 'Downloader Hub', description: 'Baixe vídeos do TikTok e Sora AI sem marcas d\'água.', tier: ToolTier.FREE, icon: '📥', category: ToolCategory.WEB },

  { id: 'media-hub', name: 'Media Hub', description: 'Busca de mídia multi-API e ferramentas visuais premium.', tier: ToolTier.PRO, icon: '🎨', category: ToolCategory.WEB },
  { id: 'motor-hub', name: 'Motor Supremo', description: 'Prompt Veo 3, Script Reverso, Título Otimizado e Description Builder — tudo em um só lugar.', tier: ToolTier.TURBO, icon: '💎', category: ToolCategory.MOTOR_SUPREMO },
  { id: 'turbo-hub', name: 'Turbo Hub', description: 'Otimize seu fluxo de trabalho com sincronização e controle automático.', tier: ToolTier.TURBO, icon: '⚙️', category: ToolCategory.TOOLS_2IN1 },

  { id: 'umbra-audios', name: 'Umbra Audios', description: 'Sintetização de Voz Neural via Google Cloud TTS.', tier: ToolTier.FREE, icon: '🎙️', category: ToolCategory.WEB },
  { id: 'storytelling', name: 'Umbra You Storytelling', description: 'Gerador de roteiros virais de alto impacto com IA Mistral.', tier: ToolTier.TURBO, icon: '🎬', category: ToolCategory.CHATBOTS },
  { id: 'image-studio', name: 'Umbra Image Studio', description: 'Geração de imagens de alta fidelidade com IA universal.', tier: ToolTier.PRO, icon: '🎨', category: ToolCategory.WEB },
  { id: 'video-generator', name: 'Umbra Video Generator', description: 'Transforme texto em vídeos cinematográficos com IA Grok.', tier: ToolTier.PRO, icon: '🎬', category: ToolCategory.CHATBOTS },
  { id: 'umbra-voice', name: 'UmbraVoice', description: 'Narração cinematográfica ultra-realista com ElevenLabs IA.', tier: ToolTier.TURBO, icon: '🎙️', category: ToolCategory.CHATBOTS },
];

export const PLANS: PricingPlan[] = [
  {
    name: 'Básico',
    price: 'Free',
    period: '',
    description: 'Para iniciantes que querem acelerar a criação de vídeos para canais Dark.',
    features: [
      'Dashboard & Academy',
      'Meus Canais (Essencial)',
      'Ferramentas de Edição (SRT, Divisor)',
      'Screenshot Tool',
      'Downloader Hub (TikTok/Sora)',
      'Umbra Áudios (Limite 3/total)'
    ],
    cta: 'COMEÇAR GRÁTIS',
    tier: ToolTier.FREE
  },
  {
    name: 'Pro',
    price: 'R$ 97,00',
    period: '/mês',
    popular: true,
    description: 'Use ferramentas poderosas e leve o crescimento do seu canal para o próximo nível.',
    features: [
      'Tudo do Básico +',
      'Umbra Vision',
      'Umbra TikTok Downloader',
      'Umbra Screen Recorder',
      'Umbra Printei',
      'Umbra Piclumen Prompter',
      'Umbra Image Download',
      'Umbra - Bloqueador YT',
      'Umbra Chat Automation',
      'Umbra Image Studio (IA Universal)',
      'Umbra Video Generator (Grok IA)',
      'YouTube Hub (Extrair, Reverse)',
      'Umbra Prompt Vault',
      'Media Hub (Search, Scout)',
      'Umbra Áudios (10/dia • 100k)'
    ],
    cta: 'ASSINAR PRO',
    ctaLink: 'https://pay.cakto.com.br/3dko6xr_769683',
    tier: ToolTier.PRO
  },
  {
    name: 'Turbo',
    price: 'R$ 197,00',
    period: '/mês',
    description: 'Para quem gerencia vários canais ou quer postar vídeos em massa diariamente.',
    features: [
      'Tudo do Pro +',
      'Umbra You Storytelling (Mistral IA)',
      'UmbraVoice (ElevenLabs IA)',
      'Motor Supremo (Title, Script)',
      'Turbo Hub (Connect, Control)',
      'Umbra Áudios (30/dia • 100k)',
      '1 Extensão Personalizada',
      'Limites Máximos de IA'
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
