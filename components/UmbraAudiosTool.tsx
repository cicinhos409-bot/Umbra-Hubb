
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    Sparkles,
    Globe,
    User,
    Lock,
    ArrowUpCircle,
    X,
    Pause,
    SlidersHorizontal,
    Zap,
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { ToolTier } from '../types';

interface UmbraAudiosToolProps {
    userTier: ToolTier;
}

interface Voice {
    name: string;
    languageCodes: string[];
    ssmlGender: string;
    naturalSampleRateHertz: number;
}

const LANGUAGE_NAMES: Record<string, { name: string; flag: string }> = {
    'pt-BR': { name: 'Português (Brasil)', flag: '🇧🇷' },
    'pt-PT': { name: 'Português (Portugal)', flag: '🇵🇹' },
    'en-US': { name: 'Inglês (EUA)', flag: '🇺🇸' },
    'en-GB': { name: 'Inglês (Reino Unido)', flag: '🇬🇧' },
    'es-ES': { name: 'Espanhol (Espanha)', flag: '🇪🇸' },
    'es-US': { name: 'Espanhol (EUA)', flag: '🇺🇸' },
    'fr-FR': { name: 'Francês', flag: '🇫🇷' },
    'it-IT': { name: 'Italiano', flag: '🇮🇹' },
    'de-DE': { name: 'Alemão', flag: '🇩🇪' },
    'ja-JP': { name: 'Japonês', flag: '🇯🇵' },
    'ko-KR': { name: 'Coreano', flag: '🇰🇷' },
    'zh-CN': { name: 'Chinês (Mandarim)', flag: '🇨🇳' },
    'ru-RU': { name: 'Russo', flag: '🇷🇺' },
    'hi-IN': { name: 'Hindi', flag: '🇮🇳' },
    'tr-TR': { name: 'Turco', flag: '🇹🇷' },
    'ar-XA': { name: 'Árabe', flag: '🇸🇦' },
};

const STORAGE_LIMIT_KEY = 'umbra_audios_usage_v2';

const VOICE_TYPES = [
    { key: 'Studio', label: 'Studio', desc: 'Podcast / News' },
    { key: 'Neural2', label: 'Neural2', desc: 'Deep Learning' },
    { key: 'Wavenet', label: 'WaveNet', desc: 'Google Assistant' },
    { key: 'Standard', label: 'Standard', desc: 'Alta eficiência' },
];

const UmbraAudiosTool: React.FC<UmbraAudiosToolProps> = ({ userTier }) => {
    const [voices, setVoices] = useState<Voice[]>([]);
    const [isLoadingVoices, setIsLoadingVoices] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState('pt-BR');
    const [selectedGender, setSelectedGender] = useState<'MALE' | 'FEMALE' | 'ALL'>('ALL');
    const [selectedVoice, setSelectedVoice] = useState('');
    const [textInput, setTextInput] = useState('Bem-vindo ao Umbra Hub. Agora você tem acesso a todas as vozes premium do Google Cloud TTS.');
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState<{ type: 'loading' | 'success' | 'error' | null; message: string }>({ type: null, message: '' });
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [usage, setUsage] = useState({ count: 0, date: new Date().toLocaleDateString() });
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [pitch, setPitch] = useState(0);
    const [speakingRate, setSpeakingRate] = useState(1.0);
    const [volumeGain, setVolumeGain] = useState(0);
    const [isProcessingBatch, setIsProcessingBatch] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const limit = userTier === ToolTier.FREE ? 3 : 30;
    const remaining = Math.max(0, limit - usage.count);
    const isLimitReached = usage.count >= limit;
    const isStudioVoice = selectedVoice.toLowerCase().includes('studio') || selectedVoice.toLowerCase().includes('neural2');
    const hasPitchAdjustment = pitch !== 0;

    // ── helpers ────────────────────────────────────────────────────
    const getLanguageLabel = (code: string) => {
        const info = LANGUAGE_NAMES[code];
        return info ? `${info.flag} ${info.name}` : code;
    };

    const getVoiceCategory = (name: string) => {
        if (name.includes('Neural2')) return 'Neural2';
        if (name.includes('Studio')) return 'Studio';
        if (name.includes('Polyglot')) return 'Polyglot';
        if (name.includes('Wavenet')) return 'WaveNet';
        if (name.includes('Chirp')) return 'Chirp v3';
        return 'Standard';
    };

    const insertSSML = (tag: string, closingTag?: string) => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const selected = textInput.substring(start, end);
        const content = closingTag && !selected ? '[texto]' : selected;
        const newText = closingTag
            ? textInput.substring(0, start) + tag + content + closingTag + textInput.substring(end)
            : textInput.substring(0, start) + tag + textInput.substring(end);
        setTextInput(newText);
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const pos = start + tag.length + content.length + (closingTag?.length || 0);
                textareaRef.current.setSelectionRange(pos, pos);
            }
        }, 10);
    };

    const applyDarkPreset = () => { setPitch(-1); setSpeakingRate(0.85); };

    const loadStorytellingExample = () => {
        setTextInput(`<speak>\n<prosody pitch="-1st" rate="92%">\nNo dia do meu casamento...\n</prosody>\n\n<break time="700ms"/>\n\n<prosody rate="95%">\nalguém se levantou no meio da cerimônia\n</prosody>\n\n<break time="400ms"/>\n\n<prosody rate="88%">\ne revelou um <emphasis level="strong">segredo</emphasis>.\n</prosody>\n</speak>`);
    };

    const splitTextIntoChunks = (text: string, maxChunkSize = 4800) => {
        const chunks: string[] = [];
        let current = text;
        while (current.length > 0) {
            if (current.length <= maxChunkSize) { chunks.push(current); break; }
            let split = current.lastIndexOf('. ', maxChunkSize);
            if (split === -1) split = current.lastIndexOf(' ', maxChunkSize);
            if (split === -1 || split < maxChunkSize * 0.5) split = maxChunkSize;
            else split += 1;
            chunks.push(current.substring(0, split));
            current = current.substring(split).trim();
        }
        return chunks;
    };

    // ── effects ────────────────────────────────────────────────────
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_LIMIT_KEY);
        const today = new Date().toLocaleDateString();
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (userTier !== ToolTier.FREE && parsed.date !== today) setUsage({ count: 0, date: today });
                else setUsage(parsed);
            } catch { setUsage({ count: 0, date: today }); }
        } else { setUsage({ count: 0, date: today }); }
    }, [userTier]);

    useEffect(() => { localStorage.setItem(STORAGE_LIMIT_KEY, JSON.stringify(usage)); }, [usage]);

    useEffect(() => {
        const fetchVoices = async () => {
            try {
                const { data, error } = await supabase.functions.invoke('google-tts', { body: { action: 'listVoices' } });
                if (error) throw error;
                if (data.voices) {
                    const sorted = (data.voices as Voice[]).sort((a, b) => a.name.localeCompare(b.name));
                    setVoices(sorted);
                    const initial = sorted.find(v => v.languageCodes.includes('pt-BR'));
                    if (initial) setSelectedVoice(initial.name);
                }
            } catch { setStatus({ type: 'error', message: 'Erro ao carregar lista de vozes' }); }
            finally { setIsLoadingVoices(false); }
        };
        fetchVoices();
    }, []);

    const availableLanguages = useMemo(() => {
        const langs = new Set<string>();
        voices.forEach(v => v.languageCodes.forEach(lc => langs.add(lc)));
        return Array.from(langs).sort();
    }, [voices]);

    const filteredVoices = useMemo(() =>
        voices.filter(v =>
            v.languageCodes.includes(selectedLanguage) &&
            (selectedGender === 'ALL' || v.ssmlGender === selectedGender)
        ), [voices, selectedLanguage, selectedGender]);

    useEffect(() => {
        if (filteredVoices.length > 0 && !filteredVoices.find(v => v.name === selectedVoice)) {
            setSelectedVoice(filteredVoices[0].name);
        } else if (filteredVoices.length === 0) { setSelectedVoice(''); }
    }, [selectedLanguage, selectedGender, filteredVoices]);

    // ── actions ────────────────────────────────────────────────────
    const handlePreview = async () => {
        if (!selectedVoice || isPreviewing) return;
        setIsPreviewing(true);
        try {
            const previewText = selectedLanguage.startsWith('pt')
                ? 'Olá! Esta é uma demonstração desta voz no Umbra Hub.'
                : 'Hello! This is a short demonstration of this voice.';
            const { data, error } = await supabase.functions.invoke('google-tts', { body: { text: previewText, voice: selectedVoice, languageCode: selectedLanguage } });
            if (error) throw error;
            if (data.audioContent) {
                const bytes = new Uint8Array(atob(data.audioContent).split('').map(c => c.charCodeAt(0)));
                const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mp3' }));
                new Audio(url).play();
            }
        } catch { } finally { setIsPreviewing(false); }
    };

    const handleGenerate = async () => {
        if (!textInput.trim()) { setStatus({ type: 'error', message: 'Por favor, insira algum texto' }); return; }
        if (isLimitReached) { setShowUpgradeModal(true); return; }

        setIsGenerating(true);
        setStatus({ type: 'loading', message: 'Iniciando síntese de voz...' });
        setAudioUrl(null);
        setIsProcessingBatch(false);
        setBatchProgress({ current: 0, total: 0 });

        try {
            let fullText = textInput.trim().replace(/&(?!(?:amp|quot|lt|gt|apos);)/g, '&amp;');
            const emptyTagRegex = /<([a-zA-Z0-9]+)\b[^>]*>(?:\s*|\[texto\])<\/\1>/g;
            while (emptyTagRegex.test(fullText)) fullText = fullText.replace(emptyTagRegex, '');

            const isSSML = /<speak|<break|<prosody|<emphasis|<phoneme|<sub|<voice|<lexicon|<say-as|<mark/.test(fullText);
            const chunks = fullText.length > 4500 ? splitTextIntoChunks(fullText, 4500) : [fullText];

            if (chunks.length > 1) {
                setIsProcessingBatch(true);
                setBatchProgress({ current: 0, total: chunks.length });
            }

            const audioChunks: Blob[] = [];

            for (let i = 0; i < chunks.length; i++) {
                if (chunks.length > 1) {
                    setBatchProgress(prev => ({ ...prev, current: i + 1 }));
                    setStatus({ type: 'loading', message: `Gerando áudio: parte ${i + 1} de ${chunks.length}...` });
                }

                const body: any = { voice: selectedVoice, languageCode: selectedLanguage, pitch, speakingRate, volumeGainDb: volumeGain };
                if (isSSML) body.ssml = chunks[i].startsWith('<speak') ? chunks[i] : `<speak>${chunks[i]}</speak>`;
                else body.text = chunks[i];

                const { data, error } = await supabase.functions.invoke('google-tts', { body });
                if (error || !data?.audioContent) throw new Error(error?.message || `Falha na parte ${i + 1}`);

                const bytes = new Uint8Array(atob(data.audioContent).split('').map(c => c.charCodeAt(0)));
                audioChunks.push(new Blob([bytes], { type: 'audio/mp3' }));
            }

            const finalBlob = new Blob(audioChunks, { type: 'audio/mp3' });
            const url = URL.createObjectURL(finalBlob);
            setAudioUrl(url);
            setStatus({ type: 'success', message: chunks.length > 1 ? `Áudio completo gerado em ${chunks.length} partes` : 'Áudio gerado com sucesso' });
            setUsage(prev => ({ ...prev, count: prev.count + 1 }));
            setTimeout(() => { if (audioRef.current) audioRef.current.play(); }, 300);
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Erro na sintetização' });
        } finally {
            setIsGenerating(false);
            setIsProcessingBatch(false);
        }
    };

    const downloadAudio = () => {
        if (!audioUrl) return;
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `umbra-audio-${selectedVoice}-${Date.now()}.mp3`;
        a.click();
    };

    // ── style tokens ───────────────────────────────────────────────
    const card = 'bg-white border border-gray-200 rounded-2xl overflow-hidden';
    const cardHeader = 'px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-3';
    const inputClass = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all';
    const btnPrimary = 'flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed';

    return (
        <div className="font-rajdhani animate-in fade-in duration-500 pb-10 space-y-5">

            {/* ── PAGE HEADER ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
                        <Volume2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-gray-900">Umbra Audios</h1>
                        <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Google Cloud TTS — +200 vozes em dezenas de idiomas</p>
                    </div>
                </div>

                {/* Usage badge */}
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border shrink-0 ${isLimitReached ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                    <div className={`w-2 h-2 rounded-full ${isLimitReached ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
                    <span className={`text-xs font-black uppercase tracking-widest ${isLimitReached ? 'text-red-600' : 'text-gray-700'}`}>
                        {remaining} / {limit} {userTier === ToolTier.FREE ? 'áudios' : 'diários'}
                    </span>
                    {isLimitReached && <Lock className="w-3.5 h-3.5 text-red-500 ml-1" />}
                </div>
            </div>

            {/* ── VOICE CONFIGURATION ── */}
            <div className={card}>
                <div className={cardHeader}>
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                        <Mic className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900">Configuração de Voz</h3>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Idioma, gênero e modelo neural</p>
                    </div>
                </div>

                <div className="p-5 space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        {/* Language */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                <Globe className="w-3 h-3" /> Idioma
                            </label>
                            <select
                                value={selectedLanguage}
                                onChange={e => setSelectedLanguage(e.target.value)}
                                className={inputClass}
                            >
                                {availableLanguages.map(lang => (
                                    <option key={lang} value={lang}>{getLanguageLabel(lang)}</option>
                                ))}
                            </select>
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                <User className="w-3 h-3" /> Gênero
                            </label>
                            <div className="flex bg-gray-100 border border-gray-200 p-1 rounded-xl h-[46px]">
                                {(['ALL', 'MALE', 'FEMALE'] as const).map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setSelectedGender(g)}
                                        className={`flex-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${selectedGender === g ? 'bg-white text-primary shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        {g === 'ALL' ? 'Todos' : g === 'MALE' ? 'Masc' : 'Fem'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Voice selector */}
                        <div className="lg:col-span-2 space-y-2">
                            <label className="flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                <span className="flex items-center gap-1.5"><Volume2 className="w-3 h-3" /> Voz ({filteredVoices.length})</span>
                                {isLoadingVoices && <RefreshCw className="w-3 h-3 animate-spin text-primary" />}
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={selectedVoice}
                                    onChange={e => setSelectedVoice(e.target.value)}
                                    className={`${inputClass} flex-1`}
                                >
                                    {filteredVoices.map(v => (
                                        <option key={v.name} value={v.name}>
                                            {v.name.replace(selectedLanguage + '-', '')} — {getVoiceCategory(v.name)}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handlePreview}
                                    disabled={!selectedVoice || isPreviewing}
                                    className="flex items-center justify-center gap-1.5 px-4 bg-white border border-gray-200 hover:border-primary/40 hover:bg-primary/5 text-gray-500 hover:text-primary rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 text-xs font-black uppercase tracking-widest"
                                    title="Ouvir prévia"
                                >
                                    {isPreviewing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                    <span className="hidden sm:inline">Prévia</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Voice type chips */}
                    <div className="flex flex-wrap gap-2 pt-1">
                        {VOICE_TYPES.map(vt => {
                            const isSelected = selectedVoice.includes(vt.key);
                            return (
                                <div
                                    key={vt.key}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${isSelected ? 'bg-primary/10 border-primary text-primary' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary' : 'bg-gray-300'}`} />
                                    {vt.label}
                                    <span className="opacity-60 normal-case font-black hidden sm:inline">· {vt.desc}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── AUDIO PARAMETERS ── */}
            <div className={card}>
                <div className={cardHeader}>
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                        <SlidersHorizontal className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-black text-gray-900">Parâmetros de Áudio</h3>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tom, velocidade e volume</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={applyDarkPreset}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            🎭 Dark Preset
                        </button>
                        <button
                            onClick={() => { setPitch(0); setSpeakingRate(1.0); setVolumeGain(0); }}
                            className="px-3 py-2 bg-white border border-gray-200 hover:border-red-200 hover:text-red-500 hover:bg-red-50 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                            title="Resetar"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Tom (Pitch)', icon: AudioLines, val: pitch > 0 ? `+${pitch}` : String(pitch), min: -5, max: 5, step: 1, value: pitch, onChange: (v: number) => setPitch(v), legends: ['Grave', 'Normal', 'Agudo'], changed: pitch !== 0 },
                            { label: 'Velocidade', icon: RefreshCw, val: `${speakingRate.toFixed(2)}x`, min: 0.8, max: 1.2, step: 0.05, value: speakingRate, onChange: (v: number) => setSpeakingRate(v), legends: ['Lenta', 'Normal', 'Rápida'], changed: speakingRate !== 1.0 },
                            { label: 'Volume Gain', icon: Volume2, val: `${volumeGain > 0 ? '+' : ''}${volumeGain} dB`, min: -5, max: 5, step: 1, value: volumeGain, onChange: (v: number) => setVolumeGain(v), legends: ['Baixo', 'Normal', 'Alto'], changed: volumeGain !== 0 },
                        ].map(slider => (
                            <div key={slider.label} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                        <slider.icon className="w-3 h-3" /> {slider.label}
                                    </label>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${slider.changed ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                                        {slider.val}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={slider.min} max={slider.max} step={slider.step}
                                    value={slider.value}
                                    onChange={e => slider.onChange(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-[8px] font-black text-gray-400 uppercase tracking-wider">
                                    {slider.legends.map(l => <span key={l}>{l}</span>)}
                                </div>
                            </div>
                        ))}
                    </div>

                    {isStudioVoice && hasPitchAdjustment && (
                        <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                            <p className="text-[10px] font-black text-amber-700">Vozes Studio e Neural2 ignoram o ajuste de Pitch.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── TEXT INPUT ── */}
            <div className={card}>
                <div className={cardHeader}>
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                        <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-black text-gray-900">Texto para Narração</h3>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Suporte a texto simples e SSML</p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${textInput.length > 95000 ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {textInput.length.toLocaleString()} / 100.000
                    </span>
                </div>

                <div className="p-5 space-y-4">
                    {/* SSML shortcuts */}
                    <div className="space-y-2">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Atalhos SSML</span>
                        <div className="flex flex-wrap gap-2">
                            {/* Pausas */}
                            <div className="flex bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                {[
                                    { label: '200ms', tag: '<break time="200ms"/>' },
                                    { label: '400ms', tag: '<break time="400ms"/>' },
                                    { label: '600ms', tag: '<break time="600ms"/>' },
                                ].map((b, i) => (
                                    <button
                                        key={b.label}
                                        onClick={() => insertSSML(b.tag)}
                                        className={`px-3 py-2 text-[10px] font-black text-gray-600 hover:text-primary hover:bg-primary/5 uppercase transition-all ${i > 0 ? 'border-l border-gray-200' : ''}`}
                                    >
                                        {b.label}
                                    </button>
                                ))}
                            </div>

                            {/* Ritmo */}
                            <div className="flex bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                <button onClick={() => insertSSML('<prosody rate="90%">', '</prosody>')} className="px-3 py-2 text-[10px] font-black text-gray-600 hover:text-primary hover:bg-primary/5 uppercase transition-all">Lento</button>
                                <button onClick={() => insertSSML('<prosody rate="110%">', '</prosody>')} className="px-3 py-2 text-[10px] font-black text-gray-600 hover:text-primary hover:bg-primary/5 uppercase transition-all border-l border-gray-200">Rápido</button>
                            </div>

                            {/* Ênfase */}
                            <div className="flex bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                                {['weak', 'moderate', 'strong'].map((level, i) => (
                                    <button
                                        key={level}
                                        onClick={() => insertSSML(`<emphasis level="${level}">`, '</emphasis>')}
                                        className={`px-3 py-2 text-[10px] font-black text-gray-600 hover:text-primary hover:bg-primary/5 uppercase transition-all ${i > 0 ? 'border-l border-gray-200' : ''}`}
                                    >
                                        {level === 'weak' ? 'Fraca' : level === 'moderate' ? 'Média' : 'Forte'}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={loadStorytellingExample}
                                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:border-primary/40 hover:bg-primary/5 hover:text-primary text-gray-500 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                🧠 Storytelling
                            </button>
                        </div>
                    </div>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={textInput}
                        onChange={e => setTextInput(e.target.value)}
                        placeholder="Cole o roteiro que deseja converter em voz neural..."
                        className="w-full h-64 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-900 leading-relaxed focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none resize-none transition-all custom-scrollbar"
                        maxLength={100000}
                    />

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !textInput.trim() || textInput.length > 100000 || isLoadingVoices || isLimitReached}
                            className={`${btnPrimary} flex-1 py-4`}
                        >
                            {isGenerating
                                ? <RefreshCw className="w-4 h-4 animate-spin" />
                                : isLimitReached
                                    ? <Lock className="w-4 h-4" />
                                    : <Zap className="w-4 h-4" />}
                            {isGenerating ? 'Gerando...' : isLimitReached ? 'Limite Atingido' : 'Gerar Áudio'}
                        </button>
                        <button
                            onClick={() => { setTextInput(''); setAudioUrl(null); setStatus({ type: null, message: '' }); }}
                            className="p-4 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl text-gray-400 hover:text-red-500 transition-all"
                            title="Limpar"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── STATUS ── */}
            {status.type && (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                    <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                        status.type === 'loading' ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        {status.type === 'loading' ? <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                            : status.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                            : <AlertCircle className="w-4 h-4 shrink-0" />}
                        <span className="text-xs font-black uppercase tracking-widest">{status.message}</span>
                    </div>

                    {isProcessingBatch && batchProgress.total > 0 && (
                        <div className={`${card} p-4 space-y-2`}>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Progresso do Lote</span>
                                <span className="text-[10px] font-black text-primary">{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-500 rounded-full" style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }} />
                            </div>
                            <p className="text-center text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                Parte {batchProgress.current} de {batchProgress.total}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ── AUDIO PLAYER ── */}
            {audioUrl && (
                <div className={`${card} animate-in zoom-in-95 duration-400`}>
                    <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                                <AudioLines className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900">Áudio Gerado</h3>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                    {selectedVoice.replace(selectedLanguage + '-', '')} · {selectedLanguage} · MP3
                                </p>
                            </div>
                        </div>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-[10px] font-black text-green-700 uppercase tracking-widest">
                            <CheckCircle2 className="w-3 h-3" /> Pronto
                        </span>
                    </div>

                    <div className="p-5 flex flex-col sm:flex-row items-center gap-4">
                        <audio
                            ref={audioRef}
                            src={audioUrl}
                            controls
                            className="flex-1 w-full h-11 rounded-xl"
                        />
                        <button
                            onClick={downloadAudio}
                            className={`${btnPrimary} px-6 py-3 shrink-0 w-full sm:w-auto`}
                        >
                            <Download className="w-4 h-4" /> Download MP3
                        </button>
                    </div>
                </div>
            )}

            {/* ── UPGRADE MODAL ── */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setShowUpgradeModal(false)} />
                    <div className="relative bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 text-center space-y-6">
                        <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
                            <X className="w-5 h-5" />
                        </button>

                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-gray-900 mb-2">
                                Limite Atingido
                            </h2>
                            <p className="text-sm font-black text-gray-600 leading-relaxed">
                                Você atingiu seu limite de <span className="text-gray-900">{userTier === ToolTier.FREE ? '3 áudios gratuitos' : '30 áudios diários'}</span>. Faça upgrade para continuar criando com vozes premium.
                            </p>
                        </div>

                        <div className="space-y-3 pt-2">
                            <button
                                onClick={() => window.open('https://pay.cakto.com.br/3dko6xr_769683', '_blank')}
                                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all"
                            >
                                <ArrowUpCircle className="w-4 h-4" /> Fazer Upgrade
                            </button>
                            <button onClick={() => setShowUpgradeModal(false)} className="w-full py-3 text-gray-400 hover:text-gray-700 font-black text-xs uppercase tracking-widest transition-all">
                                Continuar navegando
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UmbraAudiosTool;
