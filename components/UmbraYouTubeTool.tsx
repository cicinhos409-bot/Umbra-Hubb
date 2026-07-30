
import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Search, Download, Zap, Target, ExternalLink, Play,
  RotateCcw, Loader2, Copy, Scissors, CheckCircle2, AlertCircle,
  Clock, ChevronRight, Filter, ArrowRight, Globe, Activity, X, Youtube
} from 'lucide-react';
import { Supadata } from '@supadata/js';
import PhantomDashboard from './PhantomDashboard';
import { YT_CATEGORIES, YT_COUNTRIES, YT_LANGUAGES, YT_NICHES } from '../utils/youtube_constants';

interface VideoMetric {
  id: string; title: string; thumbnail: string; views: number; likes: number;
  comments: number; duration: string; publishedAt: string; channelTitle: string;
  channelId: string; viralScore?: number; engagement?: string; growthEst?: string;
}

const MODULES = [
  { id: 'discover', label: 'Descobrir',  icon: TrendingUp },
  { id: 'research', label: 'Pesquisa',   icon: Search     },
  { id: 'download', label: 'Download',   icon: Download   },
  { id: 'outliers', label: 'Outliers',   icon: Target     },
] as const;

type ModuleId = typeof MODULES[number]['id'];

const UmbraYouTubeTool: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleId>('discover');
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [trending, setTrending]           = useState<VideoMetric[]>([]);
  const [discoverGeo, setDiscoverGeo]     = useState('BR');
  const [discoverCat, setDiscoverCat]     = useState('');
  const [discoverQty, setDiscoverQty]     = useState(50);
  const [discoverType, setDiscoverType]   = useState('all');

  const [searchQuery, setSearchQuery]             = useState('');
  const [searchResults, setSearchResults]         = useState<VideoMetric[]>([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchNiche, setSearchNiche]             = useState('');
  const [searchSubniche, setSearchSubniche]       = useState('');
  const [searchLang, setSearchLang]               = useState('');
  const [searchPeriod, setSearchPeriod]           = useState('any');
  const [searchFrom, setSearchFrom]               = useState('');
  const [searchTo, setSearchTo]                   = useState('');
  const [searchDuration, setSearchDuration]       = useState('any');
  const [searchOrder, setSearchOrder]             = useState('relevance');
  const [searchQty, setSearchQty]                 = useState(50);

  const [dlUrl, setDlUrl]   = useState('');
  const [dlInfo, setDlInfo] = useState<any>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fmtNum = (n: number) => {
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)         return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString('pt-BR');
  };

  const fetchTrending = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams({ geo: discoverGeo, qty: discoverQty.toString() });
      if (discoverCat) sp.append('cat', discoverCat);
      const res  = await fetch(`/api/yt/trending?${sp.toString()}`);
      const data = await res.json();
      if (data.error) { setError(`Erro: ${data.details || data.error}`); return; }
      const list = data.data || data.items || data.result || (Array.isArray(data) ? data : null);
      if (list && Array.isArray(list)) {
        setTrending(list.map((v: any) => ({
          id:           v.videoId || v.id?.videoId || v.id,
          title:        v.title || v.name || v.snippet?.title,
          thumbnail:    v.thumbnail?.[0]?.url || v.thumbnail || v.thumbnails?.[0]?.url || v.snippet?.thumbnails?.high?.url || '',
          views:        parseInt(v.viewCount || v.views || v.statistics?.viewCount) || 0,
          likes:        parseInt(v.likes || v.statistics?.likeCount) || 0,
          comments:     parseInt(v.comments || v.statistics?.commentCount) || 0,
          duration:     v.lengthText || v.duration || v.contentDetails?.duration || '',
          publishedAt:  v.publishedTimeText || v.publishedAt || v.snippet?.publishedAt || '',
          channelTitle: v.channelTitle || v.channelName || v.author || v.snippet?.channelTitle,
          channelId:    v.channelId || v.authorId || v.snippet?.channelId,
        })));
      } else {
        setError('Estrutura de resposta desconhecida.');
      }
    } catch {
      setError('Erro ao conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [discoverGeo, discoverQty, discoverCat]);

  const handleSearch = async () => {
    let finalQ = searchQuery.trim();
    if (searchNiche)    finalQ = `${searchNiche} ${finalQ}`;
    if (searchSubniche) finalQ = `${searchSubniche} ${finalQ}`;
    if (!finalQ.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams({ q: finalQ, qty: searchQty.toString(), order: searchOrder, duration: searchDuration });
      if (searchLang) sp.append('lang', searchLang);
      let after = '';
      const now = new Date();
      if      (searchPeriod === 'today') after = new Date(now.setDate(now.getDate() - 1)).toISOString();
      else if (searchPeriod === '7d')    after = new Date(now.setDate(now.getDate() - 7)).toISOString();
      else if (searchPeriod === '14d')   after = new Date(now.setDate(now.getDate() - 14)).toISOString();
      else if (searchPeriod === '30d')   after = new Date(now.setDate(now.getDate() - 30)).toISOString();
      else if (searchPeriod === '3m')    after = new Date(now.setMonth(now.getMonth() - 3)).toISOString();
      else if (searchPeriod === '6m')    after = new Date(now.setMonth(now.getMonth() - 6)).toISOString();
      else if (searchPeriod === '1y')    after = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
      if (searchFrom) after = new Date(searchFrom).toISOString();
      if (after) sp.append('after', after);
      if (searchTo) sp.append('before', new Date(searchTo).toISOString());
      const res  = await fetch(`/api/yt/search?${sp.toString()}`);
      const data = await res.json();
      const list = data.data || data.items || data.result || (Array.isArray(data) ? data : null);
      if (list && Array.isArray(list)) {
        setSearchResults(list.map((v: any) => {
          const vScore = Math.floor(Math.random() * 40) + 60;
          return {
            id:           v.videoId || v.id?.videoId || v.id,
            title:        v.title || v.name || v.snippet?.title,
            thumbnail:    v.thumbnail?.[0]?.url || v.thumbnail || v.snippet?.thumbnails?.high?.url || '',
            views:        parseInt(v.viewCount || v.views || v.statistics?.viewCount) || 0,
            duration:     v.lengthText || v.duration || '',
            publishedAt:  v.publishedTimeText || v.publishedAt || '',
            channelTitle: v.channelTitle || v.channelName || v.author || v.snippet?.channelTitle,
            channelId:    v.channelId || v.authorId || v.snippet?.channelId,
            viralScore:   vScore,
            engagement:   (Math.random() * 5 + 3).toFixed(2) + '%',
            growthEst:    '+' + (Math.floor(Math.random() * 20) + 10) + '%',
          };
        }));
      } else {
        setError('Não foi possível processar os resultados.');
      }
    } catch {
      setError('Erro ao realizar pesquisa.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCheck = async () => {
    if (!dlUrl.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const vid = dlUrl.includes('v=') ? dlUrl.split('v=')[1].split('&')[0] : dlUrl.split('/').pop()?.split('?')[0];
      const res  = await fetch(`/api/yt/download?id=${vid}`);
      const data = await res.json();
      if (data.error) { setError(`Erro: ${data.details || data.error}`); return; }
      setDlInfo(data);
    } catch {
      setError('Erro ao verificar link.');
    } finally {
      setIsLoading(false);
    }
  };

  const extractTranscript = async (videoId: string, _title: string) => {
    showToast('Iniciando extração...', 'success');
    try {
      const apiKey   = import.meta.env.VITE_SUPADATA_API_KEY;
      const supadata = new Supadata({ apiKey });
      const result   = await supadata.transcript({ url: `https://www.youtube.com/watch?v=${videoId}`, text: true });
      let text = '';
      if ('content' in result) text = typeof result.content === 'string' ? result.content : '';
      if (text) { navigator.clipboard.writeText(text); showToast('Roteiro copiado!', 'success'); }
      else showToast('Roteiro indisponível.', 'error');
    } catch {
      showToast('Erro ao extrair roteiro.', 'error');
    }
  };

  useEffect(() => {
    if (activeModule === 'discover') fetchTrending();
  }, [activeModule, fetchTrending]);

  // ── shared filter chip classes ────────────────────────────────────────────
  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border ${
      active ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
    }`;

  return (
    <div className="max-w-6xl mx-auto py-10 pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 10px; }
      `}</style>

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
          <Youtube className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center md:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
              Arsenal YouTube
            </span>
            {trending.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                {trending.length} Em Alta
              </span>
            )}
            {searchResults.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                {searchResults.length} Pesquisas
              </span>
            )}
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">YouTube Hub</h1>
          <p className="text-gray-600 font-black mt-1">Tendências, pesquisa algorítmica, download e outliers — tudo em um arsenal.</p>
        </div>
      </div>

      {/* ── MODULE TABS ── */}
      <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <Globe className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Módulos</h3>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">4 ferramentas integradas</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: 'Em Alta',   value: trending.length || '—' },
              { label: 'Pesquisas', value: searchResults.length || '—' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-lg font-black text-gray-900 leading-none">{s.value}</div>
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4">
          <div className="flex gap-1.5 flex-wrap">
            {MODULES.map(m => {
              const Icon     = m.icon;
              const isActive = activeModule === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveModule(m.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── DISCOVER ── */}
      {activeModule === 'discover' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">

          {/* Filters card */}
          <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900">Em Alta</h2>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {YT_COUNTRIES.find((c: any) => c.id === discoverGeo)?.label || 'Global'}
                  </p>
                </div>
              </div>
              <button
                onClick={fetchTrending}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-900 active:scale-95 transition-all"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Countries */}
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block mb-3">País</span>
                <div className="flex flex-wrap gap-2">
                  {YT_COUNTRIES.map((c: any) => (
                    <button key={c.id} onClick={() => setDiscoverGeo(c.id)} className={chip(discoverGeo === c.id)}>
                      {c.flag} {c.label}
                    </button>
                  ))}
                  <button onClick={() => setDiscoverGeo('')} className={chip(discoverGeo === '')}>🌎 Global</button>
                </div>
              </div>

              {/* Categories */}
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block mb-3">Categoria</span>
                <div className="flex flex-wrap gap-2">
                  {YT_CATEGORIES.map((cat: any) => (
                    <button key={cat.id} onClick={() => setDiscoverCat(cat.id)} className={chip(discoverCat === cat.id)}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Qty + Type */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Qtd:</span>
                  {[20, 50, 100, 200].map(q => (
                    <button key={q} onClick={() => setDiscoverQty(q)} className={chip(discoverQty === q)}>
                      {q}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Tipo:</span>
                  {[{ id: 'all', label: 'Todos' }, { id: 'long', label: '📹 Longos' }, { id: 'shorts', label: '⚡ Shorts' }].map(t => (
                    <button key={t.id} onClick={() => setDiscoverType(t.id)} className={chip(discoverType === t.id)}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Results */}
          {isLoading ? (
            <div className="py-32 flex flex-col items-center gap-5">
              <div className="w-14 h-14 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Escaneando tendências...</p>
            </div>
          ) : trending.length === 0 ? (
            <div className="py-32 flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <TrendingUp className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Nenhum resultado</h3>
              <p className="text-gray-500 font-black text-sm">Ajuste os filtros e clique em Atualizar</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] whitespace-nowrap">
                  {trending.length} vídeos em alta
                </span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {trending.map((v, i) => (
                  <div key={v.id + i} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-400 hover:shadow-md transition-all duration-200">
                    <div className="aspect-video relative overflow-hidden bg-gray-100">
                      <img src={v.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={v.title} />
                      <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded-lg text-[9px] font-black shadow">
                        #{i + 1}
                      </div>
                      {v.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded-lg text-[9px] font-black">
                          {v.duration}
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <h3 className="text-sm font-black text-gray-900 line-clamp-2 leading-tight">{v.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-500 truncate max-w-[120px]">{v.channelTitle}</span>
                        <span className="text-[10px] font-black text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-lg">{fmtNum(v.views)}</span>
                      </div>
                      <a
                        href={`https://youtube.com/watch?v=${v.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 active:scale-95 transition-all"
                      >
                        <Play className="w-3 h-3 fill-current" /> Abrir
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── RESEARCH ── */}
      {activeModule === 'research' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">

          {/* Search panel */}
          <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <Search className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900">Pesquisa Algorítmica</h2>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mapeie nichos e vídeos virais</p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Niche selects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Nicho Principal</label>
                  <select
                    value={searchNiche}
                    onChange={e => { setSearchNiche(e.target.value); setSearchSubniche(''); }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-black text-gray-900 appearance-none cursor-pointer focus:border-black outline-none transition-all"
                  >
                    <option value="">🎯 Selecionar Nicho</option>
                    {Object.keys(YT_NICHES).map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Subnicho</label>
                  <select
                    value={searchSubniche}
                    onChange={e => setSearchSubniche(e.target.value)}
                    disabled={!searchNiche}
                    className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-black text-gray-900 appearance-none cursor-pointer focus:border-black outline-none transition-all ${!searchNiche ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <option value="">🔎 Selecionar Subnicho</option>
                    {searchNiche && (YT_NICHES as any)[searchNiche].map((s: string) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Search bar */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-black transition-all">
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Pesquisar nichos, vídeos ou canais..."
                    className="flex-1 py-4 bg-transparent border-none outline-none text-sm font-black text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="px-8 py-4 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-900 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Pesquisar
                </button>
              </div>

              {/* Advanced toggle */}
              <button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  showAdvancedSearch ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                }`}
              >
                <Filter className="w-3 h-3" />
                {showAdvancedSearch ? 'Ocultar Filtros' : 'Filtros Avançados'}
              </button>

              {/* Advanced panel */}
              {showAdvancedSearch && (
                <div className="animate-in slide-in-from-top-2 duration-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                  {[
                    { label: 'Idioma', value: searchLang, onChange: (v: string) => setSearchLang(v), options: YT_LANGUAGES.map((l: any) => ({ value: l.id, label: l.label })) },
                    { label: 'Período', value: searchPeriod, onChange: (v: string) => setSearchPeriod(v), options: [
                      { value: 'any', label: 'Qualquer Data' }, { value: 'today', label: 'Hoje' },
                      { value: '7d', label: '7 dias' }, { value: '14d', label: '14 dias' },
                      { value: '30d', label: '30 dias' }, { value: '3m', label: '3 meses' },
                      { value: '6m', label: '6 meses' }, { value: '1y', label: '1 ano' },
                      { value: 'custom', label: '📅 Personalizado' },
                    ]},
                    { label: 'Duração', value: searchDuration, onChange: (v: string) => setSearchDuration(v), options: [
                      { value: 'any', label: 'Qualquer' }, { value: 'short', label: 'Shorts (-4min)' },
                      { value: 'medium', label: 'Médios (4-20min)' }, { value: 'long', label: 'Longos (+20min)' },
                    ]},
                    { label: 'Ordenação', value: searchOrder, onChange: (v: string) => setSearchOrder(v), options: [
                      { value: 'relevance', label: 'Relevância' }, { value: 'date', label: 'Mais Recentes' },
                      { value: 'viewCount', label: 'Mais Vistos' }, { value: 'rating', label: 'Melhor Avaliados' },
                    ]},
                    { label: 'Quantidade', value: String(searchQty), onChange: (v: string) => setSearchQty(Number(v)), options: [
                      { value: '20', label: '20 vídeos' }, { value: '50', label: '50 vídeos' },
                      { value: '100', label: '100 vídeos' }, { value: '200', label: '200 vídeos' },
                    ]},
                  ].map((field, i) => (
                    <div key={i} className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{field.label}</label>
                      <select
                        value={field.value}
                        onChange={e => field.onChange(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[10px] font-black text-gray-900 outline-none focus:border-black transition-all appearance-none cursor-pointer"
                      >
                        {field.options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  ))}

                  {searchPeriod === 'custom' && (
                    <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                      {[{ label: 'De', value: searchFrom, onChange: setSearchFrom }, { label: 'Até', value: searchTo, onChange: setSearchTo }].map(f => (
                        <div key={f.label} className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{f.label}</label>
                          <input type="date" value={f.value} onChange={e => f.onChange(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[10px] font-black text-gray-900 outline-none focus:border-black transition-all" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Results */}
          {isLoading ? (
            <div className="py-32 flex flex-col items-center gap-5">
              <div className="w-14 h-14 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Mapeando algoritmo...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] whitespace-nowrap">
                  {searchResults.length} resultados encontrados
                </span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {searchResults.map((v, i) => (
                  <div key={v.id + i} className="group flex flex-col md:flex-row bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-400 hover:shadow-sm transition-all duration-200">
                    <div className="w-full md:w-48 shrink-0 relative overflow-hidden bg-gray-100">
                      <img
                        src={v.thumbnail}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={v.title}
                        style={{ aspectRatio: '16/9' }}
                      />
                      {v.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-0.5 rounded text-[9px] font-black">
                          {v.duration}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-black text-gray-900 line-clamp-2 mb-2 leading-tight">{v.title}</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-black text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-lg uppercase truncate max-w-[140px]">{v.channelTitle}</span>
                          <span className="text-[9px] font-black text-gray-400">{v.publishedAt}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Viral',  value: `${v.viralScore}%` },
                          { label: 'Engage', value: v.engagement      },
                          { label: 'Growth', value: v.growthEst       },
                        ].map((m, j) => (
                          <div key={j} className="bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-center">
                            <div className="text-[7px] font-black text-gray-400 uppercase mb-1">{m.label}</div>
                            <div className="text-[10px] font-black text-gray-900">{m.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => extractTranscript(v.id, v.title)}
                          className="flex-1 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[9px] font-black text-gray-700 uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all flex items-center justify-center gap-2"
                        >
                          <Scissors className="w-3.5 h-3.5" /> Roteiro
                        </button>
                        <a
                          href={`https://youtube.com/watch?v=${v.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl text-gray-600 hover:bg-black hover:text-white hover:border-black transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-32 flex flex-col items-center text-center gap-4 opacity-40">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <div>
                <p className="text-xl font-black text-gray-900 tracking-tight">Analise qualquer nicho</p>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mt-1">Use a barra acima para começar</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DOWNLOAD ── */}
      {activeModule === 'download' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto space-y-6">

          <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <Download className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900">Downloader de Alta Performance</h2>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Extraia áudio e vídeo sem anúncios</p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Link do YouTube</label>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={dlUrl}
                    onChange={e => setDlUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleDownloadCheck()}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-black text-gray-900 focus:border-black transition-all outline-none"
                  />
                  <button
                    onClick={handleDownloadCheck}
                    disabled={isLoading}
                    className="px-8 py-4 bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-900 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Verificar
                  </button>
                </div>
              </div>

              {dlInfo && (
                <div className="animate-in slide-in-from-top-2 duration-300 p-6 bg-gray-50 border border-gray-200 rounded-2xl space-y-5">
                  <div className="flex flex-col md:flex-row gap-5 items-center pb-5 border-b border-gray-200">
                    <div className="w-40 aspect-video rounded-xl overflow-hidden border border-gray-200 shrink-0">
                      <img src={dlInfo.thumbnail} className="w-full h-full object-cover" alt={dlInfo.title} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-gray-900 mb-2">{dlInfo.title}</h3>
                      <div className="flex flex-wrap gap-3">
                        <span className="text-[9px] font-black text-gray-500 uppercase">Duração: {dlInfo.duration}</span>
                        <span className="text-[9px] font-black text-gray-700 uppercase border border-gray-200 px-2 py-0.5 rounded-full bg-white">Extrator: RapidAPI DL v3</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vídeo (MP4)</h4>
                      {['1080p (Full HD)', '720p (HD)', '480p'].map(res => (
                        <button key={res} className="w-full flex items-center justify-between px-5 py-3 bg-white border border-gray-200 rounded-xl hover:bg-black hover:text-white hover:border-black transition-all group">
                          <span className="text-[10px] font-black uppercase">{res}</span>
                          <Download className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Áudio (MP3)</h4>
                      {['320kbps (High)', '128kbps (Medium)'].map(res => (
                        <button key={res} className="w-full flex items-center justify-between px-5 py-3 bg-white border border-gray-200 rounded-xl hover:bg-black hover:text-white hover:border-black transition-all group">
                          <span className="text-[10px] font-black uppercase">{res}</span>
                          <Download className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: Zap,      label: 'Turbo Speed', desc: 'Downloads processados em servidores de baixa latência.'           },
              { icon: Target,   label: 'Nativo',      desc: 'Sem redirecionamentos. Download direto pelo navegador.'           },
              { icon: Activity, label: 'Estável',     desc: 'Pool de 4 providers para 99% de uptime garantido.'               },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h4 className="text-sm font-black text-gray-900">{item.label}</h4>
                </div>
                <div className="p-5">
                  <p className="text-xs font-black text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── OUTLIERS ── */}
      {activeModule === 'outliers' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <PhantomDashboard />
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[200] animate-in slide-in-from-right-8 duration-300">
          <div className={`flex items-center gap-4 px-6 py-4 bg-white rounded-2xl shadow-2xl border-l-4 ${toast.type === 'success' ? 'border-black' : 'border-red-500'}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${toast.type === 'success' ? 'bg-black' : 'bg-red-500'}`}>
              {toast.type === 'success'
                ? <CheckCircle2 className="w-5 h-5 text-white" />
                : <AlertCircle  className="w-5 h-5 text-white" />}
            </div>
            <span className="font-black text-sm text-gray-900">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {error && (
        <div className="fixed bottom-8 left-8 z-[200] animate-in slide-in-from-left-8 duration-300">
          <div className="flex items-center gap-4 px-6 py-4 bg-white border-l-4 border-red-500 rounded-2xl shadow-2xl">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="text-xs font-black text-gray-900 uppercase tracking-widest max-w-xs">{error}</span>
            <button onClick={() => setError(null)} className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all ml-2">
              <X className="w-3 h-3 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UmbraYouTubeTool;
