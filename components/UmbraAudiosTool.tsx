
import React, { useState, useEffect, useRef } from 'react';
import {
    Mic,
    Volume2,
    Trash2,
    Download,
    Play,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    AudioLines,
    Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase'; // Assuming supabase client is here

const VOICES = [
    {
        label: '🇧🇷 Português Brasil (Neural2)',
        options: [
            { value: 'pt-BR-Neural2-A', label: 'Neural2-A - Feminino' },
            { value: 'pt-BR-Neural2-B', label: 'Neural2-B - Masculino' },
            { value: 'pt-BR-Neural2-C', label: 'Neural2-C - Feminino 2' },
        ]
    },
    {
        label: '🇧🇷 Português Brasil (Wavenet)',
        options: [
            { value: 'pt-BR-Wavenet-A', label: 'Wavenet-A - Feminino' },
            { value: 'pt-BR-Wavenet-B', label: 'Wavenet-B - Masculino' },
            { value: 'pt-BR-Wavenet-C', label: 'Wavenet-C - Feminino 2' },
        ]
    },
    {
        label: '🇺🇸 English US (Neural2)',
        options: [
            { value: 'en-US-Neural2-A', label: 'Neural2-A - Feminino' },
            { value: 'en-US-Neural2-D', label: 'Neural2-D - Masculino' },
            { value: 'en-US-Neural2-F', label: 'Neural2-F - Feminino' },
            { value: 'en-US-Neural2-H', label: 'Neural2-H - Feminino' },
        ]
    }
];

const UmbraAudiosTool: React.FC = () => {
    const [voiceModel, setVoiceModel] = useState('pt-BR-Neural2-A');
    const [textInput, setTextInput] = useState('Bem-vindo ao Umbra Hub. Esta é a nova ferramenta de áudio neural utilizando Google Cloud TTS.');
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState<{ type: 'loading' | 'success' | 'error' | null, message: string }>({ type: null, message: '' });
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleGenerate = async () => {
        if (!textInput.trim()) {
            setStatus({ type: 'error', message: '❌ Por favor, digite algum texto' });
            return;
        }

        setIsGenerating(true);
        setStatus({ type: 'loading', message: 'Sintetizando voz neural com Google Cloud...' });
        setAudioUrl(null);

        try {
            const languageCode = voiceModel.split('-').slice(0, 2).join('-');

            const { data, error } = await supabase.functions.invoke('google-tts', {
                body: {
                    text: textInput.trim(),
                    voice: voiceModel,
                    languageCode: languageCode
                }
            });

            if (error) throw error;
            if (!data.audioContent) throw new Error('Nenhum conteúdo de áudio recebido');

            // Convert base64 to blob
            const binaryString = window.atob(data.audioContent);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/mp3' });
            const url = URL.createObjectURL(blob);

            setAudioUrl(url);
            setStatus({ type: 'success', message: '✅ Áudio gerado com sucesso!' });

            setTimeout(() => audioRef.current?.play(), 300);
        } catch (err: any) {
            console.error('TTS Error:', err);
            setStatus({ type: 'error', message: `❌ ${err.message || 'Erro na sintetização'}` });
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadAudio = () => {
        if (!audioUrl) return;
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `umbra-audio-${voiceModel}-${Date.now()}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-4xl mx-auto">
            <header className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-purple/10 rounded-[28px] mb-6 shadow-2xl shadow-brand-purple/10 ring-1 ring-brand-purple/20">
                    <Volume2 className="w-10 h-10 text-brand-purple" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-purple via-brand-pink to-amber-500 bg-clip-text text-transparent uppercase">
                    Umbra Audios
                </h1>
                <p className="text-gray-500 font-medium">Sintetização de Voz Neural via Google Cloud</p>
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-brand-purple/30 to-transparent mx-auto mt-6" />
            </header>

            <div className="grid grid-cols-1 gap-8">
                {/* CONTROLS PANEL */}
                <div className="bg-background-mid border border-white/5 rounded-[32px] p-8 shadow-xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="w-3 h-3" /> Modelo de Voz (Google TTS)
                            </label>
                            <select
                                value={voiceModel}
                                onChange={e => setVoiceModel(e.target.value)}
                                className="w-full bg-background-light border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-brand-purple/50 outline-none appearance-none cursor-pointer hover:border-white/20 transition-colors"
                            >
                                {VOICES.map((group, i) => (
                                    <optgroup key={i} label={group.label} className="bg-background-mid text-gray-400">
                                        {group.options.map(opt => (
                                            <option key={opt.value} value={opt.value} className="text-white">{opt.label}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <AudioLines className="w-3 h-3" /> Tecnologia
                            </label>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 h-[52px] flex items-center">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Neural2 / Wavenet Engine</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Mic className="w-3 h-3" /> Texto para Narração
                            </label>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${textInput.length > 4500 ? 'text-brand-pink' : 'text-gray-700'}`}>
                                {textInput.length} / 5000 chars
                            </span>
                        </div>
                        <textarea
                            value={textInput}
                            onChange={e => setTextInput(e.target.value)}
                            placeholder="Cole o roteiro que deseja converter em voz neural de alta qualidade..."
                            className="w-full h-48 bg-background-deep/50 border border-white/10 rounded-[28px] p-6 text-sm leading-relaxed text-gray-300 focus:border-brand-purple/40 outline-none resize-none custom-scrollbar"
                            maxLength={5000}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !textInput.trim()}
                            className="py-5 bg-gradient-to-r from-brand-purple to-brand-pink text-white font-orbitron text-xs font-black tracking-[0.3em] rounded-2xl hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all disabled:opacity-30 uppercase flex items-center justify-center gap-3 active:scale-95"
                        >
                            {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                            Gerar Áudio
                        </button>
                        <button
                            onClick={() => { setTextInput(''); setAudioUrl(null); setStatus({ type: null, message: '' }); }}
                            className="py-5 bg-white/5 border border-white/10 text-gray-500 font-orbitron text-xs font-black tracking-[0.3em] rounded-2xl hover:text-brand-pink hover:bg-brand-pink/10 transition-all uppercase flex items-center justify-center gap-3"
                        >
                            <Trash2 className="w-5 h-5" /> Limpar
                        </button>
                    </div>
                </div>

                {/* STATUS BAR */}
                {status.type && (
                    <div className={`p-5 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-2 duration-300 ${status.type === 'loading' ? 'bg-brand-purple/5 border-brand-purple/20 text-brand-purple' :
                            status.type === 'success' ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' :
                                'bg-brand-pink/10 border-brand-pink/20 text-brand-pink'
                        }`}>
                        {status.type === 'loading' ? <RefreshCw className="w-5 h-5 animate-spin" /> :
                            status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-xs font-bold uppercase tracking-widest">{status.message}</span>
                    </div>
                )}

                {/* PLAYER PANEL */}
                {audioUrl && (
                    <div className="bg-background-mid border border-brand-purple/30 rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden relative group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-purple via-brand-pink to-amber-500 opacity-50" />

                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 w-full space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black text-brand-purple uppercase tracking-widest">Audio Output</span>
                                    <span className="text-[9px] font-bold text-gray-600 uppercase">Google Neural Engine · 48khz</span>
                                </div>
                                <audio ref={audioRef} src={audioUrl} controls className="w-full h-12 filter invert hue-rotate-180 opacity-80 hover:opacity-100 transition-opacity" />
                            </div>

                            <button
                                onClick={downloadAudio}
                                className="w-full md:w-auto px-10 py-5 bg-brand-green text-background-deep font-orbitron text-xs font-black tracking-[0.3em] rounded-2xl shadow-xl shadow-brand-green/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase"
                            >
                                <Download className="w-5 h-5" /> Download MP3
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-brand-purple/5 border border-brand-purple/10 rounded-[32px] p-8 space-y-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-brand-purple" />
                        <h4 className="font-orbitron text-[10px] font-black uppercase text-white tracking-widest">Google Cloud Platform</h4>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                        Esta ferramenta utiliza os modelos de última geração
                        <span className="text-brand-purple font-bold mx-1">Neural2</span> e
                        <span className="text-brand-pink font-bold mx-1">Wavenet</span> do Google Cloud Platform.
                        A sintetização é otimizada para narrações naturais em português e inglês.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UmbraAudiosTool;
