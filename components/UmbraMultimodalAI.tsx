import React, { useState, useEffect, useRef } from 'react';
import {
    Sparkles, RefreshCw, Download, AlertCircle, CheckCircle2, Send, X,
    Video, ImageIcon, Trash2, Lock, Zap, Clock, ChevronDown, ChevronUp, Play, Film,
    Layers, Palette, Maximize2, Monitor, Smartphone, Square, Layout,
    Type, Camera, Settings, Image as ImageLucide
} from 'lucide-react';

// ─── TYPES ───
interface UmbraMultimodalAIProps { userTier?: string; }

interface ModelInfo {
    id: string; label: string; provider: string; type: 'image' | 'video';
    modes?: string[]; duration?: string; fixedDurations?: number[]; quality?: string[];
    apiType?: 'pollinations' | 'evolink';
    image?: string; // For style previews if possible
}

// ─── MODELS ───
const IMAGE_MODELS: ModelInfo[] = [
    { id: 'flux', label: 'Flux Schnell', provider: 'Flux', type: 'image', apiType: 'pollinations' },
    { id: 'flux-2-dev', label: 'FLUX.2 Dev', provider: 'Flux', type: 'image', apiType: 'pollinations' },
    { id: 'dirtberry', label: 'Dirtberry', provider: 'Pollinations', type: 'image', apiType: 'pollinations' },
    { id: 'zimage', label: 'Z-Image Turbo', provider: 'Pollinations', type: 'image', apiType: 'pollinations' },
    { id: 'imagen-4', label: 'Imagen 4', provider: 'Google', type: 'image', apiType: 'pollinations' },
    { id: 'grok-imagine', label: 'Grok Imagine', provider: 'xAI', type: 'image', apiType: 'pollinations' },
    { id: 'klein', label: 'FLUX.2 Klein 4B', provider: 'Flux', type: 'image', apiType: 'pollinations' },
    { id: 'gptimage', label: 'GPT Image 1 Mini', provider: 'OpenAI', type: 'image', apiType: 'pollinations' },
    { id: 'dirtberry-pro', label: 'Dirtberry Pro', provider: 'Pollinations', type: 'image', apiType: 'pollinations' },
];

const VIDEO_MODELS: ModelInfo[] = [
    { id: 'grok-video-poll', label: '⚡ Grok Video (Free)', provider: 'Pollinations', type: 'video', apiType: 'pollinations', duration: '4/6/8s', fixedDurations: [4, 6, 8] },
    { id: "MiniMax-Hailuo-02", label: "MiniMax Hailuo 02", provider: "Hailuo", type: 'video', apiType: 'evolink', modes: ["T2V", "I2V"], duration: "6/10s", fixedDurations: [6, 10] },
    { id: "MiniMax-Hailuo-2.3", label: "MiniMax Hailuo 2.3", provider: "Hailuo", type: 'video', apiType: 'evolink', modes: ["T2V", "I2V"], duration: "6/10s", fixedDurations: [6, 10] },
    { id: "grok-imagine-video", label: "Grok Imagine Video", provider: "Grok", type: 'video', apiType: 'evolink', modes: ["T2V", "I2V"], duration: "6-10s" },
    { id: "omnihuman-1.5", label: "OmniHuman 1.5", provider: "OmniHuman", type: 'video', apiType: 'evolink', modes: ["Avatar"], duration: "Audio" },
    { id: "veo-3.1-fast-generate-preview", label: "Veo 3.1 Fast", provider: "Veo", type: 'video', apiType: 'evolink', modes: ["T2V", "I2V"], duration: "4/6/8s", fixedDurations: [4, 6, 8] },
    { id: "veo-3.1-generate-preview", label: "Veo 3.1 Pro", provider: "Veo", type: 'video', apiType: 'evolink', modes: ["T2V", "I2V"], duration: "4/6/8s", fixedDurations: [4, 6, 8] },
    { id: "sora-2-preview", label: "Sora 2 Preview", provider: "Sora", type: 'video', apiType: 'evolink', modes: ["T2V", "I2V"], duration: "4/8/12s", fixedDurations: [4, 8, 12] },
    { id: "sora-2-pro-preview", label: "Sora 2 Pro", provider: "Sora", type: 'video', apiType: 'evolink', modes: ["T2V", "I2V"], duration: "4/8/12s", fixedDurations: [4, 8, 12] },
    { id: "wan2.5-text-to-video", label: "Wan 2.5 T2V", provider: "Wan", type: 'video', apiType: 'evolink', modes: ["T2V"], duration: "2-15s" },
    { id: "wan2.5-image-to-video", label: "Wan 2.5 I2V", provider: "Wan", type: 'video', apiType: 'evolink', modes: ["I2V"], duration: "5/10s", fixedDurations: [5, 10] },
    { id: "wan2.6-text-to-video", label: "Wan 2.6 T2V", provider: "Wan", type: 'video', apiType: 'evolink', modes: ["T2V"], duration: "2-15s" },
    { id: "wan2.6-image-to-video", label: "Wan 2.6 I2V", provider: "Wan", type: 'video', apiType: 'evolink', modes: ["I2V"], duration: "3-15s" },
    { id: "kling-va-text-to-video", label: "Kling VA T2V", provider: "Kling", type: 'video', apiType: 'evolink', modes: ["T2V"], duration: "3-15s" },
    { id: "kling-v3-image-to-video", label: "Kling V3 I2V", provider: "Kling", type: 'video', apiType: 'evolink', modes: ["I2V"], duration: "3-15s" },
    { id: "kling-03-text-to-video", label: "Kling 03 T2V", provider: "Kling", type: 'video', apiType: 'evolink', modes: ["T2V"], duration: "3-15s" },
    { id: "kling-03-image-to-video", label: "Kling 03 I2V", provider: "Kling", type: 'video', apiType: 'evolink', modes: ["I2V"], duration: "3-15s" },
    { id: "doubao-seedance-1.0-pro-fast", label: "Seedance 1.0 Fast", provider: "Seedance", type: 'video', apiType: 'evolink', modes: ["T2V", "I2V"], duration: "2-12s" },
    { id: "seedance-1.5-pro", label: "Seedance 1.5 Pro", provider: "Seedance", type: 'video', apiType: 'evolink', modes: ["T2V", "I2V"], duration: "4-12s" },
];

// ─── STYLES WITH EMOJIS (as preview thumbnails) ───
const STYLES = [
    { id: 'Realista', emoji: '📸', color: '#6ee7b7' },
    { id: 'Ilustração', emoji: '🎨', color: '#a78bfa' },
    { id: 'Retrato', emoji: '👤', color: '#f9a8d4' },
    { id: 'Arlene', emoji: '✨', color: '#fbbf24' },
    { id: 'Dzine Realista v3', emoji: '🔬', color: '#34d399' },
    { id: 'Dzine Realista v2', emoji: '🔭', color: '#2dd4bf' },
    { id: 'Produto Realista', emoji: '📦', color: '#fb923c' },
    { id: 'Simplicidade Elegante', emoji: '🤍', color: '#e2e8f0' },
    { id: 'Arte Linear', emoji: '✏️', color: '#94a3b8' },
    { id: 'Fusão de Destaque', emoji: '💥', color: '#f43f5e' },
    { id: 'Vistas Cósmicas', emoji: '🌌', color: '#818cf8' },
    { id: 'Ângulo Baixo', emoji: '📐', color: '#60a5fa' },
    { id: 'Olho de Peixe', emoji: '🐟', color: '#22d3ee' },
    { id: 'Tela Natural', emoji: '🌿', color: '#4ade80' },
    { id: 'Arte Material', emoji: '🧱', color: '#d97706' },
    { id: 'Logo e Ícone', emoji: '🏷️', color: '#c084fc' },
    { id: 'Personagem', emoji: '🧑‍🎤', color: '#fb7185' },
    { id: 'Cena', emoji: '🎭', color: '#a855f7' },
    { id: 'CCD Retrô', emoji: '📼', color: '#fbbf24' },
    { id: 'Serenidade Natural', emoji: '🌊', color: '#67e8f9' },
    { id: 'Tonalidade Verde', emoji: '🍃', color: '#22c55e' },
    { id: 'Foto P&B', emoji: '🖤', color: '#9ca3af' },
    { id: 'Sal Desfocado', emoji: '🌫️', color: '#cbd5e1' },
    { id: 'Interior', emoji: '🛋️', color: '#f59e0b' },
    { id: 'Silhueta', emoji: '🌗', color: '#1e293b' },
    { id: 'Alm Realista', emoji: '🌅', color: '#f97316' },
    { id: 'Brinquedo de Pelúcia', emoji: '🧸', color: '#fda4af' },
    { id: 'Salpico Dinâmico', emoji: '💦', color: '#38bdf8' },
    { id: 'Foto Dzine Kac', emoji: '📷', color: '#a3e635' },
    { id: 'Joias Dzine', emoji: '💎', color: '#c4b5fd' },
];

const ASPECT_RATIOS = ['21:9','16:9','9:16','3:2','4:3','5:4','1:1','4:5','3:4','2:3'];
const DURATIONS = [2, 4, 5, 6, 8, 9, 12, 14, 15];
const QUALITIES = ['480p', '720p', '1080p'];
const PALETTES = ['Barbie','Cyberpunk','Magia','Euforia','Foto Stil','Fresca','Personalizada'];

const POLLINATIONS_KEY = 'sk_wDCaIosbvn4LtusU3EoLSuoTMrvKCBQ8';

// ─── COMPONENT ───
const UmbraMultimodalAI: React.FC<UmbraMultimodalAIProps> = ({ userTier }) => {
    const [mode, setMode] = useState<'image' | 'video'>('image');
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0].id);
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [duration, setDuration] = useState(6);
    const [quality, setQuality] = useState('720p');
    const [selectedStyle, setSelectedStyle] = useState('Realista');
    const [selectedPalette, setSelectedPalette] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [statusText, setStatusText] = useState('');
    const [progress, setProgress] = useState(0);

    // Bottom panel tabs
    const [activePanel, setActivePanel] = useState<'models' | 'styles' | 'settings' | null>('models');

    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, []);

    // Reset model when mode changes
    useEffect(() => {
        setSelectedModel(mode === 'image' ? IMAGE_MODELS[0].id : VIDEO_MODELS[0].id);
    }, [mode]);

    const currentModel = [...IMAGE_MODELS, ...VIDEO_MODELS].find(m => m.id === selectedModel) || IMAGE_MODELS[0];

    // ─── GENERATE ───
    const handleGenerate = async () => {
        if (!prompt.trim()) { setError('Digite um prompt para começar.'); return; }
        setLoading(true); setError(null); setResultUrl(null); setProgress(0);
        setStatusText('Iniciando magia AI...');

        try {
            if (mode === 'image') {
                await generateImage();
            } else {
                if (currentModel.apiType === 'pollinations') {
                    await generateVideoPollinations();
                } else {
                    await generateVideoEvolink();
                }
            }
        } catch (err: any) {
            setError(err.message || 'Erro inesperado.');
            setLoading(false); setStatusText('');
        }
    };

    const generateImage = async () => {
        const stylePrompt = `${selectedStyle} style. ${selectedPalette ? selectedPalette + ' color palette.' : ''} ${prompt}`;
        const sizeMap: Record<string, string> = {
            '1:1': '1024x1024',
            '16:9': '1792x1024',
            '9:16': '1024x1792',
            '4:3': '1024x768',
            '3:4': '768x1024',
            '3:2': '1024x682',
            '2:3': '682x1024',
            '5:4': '1024x820',
            '4:5': '820x1024',
            '21:9': '1792x768',
        };
        const size = sizeMap[aspectRatio] || '1024x1024';
        setStatusText('Gerando imagem...');

        const res = await fetch('https://gen.pollinations.ai/v1/images/generations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${POLLINATIONS_KEY}` },
            body: JSON.stringify({ prompt: stylePrompt, model: selectedModel, size, response_format: 'b64_json' })
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const blob = await (await fetch(`data:image/png;base64,${data.data[0].b64_json}`)).blob();
        setResultUrl(URL.createObjectURL(blob));
        setLoading(false); setStatusText('');
    };

    const generateVideoPollinations = async () => {
        // Reverting to width/height which is known to work for Pollinations /video endpoint
        // grok-video requires duration 6-15s
        const validDuration = Math.max(6, Math.min(15, duration));
        
        const width = aspectRatio === '9:16' ? '720' : '1280';
        const height = aspectRatio === '9:16' ? '1280' : '720';

        const params = new URLSearchParams({
            model: 'grok-video',
            width,
            height,
            duration: String(validDuration),
            key: POLLINATIONS_KEY,
        });
        if (imageUrl.trim().startsWith('http')) params.append('image', imageUrl.trim());
        const url = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt.slice(0, 500))}?${params}`;
        setStatusText(`Gerando vídeo (${validDuration}s)... pode demorar 1-3 min ⏳`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 300000);
        const res = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'video/mp4' } });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`Erro ${res.status}: ${(await res.text()).slice(0, 200)}`);
        const blob = await res.blob();
        if (blob.size < 1000) throw new Error('Vídeo inválido.');
        setResultUrl(URL.createObjectURL(blob));
        setLoading(false); setStatusText('');
    };

    const generateVideoEvolink = async () => {
        const body: any = { prompt: `${selectedStyle} style. ${prompt}`, model: selectedModel, aspect_ratio: aspectRatio, duration, quality };
        if (imageUrl.trim()) body.image_urls = [imageUrl.trim()];
        setStatusText('Enviando para EvoLink...');

        const res = await fetch('/api/evolink?action=generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Erro ao iniciar geração');
        setStatusText(`Tarefa criada! Estimativa: ~${data.estimated_time ?? '?'}s`);
        pollStatus(data.task_id);
    };

    const pollStatus = (id: string) => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/evolink?action=status&taskId=${id}`);
                const data = await res.json();
                setProgress(data.progress || 0);
                setStatusText(`Processando: ${data.progress || 0}%`);
                if (data.status === 'completed') {
                    clearInterval(pollingRef.current!); pollingRef.current = null;
                    setResultUrl(data.video_url); setLoading(false); setStatusText('');
                } else if (data.status === 'failed') {
                    clearInterval(pollingRef.current!); pollingRef.current = null;
                    setError(data.error || 'Geração falhou.'); setLoading(false); setStatusText('');
                }
            } catch (e) { console.error(e); }
        }, 5000);
    };

    const downloadResult = () => {
        if (!resultUrl) return;
        const a = document.createElement('a');
        a.href = resultUrl;
        a.download = `umbra-${mode}-${Date.now()}.${mode === 'image' ? 'png' : 'mp4'}`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    // ─── LOCKED ───
    if (userTier === 'Free' || !userTier) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-6 text-center animate-in fade-in zoom-in duration-700 font-rajdhani">
                <div className="mb-12 flex justify-center">
                    <div className="w-24 h-24 bg-brand-purple/10 rounded-[32px] flex items-center justify-center text-brand-purple animate-pulse">
                        <Lock className="w-12 h-12" />
                    </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6">
                    Multimodal <span className="text-brand-purple">AI</span>
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-12">
                    Acesso a <span className="text-white font-black">27+ modelos</span> de imagem e vídeo é exclusivo para assinantes do <span className="text-brand-purple font-black">PLANO PRO</span>.
                </p>
                <button onClick={() => window.open('https://pay.cakto.com.br/3dko6xr_769683', '_blank')}
                    className="px-12 py-5 bg-brand-purple text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand-purple/40 hover:scale-105 transition-all">
                    <Zap className="inline-block w-4 h-4 mr-2 fill-current" /> Desbloquear Agora
                </button>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col font-rajdhani" style={{ minHeight: 'calc(100vh - 80px)' }}>

            {/* ─── HEADER ─── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                    {/* Hamburger fallback trigger for dashboard sidebar */}
                    <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebar'))}
                        className="p-2 -ml-2 text-gray-500 hover:text-white md:hidden"
                    >
                        <Layout className="w-6 h-6" />
                    </button>
                    <div className="text-3xl hidden sm:block">🧠</div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tighter text-white">Multimodal AI</h1>
                        <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">27+ Modelos · Imagem & Vídeo</p>
                    </div>
                </div>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                    <button onClick={() => setMode('image')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'image' ? 'bg-brand-purple text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                        <ImageLucide className="w-3.5 h-3.5" /> Imagem
                    </button>
                    <button onClick={() => setMode('video')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${mode === 'video' ? 'bg-brand-purple text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                        <Video className="w-3.5 h-3.5" /> Vídeo
                    </button>
                </div>
            </div>

            {/* ─── PREVIEW AREA (BLACK SCREEN) ─── */}
            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden group" style={{ minHeight: '400px' }}>
                {/* Subtle noise */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'256\' height=\'256\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />

                {resultUrl ? (
                    <div className="relative animate-in fade-in zoom-in duration-700">
                        {mode === 'image' ? (
                            <div className="relative group/result">
                                <img src={resultUrl} alt="Result" className="max-w-full max-h-[60vh] object-contain rounded-2xl shadow-[0_0_80px_rgba(139,92,246,0.15)]" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/result:opacity-100 transition-opacity bg-black/40 rounded-2xl">
                                    <button onClick={downloadResult} className="bg-brand-purple text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transform translate-y-4 group-hover/result:translate-y-0 transition-all">
                                        <Download className="w-4 h-4" /> Baixar Imagem
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <video src={resultUrl} controls autoPlay loop className="max-w-full max-h-[60vh] object-contain rounded-2xl shadow-[0_0_80px_rgba(139,92,246,0.15)]" />
                        )}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                            <button onClick={downloadResult} className="px-6 py-3 bg-brand-green text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-2xl hover:scale-105 transition-all">
                                <Download className="w-4 h-4" /> Salvar Arquivo
                            </button>
                            <button onClick={() => { setResultUrl(null); setPrompt(''); }} className="px-6 py-3 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-white/20 transition-all">
                                <RefreshCw className="w-4 h-4" /> Novo
                            </button>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center gap-6 animate-in fade-in duration-300">
                        <div className="relative">
                            <div className="w-20 h-20 border-2 border-brand-purple/20 rounded-full animate-spin border-t-brand-purple" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-brand-purple animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-sm font-black text-white uppercase tracking-[0.15em]">{statusText}</p>
                            {progress > 0 && (
                                <div className="w-48 mx-auto">
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-brand-purple to-brand-cyan rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                                    </div>
                                    <p className="text-[9px] text-brand-purple font-bold mt-1">{progress}%</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 opacity-20 group-hover:opacity-40 transition-opacity duration-1000">
                        <div className="w-20 h-20 bg-gradient-to-br from-brand-purple/20 to-transparent rounded-[28px] flex items-center justify-center">
                            {mode === 'image' ? <ImageLucide className="w-8 h-8 text-brand-purple" /> : <Play className="w-8 h-8 text-brand-purple" />}
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-600">Digite um prompt e pressione Enter</p>
                    </div>
                )}

                {/* Current config badge */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-white/5 backdrop-blur border border-white/10 rounded-xl text-[8px] font-black text-gray-500 uppercase tracking-widest">
                        {currentModel.label} · {aspectRatio} · {quality}
                    </span>
                </div>

                {error && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-brand-pink/20 border border-brand-pink/30 rounded-2xl flex items-center gap-3 text-brand-pink backdrop-blur-xl">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="text-[10px] font-bold">{error}</span>
                        <button onClick={() => setError(null)} className="ml-2"><X className="w-3 h-3" /></button>
                    </div>
                )}
            </div>

            {/* ─── PROMPT BAR ─── */}
            <div className="px-6 py-4 bg-[#0a0a0a] border-t border-white/5">
                <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <div className="flex-1 bg-[#151515] border border-white/10 rounded-2xl p-1.5 flex items-center gap-3 group focus-within:border-brand-purple/40 transition-all">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                            <Type className="w-4 h-4 text-gray-600 group-focus-within:text-brand-purple transition-colors" />
                        </div>
                        <input
                            type="text" value={prompt} onChange={e => setPrompt(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                            placeholder={`Descreva sua ${mode === 'image' ? 'imagem' : 'cena de vídeo'} aqui...`}
                            className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-white placeholder:text-gray-700"
                        />
                        {mode === 'video' && (
                            <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                                placeholder="URL imagem (opc.)"
                                className="hidden md:block w-36 bg-white/5 rounded-lg px-3 py-2 text-[10px] font-bold text-gray-500 focus:text-white outline-none border border-white/5"
                            />
                        )}
                        <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
                            className="w-11 h-11 bg-brand-purple hover:brightness-125 text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-purple/20 transition-all disabled:opacity-30 active:scale-90 shrink-0">
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── BOTTOM CONTROL PANEL ─── */}
            <div className="bg-[#0a0a0a] border-t border-white/10">
                {/* Panel Tabs */}
                <div className="flex items-center justify-center gap-1 px-4 py-2 border-b border-white/5">
                    {[
                        { key: 'models' as const, icon: <Zap className="w-3.5 h-3.5" />, label: 'Modelos' },
                        { key: 'styles' as const, icon: <Palette className="w-3.5 h-3.5" />, label: 'Estilos' },
                        { key: 'settings' as const, icon: <Settings className="w-3.5 h-3.5" />, label: 'Config' },
                    ].map(tab => (
                        <button key={tab.key}
                            onClick={() => setActivePanel(activePanel === tab.key ? null : tab.key)}
                            className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activePanel === tab.key ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30' : 'text-gray-600 hover:text-gray-400 border border-transparent'}`}>
                            {tab.icon} {tab.label}
                            {activePanel === tab.key ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                        </button>
                    ))}
                </div>

                {/* Panel Content */}
                {activePanel && (
                    <div className="px-6 py-5 max-h-[280px] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-4 duration-300">

                        {/* MODELS PANEL */}
                        {activePanel === 'models' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                                {(mode === 'image' ? IMAGE_MODELS : VIDEO_MODELS).map(m => (
                                    <button key={m.id} onClick={() => setSelectedModel(m.id)}
                                        className={`p-3 rounded-2xl border text-left transition-all ${selectedModel === m.id ? 'bg-brand-purple/15 border-brand-purple shadow-lg shadow-brand-purple/10' : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/5'}`}>
                                        <div className="text-[11px] font-black text-white truncate">{m.label}</div>
                                        <div className="text-[8px] font-bold text-gray-600 uppercase mt-1 flex items-center gap-1">
                                            <span className={`w-1.5 h-1.5 rounded-full ${m.apiType === 'pollinations' ? 'bg-brand-cyan' : 'bg-brand-pink'}`} />
                                            {m.provider} {m.duration ? `· ${m.duration}` : ''}
                                        </div>
                                        {selectedModel === m.id && <CheckCircle2 className="w-3.5 h-3.5 text-brand-purple mt-1.5" />}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* STYLES PANEL */}
                        {activePanel === 'styles' && (
                            <div>
                                {/* Color Palettes */}
                                <div className="mb-5">
                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-2 block">Paleta de Cor</label>
                                    <div className="flex flex-wrap gap-2">
                                        {PALETTES.map(p => (
                                            <button key={p} onClick={() => setSelectedPalette(selectedPalette === p ? '' : p)}
                                                className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase transition-all ${selectedPalette === p ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan' : 'bg-white/5 border-white/5 text-gray-600 hover:text-white'}`}>
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Visual Styles with preview */}
                                <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-2 block">Estilos Visuais</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                                    {STYLES.map((s, idx) => {
                                        const x = (idx % 6) * 20; // 6 columns
                                        const y = Math.floor(idx / 6) * 25; // 5 rows
                                        return (
                                            <button key={s.id} onClick={() => setSelectedStyle(s.id)}
                                                className={`group/style relative overflow-hidden rounded-2xl border transition-all aspect-square flex flex-col items-center justify-end p-2 ${selectedStyle === s.id ? 'border-brand-purple bg-brand-purple/10 shadow-lg' : 'border-white/5 bg-white/[0.02] hover:bg-white/5'}`}>
                                                {/* Style Preview Image Grid */}
                                                <div className="absolute inset-0 opacity-40 group-hover/style:opacity-60 transition-opacity" 
                                                    style={{ 
                                                        backgroundImage: 'url(/style_previews.png)',
                                                        backgroundSize: '600% 500%',
                                                        backgroundPosition: `${x}% ${y}%`,
                                                    }} 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                                                
                                                <span className={`relative text-[8px] font-black uppercase tracking-tight text-center leading-tight z-10 ${selectedStyle === s.id ? 'text-white' : 'text-gray-400 group-hover/style:text-gray-200'}`}>
                                                    {s.id}
                                                </span>
                                                {selectedStyle === s.id && (
                                                    <div className="absolute top-2 right-2 z-20">
                                                        <CheckCircle2 className="w-3 h-3 text-brand-purple shadow-black shadow-lg" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* SETTINGS PANEL */}
                        {activePanel === 'settings' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                {/* Aspect Ratio */}
                                <div className="space-y-3">
                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Proporção</label>
                                    <div className="grid grid-cols-5 gap-1.5">
                                        {ASPECT_RATIOS.map(ar => (
                                            <button key={ar} onClick={() => setAspectRatio(ar)}
                                                className={`p-2 rounded-xl border text-center transition-all ${aspectRatio === ar ? 'bg-brand-purple/15 border-brand-purple text-white' : 'bg-white/[0.02] border-white/5 text-gray-600 hover:text-white'}`}>
                                                <span className="text-[9px] font-black">{ar}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quality */}
                                <div className="space-y-3">
                                    <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Qualidade</label>
                                    <div className="flex gap-2">
                                        {QUALITIES.map(q => (
                                            <button key={q} onClick={() => setQuality(q)}
                                                className={`flex-1 p-3 rounded-xl border text-center transition-all ${quality === q ? 'bg-brand-purple/15 border-brand-purple text-white' : 'bg-white/[0.02] border-white/5 text-gray-600 hover:text-white'}`}>
                                                <span className="text-[10px] font-black">{q}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Duration (video only) */}
                                {mode === 'video' && (
                                    <div className="space-y-3">
                                        <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> Duração
                                        </label>
                                        <div className="grid grid-cols-5 gap-1.5">
                                            {DURATIONS.map(d => (
                                                <button key={d} onClick={() => setDuration(d)}
                                                    className={`p-2 rounded-xl border text-center transition-all ${duration === d ? 'bg-brand-purple/15 border-brand-purple text-white' : 'bg-white/[0.02] border-white/5 text-gray-600 hover:text-white'}`}>
                                                    <span className="text-[10px] font-black">{d}s</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default UmbraMultimodalAI;
