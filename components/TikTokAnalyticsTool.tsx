import React, { useState, useEffect, useRef } from 'react';

/* ──────────────────────────────────────────────
   TikTok Analytics — Análise de Perfil TikTok
   Versão React/TypeScript para Umbra Hub
   Com proxy server-side via /api/tiktok_analytics
   
   O proxy normaliza a resposta do Countik para:
   {
     author: { uniqueId, nickname, avatarThumb, signature, verified },
     stats:  { followerCount, followingCount, heartCount, videoCount },
     analytics: { ... } | null
   }
   ────────────────────────────────────────────── */

// ── Types ──
interface AuthorData {
  nickname?: string;
  uniqueId?: string;
  signature?: string;
  verified?: boolean;
  avatarThumb?: string;
}

interface StatsData {
  followerCount?: number;
  followingCount?: number;
  heartCount?: number;
  videoCount?: number;
}

interface EngagementRates {
  total_rate?: number;
  likes_rate?: number;
  comments_rate?: number;
  shares_rate?: number;
}

interface Performance {
  avgViews?: number;
  avgLikes?: number;
  avgComments?: number;
  avgShares?: number;
}

interface Earnings {
  min?: number;
  max?: number;
}

interface Hashtag {
  name: string;
  count: number;
}

interface Video {
  id: string;
  desc?: string;
  plays?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  create_date?: number;
  engRate?: number;
}

interface Mention {
  name: string;
  count: number;
}

interface ProfileData {
  author: AuthorData;
  stats: StatsData;
  engagementRates?: EngagementRates;
  performance?: Performance;
  earnings?: Earnings;
  hashtags?: Hashtag[];
  mentions?: Mention[];
  dataset?: number[];
  videos?: Video[];
  analytics?: any;
}

type DataSource = 'server' | 'direct' | 'demo';

// ── Helpers ──
function fmt(n?: number | null): string {
  if (n == null || n === undefined) return '—';
  const num = Number(n);
  if (isNaN(num)) return '—';
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toLocaleString('pt-BR');
}

function fmtDate(ts?: number): string {
  if (!ts) return '';
  return new Date(ts * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function badgeClass(rate?: number): string {
  const r = Number(rate) || 0;
  if (r >= 5) return 'ta-badge-good';
  if (r >= 2) return 'ta-badge-mid';
  return 'ta-badge-low';
}

/**
 * Converte qualquer resposta (proxy normalizado OU Countik direto) para ProfileData.
 * O proxy retorna { author, stats, analytics }.
 * O Countik direto pode retornar { author: { ...campos + stats misturados } }.
 */
function toProfileData(json: any, username: string): ProfileData | null {
  // Formato normalizado do proxy
  if (json?.author?.uniqueId || json?.author?.nickname) {
    const author = json.author || {};
    // Stats podem estar em json.stats (proxy) ou dentro de json.author (Countik direto)
    const stats: StatsData = json.stats || {
      followerCount: json.author?.followerCount || author.followerCount,
      followingCount: json.author?.followingCount || author.followingCount,
      heartCount: json.author?.heartCount || author.heartCount,
      videoCount: json.author?.videoCount || author.videoCount,
    };

    return {
      author: {
        uniqueId: author.uniqueId || author.unique_id || username,
        nickname: author.nickname || author.name || username,
        avatarThumb: author.avatarThumb || author.avatarMedium || '',
        signature: author.signature || author.bio || '',
        verified: Boolean(author.verified),
      },
      stats,
      // Bug 1 Fix: Ensure we take from analytics if available, but also allow top-level for direct Countik
      engagementRates: json.analytics?.engagementRates || json.engagementRates || undefined,
      performance: json.analytics?.performance || json.performance || undefined,
      earnings: json.analytics?.earnings || json.earnings || undefined,
      hashtags: json.analytics?.hashtags || json.hashtags || [],
      mentions: json.analytics?.mentions || json.mentions || [],
      dataset: json.analytics?.dataset || json.dataset || [],
      videos: json.analytics?.videos || json.videos || [],
    };
  }

  // Formato userInfo
  if (json?.userInfo?.user) {
    const u = json.userInfo.user;
    const s = json.userInfo.stats || {};
    return {
      author: {
        uniqueId: u.uniqueId || username,
        nickname: u.nickname || username,
        avatarThumb: u.avatarThumb || '',
        signature: u.signature || '',
        verified: Boolean(u.verified),
      },
      stats: {
        followerCount: s.followerCount || 0,
        followingCount: s.followingCount || 0,
        heartCount: s.heartCount || 0,
        videoCount: s.videoCount || 0,
      },
    };
  }

  return null;
}

function getDemoData(user: string): ProfileData {
  return {
    author: {
      nickname: user.charAt(0).toUpperCase() + user.slice(1),
      uniqueId: user,
      signature: '🌟 Criador de conteúdo • Histórias incríveis todo dia\n👇 Mais conteúdo abaixo',
      verified: false,
      avatarThumb: '',
    },
    stats: {
      followerCount: 283600,
      followingCount: 2,
      heartCount: 12600000,
      videoCount: 30,
    },
    engagementRates: {
      total_rate: 7.83,
      likes_rate: 6.25,
      comments_rate: 0.03,
      shares_rate: 1.55,
    },
    performance: {
      avgViews: 12693608,
      avgLikes: 793911,
      avgComments: 3454,
      avgShares: 196552,
    },
    earnings: { min: 214, max: 336 },
    hashtags: [
      { name: 'sadstory', count: 9 }, { name: 'foodstory', count: 8 },
      { name: 'brainrot', count: 6 }, { name: 'realityshow', count: 1 },
      { name: 'GingerTea', count: 1 }, { name: 'healthy', count: 1 }, { name: 'lifehack', count: 1 },
    ],
    dataset: [6.05, 8.59, 8.25, 4.25, 7.84, 5.08, 6.18, 9.38, 2.49, 2.63],
    videos: [
      { id: '1', desc: '#foodshow #foodstory #veggielovevilla #realityshow', plays: 61200, likes: 3042, comments: 74, shares: 587, create_date: 1774034590, engRate: 6.05 },
      { id: '2', desc: '#sadstory #foodstory', plays: 24000000, likes: 1700000, comments: 9545, shares: 352700, create_date: 1773679177, engRate: 8.59 },
      { id: '3', desc: '#sadstory', plays: 17800000, likes: 1200000, comments: 4700, shares: 264500, create_date: 1773048586, engRate: 8.25 },
      { id: '4', desc: 'Part 2 on YouTube #sadstory #brainrot #foodstory', plays: 41700000, likes: 2900000, comments: 10400, shares: 1000000, create_date: 1772185701, engRate: 9.38 },
      { id: '5', desc: '#sadstory #brainrot #foodstory', plays: 26000000, likes: 1700000, comments: 10500, shares: 328300, create_date: 1772436817, engRate: 7.84 },
    ],
  };
}

// ── Component ──
const RAILWAY_API_URL = 'https://umbra-hubb-production.up.railway.app';

const TikTokAnalyticsTool: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('demo');
  const [searchedUser, setSearchedUser] = useState('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);

  // Load Chart.js dynamically
  useEffect(() => {
    if (!(window as any).Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Check server status on mount — Bug 2 fix: only online if res.ok AND has author data
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch(`${RAILWAY_API_URL}/api/tiktok_analytics?u=tiktok`, {
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data = await res.json();
          setServerStatus(data?.author || data?.stats ? 'online' : 'offline');
        } else {
          // Fallback to Vercel check if Railway is down
          const res2 = await fetch('/api/tiktok_analytics?u=tiktok', {
            signal: AbortSignal.timeout(5000),
          });
          setServerStatus(res2.ok ? 'online' : 'offline');
        }
      } catch {
        setServerStatus('offline');
      }
    };
    checkServer();
  }, []);

  // Render chart when data changes
  useEffect(() => {
    if (!profileData || !chartRef.current) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const dataset = profileData.dataset || [];
    if (!dataset.length) return;

    const labels = [...dataset].reverse().map((_, i) => `#${i + 1}`);
    const vals = [...dataset].reverse();

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Engajamento %',
          data: vals,
          backgroundColor: '#ff3d5a',
          hoverBackgroundColor: '#ff6b8a',
          borderRadius: 6,
          borderWidth: 0,
          barThickness: 'flex',
          maxBarThickness: 45,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 25 }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(14,14,28,0.95)',
            titleColor: '#e8e8f4',
            bodyColor: '#ff3d5a',
            borderColor: 'rgba(255,61,90,0.3)',
            borderWidth: 1,
            displayColors: false,
            callbacks: {
              label: (context: any) => `Engajamento: ${context.parsed.y.toFixed(2)}%`
            }
          },
        },
        scales: {
          x: { 
            grid: { display: false }, 
            ticks: { color: '#6b6b8a', font: { size: 10, family: 'DM Mono' } } 
          },
          y: { 
            display: false,
            grid: { display: false }, 
          },
        },
      },
      plugins: [{
        id: 'datalabels',
        afterDatasetsDraw(chart: any) {
          const { ctx, data } = chart;
          ctx.save();
          ctx.font = 'bold 11px DM Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillStyle = '#ff3d5a';
          chart.getDatasetMeta(0).data.forEach((bar: any, index: number) => {
            const value = data.datasets[0].data[index].toFixed(2) + '%';
            ctx.fillText(value, bar.x, bar.y - 8);
          });
          ctx.restore();
        }
      }]
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [profileData]);

  /**
   * Core search function with 3-tier fallback.
   * Bug 3 fix: check res.ok before parsing, use toProfileData() for normalization.
   */
  const fetchProfile = async (username: string): Promise<{ data: ProfileData; source: DataSource }> => {
    // 1) Try Railway proxy server (Primary - non-blocked)
    try {
      const res = await fetch(`${RAILWAY_API_URL}/api/tiktok_analytics?u=${encodeURIComponent(username)}`, {
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const json = await res.json();
        const parsed = toProfileData(json, username);
        if (parsed) return { data: parsed, source: 'server' };
      }
    } catch { /* try next */ }

    // 2) Try Vercel proxy server (Secondary)
    try {
      const res = await fetch(`/api/tiktok_analytics?u=${encodeURIComponent(username)}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        const json = await res.json();
        const parsed = toProfileData(json, username);
        if (parsed) return { data: parsed, source: 'server' };
      }
    } catch { /* try next */ }

    // 2) Fallback: direct API (may fail due to CORS)
    const directEndpoints = [
      `https://countik.com/api/userinfo?unique_id=${username}`,
      `https://countik.com/api/analytics?unique_id=${username}`,
    ];
    for (const url of directEndpoints) {
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' }, mode: 'cors' });
        if (res.ok) {
          const json = await res.json();
          const parsed = toProfileData(json, username);
          if (parsed) {
            return { data: parsed, source: 'direct' };
          }
        }
      } catch { /* try next */ }
    }

    // 3) Demo data
    return { data: getDemoData(username), source: 'demo' };
  };

  const doSearch = async () => {
    const raw = query.trim().replace(/^@/, '');
    if (!raw) return;

    setLoading(true);
    setSearchedUser(raw);

    const { data, source } = await fetchProfile(raw);
    setDataSource(source);
    setProfileData(data);
    setLoading(false);
  };

  const quickSearch = (u: string) => {
    setQuery(u);
    const raw = u.trim().replace(/^@/, '');
    if (!raw) return;

    setLoading(true);
    setSearchedUser(raw);

    fetchProfile(raw).then(({ data, source }) => {
      setDataSource(source);
      setProfileData(data);
      setLoading(false);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') doSearch();
  };

  // ──────────── RENDER ────────────
  const a = profileData?.author || ({} as AuthorData);
  const st = profileData?.stats || ({} as StatsData);
  const eng = profileData?.engagementRates || ({} as EngagementRates);
  const perf = profileData?.performance || ({} as Performance);
  const earn = profileData?.earnings || ({} as Earnings);
  const tags = profileData?.hashtags || [];
  const mentions = profileData?.mentions || [];
  const videos = profileData?.videos || [];

  const engItems = [
    { label: 'Engajamento geral', val: eng.total_rate || 0, icon: '💥' },
    { label: 'Taxa de curtidas', val: eng.likes_rate || 0, icon: '❤️' },
    { label: 'Taxa de comentários', val: eng.comments_rate || 0, icon: '💬' },
    { label: 'Taxa de Ações', val: eng.shares_rate || 0, icon: '🔗' },
  ];

  const statusDotClass = serverStatus === 'online' ? 'ta-dot-online' : serverStatus === 'offline' ? 'ta-dot-offline' : 'ta-dot-checking';
  const statusText = serverStatus === 'online'
    ? 'proxy online — dados reais ativados'
    : serverStatus === 'offline'
      ? 'proxy indisponível — fallback ativo'
      : 'verificando servidor...';
  const statusColor = serverStatus === 'online' ? '#10b981' : serverStatus === 'offline' ? '#ef4444' : '#6b6b8a';

  return (
    <div className="ta-root">
      <style>{CSS_CODE}</style>

      {/* HERO / SEARCH */}
      <div className="ta-hero">
        <div className="ta-hero-glow" />
        <div className="ta-hero-grid" />

        <div className="ta-brand">
          <div className="ta-brand-mark">📊</div>
          <span className="ta-brand-name">TikAnalytics</span>
          <span className="ta-brand-badge-server">● servidor {serverStatus === 'online' ? 'ativo' : 'local'}</span>
        </div>

        <div className="ta-server-status">
          <span className={`ta-dot ${statusDotClass}`} />
          <span style={{ color: statusColor }}>{statusText}</span>
        </div>

        <div className="ta-search-wrap">
          <div className="ta-search-box">
            <span className="ta-search-at">@</span>
            <input
              className="ta-search-input"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="nome de usuário..."
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              className={`ta-search-btn ${loading ? 'ta-loading' : ''}`}
              onClick={doSearch}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              Analisar
            </button>
          </div>
          <div className="ta-chips">
            <span style={{ fontSize: 11, color: '#333', fontFamily: "'DM Mono',monospace", alignSelf: 'center' }}>exemplos:</span>
            {['aiwithryto', 'mrbeast', 'charlidamelio', 'khaby.lame'].map(u => (
              <span key={u} className="ta-chip" onClick={() => quickSearch(u)}>@{u}</span>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="ta-container">
        {!profileData && !loading && (
          <div className="ta-empty">
            <div className="ta-empty-icon">🎬</div>
            <div className="ta-empty-title">Nenhum perfil carregado</div>
            <div className="ta-empty-sub">// digite um usuário do TikTok acima e pressione Enter</div>
          </div>
        )}

        {loading && (
          <div className="ta-loading-wrap">
            <div className="ta-spinner" />
            <span className="ta-loading-text">buscando dados do perfil...</span>
          </div>
        )}

        {profileData && !loading && (
          <div>
            {/* Notice bar — shows data source */}
            {dataSource === 'demo' && (
              <div className="ta-notice-bar ta-notice-warn">
                ⚠️ Exibindo dados de demonstração para <strong style={{ marginLeft: 4 }}>@{searchedUser}</strong>. O Countik pode estar bloqueando ou o usuário não existe.
              </div>
            )}
            {dataSource === 'direct' && (
              <div className="ta-notice-bar ta-notice-info">
                ✓ Dados obtidos diretamente da API (sem proxy)
              </div>
            )}
            {dataSource === 'server' && (
              <div className="ta-notice-bar ta-notice-info">
                ✓ Dados reais via servidor proxy — <strong>@{searchedUser}</strong>
              </div>
            )}

            {/* Profile Card */}
            <div className="ta-profile-card ta-d1">
              {a.avatarThumb ? (
                <img 
                  className="ta-avatar" 
                  src={a.avatarThumb} 
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  alt={a.nickname} 
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('ta-hidden');
                  }} 
                />
              ) : null}
              <div className={`ta-avatar-init ${a.avatarThumb ? 'ta-hidden' : ''}`}>
                {(a.nickname || '?')[0].toUpperCase()}
              </div>
              <div className="ta-profile-details">
                <div className="ta-profile-name">
                  {a.nickname || a.uniqueId || searchedUser}
                  {a.verified && <span className="ta-verified">✓ verificado</span>}
                </div>
                <div className="ta-profile-handle">@{a.uniqueId || searchedUser}</div>
                {a.signature && (
                  <div className="ta-profile-bio" dangerouslySetInnerHTML={{ __html: a.signature.replace(/\n/g, '<br>') }} />
                )}
                <div className="ta-profile-actions">
                  <a href={`https://tiktok.com/@${a.uniqueId || searchedUser}`} target="_blank" rel="noopener noreferrer" className="ta-btn-visit">
                    ↗ Ver no TikTok
                  </a>
                </div>
              </div>
            </div>

            {/* Stats — Bug 3 fix: reads from data.stats, not data.author */}
            <div className="ta-stats-grid">
              <div className="ta-stat-card ta-d2"><div className="ta-stat-label">Seguidores</div><div className="ta-stat-value ta-c-purple">{fmt(st.followerCount)}</div></div>
              <div className="ta-stat-card ta-d2"><div className="ta-stat-label">Total curtidas</div><div className="ta-stat-value">{fmt(st.heartCount)}</div></div>
              <div className="ta-stat-card ta-d2"><div className="ta-stat-label">Vídeos</div><div className="ta-stat-value ta-c-amber">{st.videoCount ?? '—'}</div></div>
              <div className="ta-stat-card ta-d2"><div className="ta-stat-label">Seguindo</div><div className="ta-stat-value ta-c-green">{st.followingCount ?? '—'}</div></div>
            </div>

            {/* Performance Averages */}
            <div className="ta-section-title">Desempenho médio de vídeo</div>
            <div className="ta-avg-grid ta-d3">
              <div className="ta-pcard"><div className="ta-pcard-label">Média de visualizações</div><div className="ta-pcard-val">{fmt(perf.avgViews)}</div></div>
              <div className="ta-pcard"><div className="ta-pcard-label">Média de curtidas</div><div className="ta-pcard-val">{fmt(perf.avgLikes)}</div></div>
              <div className="ta-pcard"><div className="ta-pcard-label">Média de comentários</div><div className="ta-pcard-val">{fmt(perf.avgComments)}</div></div>
              <div className="ta-pcard"><div className="ta-pcard-label">Média de ações</div><div className="ta-pcard-val">{fmt(perf.avgShares)}</div></div>
            </div>

            {/* Engagement + Chart */}
            <div className="ta-grid2">
              <div className="ta-card ta-d4">
                <div className="ta-card-head"><span className="ta-card-head-bar" />Taxas totais de engajamento</div>
                <div className="ta-eng-list">
                  {engItems.map(item => (
                    <div key={item.label} className="ta-eng-item">
                      <div className="ta-eng-icon">{item.icon}</div>
                      <div>
                        <div className="ta-eng-val">{(item.val || 0).toFixed(2)}%</div>
                        <div className="ta-eng-lab">{item.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ta-card ta-d4">
                <div className="ta-card-head"><span className="ta-card-head-bar" />Engajamento por vídeo</div>
                <div className="ta-chart-box"><canvas ref={chartRef} /></div>
              </div>
            </div>

            {/* Hashtags & Mentions */}
            <div className="ta-grid2">
              <div className="ta-card ta-d5">
                <div className="ta-card-head"><span className="ta-card-head-bar" />Hashtags mais usadas</div>
                <div className="ta-hashtag-horizontal-chart">
                  {tags.slice(0, 5).map(t => (
                    <div key={t.name} className="ta-hchart-row">
                      <div className="ta-hchart-label">#{t.name} ({t.count})</div>
                      <div className="ta-hchart-bar-bg">
                        <div className="ta-hchart-bar-fill" style={{ width: `${(t.count / tags[0].count) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  {!tags.length && <div style={{ color: '#444', fontSize: 13, padding: 10 }}>Nenhuma hashtag encontrada</div>}
                </div>
                <div className="ta-tag-wrap" style={{ marginTop: 15, borderTop: '1px solid var(--ta-border)', paddingTop: 15 }}>
                  {tags.map(t => (
                    <span className="ta-tag" key={t.name}>#{t.name}<span className="ta-tag-count">{t.count}x</span></span>
                  ))}
                </div>
              </div>
              <div className="ta-card ta-d5">
                <div className="ta-card-head"><span className="ta-card-head-bar" />Menções frequentes (@)</div>
                <div className="ta-tag-wrap">
                  {mentions.length ? mentions.map(m => (
                    <span className="ta-tag ta-tag-mention" key={m.name}>@{m.name}<span className="ta-tag-count">{m.count}x</span></span>
                  )) : <span style={{ color: '#444', fontSize: 13 }}>Nenhuma menção encontrada</span>}
                </div>
              </div>
            </div>

            {/* Earnings */}
            {earn.min != null && earn.max != null && (
              <div className="ta-earn-card ta-d6">
                <div className="ta-earn-icon">💰</div>
                <div>
                  <div className="ta-earn-label">Ganhos estimados por post patrocinado</div>
                  <div className="ta-earn-value">${earn.min.toLocaleString('en-US')} — ${earn.max.toLocaleString('en-US')} USD</div>
                  <div className="ta-earn-sub">Estimativa baseada em seguidores + taxa de engajamento média</div>
                </div>
              </div>
            )}

            {/* Posts */}
            <div className="ta-posts-title">
              <span className="ta-card-head-bar" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }} />
              Posts recentes
            </div>
            {videos.slice(0, 8).map((v, i) => (
              <div className="ta-post-item" key={v.id} style={{ animationDelay: `${0.05 * i}s` }}>
                <div className="ta-post-thumb">🎬</div>
                <div className="ta-post-body">
                  <div className="ta-post-top">
                    <div className="ta-post-desc">{v.desc || 'Sem descrição'}</div>
                    <span className={`ta-badge ${badgeClass(v.engRate)}`}>{(v.engRate || 0).toFixed(2)}%</span>
                  </div>
                  
                  {/* Hashtags in post */}
                  {(v.desc || '').match(/#[a-zA-Z0-9_\u00C0-\u00FF]+/g) && (
                    <div className="ta-post-tags">
                      {(v.desc || '').match(/#[a-zA-Z0-9_\u00C0-\u00FF]+/g)?.slice(0, 5).map(tag => (
                        <span key={tag} className="ta-post-tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="ta-post-nums">
                    <div className="ta-pnum" title="Visualizações">👁️ <span className="ta-pnum-val">{fmt(v.plays)}</span></div>
                    <div className="ta-pnum" title="Curtidas">❤️ <span className="ta-pnum-val">{fmt(v.likes)}</span></div>
                    <div className="ta-pnum" title="Comentários">💬 <span className="ta-pnum-val">{fmt(v.comments)}</span></div>
                    <div className="ta-pnum" title="Compartilhamentos">🔗 <span className="ta-pnum-val">{fmt(v.shares)}</span></div>
                  </div>
                  <div className="ta-post-date">{fmtDate(v.create_date)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Scoped CSS ──
const CSS_CODE = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

.ta-root {
  --ta-bg: #06060f;
  --ta-surface: #0e0e1c;
  --ta-surface2: #141428;
  --ta-border: rgba(255,255,255,0.07);
  --ta-border2: rgba(255,255,255,0.12);
  --ta-text: #e8e8f4;
  --ta-muted: #6b6b8a;
  --ta-accent: #ff3d5a;
  --ta-accent2: #ff6b35;
  --ta-green: #10b981;
  --ta-amber: #f59e0b;
  --ta-red: #ef4444;
  --ta-pink: #ec4899;
  font-family: 'DM Sans', sans-serif;
  color: var(--ta-text);
  line-height: 1.6;
}
.ta-hidden { display: none !important; }

.ta-hero {
  position: relative; padding: 2.5rem 1.5rem 2rem; overflow: hidden;
  border-bottom: 1px solid var(--ta-border); background: var(--ta-bg);
  border-radius: 18px 18px 0 0;
}
.ta-hero-glow {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 60% 80% at 20% -10%, rgba(124,92,252,0.12) 0%, transparent 70%),
    radial-gradient(ellipse 40% 60% at 80% 110%, rgba(236,72,153,0.07) 0%, transparent 70%);
}
.ta-hero-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: linear-gradient(to bottom, black, transparent);
  -webkit-mask-image: linear-gradient(to bottom, black, transparent);
}
.ta-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; position: relative; }
.ta-brand-mark {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, var(--ta-accent), var(--ta-pink));
  border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.ta-brand-name {
  font-size: 20px; font-weight: 700; letter-spacing: -0.5px;
  background: linear-gradient(135deg, #fff 40%, var(--ta-accent2));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.ta-brand-badge-server {
  background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3);
  color: var(--ta-green); font-size: 11px; font-weight: 500;
  padding: 2px 8px; border-radius: 100px; font-family: 'DM Mono', monospace;
}
.ta-server-status {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-family: 'DM Mono', monospace;
  margin-bottom: 1.5rem; position: relative;
}
.ta-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.ta-dot-online { background: var(--ta-green); box-shadow: 0 0 6px var(--ta-green); }
.ta-dot-offline { background: var(--ta-red); box-shadow: 0 0 6px var(--ta-red); }
.ta-dot-checking { background: var(--ta-amber); animation: ta-pulse 1s infinite; }
@keyframes ta-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

.ta-search-wrap { max-width: 600px; position: relative; }
.ta-search-box {
  display: flex; align-items: center; background: var(--ta-surface);
  border: 1px solid var(--ta-border2); border-radius: 14px; overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s; width: 100%;
}
.ta-search-box:focus-within { border-color: var(--ta-accent); box-shadow: 0 0 0 3px rgba(124,92,252,0.15); }
.ta-search-at { padding: 0 6px 0 16px; color: var(--ta-accent2); font-size: 18px; font-weight: 500; }
.ta-search-input {
  flex: 1; background: transparent; border: none; outline: none;
  padding: 14px 8px; color: var(--ta-text); font-size: 15px; font-family: 'DM Sans', sans-serif;
}
.ta-search-input::placeholder { color: var(--ta-muted); }
.ta-search-btn {
  background: linear-gradient(135deg, var(--ta-accent), #6d28d9);
  border: none; padding: 0 20px; height: 52px; color: #fff; font-size: 14px; font-weight: 600;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  display: flex; align-items: center; gap: 8px; transition: opacity 0.2s; white-space: nowrap;
}
.ta-search-btn:hover { opacity: 0.9; }
.ta-search-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ta-search-btn.ta-loading svg { animation: ta-spin 0.8s linear infinite; }
.ta-chips { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; position: relative; }
.ta-chip {
  background: rgba(255,255,255,0.04); border: 1px solid var(--ta-border);
  color: var(--ta-muted); font-size: 12px; padding: 4px 10px; border-radius: 100px;
  cursor: pointer; transition: all 0.2s; font-family: 'DM Mono', monospace;
}
.ta-chip:hover { background: rgba(124,92,252,0.1); border-color: rgba(124,92,252,0.3); color: var(--ta-accent2); }

.ta-container { max-width: 1100px; margin: 0 auto; padding: 2rem 0 1rem; }

.ta-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5rem 2rem; text-align: center; }
.ta-empty-icon { font-size: 56px; margin-bottom: 1rem; opacity: 0.2; }
.ta-empty-title { font-size: 18px; color: #555; margin-bottom: 6px; }
.ta-empty-sub { font-size: 13px; color: #444; font-family: 'DM Mono', monospace; }

.ta-loading-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; gap: 14px; }
.ta-spinner { width: 40px; height: 40px; border: 3px solid rgba(124,92,252,0.2); border-top-color: var(--ta-accent); border-radius: 50%; animation: ta-spin 0.8s linear infinite; }
@keyframes ta-spin { to { transform: rotate(360deg); } }
.ta-loading-text { color: var(--ta-muted); font-size: 14px; font-family: 'DM Mono', monospace; }

.ta-notice-bar { border-radius: 10px; padding: 12px 16px; font-size: 13px; margin-bottom: 1.5rem; display: flex; align-items: flex-start; gap: 10px; }
.ta-notice-warn { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); color: #fcd34d; }
.ta-notice-info { background: rgba(16,185,129,0.07); border: 1px solid rgba(16,185,129,0.18); color: #6ee7b7; }

.ta-profile-card { background: var(--ta-surface); border: 1px solid var(--ta-border2); border-radius: 18px; padding: 22px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 18px; position: relative; overflow: hidden; animation: ta-fadeUp 0.4s ease both; }
.ta-profile-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(124,92,252,0.05) 0%, transparent 60%); pointer-events: none; }
.ta-avatar { width: 76px; height: 76px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 2px solid rgba(124,92,252,0.4); }
.ta-avatar-init { width: 76px; height: 76px; border-radius: 50%; background: linear-gradient(135deg, var(--ta-accent), var(--ta-pink)); display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 700; color: #fff; flex-shrink: 0; }
.ta-profile-details { flex: 1; min-width: 0; position: relative; }
.ta-profile-name { font-size: 21px; font-weight: 700; letter-spacing: -0.3px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ta-verified { background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25); color: var(--ta-green); font-size: 11px; padding: 2px 7px; border-radius: 100px; font-weight: 500; }
.ta-profile-handle { color: var(--ta-accent2); font-size: 13px; font-family: 'DM Mono', monospace; margin: 2px 0 8px; }
.ta-profile-bio { font-size: 13px; color: var(--ta-muted); line-height: 1.6; max-width: 420px; }
.ta-profile-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.ta-btn-visit { background: rgba(124,92,252,0.1); border: 1px solid rgba(124,92,252,0.25); color: var(--ta-accent2); font-size: 13px; font-weight: 500; padding: 7px 14px; border-radius: 8px; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; }
.ta-btn-visit:hover { background: rgba(124,92,252,0.2); border-color: var(--ta-accent); }

.ta-c-purple { color: #ff3d5a; }
.ta-c-green { color: var(--ta-green); }
.ta-c-amber { color: var(--ta-amber); }

.ta-section-title { font-size: 14px; font-weight: 700; color: var(--ta-text); margin: 25px 0 15px; letter-spacing: 0.5px; }

.ta-avg-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px; }
.ta-pcard { background: var(--ta-surface); border: 1px solid var(--ta-border); border-radius: 16px; padding: 20px; text-align: center; transition: all 0.3s; animation: ta-fadeUp 0.4s ease both; }
.ta-pcard:hover { border-color: var(--ta-accent); transform: translateY(-2px); }
.ta-pcard-label { font-size: 11px; color: var(--ta-muted); text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px; }
.ta-pcard-val { font-size: 24px; font-weight: 800; color: var(--ta-text); font-family: 'DM Sans', sans-serif; }

.ta-eng-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; padding: 5px; }
.ta-eng-item { background: rgba(255,255,255,0.02); border: 1px solid var(--ta-border); border-radius: 12px; padding: 15px; display: flex; align-items: center; gap: 15px; }
.ta-eng-icon { font-size: 20px; width: 40px; height: 40px; background: rgba(255,61,90,0.08); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.ta-eng-val { font-size: 18px; font-weight: 700; color: var(--ta-accent); }
.ta-eng-lab { font-size: 11px; color: var(--ta-muted); margin-top: 2px; }

.ta-hashtag-horizontal-chart { padding: 5px 0; }
.ta-hchart-row { margin-bottom: 12px; }
.ta-hchart-label { font-size: 12px; color: var(--ta-text); margin-bottom: 5px; font-weight: 500; }
.ta-hchart-bar-bg { height: 10px; background: rgba(255,107,53,0.1); border-radius: 5px; overflow: hidden; }
.ta-hchart-bar-fill { height: 100%; background: linear-gradient(90deg, #ff6b35, #ff3d5a); border-radius: 5px; transition: width 0.8s ease-out; }

.ta-chart-box { height: 220px; position: relative; }
.ta-c-amber { color: var(--ta-amber); }
.ta-c-pink { color: var(--ta-pink); }

.ta-avg-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
.ta-avg-card { background: var(--ta-surface2); border: 1px solid var(--ta-border); border-radius: 12px; padding: 12px; text-align: center; animation: ta-fadeUp 0.4s ease both; }
.ta-avg-label { font-size: 10px; color: var(--ta-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.ta-avg-val { font-size: 17px; font-weight: 600; color: #c4b5fd; }

.ta-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }

.ta-card { background: var(--ta-surface); border: 1px solid var(--ta-border); border-radius: 16px; padding: 18px; animation: ta-fadeUp 0.4s ease both; }
.ta-card-head { font-size: 11px; font-weight: 600; color: var(--ta-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; font-family: 'DM Mono', monospace; }
.ta-card-head-bar { width: 3px; height: 14px; background: linear-gradient(180deg, var(--ta-accent), var(--ta-pink)); border-radius: 2px; flex-shrink: 0; }

.ta-eng-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
.ta-eng-row:last-child { border: none; }
.ta-eng-name { font-size: 13px; color: var(--ta-muted); width: 95px; flex-shrink: 0; display: flex; align-items: center; gap: 7px; }
.ta-eng-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.ta-eng-track { flex: 1; background: rgba(255,255,255,0.05); border-radius: 4px; height: 5px; overflow: hidden; }
.ta-eng-fill { height: 100%; border-radius: 4px; transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }
.ta-eng-pct { font-size: 13px; font-weight: 600; color: var(--ta-text); width: 48px; text-align: right; font-family: 'DM Mono', monospace; }

.ta-chart-box { height: 200px; position: relative; }

.ta-tag-wrap { display: flex; flex-wrap: wrap; gap: 7px; }
.ta-tag { background: rgba(124,92,252,0.08); border: 1px solid rgba(124,92,252,0.18); color: var(--ta-accent2); font-size: 12px; padding: 4px 10px; border-radius: 100px; font-family: 'DM Mono', monospace; transition: all 0.15s; cursor: default; }
.ta-tag:hover { background: rgba(124,92,252,0.18); border-color: rgba(124,92,252,0.35); }
.ta-tag-count { opacity: 0.5; margin-left: 4px; }

.ta-tag-mention { background: rgba(236,72,153,0.06); border-color: rgba(236,72,153,0.15); color: #f472b6; }
.ta-tag-mention:hover { background: rgba(236,72,153,0.15); border-color: rgba(236,72,153,0.3); }

.ta-post-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.ta-post-tag { font-size: 10px; color: var(--ta-accent2); background: rgba(124, 92, 252, 0.08); padding: 1px 6px; border-radius: 4px; }

.ta-earn-card { background: linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.03)); border: 1px solid rgba(16,185,129,0.18); border-radius: 16px; padding: 20px; margin-bottom: 14px; display: flex; align-items: center; gap: 20px; animation: ta-fadeUp 0.4s ease both; }
.ta-earn-icon { font-size: 32px; }
.ta-earn-label { font-size: 11px; color: var(--ta-green); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; font-family: 'DM Mono', monospace; }
.ta-earn-value { font-size: 26px; font-weight: 700; color: var(--ta-green); letter-spacing: -0.5px; }
.ta-earn-sub { font-size: 12px; color: var(--ta-muted); margin-top: 2px; }

.ta-posts-title { font-size: 11px; font-weight: 600; color: var(--ta-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; font-family: 'DM Mono', monospace; }
.ta-post-item { background: var(--ta-surface); border: 1px solid var(--ta-border); border-radius: 14px; padding: 14px; display: flex; gap: 14px; align-items: flex-start; margin-bottom: 10px; transition: all 0.2s; animation: ta-fadeUp 0.4s ease both; }
.ta-post-item:hover { border-color: var(--ta-border2); background: var(--ta-surface2); }
.ta-post-thumb { width: 58px; height: 78px; border-radius: 9px; background: var(--ta-surface2); border: 1px solid var(--ta-border); flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--ta-muted); font-size: 22px; }
.ta-post-body { flex: 1; min-width: 0; }
.ta-post-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px; }
.ta-post-desc { font-size: 13px; color: var(--ta-muted); line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.ta-badge { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 7px; flex-shrink: 0; font-family: 'DM Mono', monospace; }
.ta-badge-good { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); color: var(--ta-green); }
.ta-badge-mid { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: var(--ta-amber); }
.ta-badge-low { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: var(--ta-red); }
.ta-post-nums { display: flex; gap: 14px; flex-wrap: wrap; }
.ta-pnum { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--ta-muted); }
.ta-pnum-val { font-weight: 600; color: #aaa; font-family: 'DM Mono', monospace; }
.ta-post-date { font-size: 11px; color: #444; margin-top: 5px; font-family: 'DM Mono', monospace; }

@keyframes ta-fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.ta-d1 { animation-delay: 0.05s; } .ta-d2 { animation-delay: 0.1s; } .ta-d3 { animation-delay: 0.15s; }
.ta-d4 { animation-delay: 0.2s; } .ta-d5 { animation-delay: 0.25s; } .ta-d6 { animation-delay: 0.3s; }

@media(max-width: 700px) {
  .ta-stats-grid { grid-template-columns: 1fr 1fr; }
  .ta-avg-grid { grid-template-columns: 1fr 1fr; }
  .ta-grid2 { grid-template-columns: 1fr; }
  .ta-profile-card { flex-direction: column; align-items: center; text-align: center; gap: 15px; }
  .ta-hero { padding: 2rem 1rem 1.5rem; }
  .ta-search-btn { padding: 0 12px; font-size: 13px; }
  .ta-profile-bio { max-width: 100%; }
}
`;

export default TikTokAnalyticsTool;
