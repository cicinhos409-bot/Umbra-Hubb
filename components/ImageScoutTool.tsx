
import React, { useState, useEffect } from 'react';
import {
    Search,
    Download,
    Image as ImageIcon,
    Eye,
    Heart,
    Trash2,
    Maximize2,
    X,
    RefreshCw,
    CheckCircle2,
    Settings,
    Grid,
    Palette,
    Info,
    ChevronRight
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

const ImageScoutTool: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ScoutImage[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
    const [collections, setCollections] = useState<ScoutImage[]>([]);
    const [viewingImage, setViewingImage] = useState<ScoutImage | null>(null);
    const [showConfig, setShowConfig] = useState(false);
    const [activeTab, setActiveTab] = useState<'search' | 'collections'>('search');

    // APIs Configuration
    const [apiKeys, setApiKeys] = useState({
        unsplash: '',
        pexels: '',
        pixabay: '',
        flickr: ''
    });

    const [activeAPIs, setActiveAPIs] = useState<Set<string>>(new Set([
        'wikimedia', 'picsum', 'placeholder', 'dummyimage', 'placebear', 'placekitten', 'randomuser', 'robohash'
    ]));

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
            showToast('Configure a chave desta API primeiro', 'error');
            setShowConfig(true);
            return;
        }

        const newAPIs = new Set(activeAPIs);
        if (newAPIs.has(api)) newAPIs.delete(api);
        else newAPIs.add(api);
        setActiveAPIs(newAPIs);
    };

    // TOAST (Mocked since it's common in this codebase)
    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        // In a real scenario, this would trigger the toast state
        console.log(`[Toast] ${type}: ${msg}`);
    };

    // SEARCH LOGIC
    const searchImages = async () => {
        if (!query && activeAPIs.has('wikimedia')) {
            showToast('Digite algo para buscar!', 'error');
            return;
        }

        setLoading(true);
        setResults([]);
        setSelectedImages(new Set());

        const promises: Promise<ScoutImage[]>[] = [];

        // APIs with Keys
        if (activeAPIs.has('unsplash') && apiKeys.unsplash) promises.push(searchUnsplash(query));
        if (activeAPIs.has('pexels') && apiKeys.pexels) promises.push(searchPexels(query));
        if (activeAPIs.has('pixabay') && apiKeys.pixabay) promises.push(searchPixabay(query));

        // Free APIs
        if (activeAPIs.has('wikimedia')) promises.push(searchWikimedia(query));
        if (activeAPIs.has('picsum')) promises.push(searchPicsum());
        if (activeAPIs.has('randomuser')) promises.push(searchRandomUser());
        if (activeAPIs.has('robohash')) promises.push(searchRoboHash());

        try {
            const allResults = await Promise.allSettled(promises);
            let combined: ScoutImage[] = [];

            allResults.forEach(res => {
                if (res.status === 'fulfilled') combined = [...combined, ...res.value];
            });

            setResults(combined);
            if (combined.length === 0) showToast('Nenhum resultado encontrado', 'error');
        } catch (err) {
            showToast('Erro ao realizar busca', 'error');
        } finally {
            setLoading(false);
        }
    };

    // API IMPLEMENTATIONS (Ported & Improved)
    async function searchUnsplash(q: string) {
        try {
            const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=20`, {
                headers: { 'Authorization': `Client-ID ${apiKeys.unsplash}` }
            });
            const data = await res.json();
            return data.results.map((p: any) => ({
                id: `unsplash_${p.id}`,
                thumbnail: p.urls.small,
                download: p.urls.full,
                author: p.user.name,
                source: 'Unsplash',
                width: p.width,
                height: p.height
            }));
        } catch { return []; }
    }

    async function searchPexels(q: string) {
        try {
            const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=20`, {
                headers: { 'Authorization': apiKeys.pexels }
            });
            const data = await res.json();
            return data.photos.map((p: any) => ({
                id: `pexels_${p.id}`,
                thumbnail: p.src.medium,
                download: p.src.original,
                author: p.photographer,
                source: 'Pexels',
                width: p.width,
                height: p.height
            }));
        } catch { return []; }
    }

    async function searchPixabay(q: string) {
        try {
            const res = await fetch(`https://pixabay.com/api/?key=${apiKeys.pixabay}&q=${encodeURIComponent(q)}&per_page=20`);
            const data = await res.json();
            return data.hits.map((p: any) => ({
                id: `pixabay_${p.id}`,
                thumbnail: p.webformatURL,
                download: p.largeImageURL,
                author: p.user,
                source: 'Pixabay',
                width: p.imageWidth,
                height: p.imageHeight
            }));
        } catch { return []; }
    }

    async function searchWikimedia(q: string) {
        try {
            const res = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&srlimit=20&format=json&origin=*`);
            const data = await res.json();
            const images = [];
            for (const item of data.query.search) {
                const title = item.title.replace('File:', '');
                const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title)}`;
                images.push({
                    id: `wikimedia_${item.pageid}`,
                    thumbnail: url + '?width=400',
                    download: url,
                    author: 'Wikimedia Contributor',
                    source: 'Wikimedia Commons'
                });
            }
            return images;
        } catch { return []; }
    }

    async function searchPicsum() {
        return Array.from({ length: 12 }).map((_, i) => {
            const id = Math.floor(Math.random() * 1000);
            return {
                id: `picsum_${id}_${i}`,
                thumbnail: `https://picsum.photos/400/300?random=${id}`,
                download: `https://picsum.photos/1920/1080?random=${id}`,
                author: 'Unsplash Artist',
                source: 'Picsum Photos'
            };
        });
    }

    async function searchRandomUser() {
        try {
            const res = await fetch('https://randomuser.me/api/?results=12');
            const data = await res.json();
            return data.results.map((u: any, i: number) => ({
                id: `user_${i}`,
                thumbnail: u.picture.large,
                download: u.picture.large,
                author: `${u.name.first} ${u.name.last}`,
                source: 'Random User'
            }));
        } catch { return []; }
    }

    async function searchRoboHash() {
        return Array.from({ length: 12 }).map((_, i) => {
            const seed = Math.random().toString(36).substring(7);
            return {
                id: `robo_${seed}`,
                thumbnail: `https://robohash.org/${seed}?size=400x400`,
                download: `https://robohash.org/${seed}?size=1024x1024`,
                author: 'RoboHash Gen',
                source: 'RoboHash'
            };
        });
    }

    // BATCH OPERATIONS
    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedImages);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedImages(newSelected);
    };

    const selectAll = () => {
        if (selectedImages.size === results.length) setSelectedImages(new Set());
        else setSelectedImages(new Set(results.map(r => r.id)));
    };

    const downloadImage = async (img: ScoutImage) => {
        try {
            // Using Umbra Media Proxy to bypass CORS
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(img.download)}`;
            const res = await fetch(proxyUrl);

            if (!res.ok) throw new Error('Download failed');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `umbra_${img.source.toLowerCase()}_${img.id.replace(/\W/g, '_')}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showToast('Download iniciado!');
        } catch (error) {
            console.error('Erro no download:', error);
            showToast('Erro ao processar download via proxy.', 'error');
        }
    };

    const downloadSelected = async () => {
        const selected = results.filter(r => selectedImages.has(r.id));
        for (const img of selected) {
            await downloadImage(img);
            await new Promise(r => setTimeout(r, 500));
        }
        showToast(`${selected.length} imagens baixadas!`);
    };

    // COLLECTION LOGIC
    const toggleCollection = (img: ScoutImage) => {
        let newCollections;
        if (collections.find(c => c.id === img.id)) {
            newCollections = collections.filter(c => c.id !== img.id);
            showToast('Removido da coleção');
        } else {
            newCollections = [...collections, img];
            showToast('Adicionado à coleção!');
        }
        setCollections(newCollections);
        localStorage.setItem(STORAGE_KEY_COLLECTIONS, JSON.stringify(newCollections));
    };

    const renderImageGrid = (items: ScoutImage[]) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(img => (
                <div key={img.id} className="group relative bg-background-mid border border-white/5 rounded-[32px] overflow-hidden hover:border-brand-cyan/30 transition-all shadow-xl">
                    <div className="aspect-[4/3] overflow-hidden relative cursor-zoom-in" onClick={() => setViewingImage(img)}>
                        <img src={img.thumbnail} alt={img.author} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background-deep/80 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleSelect(img.id); }}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${selectedImages.has(img.id) ? 'bg-brand-cyan border-brand-cyan text-background-deep' : 'bg-black/40 border-white/20 text-white'}`}
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleCollection(img); }}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${collections.find(c => c.id === img.id) ? 'bg-brand-pink border-brand-pink text-white' : 'bg-black/40 border-white/20 text-white'}`}
                                >
                                    <Heart className={`w-5 h-5 ${collections.find(c => c.id === img.id) ? 'fill-current' : ''}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">@{img.author}</span>
                                <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setViewingImage(img); }} className="p-2 bg-brand-cyan/20 rounded-lg text-brand-cyan hover:bg-brand-cyan hover:text-white transition-all"><Maximize2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 flex items-center justify-between bg-white/5">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{img.source}</span>
                        <button onClick={() => downloadImage(img)} className="text-brand-cyan hover:text-white transition-colors"><Download className="w-4 h-4" /></button>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* HEADER SECTION */}
            <section className="relative overflow-hidden bg-background-mid border border-white/5 rounded-[40px] md:rounded-[56px] p-8 md:p-20 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cyan/5 -mr-32 -mt-32 rounded-full blur-3xl opacity-50" />
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
                    <div className="w-20 h-20 md:w-32 md:h-32 bg-gradient-to-br from-brand-cyan to-brand-purple rounded-[32px] md:rounded-[40px] flex items-center justify-center text-3xl md:text-5xl shadow-2xl shadow-brand-cyan/20 shrink-0">
                        🎨
                    </div>
                    <div className="text-center md:text-left flex-1 space-y-4">
                        <h2 className="text-3xl md:text-6xl font-black tracking-tighter">Umbra <span className="text-brand-cyan">Image Scout</span></h2>
                        <p className="text-gray-500 text-sm md:text-xl font-medium max-w-2xl leading-relaxed">Seu explorador de mídia multi-plataforma. Busque, visualize e colecione imagens premium das maiores bibliotecas do mundo.</p>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                onClick={() => setActiveTab(activeTab === 'search' ? 'collections' : 'search')}
                                className={`px-8 py-4 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeTab === 'collections' ? 'bg-brand-pink text-white shadow-xl shadow-brand-pink/20' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                            >
                                {activeTab === 'search' ? `Minhas Coleções (${collections.length})` : 'Explorar Banco'}
                            </button>
                            <button onClick={() => setShowConfig(!showConfig)} className={`p-4 rounded-2xl border transition-all flex items-center justify-center gap-2 ${showConfig ? 'bg-white border-white text-background-deep' : 'bg-white/5 border-white/10 text-white'}`}>
                                <Settings className="w-5 h-5" />
                                <span className="sm:hidden text-[10px] font-black uppercase tracking-widest">Configurar APIs</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* CONFIG PANEL */}
            {showConfig && (
                <section className="bg-background-mid border border-white/5 rounded-[40px] p-10 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-3"><Settings className="w-6 h-6 text-brand-cyan" /> Configuração de APIs</h3>
                        <button onClick={() => setShowConfig(false)} className="text-gray-500 hover:text-white"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {(['unsplash', 'pexels', 'pixabay', 'flickr'] as const).map(api => (
                            <div key={api} className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">{api} API Key</label>
                                <input
                                    type="text"
                                    value={apiKeys[api]}
                                    onChange={e => saveConfig({ ...apiKeys, [api]: e.target.value })}
                                    placeholder="Sua chave aqui..."
                                    className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-[11px] font-bold text-white focus:border-brand-cyan outline-none transition-all"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 p-6 bg-brand-cyan/5 border border-brand-cyan/20 rounded-3xl text-[10px] font-bold text-brand-cyan flex items-start gap-4 uppercase tracking-widest">
                        <Info className="w-5 h-5 shrink-0" />
                        <span>Algumas APIs requerem chaves gratuitas. O Image Scout funciona com 8 plataformas sem chave (Picsum, Wikimedia, etc).</span>
                    </div>
                </section>
            )}

            {activeTab === 'search' ? (
                <>
                    {/* SEARCH & FILTERS */}
                    <section className="bg-background-mid border border-white/5 rounded-[48px] p-10 space-y-10 shadow-xl">
                        {/* PLATFORM SELECTOR */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">Bibliotecas Ativas</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'unsplash', name: 'Unsplash', key: true },
                                    { id: 'pexels', name: 'Pexels', key: true },
                                    { id: 'pixabay', name: 'Pixabay', key: true },
                                    { id: 'wikimedia', name: 'Wikimedia', key: false },
                                    { id: 'picsum', name: 'Picsum', key: false },
                                    { id: 'randomuser', name: 'Pessoas', key: false },
                                    { id: 'robohash', name: 'Robôs', key: false }
                                ].map(api => (
                                    <button
                                        key={api.id}
                                        onClick={() => toggleAPI(api.id, api.key)}
                                        className={`px-5 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${activeAPIs.has(api.id) ? 'bg-brand-cyan border-brand-cyan text-background-deep shadow-lg shadow-brand-cyan/20' : 'bg-background-deep border-white/10 text-gray-500 hover:border-white/20'}`}
                                    >
                                        {api.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-cyan transition-colors" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && searchImages()}
                                    placeholder="O que você está procurando? (ex: Cinematic Forest...)"
                                    className="w-full bg-background-deep border border-white/5 rounded-3xl md:rounded-[32px] pl-16 pr-8 py-5 md:py-6 text-sm md:text-base font-bold text-white focus:border-brand-cyan outline-none transition-all shadow-inner"
                                />
                            </div>
                            <button
                                onClick={searchImages}
                                disabled={loading}
                                className="px-10 py-5 md:py-6 bg-brand-cyan text-background-deep font-black rounded-3xl md:rounded-[32px] uppercase text-[11px] md:text-[12px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-brand-cyan/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5" /> Buscar</>}
                            </button>
                        </div>
                    </section>

                    {/* RESULTS AREA */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between px-6">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-black uppercase tracking-tighter">Explorando ({results.length})</h3>
                                <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
                            </div>
                            {results.length > 0 && (
                                <div className="flex items-center gap-4">
                                    <button onClick={selectAll} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                                        {selectedImages.size === results.length ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
                                    </button>
                                    <button
                                        onClick={downloadSelected}
                                        disabled={selectedImages.size === 0}
                                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-cyan hover:bg-brand-cyan hover:text-white transition-all disabled:opacity-20 flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" /> Baixar Selecionados ({selectedImages.size})
                                    </button>
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="py-32 flex flex-col items-center justify-center space-y-6">
                                <RefreshCw className="w-12 h-12 text-brand-cyan animate-spin" />
                                <p className="font-black uppercase tracking-[0.3em] text-xs text-brand-cyan animate-pulse">Consultando Satélites de Mídia...</p>
                            </div>
                        ) : results.length > 0 ? (
                            renderImageGrid(results)
                        ) : (
                            <div className="py-32 bg-background-mid/50 border border-white/5 rounded-[56px] flex flex-col items-center justify-center space-y-6 text-center">
                                <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center text-4xl opacity-20"><ImageIcon className="w-12 h-12" /></div>
                                <div>
                                    <h4 className="text-2xl font-black mb-2">Pronto para a Descoberta</h4>
                                    <p className="text-gray-500 font-medium max-w-sm mx-auto">Digite um termo de pesquisa acima e explore milhões de imagens gratuitas e premium.</p>
                                </div>
                            </div>
                        )}
                    </section>
                </>
            ) : (
                /* COLLECTIONS TAB */
                <section className="space-y-8">
                    <div className="flex items-center justify-between px-6">
                        <h3 className="text-xl font-black uppercase tracking-tighter">Minha Coleção ({collections.length})</h3>
                        {collections.length > 0 && (
                            <button
                                onClick={() => { setCollections([]); localStorage.removeItem(STORAGE_KEY_COLLECTIONS); }}
                                className="text-[10px] font-black uppercase tracking-widest text-brand-pink hover:underline"
                            >
                                Limpar Tudo
                            </button>
                        )}
                    </div>
                    {collections.length > 0 ? (
                        renderImageGrid(collections)
                    ) : (
                        <div className="py-40 bg-background-mid/50 border border-white/5 rounded-[56px] flex flex-col items-center justify-center space-y-6 text-center">
                            <Heart className="w-16 h-16 text-gray-800" />
                            <h4 className="text-2xl font-black text-gray-700">Seu visual locker está vazio</h4>
                            <p className="text-gray-600 font-medium max-w-sm mx-auto uppercase text-[10px] tracking-widest">Salve imagens favoritando-as durante suas buscas</p>
                        </div>
                    )}
                </section>
            )}

            {/* PREMIUM LIGHTBOX PREVIEW */}
            {viewingImage && (
                <div className="fixed inset-0 z-[300] bg-background-deep/98 backdrop-blur-3xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
                    <button
                        onClick={() => setViewingImage(null)}
                        className="absolute top-6 right-6 md:top-10 md:right-10 p-3 md:p-5 bg-white/5 rounded-2xl md:rounded-[24px] text-white hover:text-brand-pink hover:bg-white/10 transition-all z-[310]"
                    >
                        <X className="w-6 h-6 md:w-8 h-8" />
                    </button>

                    <div className="w-full max-w-7xl flex flex-col lg:grid lg:grid-cols-12 gap-6 md:gap-10 h-full max-h-[90vh] overflow-y-auto lg:overflow-visible custom-scrollbar">
                        {/* IMAGE DISPLAY */}
                        <div className="lg:col-span-8 bg-black/40 rounded-[32px] md:rounded-[48px] overflow-hidden flex items-center justify-center border border-white/5 relative group min-h-[300px]">
                            <img src={viewingImage.download} alt={viewingImage.author} className="max-w-full max-h-full object-contain" />
                            <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-8 py-4 text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-4">
                                    <span className="flex items-center gap-2"><Maximize2 className="w-4 h-4" /> Original</span>
                                    <div className="w-px h-4 bg-white/20" />
                                    <span>{viewingImage.width ? `${viewingImage.width} x ${viewingImage.height}` : 'High Resolution'}</span>
                                </div>
                            </div>
                        </div>

                        {/* SIDEBAR TOOLS */}
                        <div className="lg:col-span-4 flex flex-col gap-6 h-auto lg:h-full">
                            <div className="bg-background-mid border border-white/5 rounded-[32px] md:rounded-[40px] p-6 md:p-10 space-y-6 md:space-y-8">
                                <div>
                                    <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest block mb-1 md:mb-2">{viewingImage.source}</span>
                                    <h4 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-2 md:mb-4">Capturado por @{viewingImage.author}</h4>
                                    <p className="text-[11px] md:text-xs text-gray-500 font-medium leading-relaxed">Esta imagem faz parte do acervo público da {viewingImage.source} e está pronta para ser usada nos seus projetos criativos.</p>
                                </div>

                                {/* AI PALETTE (Simulated Premium Feature) */}
                                <div className="space-y-3 md:space-y-4">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2"><Palette className="w-4 h-4" /> Color Palette</label>
                                    <div className="flex h-10 md:h-12 rounded-xl md:rounded-2xl overflow-hidden border border-white/5">
                                        {['#00f5ff', '#a855f7', '#ec4899', '#12121f', '#ffffff'].map(c => (
                                            <div key={c} className="flex-1 hover:flex-[1.5] transition-all cursor-pointer group relative" style={{ background: c }}>
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[8px] font-black text-white bg-black/40 px-2 py-1 rounded-full">{c}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 md:pt-8 border-t border-white/5 flex flex-col gap-3">
                                    <button onClick={() => downloadImage(viewingImage)} className="w-full py-4 md:py-5 bg-brand-cyan text-background-deep font-black rounded-xl md:rounded-2xl uppercase text-xs tracking-widest hover:scale-[1.02] shadow-xl shadow-brand-cyan/20 transition-all flex items-center justify-center gap-3"><Download className="w-4 h-4 md:w-5 h-5" /> Download Full HD</button>
                                    <button onClick={() => toggleCollection(viewingImage)} className="w-full py-4 md:py-5 bg-white/5 text-white font-black rounded-xl md:rounded-2xl uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                                        <Heart className={`w-4 h-4 ${collections.find(c => c.id === viewingImage.id) ? 'fill-brand-pink text-brand-pink' : ''}`} />
                                        {collections.find(c => c.id === viewingImage.id) ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                                    </button>
                                </div>
                            </div>

                            <div className="hidden lg:flex flex-1 bg-background-mid border border-white/5 rounded-[40px] p-8 flex flex-col items-center justify-center text-center space-y-4 border-dashed">
                                <div className="w-16 h-16 bg-white/5 rounded-[24px] flex items-center justify-center"><Grid className="w-8 h-8 text-gray-700" /></div>
                                <h5 className="text-xl font-black text-gray-500">Visual Matches</h5>
                                <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest leading-relaxed px-6">Busca similar em breve...</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageScoutTool;
