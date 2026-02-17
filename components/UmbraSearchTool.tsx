
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
  Layers,
  ChevronRight,
  Maximize2
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
    coverrKey: ''
  });

  const [sources, setSources] = useState({
    pexels: true,
    pixabay: true,
    freepik: false,
    google: false,
    openverse: true,
    coverr: true
  });

  const [filters, setFilters] = useState({
    orientation: '',
    minSize: '',
    minDuration: '',
    maxDuration: ''
  });

  const [downloadParams, setDownloadParams] = useState({
    folderName: '',
    filePrefix: 'download'
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar configuração", e);
      }
    }
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
      const searchPromises: Promise<MediaResult[]>[] = [];

      if (activeSources.includes('pexels') && config.pexelsKey) {
        if (currentTab === 'images') searchPromises.push(searchPexelsImages(query));
        else searchPromises.push(searchPexelsVideos(query));
      }
      if (activeSources.includes('pixabay') && config.pixabayKey) {
        if (currentTab === 'images') searchPromises.push(searchPixabayImages(query));
        else searchPromises.push(searchPixabayVideos(query));
      }
      if (activeSources.includes('openverse') && currentTab === 'images') {
        searchPromises.push(searchOpenverseImages(query));
      }

      const allResults = await Promise.allSettled(searchPromises);
      const combinedResults: MediaResult[] = [];
      
      allResults.forEach(result => {
        if (result.status === 'fulfilled') combinedResults.push(...result.value);
      });

      setResults(combinedResults);
      if (combinedResults.length === 0) showToast('Nenhum resultado encontrado', 'error');
    } catch (err: any) {
      showToast(`Erro na busca: ${err.message}`, 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // API implementations (simplified mocks of the provided HTML logic)
  const searchPexelsImages = async (q: string): Promise<MediaResult[]> => {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${q}&per_page=30`, {
      headers: { 'Authorization': config.pexelsKey }
    });
    const data = await res.json();
    return (data.photos || []).map((p: any) => ({
      id: 'pexels-' + p.id,
      source: 'Pexels',
      url: p.src.large2x,
      thumbnail: p.src.medium,
      width: p.width,
      height: p.height,
      type: 'image'
    }));
  };

  const searchPexelsVideos = async (q: string): Promise<MediaResult[]> => {
    const res = await fetch(`https://api.pexels.com/videos/search?query=${q}&per_page=30`, {
      headers: { 'Authorization': config.pexelsKey }
    });
    const data = await res.json();
    return (data.videos || []).map((v: any) => ({
      id: 'pexels-video-' + v.id,
      source: 'Pexels',
      url: v.video_files[0].link,
      thumbnail: v.image,
      width: v.width,
      height: v.height,
      duration: v.duration,
      type: 'video'
    }));
  };

  const searchPixabayImages = async (q: string): Promise<MediaResult[]> => {
    const res = await fetch(`https://pixabay.com/api/?key=${config.pixabayKey}&q=${q}&per_page=30`);
    const data = await res.json();
    return (data.hits || []).map((h: any) => ({
      id: 'pixabay-' + h.id,
      source: 'Pixabay',
      url: h.largeImageURL,
      thumbnail: h.webformatURL,
      width: h.imageWidth,
      height: h.imageHeight,
      type: 'image'
    }));
  };

  const searchPixabayVideos = async (q: string): Promise<MediaResult[]> => {
    const res = await fetch(`https://pixabay.com/api/videos/?key=${config.pixabayKey}&q=${q}&per_page=30`);
    const data = await res.json();
    return (data.hits || []).map((v: any) => ({
      id: 'pixabay-video-' + v.id,
      source: 'Pixabay',
      url: v.videos.large.url,
      thumbnail: v.picture_id ? `https://i.vimeocdn.com/video/${v.picture_id}_640.jpg` : '',
      width: v.videos.large.width,
      height: v.videos.large.height,
      duration: v.duration,
      type: 'video'
    }));
  };

  const searchOpenverseImages = async (q: string): Promise<MediaResult[]> => {
    const res = await fetch(`https://api.openverse.org/v1/images/?q=${q}&page_size=30`);
    const data = await res.json();
    return (data.results || []).map((img: any) => ({
      id: 'openverse-' + img.id,
      source: 'Openverse',
      url: img.url,
      thumbnail: img.thumbnail || img.url,
      width: img.width,
      height: img.height,
      type: 'image'
    }));
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === results.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(results.map(r => r.id)));
  };

  const downloadSelected = async () => {
    const targets = results.filter(r => selectedIds.has(r.id));
    if (targets.length === 0) return;

    showToast(`Iniciando download de ${targets.length} arquivos...`);
    
    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      const ext = item.type === 'image' ? 'jpg' : 'mp4';
      const fileName = `${downloadParams.filePrefix}_${i + 1}_${Date.now()}.${ext}`;

      try {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Erro no download", e);
      }
      // Wait a bit to avoid browser blocking
      await new Promise(r => setTimeout(r, 800));
    }
    showToast('Processamento concluído!');
  };

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 bg-background-mid/50 p-10 rounded-[40px] border border-white/5 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/5 blur-[100px] -z-10" />
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-brand-cyan/10 rounded-[24px] flex items-center justify-center text-brand-cyan shadow-xl"><Search className="w-8 h-8" /></div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase font-bebas">Umbra <span className="text-brand-cyan">Search</span></h1>
            <p className="text-gray-500 font-medium">Busca e Download Profissional de Mídia</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Settings className="w-4 h-4" /> Configuração API
          </button>
        </div>
      </header>

      {/* SEARCH BAR PANEL */}
      <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-8 relative group">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
             <input 
              type="text" 
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Digite sua busca (ex: natureza, cidade cyberpunk, mar...)" 
              className="w-full bg-background-deep border border-white/10 rounded-[28px] py-6 px-8 text-lg font-bold text-white focus:border-brand-purple outline-none transition-all placeholder:text-gray-700 shadow-inner"
             />
             <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
               {/* Fix: Replace undefined switchTab with setCurrentTab */}
               <button onClick={() => setCurrentTab('images')} className={`p-3 rounded-2xl transition-all ${currentTab === 'images' ? 'bg-brand-cyan text-background-deep' : 'text-gray-600 hover:text-white'}`}><ImageIcon className="w-5 h-5" /></button>
               {/* Fix: Replace undefined switchTab with setCurrentTab */}
               <button onClick={() => setCurrentTab('videos')} className={`p-3 rounded-2xl transition-all ${currentTab === 'videos' ? 'bg-brand-purple text-white' : 'text-gray-600 hover:text-white'}`}><Video className="w-5 h-5" /></button>
             </div>
          </div>
          <button 
            onClick={handleSearch}
            disabled={isSearching}
            className="px-12 py-6 bg-gradient-to-r from-brand-cyan to-brand-purple text-background-deep font-orbitron text-xs font-black tracking-[0.3em] rounded-[28px] shadow-2xl hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all disabled:opacity-30 uppercase flex items-center justify-center gap-3 active:scale-95"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Buscar Mídia
          </button>
        </div>

        {/* SOURCES & FILTERS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-4 border-t border-white/5">
           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Globe className="w-4 h-4 text-brand-cyan" /> Bancos de Mídia</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(sources).map(([key, val]) => {
                  const isAvailable = currentTab === 'images' 
                    ? ['pexels', 'pixabay', 'freepik', 'google', 'openverse'].includes(key)
                    : ['pexels', 'pixabay', 'coverr'].includes(key);
                  if (!isAvailable) return null;
                  return (
                    <button 
                      key={key}
                      onClick={() => setSources(prev => ({ ...prev, [key]: !val }))}
                      className={`px-5 py-3 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all flex items-center gap-3 ${val ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' : 'bg-background-deep border-white/5 text-gray-600 hover:border-white/20'}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${val ? 'bg-brand-cyan animate-pulse' : 'bg-gray-800'}`} />
                      {key}
                    </button>
                  );
                })}
              </div>
           </div>

           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Filter className="w-4 h-4 text-brand-purple" /> Filtros Refinados</h4>
              <div className="grid grid-cols-2 gap-4">
                 <select 
                  value={filters.orientation}
                  onChange={e => setFilters({...filters, orientation: e.target.value})}
                  className="bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none cursor-pointer"
                 >
                   <option value="">Orientação: Todas</option>
                   <option value="landscape">Horizontal</option>
                   <option value="portrait">Vertical</option>
                   <option value="square">Quadrada</option>
                 </select>
                 <select 
                  value={filters.minSize}
                  onChange={e => setFilters({...filters, minSize: e.target.value})}
                  className="bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none cursor-pointer"
                 >
                   <option value="">Resolução: Todas</option>
                   <option value="small">Small (SD)</option>
                   <option value="medium">Medium (HD)</option>
                   <option value="large">Large (4K+)</option>
                 </select>
              </div>
           </div>
        </div>
      </div>

      {/* RESULTS HEADER & GRID */}
      {results.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-background-mid border border-white/5 p-6 rounded-3xl shadow-xl">
            <div className="flex items-center gap-8">
               <div>
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Encontrados</p>
                  <p className="text-2xl font-black text-white">{results.length} <span className="text-sm font-medium text-gray-500">Arquivos</span></p>
               </div>
               <div className="h-10 w-px bg-white/5" />
               <div>
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Selecionados</p>
                  <p className="text-2xl font-black text-brand-cyan">{selectedIds.size}</p>
               </div>
            </div>
            
            <div className="flex gap-4">
               <button onClick={selectAll} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all">
                 {selectedIds.size === results.length ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
               </button>
               <button 
                onClick={downloadSelected}
                disabled={selectedIds.size === 0}
                className="px-8 py-3 bg-brand-cyan text-background-deep font-black rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-brand-cyan/20 disabled:opacity-30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
               >
                 <Download className="w-4 h-4" /> Baixar Lote
               </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map(item => (
              <div 
                key={item.id}
                onClick={() => toggleSelection(item.id)}
                className={`group relative bg-background-mid border rounded-[32px] overflow-hidden transition-all hover:scale-[1.03] cursor-pointer shadow-xl ${selectedIds.has(item.id) ? 'border-brand-cyan ring-2 ring-brand-cyan/30' : 'border-white/5'}`}
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-background-deep shadow-inner">
                  <img src={item.thumbnail} className={`w-full h-full object-cover transition-opacity duration-300 ${selectedIds.has(item.id) ? 'opacity-40' : 'opacity-80 group-hover:opacity-100'}`} alt={item.source} />
                  
                  <div className="absolute top-4 right-4 z-10">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.has(item.id) ? 'bg-brand-cyan border-brand-cyan shadow-lg' : 'bg-black/20 border-white/30 group-hover:border-brand-cyan'}`}>
                       {selectedIds.has(item.id) && <CheckCircle2 className="w-4 h-4 text-background-deep" />}
                    </div>
                  </div>

                  {item.type === 'video' && (
                    <div className="absolute bottom-4 left-4 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-black text-white flex items-center gap-1 border border-white/10">
                      <Video className="w-3 h-3" /> {Math.round(item.duration || 0)}s
                    </div>
                  )}

                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-background-deep/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="p-5 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-brand-purple uppercase tracking-widest mb-1">{item.source}</span>
                      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter">{item.width} × {item.height}</span>
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank'); }} className="p-2.5 bg-white/5 rounded-xl text-gray-500 hover:text-brand-cyan transition-all"><Maximize2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!results.length && !isSearching && (
        <div className="py-32 flex flex-col items-center opacity-20">
           <FolderDown className="w-20 h-20 mb-8" />
           <p className="font-orbitron text-xs font-black uppercase tracking-widest text-center">Faça uma busca para carregar recursos visuais</p>
        </div>
      )}

      {/* CONFIG MODAL */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background-deep/95 backdrop-blur-2xl" onClick={() => setIsConfigOpen(false)} />
          <div className="relative bg-background-mid border border-white/10 rounded-[48px] p-12 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-cyan/10 rounded-2xl flex items-center justify-center text-brand-cyan"><Key className="w-6 h-6" /></div>
                <h2 className="text-3xl font-black tracking-tight uppercase">Chaves de API</h2>
              </div>
              <button onClick={() => setIsConfigOpen(false)} className="p-3 bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
              {[
                { id: 'pexelsKey', label: 'Pexels API', hint: 'pexels.com/api', color: 'brand-cyan' },
                { id: 'pixabayKey', label: 'Pixabay API', hint: 'pixabay.com/api', color: 'brand-purple' },
                { id: 'freepikKey', label: 'Freepik API', hint: 'freepik.com/api', color: 'brand-pink' },
                { id: 'serperKey', label: 'Serper (Google Images)', hint: 'serper.dev', color: 'brand-green' },
                { id: 'coverrKey', label: 'Coverr API', hint: 'coverr.co/api', color: 'brand-cyan' },
              ].map(field => (
                <div key={field.id} className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{field.label}</label>
                    <span className="text-[8px] font-bold text-gray-700 uppercase">{field.hint}</span>
                  </div>
                  <input 
                    type="password" 
                    value={(config as any)[field.id]}
                    onChange={e => setConfig({ ...config, [field.id]: e.target.value })}
                    className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-xs font-space text-brand-cyan focus:border-brand-cyan/40 outline-none transition-all"
                    placeholder="Cole sua secret key aqui..."
                  />
                </div>
              ))}
            </div>

            <button onClick={saveConfig} className="w-full py-6 bg-brand-cyan text-background-deep font-orbitron text-xs font-black tracking-[0.3em] rounded-[28px] shadow-2xl transition-all uppercase mt-6">
              Salvar Configurações
            </button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-[250] animate-in slide-in-from-right-4 duration-300">
           <div className={`px-8 py-5 rounded-[24px] shadow-2xl flex items-center gap-4 border ${toast.type === 'error' ? 'bg-brand-pink/20 border-brand-pink text-brand-pink' : 'bg-brand-green/20 border-brand-green text-brand-green'} backdrop-blur-xl ring-4 ring-black/50`}>
             {toast.type === 'error' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
             <span className="font-black text-sm uppercase tracking-tighter">{toast.message}</span>
           </div>
        </div>
      )}

      <footer className="mt-20 p-12 bg-background-mid border border-white/5 rounded-[56px] text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-brand-pink/5 opacity-50" />
         <div className="relative z-10 space-y-6">
            <h4 className="text-xl font-black tracking-tighter text-gray-500 uppercase tracking-widest">Protocolo de Midia Umbra</h4>
            <p className="text-gray-600 text-xs max-w-xl mx-auto leading-relaxed">Centralize seus downloads de b-roll e imagens stock. Utilize múltiplas APIs simultâneas para garantir que nunca falte material visual para seus vídeos automatizados.</p>
         </div>
      </footer>
    </div>
  );
};

export default UmbraSearchTool;
