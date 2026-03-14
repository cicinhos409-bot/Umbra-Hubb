
import React, { useState, useEffect, useRef } from 'react';
import { 
    Sparkles, 
    ImageIcon, 
    Download, 
    RefreshCw, 
    CheckCircle2, 
    AlertCircle, 
    Zap, 
    Search,
    ChevronRight,
    Maximize2,
    Trash2,
    Grid,
    Palette,
    Layers,
    Monitor,
    Smartphone,
    Square,
    Send,
    X
} from 'lucide-react';

const API_BASE_URL = 'https://umbra-hubb-production.up.railway.app';

interface UmbraImageGeneratorProps {
  userTier?: string;
}

interface ImageHistory {
    id: string;
    url: string;
    prompt: string;
    engine: string;
    timestamp: number;
}

const UmbraImageGenerator: React.FC<UmbraImageGeneratorProps> = ({ userTier }) => {
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [engine, setEngine] = useState<'pollinations' | 'dalle3'>('pollinations');
    const [style, setStyle] = useState('cinematic');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [history, setHistory] = useState<ImageHistory[]>([]);
    const [viewingImage, setViewingImage] = useState<ImageHistory | null>(null);

    const resultRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        const saved = localStorage.getItem('umbra_image_history');
        if (saved) setHistory(JSON.parse(saved));
    }, []);

    // Save History
    useEffect(() => {
        localStorage.setItem('umbra_image_history', JSON.stringify(history.slice(0, 20)));
    }, [history]);

    const stylesMeta = [
        { id: 'cinematic', label: 'Cinematográfico', icon: '🎬', prompt: 'Cinematic lighting, hyper-realistic, 8k, bokeh' },
        { id: 'anime', label: 'Anime Style', icon: '🇯🇵', prompt: 'Anime style, vibrant colors, clean lines, high quality' },
        { id: '3d-render', label: '3D Render', icon: '🧊', prompt: 'Octane render, 3D model, unreal engine 5, digital art' },
        { id: 'realistic', label: 'Realista', icon: '📸', prompt: 'Professional photography, sharp focus, natural colors' },
        { id: 'cyberpunk', label: 'Cyberpunk', icon: '🌃', prompt: 'Cyberpunk aesthetic, neon lights, futuristic city' },
        { id: 'oil-painting', label: 'Pintura a Óleo', icon: '🖼️', prompt: 'Oil painting, classical art, textured, brush strokes' },
    ];

    const ratios = [
        { id: '1:1', icon: Square, label: 'Quadrado', size: '1024x1024' },
        { id: '16:9', icon: Monitor, label: 'Widescreen', size: '1792x1024' },
        { id: '9:16', icon: Smartphone, label: 'Mobile/Shorts', size: '1024x1792' },
        { id: '4:3', icon: Grid, label: 'Classic', size: '1024x768' },
    ];

    const generateImage = async () => {
        if (!prompt) {
            setError('Por favor, digite um prompt.');
            return;
        }

        setLoading(true);
        setError(null);
        setCurrentImage(null);

        try {
            const selectedStyle = stylesMeta.find(s => s.id === style)?.prompt || '';
            const finalPrompt = `${prompt}, ${selectedStyle}. ${negativePrompt ? `Negative prompt: ${negativePrompt}` : ''}`;
            const ratioData = ratios.find(r => r.id === aspectRatio);

            let imageUrl = '';

            if (engine === 'pollinations') {
                const seed = Math.floor(Math.random() * 1000000);
                imageUrl = `https://pollinations.ai/p/${encodeURIComponent(finalPrompt)}?width=${ratioData?.size.split('x')[0]}&height=${ratioData?.size.split('x')[1]}&seed=${seed}&nologo=true`;
                
                const img = new Image();
                img.src = imageUrl;
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => reject(new Error('Falha ao renderizar imagem no Pollinations.'));
                });
            } else {
                const res = await fetch(`${API_BASE_URL}/api/openai-image`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: finalPrompt,
                        size: ratioData?.id === '1:1' ? '1024x1024' : ratioData?.id === '16:9' ? '1792x1024' : '1024x1792'
                    })
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || 'Erro na API da OpenAI.');
                }
                
                const data = await res.json();
                imageUrl = data.data[0].url;
            }

            setCurrentImage(imageUrl);
            const newHistoryItem = {
                id: Date.now().toString(),
                url: imageUrl,
                prompt: prompt,
                engine: engine === 'pollinations' ? 'Flux (Free)' : 'DALL-E 3 (Premium)',
                timestamp: Date.now()
            };
            setHistory(prev => [newHistoryItem, ...prev]);

            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 300);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadImage = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `umbra-image-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            window.open(url, '_blank');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20 font-rajdhani">
            <header className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full text-[10px] font-black tracking-[0.2em] text-brand-cyan uppercase">
                    <Palette className="w-4 h-4" /> Laboratório Visual Umbra
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
                    Image <span className="text-brand-cyan">Studio</span>
                </h1>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg font-medium">
                    Transforme palavras em imagens de alto impacto. Escolha entre motores leves ou motores de ultra-definição cinematográfica.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* SETTINGS PANEL */}
                <div className="lg:col-span-8 space-y-8">
                    <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-brand-cyan/10 transition-all" />
                        
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-brand-cyan" /> Prompt Criativo
                                </label>
                                <textarea 
                                    value={prompt} 
                                    onChange={e => setPrompt(e.target.value)}
                                    placeholder="Ex: Uma floresta mística envolta em névoa neon, estilo cinematográfico, ultra detalhado..."
                                    className="w-full h-32 bg-background-light border border-white/10 rounded-[32px] p-6 text-sm font-bold focus:border-brand-cyan/50 outline-none resize-none transition-all shadow-inner"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                                    <X className="w-3 h-3 text-brand-pink" /> Prompt Negativo (O que evitar)
                                </label>
                                <input 
                                    value={negativePrompt} 
                                    onChange={e => setNegativePrompt(e.target.value)}
                                    placeholder="Ex: borrão, distorção, texto, logo..."
                                    className="w-full bg-background-light border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-brand-pink/50 outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Estilo Artístico</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {stylesMeta.map(s => (
                                        <button 
                                            key={s.id} 
                                            onClick={() => setStyle(s.id)}
                                            className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${style === s.id ? 'bg-brand-cyan/10 border-brand-cyan text-white shadow-lg shadow-brand-cyan/10' : 'bg-background-deep border-white/5 text-gray-500 hover:border-white/10'}`}
                                        >
                                            <span className="text-xl">{s.icon}</span>
                                            <span className="text-[10px] font-black uppercase tracking-tight">{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Proporção (Aspect Ratio)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {ratios.map(r => (
                                        <button 
                                            key={r.id} 
                                            onClick={() => setAspectRatio(r.id)}
                                            className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${aspectRatio === r.id ? 'bg-brand-purple/10 border-brand-purple text-white shadow-lg shadow-brand-purple/10' : 'bg-background-deep border-white/5 text-gray-500 hover:border-white/10'}`}
                                        >
                                            <r.icon className={`w-5 h-5 ${aspectRatio === r.id ? 'text-brand-purple' : ''}`} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">{r.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 md:p-10 shadow-2xl">
                        <div className="flex flex-col md:flex-row gap-4">
                            <button 
                                onClick={() => setEngine('pollinations')}
                                className={`flex-1 p-6 rounded-[32px] border transition-all text-left group relative overflow-hidden ${engine === 'pollinations' ? 'bg-white/5 border-white/20' : 'bg-background-deep border-white/5 opacity-50 hover:opacity-100'}`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${engine === 'pollinations' ? 'bg-brand-cyan/20 text-brand-cyan' : 'bg-white/5 text-gray-500'}`}>
                                        <RefreshCw className={`w-6 h-6 ${engine === 'pollinations' && loading ? 'animate-spin' : ''}`} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-widest text-white">Flux (Free)</div>
                                        <div className="text-[10px] text-gray-500">Geração leve e ilimitada.</div>
                                    </div>
                                </div>
                                {engine === 'pollinations' && <div className="absolute inset-0 bg-brand-cyan/5 animate-pulse" />}
                            </button>

                            <button 
                                onClick={() => setEngine('dalle3')}
                                className={`flex-1 p-6 rounded-[32px] border transition-all text-left group relative overflow-hidden ${engine === 'dalle3' ? 'bg-white/5 border-brand-purple/30' : 'bg-background-deep border-white/5 opacity-50 hover:opacity-100'}`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${engine === 'dalle3' ? 'bg-brand-purple/20 text-brand-purple' : 'bg-white/5 text-gray-500'}`}>
                                        <Zap className="w-6 h-6 fill-current" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-widest text-white">DALL-E 3 (Premium)</div>
                                        <div className="text-[10px] text-gray-500">Qualidade cinematográfica extrema.</div>
                                    </div>
                                </div>
                                {engine === 'dalle3' && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-purple to-brand-pink" />}
                            </button>
                        </div>

                        <button 
                            onClick={generateImage} 
                            disabled={loading || !prompt}
                            className="w-full py-6 mt-8 bg-gradient-to-r from-brand-cyan to-brand-purple rounded-3xl text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-brand-cyan/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
                        >
                            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                            Gerar Obra de Arte
                        </button>
                        
                        {error && (
                            <div className="mt-6 p-4 bg-brand-pink/10 border border-brand-pink/20 rounded-2xl flex items-center gap-3 text-brand-pink animate-in slide-in-from-top-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span className="text-[10px] font-bold uppercase tracking-tight">{error}</span>
                            </div>
                        )}
                    </section>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-2xl h-full flex flex-col">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                            Recentes ({history.length}) <div className="h-px flex-1 bg-white/5" />
                        </h4>

                        {history.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar flex-1 pr-2 max-h-[800px]">
                                {history.map(img => (
                                    <div 
                                        key={img.id} 
                                        onClick={() => setViewingImage(img)}
                                        className="aspect-square bg-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-brand-cyan/50 border border-transparent transition-all group relative"
                                    >
                                        <img src={img.url} alt={img.prompt} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Maximize2 className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                                <Grid className="w-12 h-12 text-gray-500" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Histórico de Sessão Vazio</p>
                            </div>
                        )}

                        {history.length > 0 && (
                            <button 
                                onClick={() => { setHistory([]); localStorage.removeItem('umbra_image_history'); }}
                                className="mt-8 text-[9px] font-black text-gray-600 hover:text-brand-pink uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-3 h-3" /> Limpar Histórico
                            </button>
                        )}
                    </section>
                </div>
            </div>

            {(loading || currentImage) && (
                <div ref={resultRef} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <section className="bg-background-mid border border-brand-cyan/20 rounded-[48px] overflow-hidden shadow-2xl relative">
                        {loading ? (
                            <div className="p-32 text-center space-y-8">
                                <div className="flex justify-center gap-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={`w-4 h-4 rounded-full bg-brand-cyan animate-bounce`} style={{ animationDelay: `${i * 0.1}s` }} />
                                    ))}
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Renderizando via {engine.toUpperCase()}</h3>
                                <p className="text-gray-500 font-medium max-w-sm mx-auto uppercase text-[10px] tracking-widest">Injetando luz, sombras e detalhes mágicos...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                                <div className="lg:col-span-8 bg-black/40 flex items-center justify-center border-r border-white/5 relative group min-h-[500px]">
                                    <img src={currentImage!} alt="Generated" className="max-w-full max-h-[80vh] object-contain shadow-2xl" />
                                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-background-deep/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-2 text-[10px] font-black text-brand-cyan uppercase tracking-widest">
                                            {aspectRatio} · {engine.toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-4 p-10 flex flex-col justify-between">
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green">
                                                <CheckCircle2 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black uppercase tracking-tighter text-white">Geração Completa</h3>
                                                <span className="text-[9px] font-black text-gray-500 uppercase">Processo finalizado</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                                                <Layers className="w-3 h-3" /> Prompt Utilizado
                                            </label>
                                            <div className="p-5 bg-background-light border border-white/5 rounded-2xl text-xs font-medium text-gray-400 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar italic">
                                                "{prompt}"
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-10">
                                        <button 
                                            onClick={() => downloadImage(currentImage!)}
                                            className="w-full py-5 bg-brand-green text-background-deep font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-brand-green/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                                        >
                                            <Download className="w-5 h-5" /> Download HD
                                        </button>
                                        <button 
                                            onClick={generateImage}
                                            className="w-full py-5 bg-white/5 border border-white/10 text-white font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                                        >
                                            <RefreshCw className="w-5 h-5" /> Gerar Novamente
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            )}

            {viewingImage && (
                <div className="fixed inset-0 z-[300] bg-background-deep/98 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-300">
                    <button 
                        onClick={() => setViewingImage(null)}
                        className="absolute top-10 right-10 p-5 bg-white/5 rounded-[24px] text-white hover:text-brand-pink hover:bg-white/10 transition-all z-[310]"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-8 bg-black/40 rounded-[48px] overflow-hidden flex items-center justify-center border border-white/5">
                            <img src={viewingImage.url} alt={viewingImage.prompt} className="max-w-full max-h-[85vh] object-contain shadow-2xl" />
                        </div>
                        <div className="lg:col-span-4 space-y-10 flex flex-col justify-center">
                            <div className="space-y-6">
                                <span className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.3em]">{viewingImage.engine}</span>
                                <h3 className="text-3xl font-black tracking-tighter text-white uppercase leading-tight">Obra de Arte da Sessão</h3>
                                <p className="text-sm font-medium text-gray-500 leading-relaxed italic">"{viewingImage.prompt}"</p>
                            </div>
                            
                            <div className="pt-10 border-t border-white/5 flex flex-col gap-4">
                                <button 
                                    onClick={() => downloadImage(viewingImage.url)}
                                    className="w-full py-5 bg-brand-cyan text-background-deep font-black rounded-2xl uppercase text-xs tracking-widest hover:scale-[1.02] shadow-xl shadow-brand-cyan/20 transition-all flex items-center justify-center gap-3"
                                >
                                    <Download className="w-5 h-5" /> Download HD Original
                                </button>
                                <button 
                                    onClick={() => {
                                        setPrompt(viewingImage.prompt);
                                        setViewingImage(null);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="w-full py-5 bg-white/5 text-gray-400 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:text-white transition-all flex items-center justify-center gap-3"
                                >
                                    <RefreshCw className="w-4 h-4" /> Reusing Prompt
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UmbraImageGenerator;
