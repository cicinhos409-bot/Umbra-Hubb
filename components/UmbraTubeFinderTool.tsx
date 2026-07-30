
import React, { useState, useEffect } from 'react';
import {
  Search,
  Video,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Key,
  Download,
  Play,
  ExternalLink,
  Filter,
  BarChart3,
  Globe,
  Trash2,
  X
} from 'lucide-react';

interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  publishedAt: string;
  channelCreationDate: string;
  channelTitle: string;
  channelId: string;
}

const UmbraTubeFinderTool: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [keywords, setKeywords] = useState('');
  const [maxResults, setMaxResults] = useState('50');
  const [language, setLanguage] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minViews, setMinViews] = useState('');
  const [minLikes, setMinLikes] = useState('');

  const [results, setResults] = useState<VideoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

  const [sortState, setSortState] = useState<Record<string, boolean>>({
    duration: false, date: false, views: false, likes: false, comments: false, channel: false
  });

  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    duration: true, date: true, views: true, likes: true, comments: true, channel: true
  });

  useEffect(() => {
    const savedYT = localStorage.getItem('ytApiKey');
    const savedGem = localStorage.getItem('geminiApiKey');
    if (savedYT) setApiKey(savedYT);
    if (savedGem) setGeminiKey(savedGem);
  }, []);

  const showToast = (msg: string, type: 'success' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const saveKeys = () => {
    localStorage.setItem('ytApiKey', apiKey);
    localStorage.setItem('geminiApiKey', geminiKey);
    showToast('Chaves salvas com sucesso!', 'success');
  };

  const resetForm = () => {
    setKeywords('');
    setMaxResults('50');
    setLanguage('');
    setCountry('');
    setStartDate('');
    setEndDate('');
    setMinViews('');
    setMinLikes('');
    setResults([]);
    setError(null);
  };

  const formatDuration = (iso: string) => {
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 'N/D';
    const [, h, min, s] = m.map(x => parseInt(x) || 0);
    return `${h ? h + ':' : ''}${(h && min < 10 ? '0' : '') + min}:${s < 10 ? '0' + s : s}`;
  };

  const fmtNum = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toLocaleString('pt-BR');
  };

  const fetchData = async () => {
    if (!keywords.trim()) return setError('Insira palavras-chave para buscar.');
    if (!apiKey.trim()) return setError('Insira sua YouTube API Key para continuar.');

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      let searchKeywords = keywords.trim();

      if (language) {
        try {
          const resTrans = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${language}&dt=t&q=${encodeURIComponent(searchKeywords)}`);
          const dataTrans = await resTrans.json();
          searchKeywords = dataTrans[0].map((p: any) => p[0]).join('');
        } catch (e) {
          console.warn('Falha na tradução da keyword', e);
        }
      }

      const sp = new URLSearchParams({
        key: apiKey,
        part: 'snippet',
        q: searchKeywords,
        type: 'video',
        maxResults: maxResults || '50',
        videoDuration: 'long'
      });
      if (language) sp.append('relevanceLanguage', language);
      if (country) sp.append('regionCode', country);
      if (startDate) sp.append('publishedAfter', `${startDate}T00:00:00Z`);
      if (endDate) sp.append('publishedBefore', `${endDate}T23:59:59Z`);

      const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${sp}`);
      if (!res.ok) throw new Error(res.status === 403 ? 'API Key inválida ou sem permissão (403).' : `Erro na busca: ${res.status}`);

      const data = await res.json();
      if (!data.items?.length) throw new Error('Nenhum vídeo encontrado com esses filtros.');

      const videoIds = data.items.filter((i: any) => i.id?.videoId).map((i: any) => i.id.videoId);
      const channelIds = data.items.filter((i: any) => i.snippet?.channelId).map((i: any) => i.snippet.channelId);

      const [statsRes, chanRes] = await Promise.all([
        fetch(`https://www.googleapis.com/youtube/v3/videos?${new URLSearchParams({ key: apiKey, part: 'snippet,statistics,contentDetails', id: videoIds.join(',') })}`),
        fetch(`https://www.googleapis.com/youtube/v3/channels?${new URLSearchParams({ key: apiKey, part: 'snippet', id: channelIds.join(',') })}`)
      ]);

      const statsData = await statsRes.json();
      const chanData = await chanRes.json();

      const chanMap = new Map();
      chanData.items.forEach((c: any) => chanMap.set(c.id, new Date(c.snippet.publishedAt).toLocaleDateString('pt-BR')));

      const minV = Number(minViews.replace(/\D/g, '')) || 0;
      const minL = Number(minLikes.replace(/\D/g, '')) || 0;

      const videos: VideoResult[] = statsData.items.map((s: any) => ({
        id: s.id,
        title: s.snippet?.title || 'N/D',
        thumbnail: s.snippet?.thumbnails?.high?.url || s.snippet?.thumbnails?.default?.url || '',
        views: Number(s.statistics?.viewCount) || 0,
        likes: Number(s.statistics?.likeCount) || 0,
        comments: Number(s.statistics?.commentCount) || 0,
        duration: formatDuration(s.contentDetails?.duration || ''),
        publishedAt: new Date(s.snippet?.publishedAt).toLocaleDateString('pt-BR') || 'N/D',
        channelCreationDate: chanMap.get(s.snippet?.channelId) || 'N/D',
        channelTitle: s.snippet?.channelTitle || 'N/D',
        channelId: s.snippet?.channelId || ''
      })).filter((v: VideoResult) => v.views >= minV && v.likes >= minL);

      setResults(videos);
      if (videos.length === 0) throw new Error('Nenhum vídeo atingiu as métricas mínimas solicitadas.');

      showToast(`${videos.length} vídeos carregados!`, 'success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSort = (key: string) => {
    const isAsc = !sortState[key];
    setSortState(prev => ({ ...prev, [key]: isAsc }));

    const parseLocalDate = (d: string) => {
      if (!d || d === 'N/D') return new Date(0);
      const [day, mon, yr] = d.split('/');
      return new Date(`${yr}-${mon}-${day}`);
    };

    const durationToSecs = (dur: string) => {
      const p = dur.split(':');
      if (p.length === 3) return +p[0] * 3600 + +p[1] * 60 + +p[2];
      return +p[0] * 60 + +p[1];
    };

    const sorted = [...results].sort((a, b) => {
      let valA: any, valB: any;
      switch (key) {
        case 'duration': valA = durationToSecs(a.duration); valB = durationToSecs(b.duration); break;
        case 'date': valA = parseLocalDate(a.publishedAt); valB = parseLocalDate(b.publishedAt); break;
        case 'views': valA = a.views; valB = b.views; break;
        case 'likes': valA = a.likes; valB = b.likes; break;
        case 'comments': valA = a.comments; valB = b.comments; break;
        case 'channel': valA = parseLocalDate(a.channelCreationDate); valB = parseLocalDate(b.channelCreationDate); break;
        default: return 0;
      }
      return isAsc ? valA - valB : valB - valA;
    });

    setResults(sorted);
  };

  const downloadThumbnail = async (id: string) => {
    const sizes = ['maxresdefault.jpg', 'sddefault.jpg', 'hqdefault.jpg', 'default.jpg'];
    for (const size of sizes) {
      const url = `https://i.ytimg.com/vi/${id}/${size}`;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const blob = await res.blob();
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `thumb_${id}.jpg`;
          a.click();
          return;
        }
      } catch (e) {}
    }
    showToast('Não foi possível baixar a thumbnail.', 'info');
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-24">
      <div className="max-w-7xl mx-auto px-6 pt-10">

        {/* HERO */}
        <section className="bg-black text-white rounded-2xl p-10 md:p-16 mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 border border-white/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 border border-white/5 rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-10">
            <div className="w-20 h-20 md:w-28 md:h-28 bg-white text-black rounded-2xl flex items-center justify-center shrink-0">
              <Search className="w-10 h-10 md:w-14 md:h-14" />
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-[0.3em] mb-5">
                YouTube Data API v3
              </div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-none mb-4">
                Tube Finder
              </h1>

              <p className="text-white/60 text-base md:text-lg font-black max-w-2xl leading-relaxed">
                Descubra os vídeos mais explosivos e virais do YouTube com filtros avançados de métricas e datas.
              </p>
            </div>

            <div className="flex flex-col gap-3 shrink-0">
              {[
                { label: 'Max Resultados', value: maxResults },
                { label: 'Vídeos Carregados', value: results.length > 0 ? String(results.length) : '—' },
                { label: 'API', value: apiKey ? 'Conectada' : 'Pendente' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 flex items-center justify-between gap-6 min-w-[200px]">
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{stat.label}</span>
                  <span className="text-sm font-black text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ERROR BANNER */}
        {error && (
          <div className="mb-6 bg-white border-l-4 border-red-500 rounded-xl p-5 flex items-center justify-between gap-4 animate-in slide-in-from-top-2 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-black text-gray-900">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-gray-400 hover:text-gray-900 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* FORM PANEL */}
        <div className="bg-white border border-black rounded-2xl overflow-hidden mb-6">

          {/* Auth Section */}
          <div className="bg-black text-white px-8 py-5 flex items-center gap-3">
            <Key className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Autenticação</span>
          </div>

          <div className="p-8 border-b border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2 lg:col-span-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">YouTube API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-black text-gray-900 focus:border-black outline-none transition-all"
                  placeholder="AIza..."
                />
              </div>
              <button
                onClick={saveKeys}
                className="py-3 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-900 transition-all"
              >
                Salvar YT Key
              </button>
              <div className="space-y-2 lg:col-span-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Gemini API Key</label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-black text-gray-900 focus:border-black outline-none transition-all"
                  placeholder="Opcional..."
                />
              </div>
              <button
                onClick={saveKeys}
                className="py-3 bg-white border border-black text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all"
              >
                Salvar Gemini Key
              </button>
            </div>
          </div>

          {/* Search Params Section */}
          <div className="bg-black text-white px-8 py-5 flex items-center gap-3">
            <Filter className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Parâmetros de Busca</span>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-2 lg:col-span-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Palavras-chave</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchData()}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:border-black outline-none transition-all"
                  placeholder="Ex: tecnologia, mistérios, lifestyle..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Quantidade (Max 50)</label>
                <input
                  type="number"
                  value={maxResults}
                  onChange={e => setMaxResults(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:border-black outline-none transition-all"
                  placeholder="50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Idioma</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:border-black outline-none cursor-pointer transition-all"
                >
                  <option value="">Todos os Idiomas</option>
                  <option value="pt">Português 🇧🇷</option>
                  <option value="en">Inglês 🇺🇸</option>
                  <option value="es">Espanhol 🇪🇸</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Data Início</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:border-black outline-none transition-all appearance-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Data Fim</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:border-black outline-none transition-all appearance-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Views Mínimas</label>
                <input
                  type="text"
                  value={minViews}
                  onChange={e => setMinViews(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:border-black outline-none transition-all"
                  placeholder="Ex: 100000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Likes Mínimos</label>
                <input
                  type="text"
                  value={minLikes}
                  onChange={e => setMinLikes(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:border-black outline-none transition-all"
                  placeholder="Ex: 10000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <button
                onClick={fetchData}
                disabled={isSearching}
                className="w-full py-5 bg-black text-white font-black text-xs uppercase tracking-[0.4em] rounded-xl hover:bg-gray-900 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-40"
              >
                {isSearching
                  ? <RefreshCw className="w-5 h-5 animate-spin" />
                  : <Search className="w-5 h-5" />
                }
                {isSearching ? 'Buscando...' : 'Buscar Vídeos Virais'}
              </button>
              <button
                onClick={resetForm}
                className="w-full py-5 bg-white border border-black text-black font-black text-xs uppercase tracking-[0.4em] rounded-xl hover:bg-black hover:text-white active:scale-95 transition-all"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* SORT BAR */}
        {results.length > 0 && (
          <div className="bg-white border border-black rounded-2xl overflow-hidden mb-6 animate-in slide-in-from-bottom-2">
            <div className="bg-black text-white px-8 py-5 flex items-center gap-3">
              <BarChart3 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Filtrar / Ordenar Colunas</span>
            </div>
            <div className="px-8 py-5 flex flex-wrap gap-2">
              {[
                { id: 'duration', label: 'Duração' },
                { id: 'date', label: 'Upload' },
                { id: 'views', label: 'Views' },
                { id: 'likes', label: 'Likes' },
                { id: 'comments', label: 'Comentários' },
                { id: 'channel', label: 'Canal Criado' },
              ].map(p => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-full border cursor-pointer transition-all select-none ${
                    activeFilters[p.id]
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-black'
                  }`}
                  onClick={() => {
                    setActiveFilters(prev => ({ ...prev, [p.id]: !prev[p.id] }));
                  }}
                >
                  <input
                    type="checkbox"
                    checked={activeFilters[p.id]}
                    readOnly
                    className="accent-black pointer-events-none"
                  />
                  <span
                    className="text-[11px] font-black uppercase tracking-widest flex items-center gap-1"
                    onClick={e => { e.stopPropagation(); handleSort(p.id); }}
                  >
                    {p.label} <span className="opacity-40">⇅</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESULTS PANEL */}
        <div className="bg-white border border-black rounded-2xl overflow-hidden">

          {/* Loading */}
          {isSearching && (
            <div className="py-40 flex flex-col items-center justify-center gap-6 animate-in fade-in">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                <Video className="absolute inset-0 m-auto w-8 h-8 text-black" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Escaneando YouTube...</p>
            </div>
          )}

          {/* Empty state */}
          {!isSearching && results.length === 0 && (
            <div className="py-40 flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Globe className="w-10 h-10 text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">Nenhum sinal detectado</p>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-1">Configure os filtros e clique em Buscar</p>
              </div>
            </div>
          )}

          {/* Results */}
          {!isSearching && results.length > 0 && (
            <div>
              {/* Results header */}
              <div className="bg-black text-white px-8 py-5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
                  <span className="text-white text-xl font-black mr-3">{results.length}</span>
                  Vídeos encontrados — YouTube Data API v3
                </span>
                <button
                  onClick={() => setResults([])}
                  className="w-8 h-8 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {results.map((v, i) => (
                  <div key={v.id} className="grid grid-cols-1 lg:grid-cols-12 group hover:bg-gray-50 transition-all duration-300">

                    {/* Thumbnail */}
                    <div className="lg:col-span-3 p-6">
                      <div className="aspect-video relative rounded-xl overflow-hidden border border-gray-200 group-hover:border-black transition-all">
                        <img src={v.thumbnail} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" alt={v.title} />
                        <div className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 rounded-lg text-[10px] font-black">
                          #{i + 1}
                        </div>
                        <div
                          onClick={() => downloadThumbnail(v.id)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-all">
                            <Download className="w-6 h-6 text-black" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="lg:col-span-9 p-6 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="text-base font-black leading-tight text-gray-900 group-hover:text-black transition-colors line-clamp-2">
                            {v.title}
                          </h4>
                          <a
                            href={`https://youtube.com/watch?v=${v.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-gray-900 transition-all"
                          >
                            <Play className="w-3 h-3 fill-current" /> Assistir
                          </a>
                        </div>
                        <a
                          href={`https://youtube.com/channel/${v.channelId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-black text-gray-500 hover:text-black transition-all group/link"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-black" />
                          {v.channelTitle}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-all" />
                        </a>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {activeFilters.views && (
                          <div className="p-3 bg-white border border-gray-200 rounded-xl text-center group-hover:border-black transition-all">
                            <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Views</div>
                            <div className="text-xs font-black text-gray-900">{fmtNum(v.views)}</div>
                          </div>
                        )}
                        {activeFilters.likes && (
                          <div className="p-3 bg-white border border-gray-200 rounded-xl text-center group-hover:border-black transition-all">
                            <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Likes</div>
                            <div className="text-xs font-black text-gray-900">{fmtNum(v.likes)}</div>
                          </div>
                        )}
                        {activeFilters.comments && (
                          <div className="p-3 bg-white border border-gray-200 rounded-xl text-center group-hover:border-black transition-all">
                            <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Comentários</div>
                            <div className="text-xs font-black text-gray-900">{fmtNum(v.comments)}</div>
                          </div>
                        )}
                        {activeFilters.duration && (
                          <div className="p-3 bg-white border border-gray-200 rounded-xl text-center group-hover:border-black transition-all">
                            <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Duração</div>
                            <div className="text-xs font-black text-gray-900">{v.duration}</div>
                          </div>
                        )}
                        {activeFilters.date && (
                          <div className="p-3 bg-white border border-gray-200 rounded-xl text-center group-hover:border-black transition-all">
                            <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Publicado</div>
                            <div className="text-[10px] font-black text-gray-900">{v.publishedAt}</div>
                          </div>
                        )}
                        {activeFilters.channel && (
                          <div className="p-3 bg-white border border-gray-200 rounded-xl text-center group-hover:border-black transition-all">
                            <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Canal Criado</div>
                            <div className="text-[10px] font-black text-gray-900">{v.channelCreationDate}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="mt-20 pt-10 border-t border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-black text-gray-900 italic uppercase tracking-tighter">Umbra Tube Finder</div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Inteligência de mercado via YouTube Data API v3</p>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: 'Plataforma', value: 'YouTube' },
              { label: 'API Version', value: 'v3' },
              { label: 'Max Results', value: '50' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-lg font-black text-gray-900">{stat.value}</div>
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-[200] animate-in slide-in-from-right-4 duration-300">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-black' : 'bg-gray-900'}`}>
              {toast.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 text-white" />
                : <AlertCircle className="w-4 h-4 text-white" />
              }
            </div>
            <span className="font-black text-xs text-gray-900 uppercase tracking-tight">{toast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UmbraTubeFinderTool;
