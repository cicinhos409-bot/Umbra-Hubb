import React, { useState, useRef } from "react";

/* ─────────────────────────────────────────────────────────────
   TikTok Money Calculator — UmbraHub
   Proxy: /api/tiktok_analytics?u=username
   Fallback: demo data
   ───────────────────────────────────────────────────────────── */

// ── helpers ──────────────────────────────────────────────────
function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "—";
  const num = Number(n);
  if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toLocaleString("pt-BR");
}

interface Earnings {
  min: number;
  max: number;
  monthly: number;
  yearly: number;
}

function calcEarnings(followers: number, engagementRate: number): Earnings {
  const f = Number(followers) || 0;
  const e = Number(engagementRate) || 0;

  // Base CPM tier por seguidores
  let baseCPM = 0.02;
  if (f >= 1_000_000) baseCPM = 0.05;
  else if (f >= 500_000) baseCPM = 0.04;
  else if (f >= 100_000) baseCPM = 0.03;

  // Multiplicador de engajamento (taxa normal ~3%)
  const engMultiplier = Math.max(0.5, Math.min(3, e / 3));

  const perPost = f * baseCPM * engMultiplier;
  return {
    min: Math.round(perPost * 0.7),
    max: Math.round(perPost * 1.4),
    monthly: Math.round(perPost * 4 * 0.7),
    yearly: Math.round(perPost * 4 * 12 * 0.7),
  };
}

interface ProfileData {
  author: {
    uniqueId: string;
    nickname: string;
    avatarThumb: string;
    signature: string;
    verified: boolean;
  };
  stats: {
    followerCount: number;
    followingCount: number;
    heartCount: number;
    videoCount: number;
  };
  engagementRate: number;
  isDemo?: boolean;
}

function getDemoData(username: string): ProfileData {
  return {
    author: {
      uniqueId: username,
      nickname: username.charAt(0).toUpperCase() + username.slice(1),
      avatarThumb: "",
      signature: "🌟 Criador de conteúdo · dados de demonstração",
      verified: false,
    },
    stats: {
      followerCount: 283600,
      followingCount: 2,
      heartCount: 12600000,
      videoCount: 30,
    },
    engagementRate: 7.83,
    isDemo: true,
  };
}

// ── component ─────────────────────────────────────────────────
export default function TikTokMoneyCalculator() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProfileData | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState("");
  const [animTrigger, setAnimTrigger] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Manual sliders (when no API data)
  const [manualFollowers, setManualFollowers] = useState(100000);
  const [manualEngagement, setManualEngagement] = useState(5);
  const [manualMode, setManualMode] = useState(false);

  const profile = data?.author || null;
  const stats = data?.stats || null;
  const engRate = (data && !manualMode) ? data.engagementRate : manualEngagement;
  const followers = (data && !manualMode) ? (stats?.followerCount ?? manualFollowers) : manualFollowers;
  const earnings = calcEarnings(followers, engRate);

  async function search() {
    const raw = query.trim().replace(/^@/, "");
    if (!raw) { setError("Digite um nome de usuário"); return; }
    setError("");
    setLoading(true);
    setData(null);
    setManualMode(false);

    try {
      const res = await fetch(`/api/tiktok_analytics?u=${encodeURIComponent(raw)}`, {
        signal: AbortSignal.timeout(10000),
      });
      const json = await res.json();

      if (res.ok && json.author) {
        // Normalize stats
        const s = json.stats || {};
        const eng = json.analytics?.engagementRates?.total_rate
          || json.engagementRate
          || (s.followerCount > 0
            ? Math.min(((s.heartCount / Math.max(s.videoCount, 1)) / s.followerCount * 100), 25)
            : 5);
        setData({ author: json.author, stats: s, engagementRate: parseFloat(eng.toFixed(2)) });
        setIsDemo(false);
      } else {
        throw new Error("no data");
      }
    } catch {
      // fallback demo
      const demo = getDemoData(raw);
      setData(demo);
      setIsDemo(true);
    }

    setLoading(false);
    setAnimTrigger(t => t + 1);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") search();
  }

  const quickExamples = ["charlidamelio", "khaby.lame", "mrbeast", "bella.poarch"];

  return (
    <div style={{ fontFamily: "'DM Sans', 'Nunito', sans-serif", color: "#e8e8f4", lineHeight: 1.6 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .mc-root {
          --bg: #06060f;
          --surface: #0e0e1c;
          --surface2: #141428;
          --border: rgba(255,255,255,0.07);
          --border2: rgba(255,255,255,0.12);
          --text: #e8e8f4;
          --muted: #6b6b8a;
          --accent: #7c5cfc;
          --accent2: #a78bfa;
          --green: #10b981;
          --amber: #f59e0b;
          --red: #ef4444;
          --pink: #ec4899;
        }
        .mc-root * { box-sizing: border-box; margin: 0; padding: 0; }

        /* HERO */
        .mc-hero {
          position: relative;
          padding: 2.5rem 2rem 2rem;
          background: var(--bg);
          border-radius: 18px 18px 0 0;
          overflow: hidden;
          border-bottom: 1px solid var(--border);
        }
        .mc-hero-glow {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 80% at 20% -10%, rgba(124,92,252,0.12) 0%, transparent 70%),
            radial-gradient(ellipse 40% 60% at 90% 110%, rgba(236,72,153,0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .mc-hero-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          mask-image: linear-gradient(to bottom, black, transparent);
          -webkit-mask-image: linear-gradient(to bottom, black, transparent);
        }
        .mc-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; position: relative; }
        .mc-brand-mark {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--accent), var(--pink));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .mc-brand-name {
          font-size: 18px; font-weight: 700; letter-spacing: -0.3px;
          background: linear-gradient(135deg, #fff 40%, var(--accent2));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .mc-hero-title {
          font-size: clamp(1.6rem,3.5vw,2.2rem);
          font-weight: 700; color: #fff; letter-spacing: -0.5px;
          margin-bottom: 0.5rem; position: relative; line-height: 1.2;
        }
        .mc-hero-title span {
          background: linear-gradient(135deg, var(--accent), var(--pink));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .mc-hero-sub { font-size: 14px; color: var(--muted); position: relative; margin-bottom: 1.5rem; }

        /* SEARCH */
        .mc-search-wrap { max-width: 560px; position: relative; }
        .mc-search-box {
          display: flex; align-items: center;
          background: var(--surface);
          border: 1px solid var(--border2);
          border-radius: 14px; overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .mc-search-box:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(124,92,252,0.15);
        }
        .mc-at { padding: 0 16px; color: var(--accent2); font-size: 18px; font-weight: 500; }
        .mc-input {
          flex: 1; background: transparent; border: none; outline: none;
          padding: 13px 8px; color: var(--text);
          font-size: 15px; font-family: 'DM Sans', sans-serif;
        }
        .mc-input::placeholder { color: var(--muted); }
        .mc-btn {
          background: linear-gradient(135deg, var(--accent), #6d28d9);
          border: none; padding: 0 20px; height: 50px;
          color: #fff; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; gap: 7px;
          transition: opacity 0.2s; white-space: nowrap;
        }
        .mc-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .mc-btn:hover:not(:disabled) { opacity: 0.9; }
        .mc-chips { display: flex; gap: 7px; margin-top: 10px; flex-wrap: wrap; position: relative; }
        .mc-chip {
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          color: var(--muted); font-size: 11px;
          padding: 3px 10px; border-radius: 100px;
          cursor: pointer; transition: all 0.2s;
          font-family: 'DM Mono', monospace;
        }
        .mc-chip:hover { background: rgba(124,92,252,0.1); border-color: rgba(124,92,252,0.3); color: var(--accent2); }
        .mc-error { color: var(--red); font-size: 12px; margin-top: 6px; position: relative; }

        /* MANUAL MODE */
        .mc-manual {
          background: var(--surface2); border: 1px solid var(--border);
          border-radius: 14px; padding: 1.25rem; margin-top: 1.25rem;
          position: relative;
        }
        .mc-manual-title { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; font-family: 'DM Mono', monospace; margin-bottom: 1rem; }
        .mc-slider-row { display: flex; align-items: center; gap: 12px; margin-bottom: 1rem; }
        .mc-slider-label { font-size: 12px; color: var(--muted); min-width: 80px; }
        .mc-slider {
          flex: 1; accent-color: var(--accent);
          height: 4px; cursor: pointer;
        }
        .mc-slider-val { font-size: 12px; color: var(--accent2); font-family: 'DM Mono', monospace; min-width: 56px; text-align: right; }

        /* CONTAINER */
        .mc-container { max-width: 800px; margin: 0 auto; padding: 1.5rem; }

        /* DEMO NOTICE */
        .mc-notice {
          border-radius: 10px; padding: 10px 14px;
          font-size: 12px; margin-bottom: 1.25rem;
          display: flex; align-items: center; gap: 8px;
        }
        .mc-notice-warn {
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.2);
          color: #fcd34d;
        }
        .mc-notice-info {
          background: rgba(16,185,129,0.07);
          border: 1px solid rgba(16,185,129,0.18);
          color: #6ee7b7;
        }

        /* PROFILE */
        .mc-profile {
          background: var(--surface); border: 1px solid var(--border2);
          border-radius: 16px; padding: 18px;
          display: flex; align-items: flex-start; gap: 16px;
          margin-bottom: 14px; position: relative; overflow: hidden;
          animation: mcFadeUp 0.4s ease both;
        }
        .mc-profile::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(124,92,252,0.05) 0%, transparent 60%);
          pointer-events: none;
        }
        .mc-avatar-init {
          width: 64px; height: 64px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--pink));
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .mc-avatar-img {
          width: 64px; height: 64px; border-radius: 50%;
          object-fit: cover; flex-shrink: 0;
          border: 2px solid rgba(124,92,252,0.4);
        }
        .mc-profile-name { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 7px; }
        .mc-profile-handle { color: var(--accent2); font-size: 12px; font-family: 'DM Mono', monospace; margin: 2px 0 6px; }
        .mc-profile-bio { font-size: 12px; color: var(--muted); max-width: 380px; }
        .mc-verified {
          background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25);
          color: var(--green); font-size: 10px; padding: 2px 6px; border-radius: 100px;
          font-weight: 500;
        }

        /* STATS GRID */
        .mc-stats-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 10px; margin-bottom: 14px;
        }
        .mc-stat {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 12px; padding: 14px;
          text-align: center; animation: mcFadeUp 0.4s ease both;
          transition: border-color 0.2s;
        }
        .mc-stat:hover { border-color: var(--border2); }
        .mc-stat-label {
          font-size: 10px; color: var(--muted);
          text-transform: uppercase; letter-spacing: 0.8px;
          margin-bottom: 7px; font-family: 'DM Mono', monospace;
        }
        .mc-stat-val { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }

        /* EARNINGS CARD — the star */
        .mc-earn-wrap { margin-bottom: 14px; }
        .mc-earn-card {
          background: linear-gradient(135deg, var(--surface), var(--surface2));
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 18px; padding: 22px;
          position: relative; overflow: hidden;
          animation: mcFadeUp 0.4s 0.1s ease both;
        }
        .mc-earn-glow {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 60% at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .mc-earn-title {
          font-size: 11px; font-weight: 600; color: var(--green);
          text-transform: uppercase; letter-spacing: 1px;
          margin-bottom: 14px; font-family: 'DM Mono', monospace;
          position: relative; display: flex; align-items: center; gap: 7px;
        }
        .mc-earn-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 14px; position: relative;
        }
        .mc-earn-item { text-align: center; }
        .mc-earn-item-label { font-size: 10px; color: var(--muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'DM Mono', monospace; }
        .mc-earn-item-val {
          font-size: clamp(1.2rem, 2.5vw, 1.8rem);
          font-weight: 700; letter-spacing: -0.5px;
          color: var(--green);
        }
        .mc-earn-item-sub { font-size: 10px; color: var(--muted); margin-top: 3px; }
        .mc-earn-sep {
          position: absolute; top: 0; bottom: 0;
          left: 33.33%; width: 1px;
          background: var(--border); pointer-events: none;
        }
        .mc-earn-sep2 {
          position: absolute; top: 0; bottom: 0;
          left: 66.66%; width: 1px;
          background: var(--border); pointer-events: none;
        }

        /* ENGAGEMENT BAR */
        .mc-eng-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 16px; margin-bottom: 14px;
          animation: mcFadeUp 0.4s 0.15s ease both;
        }
        .mc-eng-title {
          font-size: 11px; font-weight: 600; color: var(--muted);
          text-transform: uppercase; letter-spacing: 1px;
          margin-bottom: 14px; font-family: 'DM Mono', monospace;
          display: flex; align-items: center; gap: 7px;
        }
        .mc-eng-title-bar {
          width: 3px; height: 12px;
          background: linear-gradient(180deg, var(--accent), var(--pink));
          border-radius: 2px; flex-shrink: 0;
        }
        .mc-eng-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .mc-eng-row:last-child { margin-bottom: 0; }
        .mc-eng-name { font-size: 12px; color: var(--muted); width: 80px; flex-shrink: 0; }
        .mc-eng-track { flex: 1; background: rgba(255,255,255,0.05); border-radius: 3px; height: 4px; overflow: hidden; }
        .mc-eng-fill { height: 100%; border-radius: 3px; transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }
        .mc-eng-pct { font-size: 12px; font-weight: 600; color: var(--text); width: 44px; text-align: right; font-family: 'DM Mono', monospace; }

        /* INFO FOOTER */
        .mc-info {
          background: rgba(124,92,252,0.05);
          border: 1px solid rgba(124,92,252,0.15);
          border-radius: 10px; padding: 12px 14px;
          font-size: 11px; color: var(--muted);
          text-align: center;
          animation: mcFadeUp 0.4s 0.2s ease both;
        }

        /* LOADING */
        .mc-loading-wrap { display: flex; flex-direction: column; align-items: center; padding: 3rem; gap: 12px; }
        .mc-spinner {
          width: 38px; height: 38px;
          border: 3px solid rgba(124,92,252,0.2);
          border-top-color: var(--accent);
          border-radius: 50%; animation: mcSpin 0.8s linear infinite;
        }
        .mc-loading-text { color: var(--muted); font-size: 13px; font-family: 'DM Mono', monospace; }

        /* ANIMATIONS */
        @keyframes mcSpin { to { transform: rotate(360deg); } }
        @keyframes mcFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes mcCountUp {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .mc-earn-item-val { animation: mcCountUp 0.5s 0.2s ease both; }

        @media(max-width:640px) {
          .mc-stats-grid { grid-template-columns: 1fr 1fr; }
          .mc-earn-grid { grid-template-columns: 1fr; gap: 18px; }
          .mc-earn-sep, .mc-earn-sep2 { display: none; }
          .mc-hero { padding: 1.5rem 1rem; }
          .mc-container { padding: 1rem; }
          .mc-slider-row { flex-direction: column; align-items: flex-start; gap: 6px; }
          .mc-slider { width: 100%; }
        }
      `}</style>

      <div className="mc-root">
        {/* HERO */}
        <div className="mc-hero">
          <div className="mc-hero-glow" />
          <div className="mc-hero-grid" />
          <div className="mc-brand">
            <div className="mc-brand-mark">💰</div>
            <span className="mc-brand-name">TikTok Money Calculator</span>
          </div>
          <h1 className="mc-hero-title">
            Calculadora de<br /><span>Ganhos TikTok</span>
          </h1>
          <p className="mc-hero-sub">Estime quanto qualquer criador ganha por post patrocinado.</p>

          {/* SEARCH */}
          <div className="mc-search-wrap">
            <div className="mc-search-box">
              <span className="mc-at">@</span>
              <input
                ref={inputRef}
                className="mc-input"
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="nome de usuário..."
                autoComplete="off"
                spellCheck={false}
              />
              <button className="mc-btn" onClick={search} disabled={loading}>
                {loading
                  ? <><span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'mcSpin .8s linear infinite' }} /></>
                  : <>💵 Calcular</>
                }
              </button>
            </div>
            {error && <div className="mc-error">{error}</div>}
            <div className="mc-chips">
              <span style={{ fontSize: 10, color: '#555', fontFamily: "'DM Mono',monospace", alignSelf: 'center' }}>exemplos:</span>
              {quickExamples.map(u => (
                <span key={u} className="mc-chip" onClick={() => { setQuery(u); setError(""); }}>@{u}</span>
              ))}
            </div>
          </div>

          {/* MANUAL TOGGLE */}
          <div style={{ marginTop: '1rem', position: 'relative' }}>
            <button
              onClick={() => setManualMode(m => !m)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#6b6b8a', fontSize: 11, padding: '4px 10px',
                borderRadius: 100, cursor: 'pointer', fontFamily: "'DM Mono',monospace",
              }}
            >
              {manualMode ? '▲ ocultar' : '⚙ calcular manualmente (sem busca)'}
            </button>
            {manualMode && (
              <div className="mc-manual">
                <div className="mc-manual-title">Cálculo manual</div>
                <div className="mc-slider-row">
                  <span className="mc-slider-label">Seguidores</span>
                  <input type="range" className="mc-slider" min="1000" max="10000000" step="1000"
                    value={manualFollowers} onChange={e => setManualFollowers(Number(e.target.value))} />
                  <span className="mc-slider-val">{fmt(manualFollowers)}</span>
                </div>
                <div className="mc-slider-row" style={{ marginBottom: 0 }}>
                  <span className="mc-slider-label">Engajamento</span>
                  <input type="range" className="mc-slider" min="0.5" max="20" step="0.1"
                    value={manualEngagement} onChange={e => setManualEngagement(Number(e.target.value))} />
                  <span className="mc-slider-val">{manualEngagement.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="mc-container">
          {loading && (
            <div className="mc-loading-wrap">
              <div className="mc-spinner" />
              <span className="mc-loading-text">buscando dados do perfil...</span>
            </div>
          )}

          {/* Manual mode result (no API needed) */}
          {!loading && !data && manualMode && (
            <EarningsDisplay key={`manual-${manualFollowers}-${manualEngagement}`} earnings={earnings} engRate={manualEngagement} followers={manualFollowers} isManual />
          )}

          {/* API / demo result */}
          {!loading && data && (
            <div key={animTrigger}>
              {isDemo && (
                <div className="mc-notice mc-notice-warn">
                  ⚠️ Exibindo dados de demonstração para <strong style={{ marginLeft: 4 }}>@{profile?.uniqueId}</strong>. Servidor retornou dados de exemplo.
                </div>
              )}
              {!isDemo && (
                <div className="mc-notice mc-notice-info">
                  ✓ Dados reais de @{profile?.uniqueId}
                </div>
              )}

              {/* Profile */}
              <div className="mc-profile">
                {profile?.avatarThumb
                  ? <img className="mc-avatar-img" src={profile.avatarThumb} alt={profile.nickname} onError={(e: any) => e.target.style.display='none'} />
                  : <div className="mc-avatar-init">{(profile?.nickname || '?')[0].toUpperCase()}</div>
                }
                <div>
                  <div className="mc-profile-name">
                    {profile?.nickname || profile?.uniqueId}
                    {profile?.verified && <span className="mc-verified">✓ verificado</span>}
                  </div>
                  <div className="mc-profile-handle">@{profile?.uniqueId}</div>
                  {profile?.signature && (
                    <div className="mc-profile-bio">{profile.signature}</div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="mc-stats-grid">
                {[
                  { label: 'Seguidores', val: fmt(stats?.followerCount), color: '#a78bfa' },
                  { label: 'Total curtidas', val: fmt(stats?.heartCount), color: '#e8e8f4' },
                  { label: 'Vídeos', val: stats?.videoCount ?? '—', color: '#f59e0b' },
                  { label: 'Seguindo', val: stats?.followingCount ?? '—', color: '#10b981' },
                ].map((s, i) => (
                  <div key={s.label} className="mc-stat" style={{ animationDelay: `${0.05 * i}s` }}>
                    <div className="mc-stat-label">{s.label}</div>
                    <div className="mc-stat-val" style={{ color: s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>

              <EarningsDisplay
                earnings={earnings}
                engRate={engRate}
                followers={followers}
              />
            </div>
          )}

          {/* Empty state */}
          {!loading && !data && !manualMode && (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#333' }}>
              <div style={{ fontSize: 42, marginBottom: '1rem', opacity: 0.15 }}>💵</div>
              <div style={{ fontSize: 16, color: '#555', marginBottom: 6 }}>Nenhum perfil analisado</div>
              <div style={{ fontSize: 12, color: '#444', fontFamily: "'DM Mono',monospace" }}>// digite um usuário acima ou use o cálculo manual</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── sub-component: earnings display ──────────────────────────
const EarningsDisplay: React.FC<{ earnings: Earnings, engRate: number, followers: number, isManual?: boolean }> = ({ earnings, engRate, followers, isManual = false }) => {
  const engColor = engRate >= 6 ? "#00c27b" : engRate >= 3 ? "#f59e0b" : "#ef4444";

  return (
    <>
      {/* EARNINGS STAR CARD */}
      <div className="mc-earn-wrap">
        <div className="mc-earn-card">
          <div className="mc-earn-glow" />
          <div className="mc-earn-title">
            <span style={{ display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 6px #10b981',flexShrink:0 }} />
            💰 Ganhos estimados por post patrocinado
          </div>
          <div className="mc-earn-grid" style={{ position: 'relative' }}>
            <div className="mc-earn-sep" />
            <div className="mc-earn-sep2" />
            <div className="mc-earn-item">
              <div className="mc-earn-item-label">Mínimo</div>
              <div className="mc-earn-item-val" style={{ color: '#10b981' }}>${earnings.min.toLocaleString()}</div>
              <div className="mc-earn-item-sub">USD por post</div>
            </div>
            <div className="mc-earn-item">
              <div className="mc-earn-item-label">Máximo</div>
              <div className="mc-earn-item-val" style={{ color: '#34d399', fontSize: 'clamp(1.4rem,3vw,2.1rem)' }}>${earnings.max.toLocaleString()}</div>
              <div className="mc-earn-item-sub">USD por post</div>
            </div>
            <div className="mc-earn-item">
              <div className="mc-earn-item-label">Mensal est.</div>
              <div className="mc-earn-item-val" style={{ color: '#6ee7b7', fontSize: 'clamp(1rem,2vw,1.4rem)' }}>${earnings.monthly.toLocaleString()}</div>
              <div className="mc-earn-item-sub">~4 posts/mês</div>
            </div>
          </div>
          {isManual && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 11, color: '#6b6b8a', fontFamily: "'DM Mono',monospace", textAlign: 'center' }}>
              Cálculo manual · {(followers/1000).toFixed(0)}K seguidores · {engRate.toFixed(1)}% engajamento
            </div>
          )}
        </div>
      </div>

      {/* ENGAGEMENT BARS */}
      <div className="mc-eng-card">
        <div className="mc-eng-title">
          <span className="mc-eng-title-bar" />
          Análise de engajamento
        </div>
        {[
          { label: 'Taxa engaj.', val: engRate, max: 15, color: engColor },
          { label: 'Influência', val: Math.min(100, Math.log10(followers + 1) * 15), max: 100, color: '#7c5cfc' },
          { label: 'Monetiz.', val: Math.min(100, earnings.max / 50), max: 100, color: '#ec4899' },
        ].map(item => (
          <div key={item.label} className="mc-eng-row">
            <span className="mc-eng-name">{item.label}</span>
            <div className="mc-eng-track">
              <div
                className="mc-eng-fill"
                style={{
                  width: `${Math.min(100, (item.val / item.max) * 100).toFixed(1)}%`,
                  background: item.color,
                }}
              />
            </div>
            <span className="mc-eng-pct">
              {item.label === 'Taxa engaj.' ? `${engRate.toFixed(2)}%` : `${Math.round(item.val)}%`}
            </span>
          </div>
        ))}
      </div>

      {/* INFO */}
      <div className="mc-info">
        💡 Estimativa baseada em seguidores + taxa de engajamento. Os valores reais variam por nicho, país e negociação com marcas.
        <br />
        <span style={{ fontSize: 10, opacity: 0.6 }}>Fórmula: seguidores × CPM × multiplicador engajamento. Dados públicos via Countik API.</span>
      </div>
    </>
  );
}
