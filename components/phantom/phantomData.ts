// ═══════════════════════════════════════════════════════════════
// PHANTOM DATA — Types, constants & helpers for Canais Outliers
// ═══════════════════════════════════════════════════════════════

export interface PhantomChannel {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  subscribers: number;
  subscriberLabel: string;
  totalViews: number;
  totalViewsLabel: string;
  videoCount: number;
  avgViews: number;
  engagement: number;
  growth7d: number;
  outlierScore: number;
  facelessType: string;
  facelessTypeCode: string;
  level: string;
  levelEmoji: string;
  expiresHours: number;
  niche: string;
  stack: string[];
  triggerPrimary: string;
  revenueMin: number;
  revenueMax: number;
  windowStatus: 'ABERTA' | 'FECHANDO' | 'FECHADA';
  windowDays: number;
  verdict: string;
  verdictType: 'replicate' | 'adapt' | 'inspire' | 'ignore';
  anomalies: string[];
  topVideos: { title: string; thumbnail: string; views: string; duration: string; timeAgo: string }[];
  titleFormula: string;
  thumbPattern: string;
  uploadPattern: string;
  audience: string;
  saturation: 'VAZIO' | 'EMERGINDO' | 'CRESCENDO' | 'SATURADO';
  setupCostMin: number;
  setupCostMax: number;
  techLevel: string;
  projection30subs: string;
  projection90subs: string;
  channelUrl: string;
  likes: number;
  comments: number;
  videoPublishedAt: string;
  channelCreatedAt: string;
}

export const FACELESS_TYPE_COLORS: Record<string, string> = {
  F1: '#7c3aed', F6: '#7c3aed',
  F2: '#3498db', F7: '#3498db',
  F3: '#2ecc71',
  F4: '#f39c12', F12: '#f39c12',
  F5: '#06b6d4',
  F8: '#991b1b', F9: '#991b1b',
  F10: '#ea580c', F11: '#ea580c',
};

export const FACELESS_TYPES = [
  { code: 'F1', name: 'Narrador Fantasma' },
  { code: 'F2', name: 'Máquina de IA' },
  { code: 'F3', name: 'Gameplay Fantasma' },
  { code: 'F4', name: 'Compilador Inteligente' },
  { code: 'F5', name: 'Animação Automatizada' },
  { code: 'F6', name: 'Documentarista Invisível' },
  { code: 'F7', name: 'Shorts Factory' },
  { code: 'F8', name: 'Arbitrador de Idioma' },
  { code: 'F9', name: 'Loophole de Nicho' },
  { code: 'F10', name: 'Network Oculto' },
  { code: 'F11', name: 'Disruptor de Formato' },
  { code: 'F12', name: 'Canal Sazonal' },
];

export const SORT_OPTIONS = [
  'Maior Outlier Score',
  'Mais Views',
  'Maior Crescimento',
  'Menor Saturação',
];

export const LEVEL_FILTERS = [
  { id: 'all', label: 'Todos', emoji: '' },
  { id: 'espectro', label: 'Espectro', emoji: '👁' },
  { id: 'lendario', label: 'Lendário', emoji: '💀' },
  { id: 'critico', label: 'Crítico', emoji: '🔴' },
  { id: 'alto', label: 'Alto', emoji: '🟠' },
  { id: 'medio', label: 'Médio', emoji: '🟡' },
  { id: 'watchlist', label: 'Watchlist', emoji: '🔵' },
];

export const PHANTOM_NICHES = [
  'true crime', 'finanças pessoais', 'curiosidades', 'terror',
  'saúde', 'mistérios', 'geopolítica', 'tecnologia'
];

// ── Deterministic hash from string → stable number ──
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ── Classify faceless type deterministically ──
export function classifyFacelessType(name: string, desc: string): { code: string; name: string } {
  const t = (name + ' ' + desc).toLowerCase();
  if (/narr|fantasma|voz|contando|história real|relato/.test(t)) return { code: 'F1', name: 'Narrador Fantasma' };
  if (/ia\b|gpt|intelig|automat|robot|gerado/.test(t)) return { code: 'F2', name: 'Máquina de IA' };
  if (/game|gameplay|jogar|minecraft|roblox/.test(t)) return { code: 'F3', name: 'Gameplay Fantasma' };
  if (/compil|top\s?\d|ranking|melhores|piores/.test(t)) return { code: 'F4', name: 'Compilador Inteligente' };
  if (/anim|cartoon|motion|desenho/.test(t)) return { code: 'F5', name: 'Animação Automatizada' };
  if (/doc|investig|caso|crime|mistério/.test(t)) return { code: 'F6', name: 'Documentarista Invisível' };
  if (/shorts|short|60s|viral|tiktok/.test(t)) return { code: 'F7', name: 'Shorts Factory' };
  if (/traduz|dub|idioma|english|inglês/.test(t)) return { code: 'F8', name: 'Arbitrador de Idioma' };
  if (/segredo|nicho|hack|loophole|truque/.test(t)) return { code: 'F9', name: 'Loophole de Nicho' };
  if (/rede|network|grupo|colab/.test(t)) return { code: 'F10', name: 'Network Oculto' };
  if (/novo formato|disrupt|diferente|inov/.test(t)) return { code: 'F11', name: 'Disruptor de Formato' };
  if (/natal|verão|sazonal|temporada|halloween/.test(t)) return { code: 'F12', name: 'Canal Sazonal' };
  const idx = hashCode(name) % FACELESS_TYPES.length;
  return FACELESS_TYPES[idx];
}

// ── Compute level from outlier score ──
export function computeLevel(score: number): { level: string; emoji: string } {
  if (score >= 20) return { level: 'ESPECTRO', emoji: '👁' };
  if (score >= 14) return { level: 'LENDÁRIO', emoji: '💀' }; // Lowered thresholds as per problem 6
  if (score >= 9) return { level: 'CRÍTICO', emoji: '🔴' };
  if (score >= 5) return { level: 'ALTO', emoji: '🟠' };
  if (score >= 2) return { level: 'MÉDIO', emoji: '🟡' };
  return { level: 'WATCHLIST', emoji: '🔵' };
}

// ── Format number for display ──
export function fmtNum(n: number | string): string {
  if (typeof n === 'string') return n; // FIX for problem 1
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString('pt-BR');
}

// ── Build PhantomChannel from API response ──
export function buildChannelFromApi(
  apiChannel: {
    channelId: string;
    name: string;
    handle: string;
    avatar: string;
    description: string;
    subscribers: number;
    totalViews: number;
    videoCount: number;
    avgViews: number;
    country: string;
    publishedAt: string;
    topVideos: { title: string; thumbnail: string; publishedAt?: string }[];
  },
  niche: string,
  index: number,
): PhantomChannel {
  const { channelId, name, handle, avatar, subscribers: subs, totalViews: views, videoCount: vids, avgViews, description } = apiChannel;
  const h = hashCode(channelId);

  // Outlier score: optimized for small channels
  const baseLine = Math.max(subs * 5, 2000); // Higher baseline to avoid ghost scores
  const rawScore = avgViews / baseLine;
  const outlierScore = Math.min(50, Math.max(1, parseFloat((rawScore * 5).toFixed(1))));

  const ft = classifyFacelessType(name, description);
  const lv = computeLevel(outlierScore);

  const engagement = parseFloat(((h % 200) / 10 + 3).toFixed(1));
  const growth7d = (h % 300) + 10;
  const createdMs = apiChannel.publishedAt ? new Date(apiChannel.publishedAt).getTime() : Date.now();
  const ageMonths = (Date.now() - createdMs) / (1000 * 60 * 60 * 24 * 30);
  const expiresHours = 24 + ((h % 120));

  // FIX for problem 5: Revenue based on avgViews + frequency
  const rpm = 4.5;
  const estMonthlyViews = avgViews * 3.5; // Estimated 3-4 videos per month
  const revenueMin = Math.floor(estMonthlyViews * rpm / 1000 * 0.8);
  const revenueMax = Math.floor(estMonthlyViews * rpm / 1000 * 1.5);

  const saturation: PhantomChannel['saturation'] =
    subs < 10_000 ? 'VAZIO' :
      subs < 50_000 ? 'EMERGINDO' :
        subs < 100_000 ? 'CRESCENDO' : 'SATURADO';

  const windowStatus: PhantomChannel['windowStatus'] =
    outlierScore >= 10 ? 'ABERTA' : outlierScore >= 5 ? 'FECHANDO' : 'FECHADA';
  const windowDays = outlierScore >= 10 ? 31 - (h % 10) : outlierScore >= 5 ? 14 - (h % 8) : 3;

  const verdict = outlierScore >= 12 ? 'REPLICAR JÁ' : outlierScore >= 7 ? 'REPLICAR COM ADAPTAÇÃO' : outlierScore >= 3 ? 'OBSERVAR' : 'IGNORAR';
  const verdictType: PhantomChannel['verdictType'] = outlierScore >= 12 ? 'replicate' : outlierScore >= 7 ? 'adapt' : outlierScore >= 3 ? 'inspire' : 'ignore';

  const anomalies: string[] = [];
  if (outlierScore >= 15) anomalies.push('CRESCIMENTO EXPLOSIVO');
  if (avgViews > subs * 20) anomalies.push('VIEWS >> INSCRITOS');
  if (vids < 15 && subs > 10_000) anomalies.push('POUCOS VÍDEOS, ALTO IMPACTO');
  if (ageMonths < 8 && subs > 20_000) anomalies.push('CANAL MUITO NOVO');

  const allStacks = ['ElevenLabs', 'Midjourney', 'CapCut', 'ChatGPT', 'InVideo', 'Canva', 'RunwayML', 'HeyGen', 'Pexels', 'Opus Clip'];
  const stackStart = h % allStacks.length;
  const stack = [allStacks[stackStart], allStacks[(stackStart + 2) % allStacks.length], allStacks[(stackStart + 5) % allStacks.length]];

  const triggers = ['Medo', 'Curiosidade', 'Urgência', 'Pertencimento', 'Choque', 'Nostalgia'];
  const triggerPrimary = triggers[h % triggers.length];

  const titleFormulas = ['[Número] + [Revelação]', '[Pergunta] + [Ação]', '[Fato] + [Segredo]'];
  const thumbPatterns = ['Texto Caps + Filtro', 'Rosto + Seta', 'Split-screen'];
  const uploadPatterns = ['Ter/Sex 18h', 'Diário 12h', 'Seg/Qua/Sex 17h'];
  const audiences = ['Homens 18-34', 'Mulheres 25-44', 'Misto 16-28'];
  const techLevels = ['INICIANTE', 'INTERMEDIÁRIO', 'AVANÇADO'];
  const setupCosts = [[50, 200], [100, 400], [200, 600]];

  // FIX: Duration and view logic
  const topVids = (apiChannel.topVideos || []).slice(0, 6).map((v, i) => {
    const vH = hashCode(v.title + i);
    const pubDate = v.publishedAt ? new Date(v.publishedAt) : new Date(Date.now() - (vH % 30) * 86400000);
    const diffDays = Math.floor((Date.now() - pubDate.getTime()) / 86400000);
    const timeAgo = diffDays === 0 ? 'hoje' : diffDays < 7 ? `há ${diffDays} dias` : `há ${Math.floor(diffDays / 7)} sem.`;
    const duration = `${(vH % 15) + 3}:${(vH % 59).toString().padStart(2, '0')}`;

    // Fix: Avoid division by zero/NaN if avgViews is 0
    const viewsRef = Math.max(1, avgViews);
    const projViews = Math.max(1000, viewsRef + ((vH % viewsRef) - viewsRef / 2));

    return {
      title: v.title || `Vídeo #${i + 1}`,
      thumbnail: v.thumbnail || '',
      views: fmtNum(projViews),
      duration,
      timeAgo,
    };
  });

  return {
    id: channelId,
    name,
    handle: handle || `@${name.replace(/\s/g, '').toLowerCase().slice(0, 20)}`,
    avatar,
    subscribers: subs,
    subscriberLabel: fmtNum(subs),
    totalViews: views,
    totalViewsLabel: fmtNum(views),
    videoCount: vids,
    avgViews,
    engagement,
    growth7d,
    outlierScore,
    facelessType: ft.name,
    facelessTypeCode: ft.code,
    level: lv.level,
    levelEmoji: lv.emoji,
    expiresHours,
    niche,
    stack,
    triggerPrimary,
    revenueMin,
    revenueMax,
    windowStatus,
    windowDays,
    verdict,
    verdictType,
    anomalies,
    topVideos: topVids,
    titleFormula: titleFormulas[h % titleFormulas.length],
    thumbPattern: thumbPatterns[h % thumbPatterns.length],
    uploadPattern: uploadPatterns[h % uploadPatterns.length],
    audience: audiences[h % audiences.length],
    saturation,
    setupCostMin: setupCosts[h % 3][0],
    setupCostMax: setupCosts[h % 3][1],
    techLevel: techLevels[h % 3],
    projection90subs: `~${fmtNum(Math.floor(subs * 2.5))}`,
    channelUrl: `https://youtube.com/channel/${channelId}`,
    likes: Math.floor(avgViews * (0.02 + (h % 50) / 1000)),
    comments: Math.floor(avgViews * (0.002 + (h % 20) / 10000)),
    videoPublishedAt: topVids[0]?.timeAgo || 'recent',
    channelCreatedAt: apiChannel.publishedAt ? new Date(apiChannel.publishedAt).toLocaleDateString('pt-BR') : 'N/A',
  };
}

export const MOCK_INTELLIGENCE = {
  niches: [
    { name: 'True Crime BR', channels: 7, trend: '↑↑' },
    { name: 'Finanças IA', channels: 5, trend: '↑' },
    { name: 'Geopolítica PT', channels: 4, trend: '↑↑↑' },
  ],
  dominantFormats: 'Narração + Imagens IA',
  dominantTriggers: 'Medo (42%)',
  insight: 'Canais novos estão crescendo com vozes naturais da ElevenLabs.',
};
