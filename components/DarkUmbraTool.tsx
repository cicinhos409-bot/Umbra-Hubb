import React, { useState, useEffect, useRef } from 'react';
import {
    Sparkles, RefreshCw, Download, AlertCircle, CheckCircle2, Send, X,
    Video, ImageIcon, Trash2, Lock, Zap, Clock, ChevronDown, Play, Film
} from 'lucide-react';

interface DarkUmbraToolProps {
    userTier?: string;
}

interface ModelInfo {
    id: string;
    provider: string;
    price: string;
    modes: string[];
    duration: string;
    quality?: string[];
    note?: string;
    fixedDurations?: number[];
}

const MODEL_GROUPS: { label: string; prefix: string; color: string }[] = [
    { label: 'Seedance (BytePlus)', prefix: 'doubao-seedance,seedance', color: 'text-brand-cyan' },
    { label: 'Kling', prefix: 'kling', color: 'text-brand-purple' },
    { label: 'Wan (Alibaba)', prefix: 'wan', color: 'text-brand-green' },
    { label: 'Veo (Google)', prefix: 'veo', color: 'text-blue-400' },
    { label: 'Sora (OpenAI)', prefix: 'sora', color: 'text-brand-pink' },
    { label: 'Hailuo (MiniMax)', prefix: 'MiniMax', color: 'text-orange-400' },
    { label: 'Grok (xAI)', prefix: 'grok', color: 'text-red-400' },
    { label: 'OmniHuman', prefix: 'omnihuman', color: 'text-yellow-400' },
];

const STATIC_MODELS: ModelInfo[] = [
    { id: "doubao-seedance-1.0-pro-fast", provider: "Seedance", price: "$0.019/s", modes: ["T2V", "I2V"], duration: "2–12s", quality: ["480p","720p","1080p"], note: "⭐ Melhor custo-benefício" },
    { id: "seedance-1.5-pro", provider: "Seedance", price: "$0.025/s", modes: ["T2V", "I2V", "FLF"], duration: "4–12s", quality: ["480p","720p","1080p"], note: "Áudio nativo" },
    { id: "kling-v3-text-to-video", provider: "Kling", price: "$0.075/s", modes: ["T2V"], duration: "3–15s", quality: ["720p","1080p"], note: "Multi-shot + som" },
    { id: "kling-v3-image-to-video", provider: "Kling", price: "$0.075/s", modes: ["I2V"], duration: "3–15s", quality: ["720p","1080p"], note: "First/last frame" },
    { id: "kling-o3-text-to-video", provider: "Kling", price: "$0.075/s", modes: ["T2V"], duration: "3–15s", quality: ["720p","1080p"], note: "Multi-shot avançado" },
    { id: "kling-o3-image-to-video", provider: "Kling", price: "$0.075/s", modes: ["I2V"], duration: "3–15s", quality: ["720p","1080p"], note: "First/last/ref frame" },
    { id: "wan2.5-text-to-video", provider: "Wan", price: "$0.071/s", modes: ["T2V"], duration: "2–15s", quality: ["720p","1080p"] },
    { id: "wan2.5-image-to-video", provider: "Wan", price: "$0.071/s", modes: ["I2V"], duration: "5s ou 10s", quality: ["480p","720p","1080p"], fixedDurations: [5, 10] },
    { id: "wan2.6-text-to-video", provider: "Wan", price: "$0.071/s", modes: ["T2V"], duration: "2–15s", quality: ["720p","1080p"], note: "Suporta audio_url" },
    { id: "wan2.6-image-to-video", provider: "Wan", price: "$0.071/s", modes: ["I2V"], duration: "3–15s", quality: ["720p","1080p"] },
    { id: "veo-3.1-fast-generate-preview", provider: "Veo", price: "$0.169/vídeo", modes: ["T2V", "I2V"], duration: "4/6/8s", quality: ["720p","1080p","4K"], note: "Alta qualidade + áudio", fixedDurations: [4, 6, 8] },
    { id: "veo-3.1-generate-preview", provider: "Veo", price: "$0.169/vídeo", modes: ["T2V", "I2V"], duration: "4/6/8s", quality: ["720p","1080p","4K"], note: "Versão Pro", fixedDurations: [4, 6, 8] },
    { id: "sora-2-preview", provider: "Sora", price: "$0.080/s", modes: ["T2V", "I2V"], duration: "4/8/12s", quality: ["720p","1080p"], note: "Moderação rígida", fixedDurations: [4, 8, 12] },
    { id: "sora-2-pro-preview", provider: "Sora", price: "$0.240/s", modes: ["T2V", "I2V"], duration: "4/8/12s", quality: ["720p","1080p"], note: "Qualidade pro", fixedDurations: [4, 8, 12] },
    { id: "MiniMax-Hailuo-02", provider: "Hailuo", price: "$0.250/vídeo", modes: ["T2V", "I2V", "FLF"], duration: "6s ou 10s", quality: ["512p","768p","1080p"], note: "Comandos de câmera", fixedDurations: [6, 10] },
    { id: "MiniMax-Hailuo-2.3", provider: "Hailuo", price: "$0.250/vídeo", modes: ["T2V", "I2V"], duration: "6s ou 10s", quality: ["768p","1080p"], note: "Qualidade máxima", fixedDurations: [6, 10] },
    { id: "grok-imagine-video", provider: "Grok", price: "$0.064/vídeo", modes: ["T2V", "I2V"], duration: "6–10s", note: "fun / normal / spicy" },
    { id: "omnihuman-1.5", provider: "OmniHuman", price: "$0.167/s", modes: ["Avatar"], duration: "baseado no áudio", note: "Lip-sync falante" },
];

const DarkUmbraTool: React.FC<DarkUmbraToolProps> = ({ userTier }) => {
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('doubao-seedance-1.0-pro-fast');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [duration, setDuration] = useState(5);
    const [quality, setQuality] = useState('720p');
    const [imageUrl, setImageUrl] = useState('');
    const [generateAudio, setGenerateAudio] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [showModelPicker, setShowModelPicker] = useState(false);

    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const currentModel = STATIC_MODELS.find(m => m.id === selectedModel) || STATIC_MODELS[0];
    const isI2V = currentModel.modes.includes('I2V') && !currentModel.modes.includes('T2V');
    const supportsImage = currentModel.modes.includes('I2V');
    const supportsAudio = currentModel.id.includes('seedance-1.5') || currentModel.id.includes('veo-3.1') || currentModel.id.includes('wan2.6');
    const hasFixedDurations = !!currentModel.fixedDurations;

    const aspectRatios = [
        { id: '16:9', label: 'Widescreen', icon: '🖥️' },
        { id: '9:16', label: 'Vertical', icon: '📱' },
        { id: '1:1', label: 'Quadrado', icon: '⬜' },
    ];

    const qualities = currentModel.quality || ['720p', '1080p'];

    const startGeneration = async () => {
        if (!prompt.trim() && !imageUrl.trim()) {
            setError('Digite um prompt ou forneça uma imagem.');
            return;
        }

        setLoading(true);
        setError(null);
        setVideoUrl(null);
        setProgress(0);
        setStatusText('Enviando tarefa para o servidor...');

        try {
            const body: any = {
                prompt: prompt.trim(),
                model: selectedModel,
                aspect_ratio: aspectRatio,
                duration,
                quality,
            };
            if (imageUrl.trim()) body.image_urls = [imageUrl.trim()];
            if (supportsAudio && generateAudio) body.generate_audio = true;

            const res = await fetch('/api/evolink?action=generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || JSON.stringify(data.error) || 'Erro ao iniciar geração');

            setTaskId(data.task_id);
            setStatusText(`Tarefa criada! Tempo estimado: ~${data.estimated_time ?? '?'}s`);

            // Start polling
            pollStatus(data.task_id);

        } catch (err: any) {
            setError(err.message || 'Erro ao gerar vídeo.');
            setLoading(false);
            setStatusText('');
        }
    };

    const pollStatus = (id: string) => {
        if (pollingRef.current) clearInterval(pollingRef.current);

        pollingRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/evolink?action=status&taskId=${id}`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error?.message || 'Erro ao consultar status');
                }

                setProgress(data.progress || 0);
                setStatusText(`Status: ${data.status} — ${data.progress || 0}%`);

                if (data.status === 'completed') {
                    clearInterval(pollingRef.current!);
                    pollingRef.current = null;
                    setVideoUrl(data.video_url);
                    setLoading(false);
                    setStatusText('');
                    setProgress(100);
                }

                if (data.status === 'failed') {
                    clearInterval(pollingRef.current!);
                    pollingRef.current = null;
                    setError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error) || 'Geração falhou.');
                    setLoading(false);
                    setStatusText('');
                }
            } catch (err: any) {
                // Don't stop polling on network errors, just log
                console.error('Poll error:', err);
            }
        }, 5000);
    };

    const downloadVideo = async () => {
        if (!videoUrl) return;
        try {
            const res = await fetch(videoUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `dark-umbra-${Date.now()}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch {
            // Fallback: open in new tab
            window.open(videoUrl, '_blank');
        }
    };

    const resetAll = () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setVideoUrl(null);
        setTaskId(null);
        setPrompt('');
        setImageUrl('');
        setProgress(0);
        setStatusText('');
        setError(null);
        setLoading(false);
    };

    // ── Locked state — TURBO only ──
    if (userTier !== 'TURBO') {
        return (
            <div className="max-w-4xl mx-auto py-20 px-6 text-center animate-in fade-in zoom-in duration-700 font-rajdhani">
                <div className="mb-12 relative flex justify-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[32px] flex items-center justify-center animate-pulse border border-white/10 shadow-2xl">
                        <Lock className="w-12 h-12 text-gray-500" />
                    </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6 leading-none">
                    Dark <span className="bg-gradient-to-r from-gray-400 to-white bg-clip-text text-transparent">Umbra</span>
                </h2>
                <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12">
                    Acesso a <span className="text-white font-black">18+ modelos de IA</span> para geração de vídeo (Seedance, Kling, Wan, Veo, Sora, Hailuo, Grok) é exclusivo para assinantes do <span className="text-brand-pink font-black">PLANO TURBO</span>.
                </p>
                <button
                    onClick={() => {
                        const checkout = document.getElementById('checkout');
                        if (checkout) checkout.scrollIntoView({ behavior: 'smooth' });
                        else window.open('https://pay.cakto.com.br/36m5p68', '_blank');
                    }}
                    className="px-12 py-5 bg-gradient-to-r from-brand-pink to-brand-purple text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand-pink/30 hover:scale-105 transition-all group border border-white/10"
                >
                    <Zap className="inline-block w-4 h-4 mr-2 fill-current" /> Assinar Turbo
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20 font-rajdhani">
            {/* HEADER */}
            <header className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">
                    <Film className="w-4 h-4" /> Powered by EvoLink AI
                </div>
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                    Dark <span className="bg-gradient-to-r from-gray-400 via-white to-gray-400 bg-clip-text text-transparent">Umbra</span>
                </h1>
                <p className="text-gray-500 max-w-xl mx-auto text-base font-medium">
                    Geração de vídeo com IA multi-modelo. Escolha entre <span className="text-white font-black">18+ modelos</span> dos maiores provedores do mundo.
                </p>
            </header>

            {/* CONFIGURAÇÕES */}
            <section className="bg-background-mid border border-white/5 rounded-[40px] p-6 sm:p-8 md:p-10 shadow-2xl space-y-8">

                {/* Model Selector */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-3 h-3 text-brand-purple" /> Modelo de IA
                    </label>
                    <button
                        onClick={() => setShowModelPicker(!showModelPicker)}
                        disabled={loading}
                        className="w-full flex items-center justify-between p-5 bg-background-light border border-white/10 rounded-[24px] hover:border-white/20 transition-all"
                    >
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 bg-brand-purple/10 rounded-xl flex items-center justify-center text-brand-purple shrink-0">
                                <Video className="w-5 h-5" />
                            </div>
                            <div className="text-left min-w-0">
                                <div className="text-sm font-black text-white truncate">{currentModel.id}</div>
                                <div className="text-[9px] font-bold text-gray-500 flex items-center gap-3 flex-wrap">
                                    <span>{currentModel.provider}</span>
                                    <span className="text-brand-cyan">{currentModel.price}</span>
                                    <span>{currentModel.modes.join(' · ')}</span>
                                    <span>{currentModel.duration}</span>
                                </div>
                            </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Model Picker Dropdown */}
                    {showModelPicker && (
                        <div className="bg-background-deep border border-white/10 rounded-3xl max-h-[400px] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200 shadow-2xl">
                            {MODEL_GROUPS.map(group => {
                                const prefixes = group.prefix.split(',');
                                const groupModels = STATIC_MODELS.filter(m =>
                                    prefixes.some(p => m.id.toLowerCase().startsWith(p.toLowerCase()))
                                );
                                if (groupModels.length === 0) return null;
                                return (
                                    <div key={group.label}>
                                        <div className={`px-5 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] ${group.color} bg-white/5 border-b border-white/5`}>
                                            {group.label}
                                        </div>
                                        {groupModels.map(model => (
                                            <button
                                                key={model.id}
                                                onClick={() => {
                                                    setSelectedModel(model.id);
                                                    setShowModelPicker(false);
                                                    // Reset quality to first available
                                                    if (model.quality && model.quality.length > 0) {
                                                        setQuality(model.quality.includes('720p') ? '720p' : model.quality[0]);
                                                    }
                                                }}
                                                className={`w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-all border-b border-white/5 last:border-b-0 ${
                                                    selectedModel === model.id ? 'bg-brand-purple/10 border-l-2 border-l-brand-purple' : ''
                                                }`}
                                            >
                                                <div className="flex-1 text-left min-w-0">
                                                    <div className="text-xs font-bold text-white truncate">{model.id}</div>
                                                    <div className="text-[9px] text-gray-500 flex items-center gap-2 flex-wrap mt-1">
                                                        <span className="text-brand-cyan font-black">{model.price}</span>
                                                        <span className="px-1.5 py-0.5 bg-white/5 rounded text-[8px]">{model.modes.join(' · ')}</span>
                                                        <span>{model.duration}</span>
                                                        {model.note && <span className="text-gray-600">· {model.note}</span>}
                                                    </div>
                                                </div>
                                                {selectedModel === model.id && <CheckCircle2 className="w-4 h-4 text-brand-purple shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Prompt */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-brand-purple" /> Prompt do Vídeo
                    </label>
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        disabled={loading}
                        placeholder="Ex: Uma praia tropical ao pôr do sol com ondas suaves e luz dourada cinematográfica, drone shot..."
                        className="w-full h-32 bg-background-light border border-white/10 rounded-[24px] p-6 text-sm font-bold focus:border-brand-purple/50 outline-none resize-none transition-all placeholder:text-gray-700"
                    />
                    <p className="text-[9px] text-gray-600 ml-2">{prompt.length}/500 caracteres</p>
                </div>

                {/* Image URL (if model supports I2V) */}
                {supportsImage && (
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <ImageIcon className="w-3 h-3 text-brand-cyan" /> Imagem de Referência {isI2V ? '(obrigatória)' : '(opcional — I2V)'}
                        </label>
                        <input
                            type="text"
                            value={imageUrl}
                            onChange={e => setImageUrl(e.target.value)}
                            disabled={loading}
                            placeholder="Cole uma URL de imagem: https://exemplo.com/imagem.jpg"
                            className="w-full bg-background-light border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-brand-cyan/50 outline-none transition-all"
                        />
                        {imageUrl && imageUrl.startsWith('http') && (
                            <div className="flex items-center gap-3">
                                <img
                                    src={imageUrl}
                                    alt="Preview"
                                    className="w-16 h-16 rounded-xl object-cover border border-white/10"
                                    onError={e => (e.target as HTMLImageElement).style.display = 'none'}
                                />
                                <button onClick={() => setImageUrl('')} className="text-[9px] text-brand-pink font-black uppercase tracking-widest hover:opacity-70 transition-opacity">
                                    Remover
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Settings Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Aspect Ratio */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Proporção</label>
                        <div className="flex gap-2">
                            {aspectRatios.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => setAspectRatio(r.id)}
                                    disabled={loading}
                                    className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${aspectRatio === r.id ? 'bg-brand-purple/10 border-brand-purple text-white' : 'bg-background-deep border-white/5 text-gray-500 hover:border-white/10'}`}
                                >
                                    <span className="text-lg">{r.icon}</span>
                                    <span className="text-[8px] font-black uppercase">{r.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3 h-3" /> Duração (segundos)
                        </label>
                        {hasFixedDurations ? (
                            <div className="flex gap-2">
                                {currentModel.fixedDurations!.map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDuration(d)}
                                        disabled={loading}
                                        className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${duration === d ? 'bg-brand-purple/10 border-brand-purple text-white' : 'bg-background-deep border-white/5 text-gray-500 hover:border-white/10'}`}
                                    >
                                        <span className="text-sm font-black">{d}s</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <>
                                <input
                                    type="range"
                                    min={2}
                                    max={15}
                                    step={1}
                                    value={duration}
                                    onChange={e => setDuration(Number(e.target.value))}
                                    disabled={loading}
                                    className="w-full accent-brand-purple"
                                />
                                <div className="flex justify-between text-[9px] font-black text-gray-600">
                                    <span>2s</span>
                                    <span className="text-brand-purple text-sm">{duration}s</span>
                                    <span>15s</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Quality */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Qualidade</label>
                        <div className="flex gap-2">
                            {qualities.map(q => (
                                <button
                                    key={q}
                                    onClick={() => setQuality(q)}
                                    disabled={loading}
                                    className={`flex-1 p-3 rounded-2xl border text-center transition-all ${quality === q ? 'bg-brand-purple/10 border-brand-purple text-white' : 'bg-background-deep border-white/5 text-gray-500 hover:border-white/10'}`}
                                >
                                    <span className="text-xs font-black">{q}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Audio toggle */}
                {supportsAudio && (
                    <div className="flex items-center gap-4 p-4 bg-background-light border border-white/5 rounded-2xl">
                        <button
                            onClick={() => setGenerateAudio(!generateAudio)}
                            disabled={loading}
                            className={`w-12 h-7 rounded-full transition-all relative ${generateAudio ? 'bg-brand-purple' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all ${generateAudio ? 'left-6' : 'left-1'}`} />
                        </button>
                        <div>
                            <div className="text-xs font-black text-white">Gerar Áudio</div>
                            <div className="text-[9px] text-gray-500">Adiciona voz, efeitos e música automaticamente</div>
                        </div>
                    </div>
                )}

                {/* Generate Button */}
                <button
                    onClick={startGeneration}
                    disabled={loading || (!prompt.trim() && !imageUrl.trim())}
                    className="w-full py-6 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-3xl text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:from-gray-600 hover:via-gray-500 hover:to-gray-600 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 border border-white/10"
                >
                    {loading
                        ? <><RefreshCw className="w-5 h-5 animate-spin" /> {statusText || 'Processando...'}</>
                        : <><Send className="w-5 h-5" /> Gerar Vídeo com Dark Umbra</>
                    }
                </button>

                {/* Progress Bar */}
                {loading && progress > 0 && (
                    <div className="space-y-2">
                        <div className="h-2 bg-background-deep rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-brand-purple to-brand-cyan rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-gray-600">
                            <span>{statusText}</span>
                            <span className="text-brand-purple">{progress}%</span>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="p-4 bg-brand-pink/10 border border-brand-pink/20 rounded-2xl flex items-start gap-3 text-brand-pink">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">{error}</span>
                    </div>
                )}
            </section>

            {/* RESULTADO */}
            {videoUrl && (
                <section className="bg-background-mid border border-white/10 rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                        <div className="lg:col-span-8 bg-black flex items-center justify-center min-h-[350px]">
                            <video
                                src={videoUrl}
                                controls
                                autoPlay
                                loop
                                className="max-w-full max-h-[70vh] rounded-none"
                            />
                        </div>
                        <div className="lg:col-span-4 p-8 sm:p-10 flex flex-col justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tighter text-white">Vídeo Pronto!</h3>
                                        <span className="text-[9px] font-black text-gray-500 uppercase">{currentModel.id} · {duration}s · {quality} · {aspectRatio}</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-background-light border border-white/5 rounded-2xl text-xs font-medium text-gray-400 italic leading-relaxed">
                                    "{prompt}"
                                </div>
                                <div className="p-3 bg-brand-pink/5 border border-brand-pink/10 rounded-xl text-[9px] text-brand-pink font-bold flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    Link expira em 24h — faça download agora!
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={downloadVideo}
                                    className="w-full py-5 bg-brand-green text-background-deep font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    <Download className="w-5 h-5" /> Download MP4
                                </button>
                                <button
                                    onClick={resetAll}
                                    className="w-full py-5 bg-white/5 border border-white/10 text-white font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                                >
                                    <Trash2 className="w-5 h-5" /> Novo Vídeo
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Info Cards */}
            {!videoUrl && !loading && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-6 bg-background-mid border border-white/5 rounded-3xl text-center space-y-3">
                        <div className="text-3xl">🚀</div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">18+ Modelos</h4>
                        <p className="text-[10px] text-gray-500 font-medium">Seedance, Kling, Wan, Veo, Sora, Hailuo, Grok e OmniHuman</p>
                    </div>
                    <div className="p-6 bg-background-mid border border-white/5 rounded-3xl text-center space-y-3">
                        <div className="text-3xl">🎬</div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Até 4K</h4>
                        <p className="text-[10px] text-gray-500 font-medium">Qualidade cinematográfica com resolução até 4K (dependendo do modelo)</p>
                    </div>
                    <div className="p-6 bg-background-mid border border-white/5 rounded-3xl text-center space-y-3">
                        <div className="text-3xl">🎙️</div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">Áudio Nativo</h4>
                        <p className="text-[10px] text-gray-500 font-medium">Modelos selecionados geram voz, efeitos e música automaticamente</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DarkUmbraTool;
