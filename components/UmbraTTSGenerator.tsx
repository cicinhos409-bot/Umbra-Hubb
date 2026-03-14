import React, { useState, useRef } from 'react';
import {
    Sparkles, RefreshCw, Download, AlertCircle,
    CheckCircle2, Send, Trash2, Lock, Zap, Volume2, Mic, Search
} from 'lucide-react';

const POLLINATIONS_KEY = 'sk_wDCaIosbvn4LtusU3EoLSuoTMrvKCBQ8';

interface UmbraTTSProps {
    userTier?: string;
}

const UmbraTTSGenerator: React.FC<UmbraTTSProps> = ({ userTier }) => {
    const [text, setText] = useState('');
    const [voice, setVoice] = useState('2EiwWnXFnvU5JabPnv8nP');
    const [format, setFormat] = useState('mp3');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentAudio, setCurrentAudio] = useState<string | null>(null);
    const [selectedCat, setSelectedCat] = useState('Todas');
    const [voiceSearch, setVoiceSearch] = useState('');
    const audioRef = useRef<HTMLAudioElement>(null);

    const voices = [
        // 🎙️ Vozes Principais
        { id: '21m00Tcm4TlvDq8ikWAMDW', label: 'Rachel', style: 'Feminino Suave', cat: 'Principal' },
        { id: '29vD33N1CtxCmqQRPOHJ', label: 'Drew', style: 'Masculino Neutro', cat: 'Principal' },
        { id: '2EiwWnXFnvU5JabPnv8nP', label: 'Clyde', style: 'Grave & Intenso', cat: 'Principal' },
        { id: '5Q0t7uMcjvnagumLfvZi', label: 'Paul', style: 'Maduro & Sério', cat: 'Principal' },
        { id: 'AZnzlk1XvdvUeBnXmlld', label: 'Domi', style: 'Feminino Intenso', cat: 'Principal' },
        { id: 'CYw3kZ02Hs0563khs1Fj', label: 'Dave', style: 'Britânico', cat: 'Principal' },
        { id: 'D38z5RcWu1voky8WS1ja', label: 'Fin', style: 'Irlandês', cat: 'Principal' },
        { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah', style: 'Feminino Suave', cat: 'Principal' },
        { id: 'ErXwobaYiN019PkySvjV', label: 'Antoni', style: 'Bem Disposto', cat: 'Principal' },
        { id: 'GBv7mTt0atIp3Br8iCZE', label: 'Thomas', style: 'Calmo', cat: 'Principal' },
        { id: 'IKne3meq5aSn9XLyUdCD', label: 'Charlie', style: 'Conversacional', cat: 'Principal' },
        { id: 'JBFqnCBsd6RMkjVDRZzb', label: 'George', style: 'Maduro & Caloroso', cat: 'Principal' },
        { id: 'N2lVS1w4EtoT3dr4eOWO', label: 'Callum', style: 'Intenso', cat: 'Principal' },
        { id: 'SAz9YHcvj6GT2YYXdXww', label: 'River', style: 'Expressivo', cat: 'Principal' },
        { id: 'TX3LPaxmHKxFdv7VOQUH', label: 'Liam', style: 'Articulado', cat: 'Principal' },
        { id: 'XB0fDUnXU5powFXDhCwa', label: 'Charlotte', style: 'Feminino Sedutor', cat: 'Principal' },
        { id: 'XrExE9yKIg1WjnnlVkGX', label: 'Alice', style: 'Feminino Confiante', cat: 'Principal' },
        { id: 'bIHbv24MWmeRgasZH58o', label: 'Matilda', style: 'Feminino Amigável', cat: 'Principal' },
        { id: 'bVMeCyTHy58xNoL34h3p', label: 'Will', style: 'Amigável', cat: 'Principal' },
        { id: 'cgSgspJ2msm6clMCkdW9', label: 'Jessica', style: 'Feminino Expressivo', cat: 'Principal' },
        { id: 'cjVigY5qzO86Huf0OWal', label: 'Eric', style: 'Amigável', cat: 'Principal' },
        { id: 'iP95p4xoKVk53GoZ742B', label: 'Chris', style: 'Casual', cat: 'Principal' },
        { id: 'nPczCjzI2devNBz1zQrb', label: 'Brian', style: 'Profissional', cat: 'Principal' },
        { id: 'onwK4e9ZLuTAKqWW03F9', label: 'Daniel', style: 'Britânico Autoritativo', cat: 'Principal' },
        { id: 'pFZP5JQG7iQjIQuC4Bku', label: 'Lily', style: 'Feminino Britânico', cat: 'Principal' },
        { id: 'pqHfZKP75CvOlQylNhV4', label: 'Bill', style: 'Confiável', cat: 'Principal' },
        { id: 't0jbNlBVZ17f02VDIeMI', label: 'George B.', style: 'Britânico Maduro', cat: 'Principal' },
        { id: 'wViXBPUzp2ZZixB1xQuM', label: 'Nicole', style: 'Sussurrado', cat: 'Principal' },
        { id: 'zQzvQBubVkDWKJ5Q9nYQ', label: 'Michael', style: 'Audiobook', cat: 'Principal' },

        // 🎭 Personagens
        { id: 'sB1b5zUrxQVAFl2PhZFp', label: 'Alita', style: 'Personagem', cat: 'Personagens' },
        { id: '9BWtsMINqrJLrRacOk9x', label: 'Nova', style: 'Épico', cat: 'Personagens' },
        { id: '4n7pZ1Fh0l6pQwErTyUi', label: 'Sky', style: 'Personagem', cat: 'Personagens' },
        { id: '7y8UiopLKJhgFdsAqwer', label: 'Orion', style: 'Personagem', cat: 'Personagens' },
        { id: '2b3c4d5e6f7g8h9i0jkl', label: 'Athena', style: 'Personagem', cat: 'Personagens' },
        { id: '8kLm9nOpQrStUvWxYz12', label: 'Zara', style: 'Personagem', cat: 'Personagens' },
        { id: '3FgH45JkLmNOpQrStUvE', label: 'Victor', style: 'Personagem', cat: 'Personagens' },
        { id: '5TgYhUjIkOlPqRsTuVwX', label: 'Echo', style: 'Personagem', cat: 'Personagens' },
        { id: '9QwErTyUiOpAsDfGhJkL', label: 'Helix', style: 'Personagem', cat: 'Personagens' },
        { id: '0pLkJHgfDsAzXcVbNmQ', label: 'Atlas', style: 'Personagem', cat: 'Personagens' },
    ];

    const categories = ['Todas', 'Principal', 'Personagens'];

    const filteredVoices = voices.filter(v =>
        (selectedCat === 'Todas' || v.cat === selectedCat) &&
        (voiceSearch === '' ||
            v.label.toLowerCase().includes(voiceSearch.toLowerCase()) ||
            v.style.toLowerCase().includes(voiceSearch.toLowerCase()))
    );

    const formats = [
        { id: 'mp3', label: 'MP3', desc: 'Universal' },
        { id: 'wav', label: 'WAV', desc: 'Alta Qualidade' },
        { id: 'flac', label: 'FLAC', desc: 'Sem Perda' },
    ];

    const charCost = (text.length / 1000) * 0.18;

    const generateAudio = async () => {
        if (!text.trim()) {
            setError('Por favor, digite um texto.');
            return;
        }
        if (text.length > 4096) {
            setError('Texto muito longo. Máximo 4096 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);
        setCurrentAudio(null);

        try {
            const params = new URLSearchParams({
                voice,
                response_format: format,
                key: POLLINATIONS_KEY,
            });

            const url = `https://gen.pollinations.ai/audio/${encodeURIComponent(text)}?${params}`;

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000);

            const res = await fetch(url, {
                signal: controller.signal,
                headers: { 'Accept': 'audio/*' }
            });

            clearTimeout(timeout);

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Erro ${res.status}: ${errText.slice(0, 200)}`);
            }

            const blob = await res.blob();
            if (blob.size < 100) throw new Error('Áudio inválido. Tente novamente.');

            const audioUrl = URL.createObjectURL(blob);
            setCurrentAudio(audioUrl);

            setTimeout(() => audioRef.current?.play(), 300);

        } catch (err: any) {
            if (err.name === 'AbortError') {
                setError('Timeout. Tente novamente.');
            } else {
                setError(err.message || 'Erro ao gerar áudio.');
            }
        } finally {
            setLoading(false);
        }
    };

    const downloadAudio = () => {
        if (!currentAudio) return;
        const link = document.createElement('a');
        link.href = currentAudio;
        link.download = `umbra-voice-${Date.now()}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Lock para usuários que NÃO são Turbo
    if (userTier !== 'Turbo') {
        return (
            <div className="max-w-4xl mx-auto py-20 px-6 text-center animate-in fade-in zoom-in duration-700 font-rajdhani">
                <div className="mb-12 flex justify-center">
                    <div className="w-24 h-24 bg-brand-pink/10 rounded-[32px] flex items-center justify-center text-brand-pink animate-pulse">
                        <Lock className="w-12 h-12" />
                    </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6 leading-none">
                    Narrador <span className="text-brand-pink">Turbo</span>
                </h2>
                <p className="text-gray-400 text-lg font-medium max-w-2xl mx-auto mb-12">
                    O UmbraVoice (ElevenLabs IA) é exclusivo para assinantes do <span className="text-brand-pink font-black">PLANO TURBO</span>. Desbloqueie agora para criar narrações cinematográficas ultra-realistas.
                </p>
                <button
                    onClick={() => window.open('https://pay.cakto.com.br/DAM1olr_769683', '_blank')}
                    className="px-12 py-5 bg-brand-pink text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand-pink/40 hover:scale-105 transition-all"
                >
                    <Zap className="inline-block w-4 h-4 mr-2 fill-current" /> Desbloquear Turbo
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20 font-rajdhani">
            <header className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-brand-cyan/10 border border-brand-cyan/20 rounded-full text-[10px] font-black tracking-[0.2em] text-brand-cyan uppercase">
                    <Mic className="w-4 h-4" /> Narrador Cinematográfico
                </div>
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                    Umbra<span className="text-brand-cyan">Voice</span>
                </h1>
                <p className="text-gray-500 max-w-xl mx-auto text-base font-medium">
                    Transforme texto em narração épica com vozes ultra-realistas. Motor: <span className="text-brand-cyan font-black">ElevenLabs v3</span>
                </p>
            </header>

            <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 md:p-10 shadow-2xl space-y-8">

                {/* Texto */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-brand-cyan" /> Texto para Narrar
                        </span>
                        <span className={`text-[9px] font-bold ${text.length > 3500 ? 'text-brand-pink' : 'text-gray-600'}`}>
                            {text.length}/4096 chars · ~{charCost.toFixed(4)} pollen
                        </span>
                    </label>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        disabled={loading}
                        maxLength={4096}
                        placeholder="Ex: Em um mundo onde a sombra governa, apenas os mais corajosos ousam desafiar o destino..."
                        className="w-full h-40 bg-background-light border border-white/10 rounded-[24px] p-6 text-sm font-medium focus:border-brand-cyan/50 outline-none resize-none transition-all leading-relaxed"
                    />
                </div>

                {/* Vozes */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">
                        Escolha a Voz
                    </label>

                    {/* Filtros */}
                    <div className="flex flex-wrap items-center gap-3">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCat(cat)}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                    selectedCat === cat
                                        ? 'bg-brand-cyan/10 border border-brand-cyan text-brand-cyan'
                                        : 'bg-background-deep border border-white/5 text-gray-500 hover:border-white/10'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                        <div className="relative flex-1 min-w-[160px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
                            <input
                                type="text"
                                value={voiceSearch}
                                onChange={e => setVoiceSearch(e.target.value)}
                                placeholder="Buscar voz..."
                                className="w-full pl-8 pr-4 py-2 bg-background-deep border border-white/5 rounded-xl text-[10px] font-bold text-gray-400 focus:border-brand-cyan/30 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[280px] overflow-y-auto pr-1 no-scrollbar">
                        {filteredVoices.map(v => (
                            <button
                                key={v.id}
                                onClick={() => setVoice(v.id)}
                                disabled={loading}
                                className={`p-3 rounded-2xl border flex flex-col items-start gap-1 transition-all ${
                                    voice === v.id
                                        ? 'bg-brand-cyan/10 border-brand-cyan text-white shadow-lg shadow-brand-cyan/10'
                                        : 'bg-background-deep border-white/5 text-gray-500 hover:border-white/10'
                                }`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-tight">{v.label}</span>
                                <span className="text-[8px] text-gray-600 leading-tight">{v.style}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Formato */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">
                        Formato de Saída
                    </label>
                    <div className="flex gap-3">
                        {formats.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFormat(f.id)}
                                disabled={loading}
                                className={`flex-1 p-4 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                                    format === f.id
                                        ? 'bg-brand-purple/10 border-brand-purple text-white'
                                        : 'bg-background-deep border-white/5 text-gray-500 hover:border-white/10'
                                }`}
                            >
                                <span className="text-sm font-black uppercase">{f.label}</span>
                                <span className="text-[8px] text-gray-600">{f.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Botão */}
                <button
                    onClick={generateAudio}
                    disabled={loading || !text.trim()}
                    className="w-full py-6 bg-gradient-to-r from-brand-cyan to-brand-purple rounded-3xl text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-brand-cyan/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {loading
                        ? <><RefreshCw className="w-5 h-5 animate-spin" /> Gerando Narração...</>
                        : <><Volume2 className="w-5 h-5" /> Gerar Narração</>
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
            {currentAudio && (
                <section className="bg-background-mid border border-brand-cyan/20 rounded-[40px] p-8 md:p-10 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter text-white">Narração Pronta!</h3>
                            <span className="text-[9px] font-black text-gray-500 uppercase">
                                ElevenLabs v3 · {voices.find(v => v.id === voice)?.label} · {format.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div className="bg-background-light border border-white/5 rounded-2xl p-6">
                        <audio
                            ref={audioRef}
                            src={currentAudio}
                            controls
                            className="w-full"
                        />
                    </div>

                    <div className="p-4 bg-background-light border border-white/5 rounded-2xl text-xs font-medium text-gray-400 italic leading-relaxed max-h-24 overflow-y-auto">
                        "{text}"
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={downloadAudio}
                            className="flex-1 py-5 bg-brand-green text-background-deep font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <Download className="w-5 h-5" /> Download {format.toUpperCase()}
                        </button>
                        <button
                            onClick={() => { setCurrentAudio(null); setText(''); }}
                            className="flex-1 py-5 bg-white/5 border border-white/10 text-white font-black rounded-2xl uppercase text-[11px] tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                        >
                            <Trash2 className="w-5 h-5" /> Nova Narração
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
};

export default UmbraTTSGenerator;
