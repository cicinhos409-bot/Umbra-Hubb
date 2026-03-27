import React, { useState } from 'react';
import {
    Sparkles, RefreshCw, Download, AlertCircle,
    CheckCircle2, Send, X, Video, ImageIcon, Trash2, Lock, Zap
} from 'lucide-react';

const POLLINATIONS_KEY = 'sk_wDCaIosbvn4LtusU3EoLSuoTMrvKCBQ8';

interface UmbraVideoGeneratorProps {
    userTier?: string;
}

const UmbraVideoGenerator: React.FC<UmbraVideoGeneratorProps> = ({ userTier }) => {
    const [prompt, setPrompt] = useState('');
    const [referenceImage, setReferenceImage] = useState('');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [duration, setDuration] = useState(4);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentVideo, setCurrentVideo] = useState<string | null>(null);
    const [progress, setProgress] = useState('');


    const aspectRatios = [
        { id: '16:9', label: 'Widescreen', icon: '🖥️' },
        { id: '9:16', label: 'Vertical', icon: '📱' },
    ];

    const durations = [4, 6, 8];

    const generateVideo = async () => {
        if (!prompt.trim()) {
            setError('Por favor, digite um prompt.');
            return;
        }

        setLoading(true);
        setError(null);
        setCurrentVideo(null);
        setProgress('Enviando para o servidor...');

        try {
            // grok-video accepts: aspectRatio (not width/height), duration 6-15s
            const validDuration = Math.max(6, Math.min(15, duration));

            const params = new URLSearchParams({
                model: 'grok-video',
                aspectRatio: aspectRatio,
                duration: String(validDuration),
                key: POLLINATIONS_KEY,
            });

            // Só adiciona image se for URL externa
            if (referenceImage && referenceImage.startsWith('http')) {
                params.append('image', referenceImage);
            }

            const url = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt.slice(0, 500))}?${params}`;

            setProgress('Gerando vídeo... isso pode levar 1-3 minutos ⏳');

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 300000); // 5 min timeout

            const res = await fetch(url, {
                signal: controller.signal,
                headers: { 'Accept': 'video/mp4, video/*' }
            });

            clearTimeout(timeout);

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Erro ${res.status}: ${errText.slice(0, 200)}`);
            }

            setProgress('Processando vídeo...');
            const blob = await res.blob();

            if (blob.size < 1000) {
                throw new Error('Vídeo inválido recebido. Tente novamente.');
            }

            const videoUrl = URL.createObjectURL(blob);
            setCurrentVideo(videoUrl);
            setProgress('');

        } catch (err: any) {
            if (err.name === 'AbortError') {
                setError('Timeout: o servidor demorou muito. Tente novamente.');
            } else {
                setError(err.message || 'Erro ao gerar vídeo. Tente novamente.');
            }
            setProgress('');
        } finally {
            setLoading(false);
        }
    };

    const downloadVideo = () => {
        if (!currentVideo) return;
        const link = document.createElement('a');
        link.href = currentVideo;
        link.download = `umbra-video-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };



    if (userTier === 'Free' || !userTier) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-6 text-center animate-in fade-in zoom-in duration-700 font-rajdhani">
                <div className="mb-12 relative flex justify-center">
                    <div className="w-24 h-24 bg-brand-purple/10 rounded-[32px] flex items-center justify-center text-brand-purple animate-pulse">
                        <Lock className="w-12 h-12" />
                    </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6 leading-none">
                    Vídeo <span className="text-brand-purple">Premium</span>
                </h2>
                <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12">
                    O Umbra Video Generator (IA Grok) é exclusivo para assinantes do <span className="text-brand-purple font-black">PLANO PRO</span>. Desbloqueie agora para criar vídeos cinematográficos com IA.
                </p>
                <button
                    onClick={() => {
                        const checkout = document.getElementById('checkout');
                        if (checkout) checkout.scrollIntoView({ behavior: 'smooth' });
                        else window.open('https://pay.cakto.com.br/3dko6xr_769683', '_blank');
                    }}
                    className="px-12 py-5 bg-brand-purple text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand-purple/40 hover:scale-105 transition-all group"
                >
                    <Zap className="inline-block w-4 h-4 mr-2 fill-current" /> Desbloquear Agora
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20 font-rajdhani">
            <header className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-brand-purple/10 border border-brand-purple/20 rounded-full text-[10px] font-black tracking-[0.2em] text-brand-purple uppercase">
                    <Video className="w-4 h-4" /> Laboratório de Vídeo Umbra
                </div>
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                    Video <span className="text-brand-purple">Studio</span>
                </h1>
                <p className="text-gray-500 max-w-xl mx-auto text-base font-medium">
                    Transforme texto em vídeo cinematográfico com IA. Motor: <span className="text-brand-purple font-black">Grok Video</span>
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-pink/10 border border-brand-pink/20 rounded-full text-[9px] font-black text-brand-pink uppercase tracking-widest">
                    ⚠️ Alpha — resultados podem variar
                </div>
            </header>

            {/* CONFIGURAÇÕES */}
            <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 md:p-10 shadow-2xl space-y-8">

                {/* Prompt */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-brand-purple" /> Prompt do Vídeo
                    </label>
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        disabled={loading}
                        placeholder="Ex: A cinematic slow motion shot of a warrior standing in a burning field, dramatic lighting, epic atmosphere..."
                        className="w-full h-32 bg-background-light border border-white/10 rounded-[24px] p-6 text-sm font-bold focus:border-brand-purple/50 outline-none resize-none transition-all"
                    />
                    <p className="text-[9px] text-gray-600 ml-2">{prompt.length}/500 caracteres</p>
                </div>

                {/* Imagem de referência — URL externa */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon className="w-3 h-3 text-brand-cyan" /> Imagem de Referência (opcional)
                    </label>
                    <input
                        type="text"
                        value={referenceImage}
                        onChange={e => setReferenceImage(e.target.value)}
                        disabled={loading}
                        placeholder="Cole uma URL de imagem: https://exemplo.com/imagem.jpg"
                        className="w-full bg-background-light border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-brand-cyan/50 outline-none transition-all"
                    />
                    {referenceImage && !referenceImage.startsWith('http') && (
                        <p className="text-[9px] text-brand-pink ml-2 font-bold">
                            ⚠️ Use uma URL externa (https://...)
                        </p>
                    )}
                    {referenceImage && referenceImage.startsWith('http') && (
                        <div className="flex items-center gap-3">
                            <img
                                src={referenceImage}
                                alt="Preview"
                                className="w-16 h-16 rounded-xl object-cover border border-white/10"
                                onError={e => (e.target as HTMLImageElement).style.display = 'none'}
                            />
                            <button
                                onClick={() => setReferenceImage('')}
                                className="text-[9px] text-brand-pink font-black uppercase tracking-widest hover:opacity-70 transition-opacity"
                            >
                                Remover
                            </button>
                        </div>
                    )}
                </div>

                {/* Aspect Ratio e Duração */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Proporção</label>
                        <div className="flex gap-3">
                            {aspectRatios.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => setAspectRatio(r.id)}
                                    disabled={loading}
                                    className={`flex-1 p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${aspectRatio === r.id ? 'bg-brand-purple/10 border-brand-purple text-white' : 'bg-background-deep border-white/5 text-gray-500 hover:border-white/10'}`}
                                >
                                    <span className="text-2xl">{r.icon}</span>
                                    <span className="text-[9px] font-black uppercase">{r.label}</span>
                                    <span className="text-[8px] text-gray-600">{r.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Duração</label>
                        <div className="flex gap-3">
                            {durations.map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDuration(d)}
                                    disabled={loading}
                                    className={`flex-1 p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${duration === d ? 'bg-brand-purple/10 border-brand-purple text-white' : 'bg-background-deep border-white/5 text-gray-500 hover:border-white/10'}`}
                                >
                                    <span className="text-xl font-black">{d}s</span>
                                    <span className="text-[8px] text-gray-600 uppercase">
                                        {d === 4 ? 'Rápido' : d === 6 ? 'Médio' : 'Longo'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Botão Gerar */}
                <button
                    onClick={generateVideo}
                    disabled={loading || !prompt.trim()}
                    className="w-full py-6 bg-gradient-to-r from-brand-purple to-brand-pink rounded-3xl text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-brand-purple/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {loading
                        ? <><RefreshCw className="w-5 h-5 animate-spin" /> {progress}</>
                        : <><Send className="w-5 h-5" /> Gerar Vídeo</>
                    }
                </button>

                {error && (
                    <div className="p-4 bg-brand-pink/10 border border-brand-pink/20 rounded-2xl flex items-center gap-3 text-brand-pink">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">{error}</span>
                    </div>
                )}
            </section>

            {/* RESULTADO */}
            {currentVideo && (
                <section className="bg-background-mid border border-brand-purple/20 rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                        <div className="lg:col-span-8 bg-black flex items-center justify-center min-h-[400px]">
                            <video
                                src={currentVideo}
                                controls
                                autoPlay
                                loop
                                className="max-w-full max-h-[70vh] rounded-none"
                            />
                        </div>
                        <div className="lg:col-span-4 p-10 flex flex-col justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tighter text-white">Vídeo Pronto!</h3>
                                        <span className="text-[9px] font-black text-gray-500 uppercase">Grok Video · {duration}s · {aspectRatio}</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-background-light border border-white/5 rounded-2xl text-xs font-medium text-gray-400 italic leading-relaxed">
                                    "{prompt}"
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
                                    onClick={() => { setCurrentVideo(null); setPrompt(''); }}
                                    className="w-full py-5 bg-white/5 border border-white/10 text-white font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                                >
                                    <Trash2 className="w-5 h-5" /> Novo Vídeo
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default UmbraVideoGenerator;
