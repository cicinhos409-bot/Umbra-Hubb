
import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Image as ImageIcon,
  Heart,
  Maximize2,
  X,
  RefreshCw,
  CheckCircle2,
  Settings,
  Palette,
  Info,
  Bookmark,
  Trash2,
} from 'lucide-react';

interface ScoutImage {
  id: string;
  thumbnail: string;
  download: string;
  author: string;
  source: string;
  width?: number;
  height?: number;
}

const STORAGE_KEY_CONFIG = 'umbra_scout_config';
const STORAGE_KEY_COLLECTIONS = 'umbra_scout_collections';

const API_LIST = [
  { id: 'unsplash', name: 'Unsplash', key: true },
  { id: 'pexels', name: 'Pexels', key: true },
  { id: 'pixabay', name: 'Pixabay', key: true },
  { id: 'wikimedia', name: 'Wikimedia', key: false },
  { id: 'picsum', name: 'Picsum', key: false },
  { id: 'randomuser', name: 'Pessoas', key: false },
  { id: 'robohash', name: 'Robôs', key: false },
];

const ImageScoutTool: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScoutImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<ScoutImage[]>([]);
  const [viewingImage, setViewingImage] = useState<ScoutImage | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'collections'>('search');

  const [apiKeys, setApiKeys] = useState({ unsplash: '', pexels: '', pixabay: '', flickr: '' });
  const [activeAPIs, setActiveAPIs] = useState<Set<string>>(new Set(['wikimedia', 'picsum', 'randomuser', 'robohash']));

  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (savedConfig) setApiKeys(JSON.parse(savedConfig));
    const savedCollections = localStorage.getItem(STORAGE_KEY_COLLECTIONS);
    if (savedCollections) setCollections(JSON.parse(savedCollections));
  }, []);

  const saveConfig = (newKeys: typeof apiKeys) => {
    setApiKeys(newKeys);
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newKeys));
  };

  const toggleAPI = (api: string, needsKey: boolean) => {
    if (needsKey && !apiKeys[api as keyof typeof apiKeys]) {
      setShowConfig(true);
      return;
    }
    const n = new Set(activeAPIs);
    n.has(api) ? n.delete(api) : n.add(api);
    setActiveAPIs(n);
  };

  // ── API implementations ────────────────────────────────────────
  async function searchUnsplash(q: string) {
    try {
      const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=20`, { headers: { Authorization: `Client-ID ${apiKeys.unsplash}` } });
      const data = await res.json();
      return (data.results || []).map((p: any) => ({ id: `unsplash_${p.id}`, thumbnail: p.urls.small, download: p.urls.full, author: p.user.name, source: 'Unsplash', width: p.width, height: p.height }));
    } catch { return []; }
  }

  async function searchPexels(q: string) {
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=20`, { headers: { Authorization: apiKeys.pexels } });
      const data = await res.json();
      return (data.photos || []).map((p: any) => ({ id: `pexels_${p.id}`, thumbnail: p.src.medium, download: p.src.original, author: p.photographer, source: 'Pexels', width: p.width, height: p.height }));
    } catch { return []; }
  }

  async function searchPixabay(q: string) {
    try {
      const res = await fetch(`https://pixabay.com/api/?key=${apiKeys.pixabay}&q=${encodeURIComponent(q)}&per_page=20`);
      const data = await res.json();
      return (data.hits || []).map((p: any) => ({ id: `pixabay_${p.id}`, thumbnail: p.webformatURL, download: p.largeImageURL, author: p.user, source: 'Pixabay', width: p.imageWidth, height: p.imageHeight }));
    } catch { return []; }
  }

  async function searchWikimedia(q: string) {
    try {
      const res = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&srlimit=20&format=json&origin=*`);
      const data = await res.json();
      return (data.query?.search || []).map((item: any) => {
        const title = item.title.replace('File:', '');
        const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title)}`;
        return { id: `wikimedia_${item.pageid}`, thumbnail: url + '?width=400', download: url, author: 'Wikimedia', source: 'Wikimedia Commons' };
      });
    } catch { return []; }
  }

  async function searchPicsum(): Promise<ScoutImage[]> {
    return Array.from({ length: 12 }).map((_, i) => {
      const id = Math.floor(Math.random() * 1000);
      return { id: `picsum_${id}_${i}`, thumbnail: `https://picsum.photos/400/300?random=${id}`, download: `https://picsum.photos/1920/1080?random=${id}`, author: 'Unsplash Artist', source: 'Picsum' };
    });
  }

  async function searchRandomUser(): Promise<ScoutImage[]> {
    try {
      const res = await fetch('https://randomuser.me/api/?results=12');
      const data = await res.json();
      return (data.results || []).map((u: any, i: number) => ({ id: `user_${i}`, thumbnail: u.picture.large, download: u.picture.large, author: `${u.name.first} ${u.name.last}`, source: 'RandomUser' }));
    } catch { return []; }
  }

  async function searchRoboHash(): Promise<ScoutImage[]> {
    return Array.from({ length: 12 }).map((_, i) => {
      const seed = Math.random().toString(36).substring(7);
      return { id: `robo_${seed}`, thumbnail: `https://robohash.org/${seed}?size=400x400`, download: `https://robohash.org/${seed}?size=1024x1024`, author: 'RoboHash', source: 'RoboHash' };
    });
  }

  const searchImages = async () => {
    if (!query && activeAPIs.has('wikimedia')) { return; }
    setLoading(true); setResults([]); setSelectedImages(new Set());
    const promises: Promise<ScoutImage[]>[] = [];
    if (activeAPIs.has('unsplash') && apiKeys.unsplash) promises.push(searchUnsplash(query));
    if (activeAPIs.has('pexels') && apiKeys.pexels) promises.push(searchPexels(query));
    if (activeAPIs.has('pixabay') && apiKeys.pixabay) promises.push(searchPixabay(query));
    if (activeAPIs.has('wikimedia')) promises.push(searchWikimedia(query));
    if (activeAPIs.has('picsum')) promises.push(searchPicsum());
    if (activeAPIs.has('randomuser')) promises.push(searchRandomUser());
    if (activeAPIs.has('robohash')) promises.push(searchRoboHash());
    try {
      const settled = await Promise.allSettled(promises);
      let combined: ScoutImage[] = [];
      settled.forEach(r => { if (r.status === 'fulfilled') combined = [...combined, ...r.value]; });
      setResults(combined);
    } catch { } finally { setLoading(false); }
  };

  const toggleSelect = (id: string) => {
    const n = new Set(selectedImages);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelectedImages(n);
  };

  const selectAll = () => {
    setSelectedImages(selectedImages.size === results.length ? new Set() : new Set(results.map(r => r.id)));
  };

  const downloadImage = async (img: ScoutImage) => {
    try {
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(img.download)}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = `umbra_${img.source.toLowerCase()}_${img.id.replace(/\W/g, '_')}.jpg`;
      a.click();
    } catch { window.open(img.download, '_blank'); }
  };

  const downloadSelected = async () => {
    const selected = results.filter(r => selectedImages.has(r.id));
    for (const img of selected) {
      await downloadImage(img);
      await new Promise(r => setTimeout(r, 500));
    }
  };

  const toggleCollection = (img: ScoutImage) => {
    const exists = collections.find(c => c.id === img.id);
    const next = exists ? collections.filter(c => c.id !== img.id) : [...collections, img];
    setCollections(next);
    localStorage.setItem(STORAGE_KEY_COLLECTIONS, JSON.stringify(next));
  };

  // ── style tokens ───────────────────────────────────────────────
  const card = 'bg-white border border-gray-200 rounded-2xl overflow-hidden';
  const cardHeader = 'px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-3';
  const btnPrimary = 'flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-black py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed';
  const btnSecondary = 'flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 font-black py-3 px-5 rounded-xl text-xs uppercase tracking-widest transition-all';
  const inputClass = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all';

  const renderGrid = (items: ScoutImage[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map(img => (
        <div key={img.id} className={`group relative bg-white border rounded-xl overflow-hidden transition-all hover:shadow-md ${selectedImages.has(img.id) ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-primary/40'}`}>
          <div className="aspect-[4/3] overflow-hidden relative cursor-pointer" onClick={() => setViewingImage(img)}>
            <img src={img.thumbnail} alt={img.author} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={e => { e.stopPropagation(); toggleSelect(img.id); }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all ${selectedImages.has(img.id) ? 'bg-primary border-primary' : 'bg-white/20 border-white/60 hover:border-white'}`}
                >
                  {selectedImages.has(img.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); toggleCollection(img); }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${collections.find(c => c.id === img.id) ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
                >
                  <Heart className={`w-4 h-4 ${collections.find(c => c.id === img.id) ? 'fill-current' : ''}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-white/80">@{img.author}</span>
                <button
                  onClick={e => { e.stopPropagation(); setViewingImage(img); }}
                  className="w-7 h-7 bg-white/20 hover:bg-white/40 rounded-lg flex items-center justify-center text-white transition-all"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-3 py-2.5 flex items-center justify-between bg-gray-50 border-t border-gray-100">
            <span className="text-[9px] font-black text-primary uppercase tracking-widest">{img.source}</span>
            <button onClick={() => downloadImage(img)} className="p-1.5 text-gray-400 hover:text-primary transition-colors" title="Download">
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5 font-rajdhani">

      {/* ── SEARCH & PLATFORM PANEL ── */}
      <div className={card}>
        <div className={cardHeader}>
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
            <Palette className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-gray-900">Image Scout</h3>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Explore múltiplas bibliotecas de imagem</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'search' ? 'collections' : 'search')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                activeTab === 'collections'
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Coleção ({collections.length})
            </button>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`p-2 rounded-xl border transition-all ${showConfig ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900'}`}
              title="Configurar APIs"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* API config panel (inline, collapsible) */}
          {showConfig && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Chaves de API</span>
                <button onClick={() => setShowConfig(false)} className="p-1 text-gray-400 hover:text-gray-900 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(['unsplash', 'pexels', 'pixabay', 'flickr'] as const).map(api => (
                  <div key={api} className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{api}</label>
                    <input
                      type="password"
                      value={apiKeys[api]}
                      onChange={e => saveConfig({ ...apiKeys, [api]: e.target.value })}
                      placeholder="API key..."
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 p-3 bg-white border border-gray-200 rounded-lg">
                <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[10px] font-black text-gray-500">Wikimedia, Picsum, Pessoas e Robôs funcionam sem chave.</p>
              </div>
            </div>
          )}

          {/* Platform chips */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Bibliotecas Ativas</span>
            <div className="flex flex-wrap gap-2">
              {API_LIST.map(api => (
                <button
                  key={api.id}
                  onClick={() => toggleAPI(api.id, api.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeAPIs.has(api.id)
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activeAPIs.has(api.id) ? 'bg-primary' : 'bg-gray-300'}`} />
                  {api.name}
                  {api.key && <span className="text-[8px] opacity-60">KEY</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Search input */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchImages()}
                placeholder="O que você está procurando? (ex: Cinematic Forest...)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-black text-gray-900 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>
            <button onClick={searchImages} disabled={loading} className={`${btnPrimary} shrink-0`}>
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      {activeTab === 'search' ? (
        <div className="space-y-4">
          {/* Results bar */}
          {results.length > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-gray-900">{results.length} imagens</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="flex gap-2">
                <button onClick={selectAll} className={btnSecondary}>
                  {selectedImages.size === results.length ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
                </button>
                <button onClick={downloadSelected} disabled={selectedImages.size === 0} className={btnPrimary}>
                  <Download className="w-4 h-4" />
                  {selectedImages.size > 0 ? `Baixar (${selectedImages.size})` : 'Baixar Selecionados'}
                </button>
              </div>
            </div>
          )}

          {/* Grid / loading / empty */}
          {loading ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <RefreshCw className="w-10 h-10 text-primary animate-spin" />
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Consultando bibliotecas de mídia...</p>
            </div>
          ) : results.length > 0 ? (
            renderGrid(results)
          ) : (
            <div className="py-20 border border-dashed border-gray-200 rounded-2xl bg-gray-50 flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center">
                <ImageIcon className="w-7 h-7 text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Pronto para explorar</p>
                <p className="text-[10px] font-black text-gray-300 mt-1">Ative as bibliotecas e busque um termo</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Collections tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-gray-900">Minha Coleção ({collections.length})</span>
            {collections.length > 0 && (
              <button
                onClick={() => { setCollections([]); localStorage.removeItem(STORAGE_KEY_COLLECTIONS); }}
                className="flex items-center gap-1.5 text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpar Tudo
              </button>
            )}
          </div>

          {collections.length > 0 ? (
            renderGrid(collections)
          ) : (
            <div className="py-20 border border-dashed border-gray-200 rounded-2xl bg-gray-50 flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center">
                <Heart className="w-7 h-7 text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Coleção vazia</p>
                <p className="text-[10px] font-black text-gray-300 mt-1">Favorite imagens durante a busca para salvá-las aqui</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LIGHTBOX ── */}
      {viewingImage && (
        <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-5 right-5 p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-5 max-h-[90vh] overflow-y-auto lg:overflow-visible custom-scrollbar">
            {/* Image */}
            <div className="lg:col-span-8 bg-black rounded-xl overflow-hidden flex items-center justify-center min-h-[300px]">
              <img src={viewingImage.download} alt={viewingImage.author} className="max-w-full max-h-[80vh] object-contain" />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">{viewingImage.source}</span>
                  <h4 className="text-lg font-black text-gray-900 leading-tight">@{viewingImage.author}</h4>
                  {viewingImage.width && (
                    <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">{viewingImage.width} × {viewingImage.height}px</p>
                  )}
                </div>

                <div className="p-5 space-y-3">
                  {/* Color palette preview */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      <Palette className="w-3 h-3" /> Paleta de Cores
                    </label>
                    <div className="flex h-10 rounded-xl overflow-hidden border border-gray-200">
                      {['#111827', '#374151', '#6b7280', '#d1d5db', '#f9fafb'].map(c => (
                        <div
                          key={c}
                          className="flex-1 hover:flex-[1.5] transition-all cursor-pointer group relative"
                          style={{ background: c }}
                          title={c}
                        >
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[8px] font-black bg-white/90 text-gray-900 px-1.5 py-0.5 rounded">{c}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <button
                      onClick={() => downloadImage(viewingImage)}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-black py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition-all"
                    >
                      <Download className="w-4 h-4" /> Download Full HD
                    </button>
                    <button
                      onClick={() => toggleCollection(viewingImage)}
                      className={`w-full flex items-center justify-center gap-2 font-black py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition-all border ${
                        collections.find(c => c.id === viewingImage.id)
                          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${collections.find(c => c.id === viewingImage.id) ? 'fill-current' : ''}`} />
                      {collections.find(c => c.id === viewingImage.id) ? 'Remover dos Favoritos' : 'Salvar na Coleção'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageScoutTool;
