import React, { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────
   TikTok Video Counter — UmbraHub
   Proxy: /api/tiktok_video?url=<tiktok_url>
   Auto-refresh: 30s | Shows delta since session start
   ───────────────────────────────────────────────────────────── */

// ── types ─────────────────────────────────────────────────────
interface VideoStats {
  play_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
}

interface VideoData {
  video_id: string;
  desc: string;
  create_time: number | null;
  stats: VideoStats;
  author: {
    unique_id: string;
    nickname: string;
    avatar_thumb: string;
    verified: boolean;
  };
  fetched_at: number;
}

// ── helpers ───────────────────────────────────────────────────
function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "—";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)         return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString("pt-BR");
}

function fmtDelta(n: number): string {
  if (n === 0) return "";
  return (n > 0 ? "+" : "") + fmt(n);
}

function isValidTikTokUrl(url: string): boolean {
  return /tiktok\.com/.test(url);
}

const REFRESH_INTERVAL = 30; // seconds

// ── demo data ─────────────────────────────────────────────────
function getDemoData(videoId: string): VideoData {
  return {
    video_id: videoId || "7417197815434169631",
    desc: "🎵 Vídeo de demonstração — dados de exemplo",
    create_time: null,
    stats: { play_count: 14820000, like_count: 2341000, comment_count: 18400, share_count: 97300 },
    author: { unique_id: "demo_user", nickname: "Demo Creator", avatar_thumb: "", verified: false },
    fetched_at: Date.now(),
  };
}

// ── component ─────────────────────────────────────────────────
export default function TikTokVideoCounter() {
  const [url, setUrl]             = useState("");
  const [loading, setLoading]     = useState(false);
  const [data, setData]           = useState<VideoData | null>(null);
  const [isDemo, setIsDemo]       = useState(false);
  const [error, setError]         = useState("");
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [baseline, setBaseline]   = useState<VideoStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pulse, setPulse]         = useState(false);

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentUrl   = useRef("");

  // ── fetch ──────────────────────────────────────────────────
  const fetchData = useCallback(async (targetUrl: string, isRefresh = false) => {
    if (!targetUrl) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(
        `/api/tiktok_video?url=${encodeURIComponent(targetUrl)}`,
        { signal: AbortSignal.timeout(12000) }
      );
      const json = await res.json();

      if (res.ok && json.stats) {
        setData(json as VideoData);
        setIsDemo(false);
        setError("");
        if (!isRefresh) setBaseline(json.stats);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      } else {
        throw new Error(json.error || "Erro ao buscar dados");
      }
    } catch (err: any) {
      if (!isRefresh) {
        // First load failed → show demo
        const demo = getDemoData("");
        setData(demo);
        setIsDemo(true);
        setBaseline(demo.stats);
        setError("");
      }
      // Refresh failures are silent (keep old data)
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── auto-refresh loop ──────────────────────────────────────
  function startAutoRefresh(targetUrl: string) {
    stopAutoRefresh();
    setCountdown(REFRESH_INTERVAL);

    // countdown ticker
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) return REFRESH_INTERVAL;
        return c - 1;
      });
    }, 1000);

    // data refresh
    intervalRef.current = setInterval(() => {
      fetchData(targetUrl, true);
      setCountdown(REFRESH_INTERVAL);
    }, REFRESH_INTERVAL * 1000);
  }

  function stopAutoRefresh() {
    if (intervalRef.current)  clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }

  useEffect(() => () => stopAutoRefresh(), []);

  // ── search ─────────────────────────────────────────────────
  async function search() {
    const raw = url.trim();
    if (!raw) { setError("Cole a URL do vídeo"); return; }
    if (!isValidTikTokUrl(raw)) { setError("URL inválida — use um link do TikTok"); return; }

    setError("");
    setData(null);
    setBaseline(null);
    currentUrl.current = raw;

    await fetchData(raw, false);
    startAutoRefresh(raw);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") search();
  }

  function manualRefresh() {
    fetchData(currentUrl.current, true);
    setCountdown(REFRESH_INTERVAL);
    // reset interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        fetchData(currentUrl.current, true);
        setCountdown(REFRESH_INTERVAL);
      }, REFRESH_INTERVAL * 1000);
    }
  }

  // ── deltas ─────────────────────────────────────────────────
  const delta = (key: keyof VideoStats): number => {
    if (!data || !baseline) return 0;
    return data.stats[key] - baseline[key];
  };

  const examples = [
    "https://www.tiktok.com/@kamalaharris/video/7417197815434169631",
    "https://vm.tiktok.com/ZMLYJPWBp/",
  ];

  const statsCards = data ? [
    { label: "Visualizações", icon: "👁", key: "play_count"    as keyof VideoStats, color: "#a78bfa", glow: "rgba(167,139,250,0.15)" },
    { label: "Curtidas",      icon: "❤️", key: "like_count"    as keyof VideoStats, color: "#ec4899", glow: "rgba(236,72,153,0.15)"  },
    { label: "Comentários",   icon: "💬", key: "comment_count" as keyof VideoStats, color: "#38bdf8", glow: "rgba(56,189,248,0.15)"  },
    { label: "Compartilhos",  icon: "🔁", key: "share_count"   as keyof VideoStats, color: "#34d399", glow: "rgba(52,211,153,0.15)"  },
  ] : [];

  // countdown ring progress
  const ringProgress = countdown / REFRESH_INTERVAL;

  return (
    <div style={{ fontFamily: "'DM Sans','Nunito',sans-serif", color: "#e8e8f4", lineHeight: 1.6 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        .vc-root {
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
          --pink: #ec4899;
          --red: #ef4444;
        }
        .vc-root * { box-sizing: border-box; margin: 0; padding: 0; }

        /* HERO */
        .vc-hero {
          position: relative; padding: 2.5rem 2rem 2rem;
          background: var(--bg); border-radius: 18px 18px 0 0;
          overflow: hidden; border-bottom: 1px solid var(--border);
        }
        .vc-hero-glow {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 80% at 15% -5%, rgba(124,92,252,0.13) 0%, transparent 70%),
            radial-gradient(ellipse 40% 50% at 85% 105%, rgba(236,72,153,0.08) 0%, transparent 70%);
        }
        .vc-hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: linear-gradient(to bottom, black 40%, transparent);
          -webkit-mask-image: linear-gradient(to bottom, black 40%, transparent);
        }
        .vc-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; position: relative; }
        .vc-brand-mark {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, var(--accent), var(--pink));
          display: flex; align-items: center; justify-content: center; font-size: 18px;
        }
        .vc-brand-name {
          font-size: 18px; font-weight: 700;
          background: linear-gradient(135deg, #fff 40%, var(--accent2));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .vc-hero-title {
          font-size: clamp(1.6rem,3.5vw,2.2rem); font-weight: 700;
          color: #fff; letter-spacing: -0.5px; margin-bottom: 0.4rem;
          position: relative; line-height: 1.2;
        }
        .vc-hero-title span {
          background: linear-gradient(135deg, var(--accent), var(--pink));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .vc-hero-sub { font-size: 13px; color: var(--muted); margin-bottom: 1.5rem; position: relative; }

        /* SEARCH */
        .vc-search-wrap { max-width: 640px; position: relative; }
        .vc-search-box {
          display: flex; align-items: center;
          background: var(--surface); border: 1px solid var(--border2);
          border-radius: 14px; overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .vc-search-box:focus-within {
          border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,92,252,0.15);
        }
        .vc-url-icon { padding: 0 14px; color: var(--muted); font-size: 16px; flex-shrink: 0; }
        .vc-input {
          flex: 1; background: transparent; border: none; outline: none;
          padding: 13px 6px; color: var(--text); font-size: 13px;
          font-family: 'DM Mono', monospace;
        }
        .vc-input::placeholder { color: var(--muted); font-family: 'DM Sans', sans-serif; font-size: 14px; }
        .vc-btn {
          background: linear-gradient(135deg, var(--accent), #6d28d9);
          border: none; padding: 0 20px; height: 50px;
          color: #fff; font-size: 13px; font-weight: 600;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; gap: 7px;
          transition: opacity 0.2s; white-space: nowrap; flex-shrink: 0;
        }
        .vc-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .vc-btn:hover:not(:disabled) { opacity: 0.9; }
        .vc-error { color: var(--red); font-size: 12px; margin-top: 6px; }
        .vc-examples { margin-top: 10px; display: flex; flex-direction: column; gap: 4px; }
        .vc-example-label { font-size: 10px; color: #444; font-family: 'DM Mono', monospace; }
        .vc-example {
          font-size: 11px; color: var(--muted); font-family: 'DM Mono', monospace;
          cursor: pointer; transition: color 0.15s;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 560px;
        }
        .vc-example:hover { color: var(--accent2); }

        /* CONTAINER */
        .vc-container { max-width: 800px; margin: 0 auto; padding: 1.5rem; }

        /* NOTICE */
        .vc-notice {
          border-radius: 10px; padding: 10px 14px; font-size: 12px;
          margin-bottom: 1.25rem; display: flex; align-items: center; gap: 8px;
        }
        .vc-notice-warn { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); color: #fcd34d; }
        .vc-notice-live { background: rgba(16,185,129,0.07); border: 1px solid rgba(16,185,129,0.18); color: #6ee7b7; }

        /* VIDEO CARD */
        .vc-video-card {
          background: var(--surface); border: 1px solid var(--border2);
          border-radius: 16px; padding: 16px 18px;
          display: flex; align-items: flex-start; gap: 14px;
          margin-bottom: 14px; position: relative; overflow: hidden;
          animation: vcFadeUp 0.4s ease both;
        }
        .vc-video-card::before {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(135deg, rgba(124,92,252,0.04) 0%, transparent 60%);
        }
        .vc-avatar-wrap { position: relative; flex-shrink: 0; }
        .vc-avatar {
          width: 52px; height: 52px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--pink));
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 700; color: #fff;
        }
        .vc-avatar-img { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(124,92,252,0.3); }
        .vc-live-dot {
          position: absolute; bottom: 1px; right: 1px;
          width: 12px; height: 12px; border-radius: 50%;
          background: #10b981; border: 2px solid var(--surface);
          animation: vcLivePulse 2s ease-in-out infinite;
        }
        .vc-video-meta { flex: 1; min-width: 0; }
        .vc-video-author { font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .vc-verified { background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.25); color: var(--green); font-size: 10px; padding: 2px 6px; border-radius: 100px; }
        .vc-video-handle { color: var(--accent2); font-size: 11px; font-family: 'DM Mono', monospace; margin: 2px 0 5px; }
        .vc-video-desc { font-size: 12px; color: var(--muted); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .vc-video-id { font-size: 10px; color: #333; font-family: 'DM Mono', monospace; margin-top: 4px; }

        /* REFRESH BAR */
        .vc-refresh-bar {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 14px; background: var(--surface);
          border: 1px solid var(--border); border-radius: 12px;
          padding: 10px 14px;
          animation: vcFadeUp 0.35s ease both;
        }
        .vc-countdown-ring { position: relative; width: 28px; height: 28px; flex-shrink: 0; }
        .vc-countdown-ring svg { transform: rotate(-90deg); }
        .vc-countdown-num {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 600; color: var(--accent2); font-family: 'DM Mono', monospace;
        }
        .vc-refresh-text { flex: 1; font-size: 12px; color: var(--muted); }
        .vc-refresh-status { font-size: 11px; font-family: 'DM Mono', monospace; }
        .vc-refresh-status.refreshing { color: var(--accent2); }
        .vc-refresh-status.ok { color: var(--green); }
        .vc-manual-btn {
          background: rgba(124,92,252,0.1); border: 1px solid rgba(124,92,252,0.25);
          color: var(--accent2); font-size: 11px; padding: 4px 10px;
          border-radius: 8px; cursor: pointer; font-family: 'DM Mono', monospace;
          transition: all 0.2s;
        }
        .vc-manual-btn:hover { background: rgba(124,92,252,0.2); }

        /* STATS GRID */
        .vc-stats-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 10px; margin-bottom: 14px;
        }
        .vc-stat {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 14px; padding: 16px 12px;
          text-align: center; position: relative; overflow: hidden;
          transition: border-color 0.3s, box-shadow 0.3s;
          animation: vcFadeUp 0.4s ease both;
        }
        .vc-stat.pulse {
          border-color: rgba(124,92,252,0.4);
          box-shadow: 0 0 12px rgba(124,92,252,0.1);
        }
        .vc-stat-glow {
          position: absolute; inset: 0; pointer-events: none;
          border-radius: 14px; opacity: 0; transition: opacity 0.3s;
        }
        .vc-stat.pulse .vc-stat-glow { opacity: 1; }
        .vc-stat-icon { font-size: 20px; margin-bottom: 6px; }
        .vc-stat-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 5px; font-family: 'DM Mono', monospace; }
        .vc-stat-val { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .vc-stat-delta {
          font-size: 11px; font-family: 'DM Mono', monospace;
          margin-top: 4px; font-weight: 600;
          transition: all 0.3s;
        }
        .vc-stat-delta.pos { color: #10b981; }
        .vc-stat-delta.neg { color: #ef4444; }
        .vc-stat-delta.zero { color: #333; }

        /* INFO */
        .vc-info {
          background: rgba(124,92,252,0.05); border: 1px solid rgba(124,92,252,0.12);
          border-radius: 10px; padding: 12px 14px;
          font-size: 11px; color: var(--muted); text-align: center;
          animation: vcFadeUp 0.4s 0.2s ease both;
        }

        /* LOADING */
        .vc-loading { display: flex; flex-direction: column; align-items: center; padding: 3.5rem 2rem; gap: 12px; }
        .vc-spinner {
          width: 40px; height: 40px;
          border: 3px solid rgba(124,92,252,0.2); border-top-color: var(--accent);
          border-radius: 50%; animation: vcSpin 0.8s linear infinite;
        }
        .vc-loading-text { color: var(--muted); font-size: 13px; font-family: 'DM Mono', monospace; }

        /* EMPTY */
        .vc-empty { text-align: center; padding: 3.5rem 2rem; color: #333; }
        .vc-empty-icon { font-size: 48px; opacity: 0.1; margin-bottom: 1rem; }
        .vc-empty-title { font-size: 15px; color: #555; margin-bottom: 5px; }
        .vc-empty-sub { font-size: 12px; color: #444; font-family: 'DM Mono', monospace; }

        /* ANIMATIONS */
        @keyframes vcSpin { to { transform: rotate(360deg); } }
        @keyframes vcFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes vcLivePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes vcCountUp {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        .vc-stat-val { animation: vcCountUp 0.4s ease both; }

        @media(max-width: 640px) {
          .vc-stats-grid { grid-template-columns: 1fr 1fr; }
          .vc-hero { padding: 1.5rem 1rem; }
          .vc-container { padding: 1rem; }
          .vc-input { font-size: 11px; }
        }
      `}</style>

      <div className="vc-root">
        {/* ── HERO ───────────────────────────────────────────── */}
        <div className="vc-hero">
          <div className="vc-hero-glow" />
          <div className="vc-hero-grid" />

          <div className="vc-brand">
            <div className="vc-brand-mark">📊</div>
            <span className="vc-brand-name">TikTok Video Counter</span>
          </div>

          <h1 className="vc-hero-title">
            Contador de Vídeo<br /><span>em Tempo Real</span>
          </h1>
          <p className="vc-hero-sub">
            Visualizações, curtidas, comentários e compartilhamentos — atualizado a cada 30s.
          </p>

          {/* SEARCH */}
          <div className="vc-search-wrap">
            <div className="vc-search-box">
              <span className="vc-url-icon">🔗</span>
              <input
                className="vc-input"
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Cole a URL do vídeo TikTok..."
                autoComplete="off"
                spellCheck={false}
              />
              <button className="vc-btn" onClick={search} disabled={loading}>
                {loading
                  ? <span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'vcSpin .8s linear infinite' }} />
                  : <>📊 Monitorar</>
                }
              </button>
            </div>

            {error && <div className="vc-error">{error}</div>}

            <div className="vc-examples">
              <span className="vc-example-label">exemplos:</span>
              {examples.map(ex => (
                <span
                  key={ex}
                  className="vc-example"
                  onClick={() => { setUrl(ex); setError(""); }}
                  title={ex}
                >
                  → {ex}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENT ────────────────────────────────────────── */}
        <div className="vc-container">

          {/* Loading */}
          {loading && (
            <div className="vc-loading">
              <div className="vc-spinner" />
              <span className="vc-loading-text">buscando dados do vídeo...</span>
            </div>
          )}

          {/* Results */}
          {!loading && data && (
            <div>
              {/* Notice */}
              {isDemo ? (
                <div className="vc-notice vc-notice-warn">
                  ⚠️ Exibindo dados de demonstração. Verifique a URL ou tente novamente.
                </div>
              ) : (
                <div className="vc-notice vc-notice-live">
                  <span style={{ width:7,height:7,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 5px #10b981',display:'inline-block',flexShrink:0 }} />
                  Monitorando ao vivo · atualiza em {countdown}s
                </div>
              )}

              {/* Video card */}
              <div className="vc-video-card">
                <div className="vc-avatar-wrap">
                  {data.author.avatar_thumb
                    ? <img className="vc-avatar-img" src={data.author.avatar_thumb} alt={data.author.nickname} onError={(e: any) => e.target.style.display='none'} />
                    : <div className="vc-avatar">{(data.author.nickname || data.author.unique_id || "?")[0].toUpperCase()}</div>
                  }
                  <span className="vc-live-dot" />
                </div>
                <div className="vc-video-meta">
                  <div className="vc-video-author">
                    {data.author.nickname || data.author.unique_id}
                    {data.author.verified && <span className="vc-verified">✓</span>}
                  </div>
                  {data.author.unique_id && (
                    <div className="vc-video-handle">@{data.author.unique_id}</div>
                  )}
                  {data.desc && <div className="vc-video-desc">{data.desc}</div>}
                  <div className="vc-video-id">id: {data.video_id}</div>
                </div>
              </div>

              {/* Refresh bar */}
              {!isDemo && (
                <div className="vc-refresh-bar">
                  {/* SVG countdown ring */}
                  <div className="vc-countdown-ring">
                    <svg width="28" height="28" viewBox="0 0 28 28">
                      <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                      <circle
                        cx="14" cy="14" r="11" fill="none"
                        stroke="#7c5cfc" strokeWidth="2.5"
                        strokeDasharray={`${2 * Math.PI * 11}`}
                        strokeDashoffset={`${2 * Math.PI * 11 * (1 - ringProgress)}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 1s linear' }}
                      />
                    </svg>
                    <span className="vc-countdown-num">{countdown}</span>
                  </div>

                  <span className="vc-refresh-text">
                    Próxima atualização em <strong style={{ color: '#a78bfa' }}>{countdown}s</strong>
                  </span>

                  <span className={`vc-refresh-status ${refreshing ? 'refreshing' : 'ok'}`}>
                    {refreshing ? '↻ atualizando...' : '✓ ao vivo'}
                  </span>

                  <button className="vc-manual-btn" onClick={manualRefresh} disabled={refreshing}>
                    ↻ agora
                  </button>
                </div>
              )}

              {/* Stats grid */}
              <div className="vc-stats-grid">
                {statsCards.map((card, i) => {
                  const d = delta(card.key);
                  const deltaClass = d > 0 ? 'pos' : d < 0 ? 'neg' : 'zero';
                  return (
                    <div
                      key={card.key}
                      className={`vc-stat${pulse ? ' pulse' : ''}`}
                      style={{ animationDelay: `${0.05 * i}s` }}
                    >
                      <div className="vc-stat-glow" style={{ background: card.glow }} />
                      <div className="vc-stat-icon">{card.icon}</div>
                      <div className="vc-stat-label">{card.label}</div>
                      <div className="vc-stat-val" style={{ color: card.color }}>
                        {fmt(data.stats[card.key])}
                      </div>
                      <div className={`vc-stat-delta ${deltaClass}`}>
                        {d !== 0 ? fmtDelta(d) : <span style={{ color: '#222' }}>—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info */}
              <div className="vc-info">
                💡 Os deltas <strong style={{ color: '#a78bfa' }}>(+X)</strong> mostram o crescimento desde que você começou a monitorar.
                <br />
                <span style={{ fontSize: 10, opacity: 0.5 }}>Dados via Countik API · refresh automático a cada 30s</span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !data && (
            <div className="vc-empty">
              <div className="vc-empty-icon">📊</div>
              <div className="vc-empty-title">Nenhum vídeo monitorado</div>
              <div className="vc-empty-sub">// cole a URL de um vídeo TikTok acima</div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
