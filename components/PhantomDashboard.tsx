import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertTriangle, Search, Target } from 'lucide-react';
import {
  PHANTOM_NICHES, SORT_OPTIONS,
  type PhantomChannel,
  buildChannelFromApi,
} from './phantom/phantomData';
import {
  AgentStatusBar,
  NetworkAlertBanner, NicheAlertBanner,
} from './phantom/PhantomParts';
import ChannelCard from './ChannelCard';

const PhantomDashboard: React.FC = () => {
  const [sortBy, setSortBy] = useState('Maior Outlier Score');
  const [allChannels, setAllChannels] = useState<PhantomChannel[]>([]);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showNetworkAlert, setShowNetworkAlert] = useState(true);
  const [showNicheAlert, setShowNicheAlert] = useState(true);
  const [selectedNiche, setSelectedNiche] = useState('true crime');
  const [selectedLang, setSelectedLang] = useState('pt');
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiWarnings, setApiWarnings] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(24);
  const [maxVideos, setMaxVideos] = useState(200);
  const [contentType, setContentType] = useState('Todos');

  const fetchChannels = useCallback(async (niche: string, lang: string) => {
    setIsLoading(true);
    setApiError(null);
    setApiWarnings([]);
    setPageSize(24);
    setIgnoredIds(new Set());

    try {
      const params = new URLSearchParams({ niche, lang });
      const res = await fetch(`/api/yt/phantom?${params.toString()}`);

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`HTTP ${res.status}: ${errBody.slice(0, 200)}`);
      }

      const data = await res.json();
      if (data.errors && data.errors.length > 0) setApiWarnings(data.errors);

      const apiChannels = data.channels || [];
      if (apiChannels.length === 0) {
        setApiError(`Nenhum canal encontrado para "${niche}" em ${lang === 'pt' ? 'Português' : 'Inglês'}.`);
        setAllChannels([]);
        return;
      }

      const channels = apiChannels.map((ch: any, i: number) => buildChannelFromApi(ch, niche, i));
      setAllChannels(channels);
      if (channels.length > 0 && channels[0].outlierScore > 10) {
        setExpandedId(channels[0].id);
      }
    } catch (err: any) {
      setApiError(`Erro ao conectar com o servidor: ${err.message || err}`);
      setAllChannels([]);
    } finally {
      setIsLoading(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchChannels(selectedNiche, selectedLang);
  }, [selectedNiche, selectedLang, fetchChannels]);

  const handleIgnore = (id: string) => {
    setIgnoredIds(prev => {
      const n = new Set(prev);
      n.add(id);
      return n;
    });
    if (expandedId === id) setExpandedId(null);
  };

  const handleToggle = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const totalCount = allChannels.length;
  let channels = allChannels.filter((c: PhantomChannel) => {
    if (ignoredIds.has(c.id)) return false;
    if (c.videoCount > maxVideos) return false;
    if (contentType === '📹 Longos') return c.topVideos.some(v => !v.duration.startsWith('0:'));
    if (contentType === '⚡ Shorts') return c.topVideos.every(v => v.duration.startsWith('0:')) || c.videoCount > 500;
    return true;
  });

  channels.sort((a: PhantomChannel, b: PhantomChannel) => {
    switch (sortBy) {
      case 'Mais Views': return b.totalViews - a.totalViews;
      case 'Maior Crescimento': return b.growth7d - a.growth7d;
      case 'Menor Saturação': {
        const orderMap: Record<string, number> = { 'VAZIO': 0, 'EMERGINDO': 1, 'CRESCENDO': 2, 'SATURADO': 3 };
        return (orderMap[a.saturation] || 0) - (orderMap[b.saturation] || 0);
      }
      default: return b.outlierScore - a.outlierScore;
    }
  });

  const visibleChannels = channels.slice(0, pageSize);

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @keyframes fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fade-up 0.4s ease-out forwards; }
      `}</style>

      {/* STATUS BAR */}
      <AgentStatusBar channelCount={channels.length} totalCount={totalCount} isLoading={isLoading} />

      {/* FILTERS PANEL */}
      <div className="bg-white border border-black rounded-2xl overflow-hidden mb-6">

        {/* Niches header */}
        <div className="bg-black text-white px-8 py-5 flex items-center gap-3">
          <Target className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Protocolo de Extração — Nicho</span>
        </div>

        <div className="p-8 space-y-6 border-b border-gray-100">
          {/* Niche buttons */}
          <div className="flex flex-wrap gap-2">
            {PHANTOM_NICHES.map((n: string, i: number) => (
              <button
                key={n}
                onClick={() => setSelectedNiche(n)}
                title={n.toUpperCase()}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                  selectedNiche === n
                    ? 'bg-black text-white border-black'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-black'
                }`}
              >
                SIGMA-{String(i + 1).padStart(2, '0')}
              </button>
            ))}
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Language toggle */}
            <div className="flex bg-gray-100 border border-gray-200 rounded-xl p-1">
              {['pt', 'en'].map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`px-5 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                    selectedLang === lang ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-5 py-2 text-[10px] font-black uppercase appearance-none cursor-pointer focus:outline-none focus:border-black transition-all text-gray-900"
            >
              {SORT_OPTIONS.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
            </select>

            {/* Rescan */}
            <button
              onClick={() => fetchChannels(selectedNiche, selectedLang)}
              disabled={isLoading}
              className="h-[38px] px-6 rounded-xl bg-black text-white text-[10px] font-black uppercase flex items-center gap-2 hover:bg-gray-900 active:scale-95 transition-all disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Reescanear
            </button>
          </div>
        </div>

        {/* Advanced filters */}
        <div className="px-8 py-5 flex flex-wrap items-center gap-8 bg-gray-50">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Máximo de Vídeos</p>
            <div className="flex gap-2">
              {[20, 50, 100, 200].map(val => (
                <button
                  key={val}
                  onClick={() => setMaxVideos(val)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all border ${
                    maxVideos === val
                      ? 'bg-black text-white border-black'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-black'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Tipo de Conteúdo</p>
            <div className="flex gap-2">
              {['Todos', '📹 Longos', '⚡ Shorts'].map(type => (
                <button
                  key={type}
                  onClick={() => setContentType(type)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all border ${
                    contentType === type
                      ? 'bg-black text-white border-black'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-black'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-black/10 border-t-black rounded-full animate-spin" />
              <Search className="absolute inset-0 m-auto w-6 h-6 text-black/30" />
            </div>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em] text-center">
              Sintonizando Canais Fantasmas...
            </p>
          </div>
        ) : apiError ? (
          <div className="py-20 text-center bg-white border-l-4 border-red-500 rounded-xl p-8 shadow-sm">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h4 className="text-sm font-black text-gray-900 uppercase mb-2">Erro de Coleta</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">{apiError}</p>
          </div>
        ) : channels.length === 0 ? (
          <div className="py-20 text-center bg-black rounded-2xl">
            <p className="text-xs text-white/40 font-black uppercase tracking-widest">Nenhum rastro detectado com estes filtros.</p>
          </div>
        ) : (
          <>
            {showNetworkAlert && <NetworkAlertBanner onDismiss={() => setShowNetworkAlert(false)} />}
            {showNicheAlert && <NicheAlertBanner niche={selectedNiche} count={channels.length} onDismiss={() => setShowNicheAlert(false)} />}

            <div className="grid grid-cols-1 gap-4">
              {visibleChannels.map((ch: PhantomChannel, i: number) => (
                <div key={ch.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <ChannelCard
                    ch={ch}
                    index={i}
                    isExpanded={expandedId === ch.id}
                    onToggle={() => handleToggle(ch.id)}
                    onIgnore={() => handleIgnore(ch.id)}
                  />
                </div>
              ))}
            </div>

            {channels.length > pageSize && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={() => setPageSize(p => p + 24)}
                  className="px-10 py-3 rounded-xl bg-white border border-black text-[10px] font-black uppercase tracking-widest text-black hover:bg-black hover:text-white active:scale-95 transition-all"
                >
                  Carregar mais canais
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PhantomDashboard;
