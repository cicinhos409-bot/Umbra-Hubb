import React, { useState, useEffect } from 'react';
import {
    Download,
    Search,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Video,
    Zap,
    Play,
    RotateCcw,
    Settings,
    Shield,
    ExternalLink,
    ChevronRight,
    X,
    Sparkles,
    Eye,
    Info,
    TrendingUp,
    Users,
    Copy,
    Brain,
    Layers,
    Wand2
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface SoraVideoData {
    status: string;
    method: string;
    title: string;
    prompt: string;
    pic: string;
    videoUrl: string;
    download_videoUrl: string;
}

const SoraDownTool: React.FC = () => {
    const [url, setUrl] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState(0);
    const [status, setStatus] = useState<{ type: 'info' | 'success' | 'error' | null, message: string }>({ type: null, message: '' });
    const [videoData, setVideoData] = useState<SoraVideoData | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [showVideo, setShowVideo] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [cookies, setCookies] = useState('');
    const [bearerToken, setBearerToken] = useState('');
    const [geminiKey, setGeminiKey] = useState('');

    // AI Enhancement States
    const [optimizedPrompt, setOptimizedPrompt] = useState('');
    const [isOptimizing, setIsOptimizing] = useState(false);

    // Stats
    const [liveUsers, setLiveUsers] = useState(Math.floor(Math.random() * 200) + 400);
    const [processedToday, setProcessedToday] = useState(Math.floor(Math.random() * 1000) + 8000);

    const steps = [
        { label: 'Analisando metadados do Sora', icon: <Search className="w-4 h-4" /> },
        { label: 'Localizando streams de alta definição', icon: <Layers className="w-4 h-4" /> },
        { label: 'Bypassing restrições de CDN', icon: <Shield className="w-4 h-4" /> },
        { label: 'Finalizando extração Umbra v2.7', icon: <Sparkles className="w-4 h-4" /> }
    ];

    useEffect(() => {
        const savedCookies = localStorage.getItem('umbra_sora_cookies');
        const savedBearer = localStorage.getItem('umbra_sora_bearer');
        const savedGemini = localStorage.getItem('gemini_api_key');
        if (savedCookies) setCookies(savedCookies);
        if (savedBearer) setBearerToken(savedBearer);
        if (savedGemini) setGeminiKey(savedGemini);

        const interval = setInterval(() => {
            setLiveUsers(prev => prev + (Math.random() > 0.5 ? 1 : -1));
            setProcessedToday(prev => prev + (Math.random() > 0.8 ? 1 : 0));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const saveSettings = () => {
        localStorage.setItem('umbra_sora_cookies', cookies);
        localStorage.setItem('umbra_sora_bearer', bearerToken);
        localStorage.setItem('gemini_api_key', geminiKey);
        setShowConfig(false);
        setStatus({ type: 'success', message: '✅ Configurações salvas com sucesso!' });
    };

    const handleSearch = async () => {
        if (!url.trim() || (!url.includes('sora.chatgpt.com/p') && !url.includes('sora.chatgpt.com/share'))) {
            setStatus({ type: 'error', message: '❌ Cole uma URL válida do Sora (sora.chatgpt.com/p/... ou /share/...)' });
            return;
        }

        setIsProcessing(true);
        setProcessingStep(0);
        setVideoData(null);
        setOptimizedPrompt('');
        setShowVideo(false);

        const stepTimer = setInterval(() => {
            setProcessingStep(prev => (prev < 3 ? prev + 1 : prev));
        }, 2000);

        try {
            const response = await fetch('/api/sora_down', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, cookies, bearerToken })
            });

            clearInterval(stepTimer);

            const data = await response.json();

            if (data.status === 'success') {
                setProcessingStep(4);
                setVideoData(data);
                setStatus({ type: 'success', message: `✅ Vídeo encontrado e pronto!` });
            } else {
                throw new Error(data.msg || 'Erro ao localizar vídeo');
            }
        } catch (err: any) {
            clearInterval(stepTimer);
            setStatus({ type: 'error', message: `❌ Erro: ${err.message}` });
        } finally {
            setIsProcessing(false);
        }
    };

    const optimizeSoraPrompt = async () => {
        if (!videoData || !videoData.prompt) return;

        const key = geminiKey.trim() || localStorage.getItem('gemini_api_key') || '';
        if (!key) {
            setStatus({ type: 'error', message: '❌ Configura a Gemini Key nas configurações!' });
            setShowConfig(true);
            return;
        }

        setIsOptimizing(true);
        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const systemRule = `Você é o Umbra AI Expert em Veo 3 e Sora. 
            Sua tarefa é pegar um prompt do Sora e transformá-lo em um "Veo 3 Production Prompt".
            
            Regras do Veo 3:
            1. Cinematic film, photorealistic, real human actors.
            2. Visual-only scene.
            3. Adicione detalhes de CÂMERA (ex: Drone shot, Close-up, Pan).
            4. Descreva ENVIRONMENT + LIGHTING (ex: Golden hour, Neon lights).
            5. Finalize com: Clean frame, 8K, photorealistic.
            6. Responda APENAS com o prompt em Inglês.`;

            const result = await model.generateContent(`${systemRule}\n\nPrompt Original do Sora: "${videoData.prompt}"`);
            const text = result.response.text().trim();
            setOptimizedPrompt(text);
            setStatus({ type: 'success', message: '✨ Prompt otimizado para Veo 3!' });
        } catch (err: any) {
            console.error(err);
            setStatus({ type: 'error', message: '❌ Erro ao otimizar com Gemini.' });
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleDownload = async () => {
        if (!videoData) return;
        setDownloading(true);
        setStatus({ type: 'info', message: '⚡ Iniciando tunelamento de download...' });

        try {
            const proxyUrl = `/api/sora_down?proxy=${encodeURIComponent(videoData.download_videoUrl)}`;
            const a = document.createElement('a');
            a.href = proxyUrl;
            // Sanitizar nome do arquivo
            const safeTitle = videoData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            a.download = `${safeTitle}_umbra_sora.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setStatus({ type: 'success', message: '✅ Download processado via Proxy Umbra!' });
        } catch (err) {
            window.open(videoData.download_videoUrl, '_blank');
        } finally {
            setDownloading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setStatus({ type: 'success', message: '📋 Copiado para a área de transferência!' });
    };

    const resetUI = () => {
        setUrl('');
        setVideoData(null);
        setStatus({ type: null, message: '' });
        setShowVideo(false);
        setOptimizedPrompt('');
    };

    return (
        <div className="font-rajdhani space-y-8 animate-in fade-in duration-1000 pb-20 max-w-2xl mx-auto px-4">

            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-brand-purple/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-brand-cyan/5 blur-[120px] rounded-full animate-pulse delay-700" />
            </div>

            {/* Live Stats Bar */}
            <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 px-4 py-1.5 bg-background-deep/50 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ring-4 ring-green-500/20" />
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                        {liveUsers} OPERADORES ONLINE
                    </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-background-deep/50 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
                    <TrendingUp className="w-3 h-3 text-brand-cyan" />
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                        {processedToday.toLocaleString()} EXTRAÇÕES HOJE
                    </span>
                </div>
            </div>

            <header className="text-center relative pt-4">
                <button
                    onClick={() => setShowConfig(true)}
                    className="absolute right-0 top-0 p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white hover:border-brand-purple/50 transition-all group backdrop-blur-sm"
                >
                    <Settings className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                </button>

                <div className="relative inline-flex items-center justify-center w-28 h-28 mb-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-purple via-accent-blue to-brand-cyan rounded-[36px] blur-2xl opacity-40 animate-pulse" />
                    <div className="relative w-28 h-28 bg-background-mid border border-white/20 rounded-[36px] flex items-center justify-center shadow-2xl ring-1 ring-white/10">
                        <Video className="w-14 h-14 text-white" />
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-tr from-brand-purple to-brand-cyan rounded-2xl flex items-center justify-center border-4 border-background-deep shadow-xl transform rotate-12">
                            <Zap className="w-5 h-5 text-white fill-current" />
                        </div>
                    </div>
                </div>

                <h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent uppercase italic">
                    Umbra SoraDown
                </h1>
                <p className="text-brand-purple font-black text-xs uppercase tracking-[0.4em] drop-shadow-sm">High-Fidelity Extractor v2.7</p>
            </header>

            <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-purple via-brand-cyan to-brand-purple bg-[length:200%_auto] animate-gradient-x rounded-[44px] blur-sm opacity-20 transition duration-1000 group-hover:opacity-40" />
                <div className="relative bg-background-mid border border-white/5 rounded-[40px] p-2 shadow-2xl overflow-hidden backdrop-blur-2xl">

                    {/* Input Section */}
                    <div className="p-8 pb-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-gray-600" />
                            </div>
                            <input
                                type="text"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && !isProcessing && handleSearch()}
                                placeholder="Insira o link do Sora Chat GPT..."
                                className="w-full bg-background-deep border border-white/10 rounded-3xl py-6 pl-14 pr-40 text-sm font-bold text-white outline-none focus:border-brand-purple/50 transition-all placeholder:text-gray-700 shadow-inner"
                            />
                            <div className="absolute inset-y-2 right-2 flex items-center">
                                <button
                                    onClick={handleSearch}
                                    disabled={isProcessing || !url.trim()}
                                    className="h-full px-8 bg-gradient-to-r from-brand-purple to-brand-cyan text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-30 disabled:grayscale"
                                >
                                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                                    <span className="text-[11px] uppercase tracking-widest leading-none">{isProcessing ? 'Buscando' : 'Extrair'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 pt-0">
                        {isProcessing && (
                            <div className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="relative h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-purple to-brand-cyan transition-all duration-700 ease-out"
                                        style={{ width: `${(processingStep + 1) * 25}%` }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {steps.map((step, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 ${idx === processingStep
                                                ? 'bg-brand-purple/10 border-brand-purple/30 text-white shadow-lg'
                                                : idx < processingStep
                                                    ? 'bg-brand-green/5 border-brand-green/10 text-brand-green opacity-60'
                                                    : 'bg-white/5 border-white/5 text-gray-700 opacity-40'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${idx === processingStep ? 'bg-brand-purple text-white animate-pulse' :
                                                idx < processingStep ? 'bg-brand-green text-white' : 'bg-white/10'
                                                }`}>
                                                {idx < processingStep ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest truncate">{step.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {status.type && !isProcessing && (
                            <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${status.type === 'success' ? 'bg-brand-green/10 border-brand-green/20 text-brand-green shadow-[0_0_15px_rgba(34,197,94,0.1)]' :
                                status.type === 'error' ? 'bg-brand-pink/10 border-brand-pink/20 text-brand-pink' : 'bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan'
                                }`}>
                                {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                <span className="text-[10px] font-black uppercase tracking-widest">{status.message}</span>
                            </div>
                        )}

                        {videoData && !isProcessing && (
                            <div className="space-y-6 animate-in zoom-in-95 duration-700">
                                <div className="relative group/preview rounded-[32px] overflow-hidden border border-white/10 shadow-2xl aspect-video bg-black">
                                    {showVideo ? (
                                        <video src={videoData.videoUrl} controls autoPlay className="w-full h-full" />
                                    ) : (
                                        <>
                                            <img src={videoData.pic || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80'} alt="Thumbnail" className="w-full h-full object-cover opacity-80 group-hover/preview:scale-105 transition-transform duration-1000" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                            <button
                                                onClick={() => setShowVideo(true)}
                                                className="absolute inset-0 flex items-center justify-center group/btn"
                                            >
                                                <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 shadow-2xl group-hover/btn:scale-110 group-hover/btn:bg-white/20 transition-all duration-500">
                                                    <Play className="w-8 h-8 text-white fill-current" />
                                                </div>
                                            </button>
                                            <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between">
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black text-brand-cyan uppercase tracking-[0.3em] block mb-1">CÓDIGO: {videoData.method.split(' ')[0]}</span>
                                                    <h3 className="text-2xl font-black text-white italic line-clamp-1">{videoData.title}</h3>
                                                </div>
                                                <div className="px-4 py-2 bg-brand-green/20 backdrop-blur-md rounded-2xl border border-brand-green/30 text-brand-green text-[9px] font-black uppercase tracking-tighter shadow-lg translate-y-2">
                                                    8K NATIVE
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Original Data Section */}
                                    <div className="p-6 bg-background-deep/50 border border-white/5 rounded-[32px] space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Brain className="w-4 h-4 text-brand-purple" />
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Metadata Original</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 relative group/txt">
                                                <button onClick={() => copyToClipboard(videoData.prompt)} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-all opacity-0 group-hover/txt:opacity-100">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <p className="text-gray-400 text-[11px] leading-relaxed italic max-h-24 overflow-y-auto pr-2 scrollbar-thin">
                                                    "{videoData.prompt || 'Sem descrição presente no dataset do Sora.'}"
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={optimizeSoraPrompt}
                                                    disabled={isOptimizing}
                                                    className="flex-1 py-3 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-purple/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {isOptimizing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                                                    Otimizar Prompt (AI)
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Download/Actions Section */}
                                    <div className="p-6 bg-background-deep/50 border border-white/5 rounded-[32px] flex flex-col justify-between space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Zap className="w-4 h-4 text-brand-cyan" />
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ações de Entrega</span>
                                        </div>
                                        <div className="space-y-3">
                                            <button
                                                onClick={handleDownload}
                                                disabled={downloading}
                                                className="w-full py-5 bg-gradient-to-r from-brand-purple via-accent-blue to-brand-cyan text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                            >
                                                {downloading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                                DOWNLOAD VÍDEO MP4
                                            </button>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => window.open(videoData.download_videoUrl, '_blank')}
                                                    className="flex-1 py-4 bg-white/5 border border-white/10 text-gray-400 font-black rounded-xl text-[10px] uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <ExternalLink className="w-4 h-4" /> Link Direto
                                                </button>
                                                <button
                                                    onClick={resetUI}
                                                    className="px-6 py-4 bg-white/5 border border-white/10 text-gray-600 font-black rounded-xl text-[10px] uppercase tracking-widest hover:text-brand-pink hover:border-brand-pink/30 transition-all flex items-center justify-center"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Optimized Result (Conditional) */}
                                {optimizedPrompt && (
                                    <div className="p-8 bg-brand-purple/10 border border-brand-purple/20 rounded-[32px] animate-in slide-in-from-top-4 duration-500">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-brand-purple rounded-2xl flex items-center justify-center shadow-lg shadow-brand-purple/20">
                                                    <Brain className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="text-white text-sm font-black uppercase tracking-tight italic">Prompt Otimizado (Umbra Expert)</h4>
                                                    <span className="text-[9px] font-bold text-brand-purple uppercase tracking-widest">VEHICLE COMPATIBILITY: VEO 3 + SORA</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(optimizedPrompt)}
                                                className="px-6 py-2.5 bg-brand-purple text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl"
                                            >
                                                <Copy className="w-4 h-4 inline mr-2" /> Copiar para Veo 3
                                            </button>
                                        </div>
                                        <div className="bg-background-deep p-6 rounded-2xl border border-brand-purple/20 shadow-inner">
                                            <p className="text-sm font-medium text-white/90 leading-relaxed font-mono">
                                                {optimizedPrompt}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Features Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {[
                    { icon: <Zap className="text-orange-500" />, title: "Turbo Tunneling", desc: "Download direto dos servidores da OpenAI sem filas." },
                    { icon: <Sparkles className="text-brand-purple" />, title: "IA Enhancement", desc: "Transforme prompts simples em obras-primas cinematográficas." },
                    { icon: <Shield className="text-brand-green" />, title: "Private Access", desc: "Suporte a vídeos privados via injeção de Cookies." }
                ].map((f, i) => (
                    <div key={i} className="bg-background-mid/40 border border-white/5 p-6 rounded-[32px] backdrop-blur-sm group hover:border-white/10 transition-all">
                        <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/5 group-hover:scale-110 transition-transform">{f.icon}</div>
                        <h5 className="text-white text-xs font-black uppercase tracking-widest mb-2">{f.title}</h5>
                        <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">{f.desc}</p>
                    </div>
                ))}
            </div>

            {/* Config Modal */}
            {showConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-black/60 animate-in fade-in duration-500">
                    <div className="bg-background-mid border border-white/10 rounded-[44px] p-2 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="bg-background-deep rounded-[42px] p-10 space-y-8 relative">
                            <button onClick={() => setShowConfig(false)} className="absolute right-8 top-8 text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-xl border border-white/10">
                                <X className="w-5 h-5" />
                            </button>

                            <div className="space-y-2">
                                <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                                    <div className="p-3 bg-brand-purple/20 rounded-2xl border border-brand-purple/30">
                                        <Settings className="text-brand-purple" />
                                    </div>
                                    Configurações
                                </h2>
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Painel de Controle Umbra</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-brand-purple uppercase tracking-widest flex items-center justify-between">
                                        <span>Gemini API Key</span>
                                        <span className="text-gray-600">Model: Gemini 1.5 Flash</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={geminiKey}
                                        onChange={e => setGeminiKey(e.target.value)}
                                        placeholder="Coloque sua chave da API Google..."
                                        className="w-full bg-background-mid border-2 border-white/5 rounded-2xl p-4 text-xs font-mono text-gray-400 focus:border-brand-purple/50 outline-none transition-all placeholder:text-gray-800"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-brand-cyan uppercase tracking-widest flex items-center justify-between">
                                        <span>Authorization Token</span>
                                        <span className="text-gray-600">Bearer Token (Opcional)</span>
                                    </label>
                                    <input
                                        type="password"
                                        value={bearerToken}
                                        onChange={e => setBearerToken(e.target.value)}
                                        placeholder="eyJhbGciOiJkaXIi..."
                                        className="w-full bg-background-mid border-2 border-white/5 rounded-2xl p-4 text-xs font-mono text-gray-400 focus:border-brand-purple/50 outline-none transition-all placeholder:text-gray-800"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-brand-cyan uppercase tracking-widest flex items-center justify-between">
                                        <span>Cookies Sora</span>
                                        <span className="text-gray-600">Para vídeos privados</span>
                                    </label>
                                    <textarea
                                        value={cookies}
                                        onChange={e => setCookies(e.target.value)}
                                        placeholder="name=value; name2=value2..."
                                        className="w-full h-24 bg-background-mid border-2 border-white/5 rounded-2xl p-4 text-xs font-mono text-gray-400 focus:border-brand-purple/50 outline-none transition-all placeholder:text-gray-800 scrollbar-hide resize-none"
                                    />
                                </div>

                                <button
                                    onClick={saveSettings}
                                    className="w-full py-5 bg-white text-background-deep font-black rounded-2xl text-[11px] uppercase tracking-[0.2em] transition-all hover:bg-brand-purple hover:text-white flex items-center justify-center gap-3 shadow-2xl active:scale-95"
                                >
                                    Salvar Alterações
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SoraDownTool;
