
import React, { useState, useEffect } from 'react';
import {
  Search,
  Settings,
  Download,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  Globe,
  Key,
  Trash2,
  FolderDown,
  Loader2,
  AlertCircle,
  X,
  Filter,
  Maximize2,
} from 'lucide-react';

interface MediaResult {
  id: string;
  source: string;
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  type: 'image' | 'video';
  duration?: number;
}

const STORAGE_CONFIG_KEY = 'umbra_search_config_v1';

const SOURCE_LABELS: Record<string, string> = {
  pexels: 'Pexels',
  pixabay: 'Pixabay',
  freepik: 'Freepik',
  google: 'Google',
  openverse: 'Openverse',
  coverr: 'Coverr',
};

const UmbraSearchTool: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'images' | 'videos'>('images');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [config, setConfig] = useState({
    pexelsKey: '',
    pixabayKey: '',
    freepikKey: '',
    serperKey: '',
    coverrKey: '',
  });

  const [sources, setSources] = useState({
    pexels: true,
    pixabay: true,
    freepik: false,
    google: false,
    openverse: true,
    coverr: true,
  });

  const [filters, setFilters] = useState({ orientation: '', minSize: '' });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) { try { setConfig(JSON.parse(saved)); } catch { } }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const saveConfig = () => {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
    showToast('Configuração salva!');
    setIsConfigOpen(false);
  };

  // ── API calls ──────────────────────────────────────────────────
  const searchPexelsImages = async (q: string): Promise<MediaResult[]> => {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${q}&per_page=30`, { headers: { Authorization: config.pexelsKey } });
    const data = await res.json();
    return (data.photos || []).map((p: any) => ({ id: 'pexels-' + p.id, source: 'Pexels', url: p.src.large2x, thumbnail: p.src.medium, width: p.width, height: p.height, type: 'image' as const }));
  };

  const searchPexelsVideos = async (q: string): Promise<MediaResult[]> => {
    const res = await fetch(`https://api.pexels.com/videos/search?query=${q}&per_page=30`, { headers: { Authorization: config.pexelsKey } });
    const data = await res.json();
    return (data.videos || []).map((v: any) => ({ id: 'pexels-video-' + v.id, source: 'Pexels', url: v.video_files[0].link, thumbnail: v.image, width: v.width, height: v.height, duration: v.duration, type: 'video' as const }));
  };

  const searchPixabayImages = async (q: string): Promise<MediaResult[]> => {
    const res = await fetch(`https://pixabay.com/api/?key=${config.pixabayKey}&q=${q}&per_page=30`);
    const data = await res.json();
    return (data.hits || []).map((h: any) => ({ id: 'pixabay-' + h.id, source: 'Pixabay', url: h.largeImageURL, thumbnail: h.webformatURL, width: h.imageWidth, height: h.imageHeight, type: 'image' as const }));
  };

  const searchPixabayVideos = async (q: string): Promise<MediaResult[]> => {
    const res = await fetch(`https://pixabay.com/api/videos/?key=${config.pixabayKey}&q=${q}&per_page=30`);
    const data = await res.json();
    return (data.hits || []).map((v: any) => ({ id: 'pixabay-video-' + v.id, source: 'Pixabay', url: v.videos.large.url, thumbnail: v.picture_id ? `https://i.vimeocdn.com/video/${v.picture_id}_640.jpg` : '', width: v.videos.large.width, height: v.videos.large.height, duration: v.duration, type: 'video' as const }));
  };

  const searchOpenverseImages = async (q: string): Promise<MediaResult[]> => {
    const res = await fetch(`https://api.openverse.org/v1/images/?q=${q}&page_size=30`);
    const data = await res.json();
    return (data.results || []).map((img: any) => ({ id: 'openverse-' + img.id, source: 'Openverse', url: img.url, thumbnail: img.thumbnail || img.url, width: img.width, height: img.height, type: 'image' as const }));
  };

  const handleSearch = async () => {
    if (!query.trim()) return showToast('Digite algo para buscar', 'error');
    setIsSearching(true);
    setResults([]);
    setSelectedIds(new Set());

    const activeSources = currentTab === 'images'
      ? ['pexels', 'pixabay', 'freepik', 'google', 'openverse'].filter(s => (sources as any)[s])
      : ['pexels', 'pixabay', 'coverr'].filter(s => (sources as any)[s]);

    if (activeSources.length === 0) {
      showToast('Selecione pelo menos uma fonte', 'error');
      setIsSearching(false);
      return;
    }

    try {
      const promises: Promise<MediaResult[]>[] = [];
      if (activeSources.includes('pexels') && config.pexelsKey) {
        promises.push(currentTab === 'images' ? searchPexelsImages(query) : searchPexelsVideos(query));
      }
      if (activeSources.includes('pixabay') && config.pixabayKey) {
        promises.push(currentTab === 'images' ? searchPixabayImages(query) : searchPixabayVideos(query));
      }
      if (activeSources.includes('openverse') && currentTab === 'images') {
        promises.push(searchOpenverseImages(query));
      }

      const settled = await Promise.allSettled(promises);
      const combined: MediaResult[] = [];
      settled.forEach(r => { if (r.status === 'fulfilled') combined.push(...r.value); });
      setResults(combined);
      if (combined.length === 0) showToast('Nenhum resultado encontrado', 'error');
    } catch (err: any) {
      showToast(`Erro na busca: ${err.message}`, 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const downloadSelected = async () => {
    const targets = results.filter(r => selectedIds.has(r.id));
    if (targets.length === 0) return;
    showToast(`Iniciando download de ${targets.length} arquivo${targets.length > 1 ? 's' : ''}...`);
    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      try {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `umbra_${i + 1}_${Date.now()}.${item.type === 'image' ? 'jpg' : 'mp4'}`; a.click();
        window.URL.revokeObjectURL(url);
      } catch { }
      await new Promise(r => setTimeout(r, 800));
    }
    showToast('Download concluído!');
  };

  // ── style tokens ───────────────────────────────────────────────
  const card = 'bg-white border border-gray-200 rounded-2xl overflow-hidden';
  const cardHeader = 'px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-3';
  const btnPrimary = 'flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-black py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed';
  const btnSecondary = 'flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 font-black py-3 px-5 rounded-xl text-xs uppercase tracking-widest transition-all';
  const inputClass = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all';

  const imageSources = ['pexels', 'pixabay', 'freepik', 'google', 'openverse'];
  const videoSources = ['pexels', 'pixabay', 'coverr'];
  const activeSrcList = currentTab === 'images' ? imageSources : videoSources;

  return (
    <div className="space-y-5 font-rajdhani">

      {/* ── SEARCH PANEL ── */}
      <div className={card}>
        <div className={cardHeader}>
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
            <Search className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-gray-900">Busca de Mídia</h3>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pesquise em múltiplos bancos simultaneamente</p>
          </div>
          <button
            onClick={() => setIsConfigOpen(true)}
            className={btnSecondary}
          >
            <Key className="w-3.5 h-3.5" /> APIs
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Type toggle + search bar */}
          <div className="flex gap-3">
            {/* Image / Video toggle */}
            <div className="flex gap-1 bg-gray-100 border border-gray-200 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setCurrentTab('images')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${currentTab === 'images' ? 'bg-white text-primary shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imagens</span>
              </button>
              <button
                onClick={() => setCurrentTab('videos')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${currentTab === 'videos' ? 'bg-white text-primary shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Video className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vídeos</span>
              </button>
            </div>

            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Ex: natureza, cidade cyberpunk, oceano..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-black text-gray-900 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={isSearching}
              className={`${btnPrimary} shrink-0`}
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>

          {/* Sources + Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
            {/* Sources */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Bancos de Mídia</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeSrcList.map(key => {
                  const active = (sources as any)[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setSources(prev => ({ ...prev, [key]: !(prev as any)[key] }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
                        active
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-primary' : 'bg-gray-300'}`} />
                      {SOURCE_LABELS[key] || key}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Filtros</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={filters.orientation}
                  onChange={e => setFilters({ ...filters, orientation: e.target.value })}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-black text-gray-700 outline-none cursor-pointer focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                >
                  <option value="">Orientação: Todas</option>
                  <option value="landscape">Horizontal</option>
                  <option value="portrait">Vertical</option>
                  <option value="square">Quadrada</option>
                </select>
                <select
                  value={filters.minSize}
                  onChange={e => setFilters({ ...filters, minSize: e.target.value })}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-black text-gray-700 outline-none cursor-pointer focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
                >
                  <option value="">Resolução: Todas</option>
                  <option value="small">SD</option>
                  <option value="medium">HD</option>
                  <option value="large">4K+</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RESULTS ── */}
      {isSearching && (
        <div className="py-24 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Consultando bancos de mídia...</p>
        </div>
      )}

      {!isSearching && results.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-400">
          {/* Results bar */}
          <div className={card}>
            <div className={`${cardHeader} justify-between flex-wrap gap-3`}>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Encontrados</p>
                  <p className="text-xl font-black text-gray-900">{results.length} <span className="text-sm text-gray-400">arquivos</span></p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Selecionados</p>
                  <p className="text-xl font-black text-primary">{selectedIds.size}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedIds(selectedIds.size === results.length ? new Set() : new Set(results.map(r => r.id)))}
                  className={btnSecondary}
                >
                  {selectedIds.size === results.length ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
                </button>
                <button
                  onClick={downloadSelected}
                  disabled={selectedIds.size === 0}
                  className={btnPrimary}
                >
                  <Download className="w-4 h-4" />
                  {selectedIds.size > 0 ? `Baixar (${selectedIds.size})` : 'Baixar Lote'}
                </button>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map(item => (
              <div
                key={item.id}
                onClick={() => toggleSelection(item.id)}
                className={`group relative bg-white border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  selectedIds.has(item.id)
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-gray-200 hover:border-primary/40'
                }`}
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                  <img
                    src={item.thumbnail}
                    alt={item.source}
                    className={`w-full h-full object-cover transition-all duration-300 ${selectedIds.has(item.id) ? 'opacity-50' : 'group-hover:scale-105'}`}
                  />

                  {/* Selection indicator */}
                  <div className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    selectedIds.has(item.id)
                      ? 'bg-primary border-primary'
                      : 'bg-white/80 border-gray-300 group-hover:border-primary/60'
                  }`}>
                    {selectedIds.has(item.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>

                  {/* Video badge */}
                  {item.type === 'video' && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/70 rounded-lg text-[9px] font-black text-white">
                      <Video className="w-3 h-3" /> {Math.round(item.duration || 0)}s
                    </div>
                  )}
                </div>

                <div className="p-3 flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] font-black text-primary uppercase tracking-widest">{item.source}</span>
                    <span className="block text-[9px] font-black text-gray-400">{item.width} × {item.height}</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); window.open(item.url, '_blank'); }}
                    className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-all"
                    title="Ver original"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {!isSearching && results.length === 0 && (
        <div className="py-24 flex flex-col items-center gap-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50">
          <div className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center">
            <FolderDown className="w-7 h-7 text-gray-300" />
          </div>
          <div className="text-center">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Nenhuma busca realizada</p>
            <p className="text-[10px] font-black text-gray-300 mt-1">Configure as APIs e pesquise um termo</p>
          </div>
        </div>
      )}

      {/* ── CONFIG MODAL ── */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsConfigOpen(false)} />
          <div className="relative bg-white border border-gray-200 rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                  <Key className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Chaves de API</h3>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Configure seus tokens de acesso</p>
                </div>
              </div>
              <button onClick={() => setIsConfigOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {[
                { id: 'pexelsKey', label: 'Pexels API Key', hint: 'pexels.com/api' },
                { id: 'pixabayKey', label: 'Pixabay API Key', hint: 'pixabay.com/api' },
                { id: 'freepikKey', label: 'Freepik API Key', hint: 'freepik.com/api' },
                { id: 'serperKey', label: 'Serper Key (Google Images)', hint: 'serper.dev' },
                { id: 'coverrKey', label: 'Coverr API Key', hint: 'coverr.co/api' },
              ].map(field => (
                <div key={field.id} className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{field.label}</label>
                    <span className="text-[9px] font-black text-gray-400 uppercase">{field.hint}</span>
                  </div>
                  <input
                    type="password"
                    value={(config as any)[field.id]}
                    onChange={e => setConfig({ ...config, [field.id]: e.target.value })}
                    placeholder="Cole sua secret key aqui..."
                    className={inputClass}
                  />
                </div>
              ))}

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3">
                <Key className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[10px] font-black text-gray-500 leading-relaxed">
                  As chaves ficam salvas apenas no seu navegador. Openverse funciona sem chave.
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button onClick={saveConfig} className={`${btnPrimary} w-full py-3.5`}>
                <CheckCircle2 className="w-4 h-4" /> Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-[250] animate-in slide-in-from-right-4 duration-300">
          <div className={`px-5 py-4 rounded-xl shadow-xl flex items-center gap-3 border ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span className="font-black text-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UmbraSearchTool;
