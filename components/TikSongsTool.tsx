import React, { useState, useEffect, useRef } from 'react';

/* ──────────────────────────────────────────────
   Umbra TikSongs — Trending TikTok Songs
   Versão React/TypeScript para Umbra Hub
   Audio previews via iTunes API
   ────────────────────────────────────────────── */

interface Song {
  rank: number;
  title: string;
  artist: string;
  duration: string;
  cover?: string | null;
  tiktokId?: string | null;
}

interface SongsResponse {
  songs: Song[];
  updatedAt: string;
  country: string;
  total: number;
  source: string;
}

const COUNTRIES = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'FR', name: 'França', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemanha', flag: '🇩🇪' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'JP', name: 'Japão', flag: '🇯🇵' },
  { code: 'KR', name: 'Coreia do Sul', flag: '🇰🇷' },
  { code: 'IN', name: 'Índia', flag: '🇮🇳' },
];

const PER_PAGE = 15;

const TikSongsTool: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [country, setCountry] = useState('BR');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Player state
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerStatus, setPlayerStatus] = useState({ type: '', msg: '' });
  const [toast, setToast] = useState<{ show: boolean, msg: string }>({ show: false, msg: '' });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewCache = useRef<Record<string, string | null>>({});

  useEffect(() => {
    fetchSongs(country);
  }, [country]);

  const fetchSongs = async (c: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/songs?country=${c}`);
      const data: SongsResponse = await res.json();
      setSongs(data.songs || []);
      setUpdatedAt(data.updatedAt ? new Date(data.updatedAt).toLocaleDateString('pt-BR') : '—');
    } catch (e) {
      console.error('Erro ao carregar músicas:', e);
    } finally {
      setLoading(false);
    }
  };

  const showToastMsg = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const getItunesPreview = async (title: string, artist: string) => {
    const key = `${title}||${artist}`;
    if (previewCache.current[key] !== undefined) return previewCache.current[key];

    const cleanTitle = title.replace(/\(.*?\)/g, '').replace(/feat\..*/gi, '').trim();
    const query = encodeURIComponent(`${cleanTitle} ${artist.split(' ')[0]}`);

    try {
      const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=5&media=music`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      
      const track = (data.results || []).find((r: any) => r.previewUrl);
      const previewUrl = track ? track.previewUrl : null;
      previewCache.current[key] = previewUrl;
      return previewUrl;
    } catch (e) {
      previewCache.current[key] = null;
      return null;
    }
  };

  const playSong = async (idx: number) => {
    if (isBuffering || !audioRef.current) return;
    const song = songs[idx];
    if (!song) return;

    if (currentIdx === idx && audioRef.current.src) {
      togglePlay();
      return;
    }

    setCurrentIdx(idx);
    setIsBuffering(true);
    setIsPlaying(false);
    setPlayerStatus({ type: 'loading', msg: '⏳ buscando preview...' });

    const url = await getItunesPreview(song.title, song.artist);
    setIsBuffering(false);

    if (url) {
      audioRef.current.src = url;
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        setPlayerStatus({ type: 'playing', msg: '▶ preview 30s — iTunes' });
      } catch (e: any) {
        console.error('[TikSongs] Playback failed:', e);
        setPlayerStatus({ type: 'error', msg: '❌ erro ao reproduzir' });
      }
    } else {
      setPlayerStatus({ type: 'noresult', msg: '🚫 sem preview disponível' });
      showToastMsg(`"${song.title}" — sem preview disponível`);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (currentIdx < 0 || !audioRef.current || !audioRef.current.src) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setPlayerStatus({ type: '', msg: '' });
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setPlayerStatus({ type: 'playing', msg: '▶ preview 30s — iTunes' });
      }).catch(() => {});
    }
  };

  const nextSong = () => playSong((currentIdx + 1) % songs.length);
  const prevSong = () => playSong((currentIdx - 1 + songs.length) % songs.length);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    setDuration(audioRef.current.duration || 0);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setTimeout(nextSong, 600);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  const fmtTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Pagination
  const totalPages = Math.ceil(songs.length / PER_PAGE);
  const startIdx = (currentPage - 1) * PER_PAGE;
  const pageSongs = songs.slice(startIdx, startIdx + PER_PAGE);
  const isFirstPage = currentPage === 1;

  return (
    <div className="ts-root">
      <style>{CSS_CODE}</style>
      <audio 
        ref={audioRef} 
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate} 
        onEnded={handleEnded}
        onError={(e) => {
          console.error('[TikSongs] Audio element error:', e);
          setPlayerStatus({ type: 'error', msg: '❌ erro de áudio' });
          setIsPlaying(false);
        }}
      />

      {/* HERO */}
      <div className="ts-hero">
        <div className="ts-hero-dots" />
        <div className="ts-hero-inner">
          <div className="ts-brand">
            <div className="ts-brand-logo">🎵</div>
            <span className="ts-brand-name">Umbra TikSongs</span>
            <span className="ts-brand-sub">{COUNTRIES.find(c => c.code === country)?.name}</span>
          </div>
          <h1 className="ts-hero-title">Top Músicas em Alta<br /><span>no TikTok Hoje</span></h1>
          <div className="ts-hero-meta">
            <div className="ts-hero-badge"><span className="ts-live-dot" /> Atualizado diariamente</div>
            <div className="ts-hero-badge">🎵 {songs.length} músicas</div>
            <div className="ts-hero-badge">🎧 Preview 30s via iTunes</div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="ts-filter-bar">
        <span className="ts-filter-label">País:</span>
        <select 
          className="ts-country-select" 
          value={country} 
          onChange={e => {
            setCountry(e.target.value);
            setCurrentPage(1);
          }}
        >
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
          ))}
        </select>
        <span className="ts-updated-at">Atualizado: <strong>{updatedAt}</strong> · Previews de 30s via iTunes</span>
      </div>

      {/* PLAYER BAR */}
      <div className={`ts-player-bar ${currentIdx === -1 ? 'ts-hidden' : ''}`}>
        <div className="ts-player-song-info">
          <div className="ts-player-title">{songs[currentIdx]?.title || '—'}</div>
          <div className="ts-player-artist">{songs[currentIdx]?.artist || '—'}</div>
          <div className={`ts-player-status ${playerStatus.type}`}>{playerStatus.msg}</div>
        </div>
        
        <div className="ts-player-controls">
          <button className="ts-ctrl-btn" onClick={prevSong} title="Anterior">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
          </button>
          <button className="ts-ctrl-btn ts-play-main" onClick={togglePlay} disabled={isBuffering}>
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button className="ts-ctrl-btn" onClick={nextSong} title="Próxima">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z"/></svg>
          </button>
        </div>

        <div className="ts-player-progress">
          <span className="ts-time-txt">{fmtTime(currentTime)}</span>
          <div className="ts-progress-track" onClick={seek}>
            <div className="ts-progress-fill" style={{ width: `${(currentTime / (duration || 30)) * 100}%` }} />
          </div>
          <span className="ts-time-txt">{fmtTime(duration || 30)}</span>
        </div>
      </div>

      {/* MAIN LIST */}
      <div className="ts-main">
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#9a7060', fontFamily: 'Inter' }}>
            ⏳ Carregando tendências musicais...
          </div>
        ) : (
          <>
            <div className="ts-list-head">
              <div className="ts-list-title">🔥 Top {songs.length} — {COUNTRIES.find(c => c.code === country)?.name}</div>
              <div className="ts-list-count">{songs.length} músicas · clique para ouvir 30s</div>
            </div>

            <div className="ts-songs-table">
              {/* Top 3 */}
              {isFirstPage && (
                <div className="ts-top3">
                  <div className="ts-top3-title">🏆 Top 3 desta semana</div>
                  {pageSongs.slice(0, 3).map((s, i) => {
                    const idx = songs.indexOf(s);
                    const isActive = currentIdx === idx;
                    const medals = ['🥇', '🥈', '🥉'];
                    const rankCls = ['gold', 'silver', 'bronze'][i];
                    return (
                      <div key={idx} className={`ts-song-row ${isActive ? 'ts-active' : ''}`} onClick={() => playSong(idx)}>
                        <div className={`ts-rank ${rankCls}`}>{medals[i]}</div>
                        <div className="ts-song-cover">
                          {s.cover ? <img src={s.cover} alt="" /> : '🎵'}
                        </div>
                        <div className="ts-song-info">
                          <div className="ts-song-title">{s.title}</div>
                          <div className="ts-song-artist">{s.artist}</div>
                        </div>
                        <div className="ts-song-duration">{s.duration}</div>
                        <button className={`ts-play-btn ${isActive && isPlaying ? 'ts-playing' : ''} ${isActive && isBuffering ? 'ts-loading-spin' : ''}`}>
                          {isActive && isPlaying ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                          ) : isActive && isBuffering ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 1 10 10h-2a8 8 0 0 0-8-8V2z"/></svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Rest of the list */}
              <div className="ts-songs-rest">
                {(isFirstPage ? pageSongs.slice(3) : pageSongs).map(s => {
                  const idx = songs.indexOf(s);
                  const isActive = currentIdx === idx;
                  return (
                    <div key={idx} className={`ts-song-row-reg ${isActive ? 'ts-active' : ''}`} onClick={() => playSong(idx)}>
                      <div className="ts-rank-reg">{s.rank}</div>
                      <div className="ts-cover-sm">
                        {s.cover ? <img src={s.cover} alt="" /> : '🎵'}
                      </div>
                      <div className="ts-song-info">
                        <div className="ts-song-title">{s.title}</div>
                        <div className="ts-song-artist">{s.artist}</div>
                      </div>
                      <div className="ts-song-duration">{s.duration}</div>
                      <button className={`ts-play-btn ${isActive && isPlaying ? 'ts-playing' : ''} ${isActive && isBuffering ? 'ts-loading-spin' : ''}`}>
                        {isActive && isPlaying ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        ) : isActive && isBuffering ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 1 10 10h-2a8 8 0 0 0-8-8V2z"/></svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PAGINATION */}
            <div className="ts-pagination">
              <button 
                className="ts-pag-btn" 
                disabled={currentPage === 1} 
                onClick={() => {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                ← Anterior
              </button>
              <span className="ts-pag-info">Página {currentPage} de {totalPages}</span>
              <button 
                className="ts-pag-btn" 
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Próxima →
              </button>
            </div>
          </>
        )}
      </div>

      {toast.show && <div className="ts-toast ts-show">{toast.msg}</div>}
    </div>
  );
};

const CSS_CODE = `
.ts-root {
  --ts-bg: #06060f; --ts-surface: #0e0e1c; --ts-surface2: #141428;
  --ts-border: rgba(255,255,255,0.07); --ts-border2: rgba(255,255,255,0.12);
  --ts-text: #e8e8f4; --ts-muted: #6b6b8a;
  --ts-accent: #7c5cfc; --ts-accent2: #a78bfa;
  --ts-gold: #f5a623; --ts-radius: 14px;
  background: var(--ts-bg);
  color: var(--ts-text);
  font-family: 'DM Sans', sans-serif;
}

.ts-hidden { display: none !important; }

.ts-hero {
  background: linear-gradient(135deg, #0e0e1c 0%, #06060f 100%);
  padding: 3rem 2rem 2.5rem; position: relative; overflow: hidden;
  border-bottom: 1px solid var(--ts-border);
  border-radius: 18px 18px 0 0;
}
.ts-hero::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse 60% 80% at 20% -10%, rgba(124,92,252,0.12) 0%, transparent 70%),
             radial-gradient(ellipse 40% 60% at 80% 110%, rgba(236,72,153,0.07) 0%, transparent 70%);
  pointer-events: none;
}
.ts-hero-dots { position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px); background-size: 30px 30px; }
.ts-hero-inner { max-width: 1000px; margin: 0 auto; position: relative; }

.ts-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 2rem; }
.ts-brand-logo { width: 38px; height: 38px; background: linear-gradient(135deg, var(--ts-accent), var(--ts-accent2)); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.ts-brand-name { font-size: 20px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
.ts-brand-sub { font-size: 11px; background: rgba(124, 92, 252, 0.15); border: 1px solid rgba(124, 92, 252, 0.3); color: #a78bfa; padding: 2px 8px; border-radius: 100px; }

.ts-hero-title { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 700; color: #fff; margin-bottom: .75rem; letter-spacing: -0.5px; line-height: 1.15; }
.ts-hero-title span { background: linear-gradient(135deg, #fff, var(--ts-accent2)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

.ts-hero-meta { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 1rem; }
.ts-hero-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.04); border: 1px solid var(--ts-border); color: var(--ts-muted); font-size: 12px; padding: 5px 12px; border-radius: 100px; }
.ts-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; animation: tspulse 1.5s infinite; }
@keyframes tspulse { 0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4) } 50% { box-shadow: 0 0 0 5px rgba(16, 185, 129, 0) } }

.ts-filter-bar { background: var(--ts-surface); border-bottom: 1px solid var(--ts-border); padding: .75rem 2rem; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; position: sticky; top: 0; z-index: 99; }
.ts-filter-label { font-size: 12px; color: var(--ts-muted); font-weight: 500; font-family: 'DM Mono', monospace; }
.ts-country-select { background: var(--ts-surface2); border: 1px solid var(--ts-border2); border-radius: 8px; padding: 6px 28px 6px 12px; font-size: 13px; color: var(--ts-text); cursor: pointer; outline: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath stroke='%236b6b8a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m1 1 4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; }
.ts-updated-at { margin-left: auto; font-size: 11px; color: var(--ts-muted); font-style: italic; font-family: 'DM Mono', monospace; }
.ts-updated-at strong { color: var(--ts-accent2); font-style: normal; }

.ts-player-bar {
  background: var(--ts-surface2);
  padding: .85rem 2rem; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  border-bottom: 1px solid var(--ts-border); transition: all 0.3s;
}
.ts-player-song-info { flex: 1; min-width: 0; }
.ts-player-title { font-size: 14px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ts-player-artist { font-size: 12px; color: var(--ts-muted); margin-top: 2px; }
.ts-player-status { font-size: 10px; margin-top: 2px; font-style: italic; font-family: 'DM Mono', monospace; }
.ts-player-status.loading { color: var(--ts-gold); }
.ts-player-status.playing { color: #10b981; }
.ts-player-status.error { color: #ef4444; }
.ts-player-status.noresult { color: var(--ts-muted); }

.ts-player-controls { display: flex; align-items: center; gap: 10px; }
.ts-ctrl-btn { background: rgba(255, 255, 255, 0.05); border: 1px solid var(--ts-border); width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; color: #fff; }
.ts-ctrl-btn:hover:not(:disabled) { background: var(--ts-accent); border-color: var(--ts-accent); transform: scale(1.1); }
.ts-play-main { background: linear-gradient(135deg, var(--ts-accent), #6d28d9); width: 40px; height: 40px; border: none; }
.ts-ctrl-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.ts-player-progress { flex: 1; min-width: 120px; display: flex; align-items: center; gap: 8px; }
.ts-progress-track { flex: 1; height: 4px; background: rgba(255, 255, 255, 0.08); border-radius: 2px; cursor: pointer; position: relative; }
.ts-progress-fill { height: 100%; background: linear-gradient(90deg, var(--ts-accent), var(--ts-accent2)); border-radius: 2px; width: 0%; transition: width 0.1s linear; }
.ts-time-txt { font-size: 11px; color: var(--ts-muted); font-family: 'DM Mono', monospace; white-space: nowrap; min-width: 30px; }

.ts-main { max-width: 1000px; margin: 0 auto; padding: 2rem; }
.ts-list-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.ts-list-title { font-size: 1.1rem; font-weight: 700; color: var(--ts-text); }
.ts-list-count { font-size: 12px; color: var(--ts-muted); font-family: 'DM Mono', monospace; }

.ts-songs-table { background: var(--ts-surface); border-radius: 20px; border: 1px solid var(--ts-border); overflow: hidden; }
.ts-top3 { background: rgba(255, 255, 255, 0.02); border-bottom: 1px solid var(--ts-border); padding: 1.5rem; display: flex; flex-direction: column; gap: 0; }
.ts-top3-title { font-size: 11px; font-weight: 700; color: var(--ts-accent2); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem; display: flex; align-items: center; gap: 6px; font-family: 'DM Mono', monospace; }

.ts-song-row { display: flex; align-items: center; gap: 14px; padding: 12px 10px; border-radius: 12px; cursor: pointer; transition: all 0.18s; position: relative; }
.ts-song-row:hover { background: rgba(124, 92, 252, 0.08); }
.ts-active .ts-song-title { color: var(--ts-accent2); }
.ts-rank { font-size: 1.3rem; font-weight: 700; min-width: 36px; text-align: center; color: var(--ts-muted); }
.ts-rank.gold { color: #f5a623; } .ts-rank.silver { color: #b0b8c8; } .ts-rank.bronze { color: #c07850; }
.ts-song-cover { width: 54px; height: 54px; border-radius: 10px; flex-shrink: 0; background: var(--ts-surface2); border: 1px solid var(--ts-border); display: flex; align-items: center; justify-content: center; font-size: 22px; color: var(--ts-muted); overflow: hidden; }
.ts-song-cover img { width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }
.ts-song-info { flex: 1; min-width: 0; }
.ts-song-title { font-weight: 600; font-size: 14px; color: var(--ts-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px; }
.ts-song-artist { font-size: 12px; color: var(--ts-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ts-song-duration { font-size: 12px; color: var(--ts-muted); font-family: 'DM Mono', monospace; white-space: nowrap; }

.ts-play-btn { width: 36px; height: 36px; border-radius: 50%; background: var(--ts-surface2); border: 1px solid var(--ts-border); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all 0.2s; color: var(--ts-accent2); }
.ts-song-row:hover .ts-play-btn { background: var(--ts-accent); color: #fff; border-color: var(--ts-accent); }
.ts-play-btn.ts-playing { background: var(--ts-accent); color: #fff; border-color: var(--ts-accent); animation: tspulse2 1s infinite; }
.ts-play-btn.ts-loading-spin svg { animation: tssplitspin 0.8s linear infinite; }
@keyframes tspulse2 { 0%, 100% { box-shadow: 0 0 0 0 rgba(124, 92, 252, 0.3) } 50% { box-shadow: 0 0 0 6px rgba(124, 92, 252, 0) } }
@keyframes tssplitspin { to { transform: rotate(360deg) } }

.ts-songs-rest { padding: 0 8px 8px; }
.ts-song-row-reg { display: flex; align-items: center; gap: 12px; padding: 10px 8px; border-radius: 10px; cursor: pointer; transition: all 0.18s; border-bottom: 1px solid var(--ts-border); }
.ts-song-row-reg:last-child { border-bottom: none; }
.ts-song-row-reg:hover { background: rgba(124, 92, 252, 0.05); }
.ts-cover-sm { width: 44px; height: 44px; border-radius: 8px; flex-shrink: 0; background: var(--ts-surface2); border: 1px solid var(--ts-border); display: flex; align-items: center; justify-content: center; font-size: 18px; color: var(--ts-muted); overflow: hidden; }
.ts-cover-sm img { width: 100%; height: 100%; border-radius: inherit; object-fit: cover; }
.ts-rank-reg { font-size: 14px; font-weight: 700; min-width: 28px; text-align: center; color: #333; font-family: 'DM Mono', monospace; }

.ts-pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 2rem 0 0; }
.ts-pag-btn { background: var(--ts-surface); border: 1px solid var(--ts-border); color: var(--ts-text); font-size: 13px; font-weight: 600; padding: 8px 18px; border-radius: 8px; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
.ts-pag-btn:hover:not(:disabled) { background: var(--ts-accent); color: #fff; border-color: var(--ts-accent); }
.ts-pag-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.ts-pag-info { font-size: 13px; color: var(--ts-muted); font-family: 'DM Mono', monospace; }

.ts-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #0e0e1c; color: #fff; font-size: 13px; padding: 10px 20px; border-radius: 100px; border: 1px solid var(--ts-accent); opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 999; white-space: nowrap; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
.ts-toast.ts-show { opacity: 1; }

@media(max-width: 600px) {
  .ts-hero { padding: 2rem 1rem; }
  .ts-main { padding: 1rem; }
  .ts-filter-bar { padding: .75rem 1rem; }
  .ts-player-bar { padding: .75rem 1rem; }
  .ts-song-cover, .ts-cover-sm { display: none; }
  .ts-player-progress { min-width: 80px; }
}
`;

export default TikSongsTool;
