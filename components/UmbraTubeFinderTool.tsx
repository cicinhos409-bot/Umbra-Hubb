
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Youtube, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  ChevronRight, 
  Calendar, 
  Download, 
  Play, 
  ExternalLink,
  Filter,
  BarChart3,
  Globe,
  Trash2
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
  // Authentication & Settings State
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

  // Results & Logic State
  const [results, setResults] = useState<VideoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'info' } | null>(null);

  // Sorting State
  const [sortState, setSortState] = useState<Record<string, boolean>>({
    duration: false,
    date: false,
    views: false,
    likes: false,
    comments: false,
    channel: false
  });

  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    duration: true,
    date: true,
    views: true,
    likes: true,
    comments: true,
    channel: true
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
    showToast('✓ Chaves salvas com sucesso!', 'success');
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
    if (!keywords.trim()) return setError('⚠ Insira palavras-chave.');
    if (!apiKey.trim()) return setError('⚠ Insira sua YouTube API Key.');

    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      let searchKeywords = keywords.trim();
      
      // Tradução opcional simulada para busca global (conforme HTML original)
      if (language) {
        try {
          const resTrans = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${language}&dt=t&q=${encodeURIComponent(searchKeywords)}`);
          const dataTrans = await resTrans.json();
          searchKeywords = dataTrans[0].map((p: any) => p[0]).join('');
        } catch (e) {
          console.warn("Falha na tradução da keyword", e);
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
      
      showToast(`✓ ${videos.length} vídeos carregados!`, 'success');
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
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      <header className="text-center relative py-10">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-brand-cyan/10 rounded-[32px] mb-6 shadow-2xl ring-1 ring-brand-cyan/20 animate-pulse">
          <Search className="w-12 h-12 text-brand-cyan" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink bg-clip-text text-transparent uppercase font-bebas">
          Umbra Tube Finder
        </h1>
        <p className="text-gray-500 font-medium tracking-wide">Descubra os vídeos mais explosivos e virais do YouTube</p>
      </header>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-brand-pink/10 border border-brand-pink/20 rounded-2xl p-5 flex items-center gap-4 text-brand-pink animate-in slide-in-from-top-2">
          <AlertCircle className="w-6 h-6" />
          <span className="text-sm font-bold uppercase tracking-widest">{error}</span>
        </div>
      )}

      {/* FORM PANEL */}
      <div className="bg-background-mid border border-white/5 rounded-[48px] p-10 shadow-2xl space-y-10 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/5 blur-[100px] -z-10" />
        
        {/* API KEYS */}
        <div className="space-y-6">
           <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-brand-cyan" />
              <h3 className="font-orbitron text-[10px] font-black uppercase tracking-[0.2em] text-white">Autenticação</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2 lg:col-span-1">
                 <label className="text-[10px] font-black text-gray-600 uppercase px-2">YouTube API Key</label>
                 <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-xs font-space text-brand-cyan focus:border-brand-cyan outline-none transition-all" placeholder="AIza..." />
              </div>
              <button onClick={saveKeys} className="py-4 bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-cyan/20 transition-all">Salvar YT Key</button>
              <div className="space-y-2 lg:col-span-1">
                 <label className="text-[10px] font-black text-gray-600 uppercase px-2">Gemini API Key</label>
                 <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-xs font-space text-brand-purple focus:border-brand-purple outline-none transition-all" placeholder="Opcional..." />
              </div>
              <button onClick={saveKeys} className="py-4 bg-brand-purple/10 border border-brand-purple/30 text-brand-purple rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-purple/20 transition-all">Salvar Gemini</button>
           </div>
        </div>

        {/* SEARCH PARAMS */}
        <div className="space-y-6">
           <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-brand-purple" />
              <h3 className="font-orbitron text-[10px] font-black uppercase tracking-[0.2em] text-white">Parâmetros de Busca</h3>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2 lg:col-span-2">
                 <label className="text-[10px] font-black text-gray-600 uppercase px-2">Palavras-chave</label>
                 <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-brand-purple outline-none" placeholder="Ex: tecnologia, mistérios..." />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-600 uppercase px-2">Qtd (Max 50)</label>
                 <input type="number" value={maxResults} onChange={e => setMaxResults(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-bold" placeholder="50" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-600 uppercase px-2">Idioma</label>
                 <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none cursor-pointer">
                    <option value="">Todos</option>
                    <option value="pt">Português 🇧🇷</option>
                    <option value="en">Inglês 🇺🇸</option>
                    <option value="es">Espanhol 🇪🇸</option>
                 </select>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-600 uppercase px-2">Data Início</label>
                 <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-bold text-white appearance-none" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-600 uppercase px-2">Data Fim</label>
                 <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-bold text-white appearance-none" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-600 uppercase px-2">Views Mínimas</label>
                 <input type="text" value={minViews} onChange={e => setMinViews(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-bold" placeholder="Ex: 100.000" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-600 uppercase px-2">Likes Mínimos</label>
                 <input type="text" value={minLikes} onChange={e => setMinLikes(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-bold" placeholder="Ex: 10.000" />
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
           <button 
             onClick={fetchData}
             disabled={isSearching}
             className="w-full py-6 bg-gradient-to-r from-brand-cyan to-brand-purple text-background-deep font-orbitron text-xs font-black tracking-[0.4em] rounded-[24px] shadow-2xl hover:shadow-[0_0_30px_rgba(0,245,255,0.3)] transition-all flex items-center justify-center gap-3 uppercase disabled:opacity-30"
           >
             {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Youtube className="w-5 h-5" />}
             Buscar Vídeos Virais
           </button>
           <button onClick={resetForm} className="w-full py-6 bg-white/5 border border-white/10 text-gray-500 font-orbitron text-xs font-black tracking-[0.4em] rounded-[24px] hover:text-brand-pink hover:bg-brand-pink/5 transition-all uppercase">Limpar Filtros</button>
        </div>
      </div>

      {/* SORT BAR */}
      {results.length > 0 && (
        <div className="bg-background-mid border border-white/5 rounded-3xl p-6 flex flex-wrap items-center gap-6 shadow-xl animate-in slide-in-from-bottom-2">
           <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Filtrar / Ordenar:</span>
           <div className="flex flex-wrap gap-2">
              {[
                { id: 'duration', label: 'Duração' },
                { id: 'date', label: 'Upload' },
                { id: 'views', label: 'Views' },
                { id: 'likes', label: 'Likes' },
                { id: 'comments', label: 'Comentários' },
                { id: 'channel', label: 'Canal Criado' },
              ].map(p => (
                <div key={p.id} className={`flex items-center gap-3 px-5 py-2.5 rounded-full border transition-all cursor-pointer ${activeFilters[p.id] ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' : 'bg-background-deep border-white/5 text-gray-600'}`}>
                  <input type="checkbox" checked={activeFilters[p.id]} onChange={() => setActiveFilters(prev => ({ ...prev, [p.id]: !prev[p.id] }))} className="accent-brand-cyan" />
                  <span onClick={() => handleSort(p.id)} className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 select-none">
                    {p.label} <span className="opacity-40">⇅</span>
                  </span>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* RESULTS LIST */}
      <div className="bg-background-mid border border-white/5 rounded-[48px] overflow-hidden shadow-2xl min-h-[400px]">
        {isSearching && (
          <div className="py-40 flex flex-col items-center justify-center space-y-6 animate-in fade-in">
             <div className="relative">
                <div className="w-24 h-24 border-4 border-white/5 border-t-brand-cyan rounded-full animate-spin" />
                <Youtube className="absolute inset-0 m-auto w-10 h-10 text-brand-cyan animate-pulse" />
             </div>
             <p className="font-orbitron text-xs font-black uppercase tracking-[0.3em] text-brand-cyan">Escaneando Matrix do YouTube...</p>
          </div>
        )}

        {!isSearching && results.length === 0 && (
          <div className="py-40 flex flex-col items-center justify-center opacity-20">
             <Globe className="w-20 h-20 mb-8" />
             <p className="font-orbitron text-xs font-black uppercase tracking-widest">Nenhum sinal detectado</p>
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="divide-y divide-white/5">
             <div className="p-8 bg-black/20 flex justify-between items-center border-b border-white/5">
                <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
                   <strong className="text-brand-cyan text-lg mr-2">{results.length}</strong> Vídeos encontrados via YouTube Data API v3
                </span>
                <div className="flex gap-2">
                   <button onClick={() => setResults([])} className="p-3 bg-white/5 rounded-xl text-gray-600 hover:text-brand-pink transition-all"><Trash2 className="w-5 h-5" /></button>
                </div>
             </div>
             {results.map((v, i) => (
               <div key={v.id} className="grid grid-cols-1 lg:grid-cols-12 group hover:bg-brand-cyan/5 transition-all duration-500">
                  <div className="lg:col-span-3 p-8">
                     <div className="aspect-video relative rounded-2xl overflow-hidden border border-white/5 shadow-2xl group-hover:border-brand-cyan/40 transition-all">
                        <img src={v.thumbnail} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={v.title} />
                        <div className="absolute top-3 left-3 bg-background-deep/80 backdrop-blur-md border border-brand-cyan/20 px-2.5 py-1 rounded-lg text-[10px] font-black text-brand-cyan tracking-tighter shadow-xl">#{i+1}</div>
                        <div onClick={() => downloadThumbnail(v.id)} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                           <div className="w-12 h-12 bg-brand-cyan rounded-full flex items-center justify-center shadow-2xl shadow-brand-cyan/30 text-background-deep scale-75 group-hover:scale-100 transition-all">
                              <Download className="w-6 h-6" />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="lg:col-span-9 p-8 flex flex-col justify-between">
                     <div className="space-y-4">
                        <div className="flex justify-between items-start gap-4">
                           <h4 className="text-xl font-black leading-tight text-white group-hover:text-brand-cyan transition-colors">{v.title}</h4>
                           <a href={`https://youtube.com/watch?v=${v.id}`} target="_blank" className="px-5 py-2.5 bg-brand-cyan/10 border border-brand-cyan/20 rounded-xl text-[10px] font-black text-brand-cyan uppercase tracking-widest hover:bg-brand-cyan hover:text-background-deep transition-all flex items-center gap-2 whitespace-nowrap shadow-xl">
                              <Play className="w-4 h-4 fill-current" /> Abrir Vídeo
                           </a>
                        </div>
                        <a href={`https://youtube.com/channel/${v.channelId}`} target="_blank" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-purple transition-all group/link">
                           <div className="w-1.5 h-1.5 rounded-full bg-brand-purple" /> {v.channelTitle} <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-all" />
                        </a>
                     </div>

                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
                        {activeFilters.views && (
                          <div className="p-3 bg-background-deep border border-white/5 rounded-2xl text-center group-hover:border-brand-cyan/20 transition-all shadow-inner">
                             <div className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Views</div>
                             <div className="text-xs font-black text-brand-cyan">{fmtNum(v.views)}</div>
                          </div>
                        )}
                        {activeFilters.likes && (
                          <div className="p-3 bg-background-deep border border-white/5 rounded-2xl text-center group-hover:border-brand-green/20 transition-all shadow-inner">
                             <div className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Likes</div>
                             <div className="text-xs font-black text-brand-green">{fmtNum(v.likes)}</div>
                          </div>
                        )}
                        {activeFilters.comments && (
                          <div className="p-3 bg-background-deep border border-white/5 rounded-2xl text-center group-hover:border-brand-purple/20 transition-all shadow-inner">
                             <div className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Comentários</div>
                             <div className="text-xs font-black text-brand-purple">{fmtNum(v.comments)}</div>
                          </div>
                        )}
                        {activeFilters.duration && (
                          <div className="p-3 bg-background-deep border border-white/5 rounded-2xl text-center group-hover:border-brand-pink/20 transition-all shadow-inner">
                             <div className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Duração</div>
                             <div className="text-xs font-black text-brand-pink">{v.duration}</div>
                          </div>
                        )}
                        {activeFilters.date && (
                          <div className="p-3 bg-background-deep border border-white/5 rounded-2xl text-center shadow-inner">
                             <div className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Publicado</div>
                             <div className="text-[10px] font-black text-white">{v.publishedAt}</div>
                          </div>
                        )}
                        {activeFilters.channel && (
                          <div className="p-3 bg-background-deep border border-white/5 rounded-2xl text-center shadow-inner">
                             <div className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Canal Criado</div>
                             <div className="text-[10px] font-black text-white">{v.channelCreationDate}</div>
                          </div>
                        )}
                     </div>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-[200] animate-in slide-in-from-right-4 duration-300">
           <div className={`px-8 py-5 rounded-[24px] shadow-2xl flex items-center gap-4 border ${toast.type === 'success' ? 'bg-brand-green/20 border-brand-green text-brand-green' : 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan'} backdrop-blur-xl ring-4 ring-black/50`}>
             {toast.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <RefreshCw className="w-6 h-6" />}
             <span className="font-black text-sm uppercase tracking-tighter">{toast.msg}</span>
           </div>
        </div>
      )}

      <footer className="mt-20 p-12 bg-background-mid border border-white/5 rounded-[56px] text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-brand-pink/5 opacity-50" />
         <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-white/5 rounded-[24px] flex items-center justify-center mx-auto text-brand-cyan shadow-xl"><Globe className="w-8 h-8" /></div>
            <h4 className="text-xl font-black tracking-tighter uppercase">Inteligência de Mercado Umbra</h4>
            <p className="text-gray-500 text-xs max-w-xl mx-auto leading-relaxed">Analise tendências globais e descubra o que o seu nicho está assistindo em tempo real. Use os filtros de métricas mínimas para encontrar apenas vídeos que já validaram o sucesso comercial e orgânico.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="https://www.youtube.com/channel/UC3ljRCyGc_Atq6ld8iTVYfw" target="_blank" className="px-6 py-3 bg-background-deep border border-white/5 rounded-xl text-[9px] font-black text-gray-400 hover:text-brand-purple transition-all flex items-center gap-2 uppercase tracking-widest"><Youtube className="w-4 h-4" /> Canal Oficial</a>
              <a href="https://wa.me/message/EF4DJTI6JTOTH1" target="_blank" className="px-6 py-3 bg-background-deep border border-white/5 rounded-xl text-[9px] font-black text-gray-400 hover:text-brand-cyan transition-all flex items-center gap-2 uppercase tracking-widest"><ExternalLink className="w-4 h-4" /> Suporte VIP</a>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default UmbraTubeFinderTool;
