
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
    Search,
    Globe,
    User,
    Lock,
    ArrowUpCircle,
    X
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

const LANGUAGE_NAMES: Record<string, { name: string, flag: string }> = {
    'pt-BR': { name: 'Português (Brasil)', flag: '🇧🇷' },
    'pt-PT': { name: 'Português (Portugal)', flag: '🇵🇹' },
    'en-US': { name: 'Inglês (EUA)', flag: '🇺🇸' },
    'en-GB': { name: 'Inglês (Reino Unido)', flag: '🇬🇧' },
    'es-ES': { name: 'Espanhol (Espanha)', flag: 'es-ES' },
    'es-US': { name: 'Espanhol (EUA)', flag: '🇺🇸' },
    'fr-FR': { name: 'Francês (França)', flag: '🇫🇷' },
    'it-IT': { name: 'Italiano (Itália)', flag: '🇮🇹' },
    'de-DE': { name: 'Alemão (Alemanha)', flag: '🇩🇪' },
    'ja-JP': { name: 'Japonês', flag: '🇯🇵' },
    'ko-KR': { name: 'Coreano', flag: '🇰🇷' },
    'zh-CN': { name: 'Chinês (Mandarim)', flag: '🇨🇳' },
    'ru-RU': { name: 'Russo', flag: '🇷🇺' },
    'hi-IN': { name: 'Hindi', flag: '🇮🇳' },
    'tr-TR': { name: 'Turco', flag: '🇹🇷' },
    'ar-XA': { name: 'Árabe', flag: '🇸🇦' },
};

const STORAGE_LIMIT_KEY = 'umbra_audios_usage_v2';

const UmbraAudiosTool: React.FC<UmbraAudiosToolProps> = ({ userTier }) => {
    const [voices, setVoices] = useState<Voice[]>([]);
    const [isLoadingVoices, setIsLoadingVoices] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState('pt-BR');
    const [selectedGender, setSelectedGender] = useState<'MALE' | 'FEMALE' | 'ALL'>('ALL');
    const [selectedVoice, setSelectedVoice] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [textInput, setTextInput] = useState('Bem-vindo ao Umbra Hub. Agora você tem acesso a todas as vozes premium do Google Cloud TTS.');
    const [isGenerating, setIsGenerating] = useState(false);
    const [status, setStatus] = useState<{ type: 'loading' | 'success' | 'error' | null, message: string }>({ type: null, message: '' });
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [usage, setUsage] = useState({ count: 0, date: new Date().toLocaleDateString() });
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    
    // Audio Filters State
    const [pitch, setPitch] = useState(0);
    const [speakingRate, setSpeakingRate] = useState(1.0);
    const [volumeGain, setVolumeGain] = useState(0);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const insertSSML = (tag: string, closingTag?: string) => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const textAreaValue = textInput;
        const selectedText = textAreaValue.substring(start, end);
        
        // Se for um atalho de início/fim e nada estiver selecionado, coloca um placeholder
        const content = (closingTag && !selectedText) ? '[texto]' : selectedText;
        
        let newText;
        if (closingTag) {
            newText = textAreaValue.substring(0, start) + tag + content + closingTag + textAreaValue.substring(end);
        } else {
            newText = textAreaValue.substring(0, start) + tag + textAreaValue.substring(end);
        }
        
        setTextInput(newText);
        
        // Retornar o foco e posicionar o cursor
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const pos = start + tag.length + content.length + (closingTag ? closingTag.length : 0);
                textareaRef.current.setSelectionRange(pos, pos);
            }
        }, 10);
    };

    const applyDarkChannelPreset = () => {
        setPitch(-1);
        setSpeakingRate(0.85);
        setStatus({ type: 'success', message: '🎭 Preset DARK CHANNEL aplicado!' });
    };

    const loadStorytellingExample = () => {
        const example = `<speak>
<prosody pitch="-1st" rate="92%">
No dia do meu casamento...
</prosody>

<break time="700ms"/>

<prosody rate="95%">
alguém se levantou no meio da cerimônia
</prosody>

<break time="400ms"/>

<prosody rate="88%">
e revelou um <emphasis level="strong">segredo</emphasis>.
</prosody>
</speak>`;
        setTextInput(example);
        setStatus({ type: 'success', message: '📖 Exemplo HUMAN STORYTELLING carregado!' });
    };

    const isStudioVoice = selectedVoice.toLowerCase().includes('studio') || selectedVoice.toLowerCase().includes('neural2');
    const hasPitchAdjustment = pitch !== 0;

    // Batch Processing State
    const [isProcessingBatch, setIsProcessingBatch] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

    const splitTextIntoChunks = (text: string, maxChunkSize = 4800) => {
        // Find if text is SSML
        const isSSML = /<speak/i.test(text);
        const chunks: string[] = [];
        
        let currentText = text;
        
        // Very basic splitter that tries to avoid breaking tags
        while (currentText.length > 0) {
            if (currentText.length <= maxChunkSize) {
                chunks.push(currentText);
                break;
            }

            // Look for a good split point (period followed by space) near the limit
            let splitIndex = currentText.lastIndexOf('. ', maxChunkSize);
            
            // If no good sentence break, just split at last space
            if (splitIndex === -1) {
                splitIndex = currentText.lastIndexOf(' ', maxChunkSize);
            }
            
            // If still no space, just hard cut
            if (splitIndex === -1 || splitIndex < maxChunkSize * 0.5) {
                splitIndex = maxChunkSize;
            } else {
                splitIndex += 1; // Include the space or period
            }

            chunks.push(currentText.substring(0, splitIndex));
            currentText = currentText.substring(splitIndex).trim();
        }

        return chunks;
    };

    // Load usage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_LIMIT_KEY);
        const today = new Date().toLocaleDateString();
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Daily reset for PRO/TURBO
                if (userTier !== ToolTier.FREE && parsed.date !== today) {
                    setUsage({ count: 0, date: today });
                } else {
                    setUsage(parsed);
                }
            } catch (e) {
                setUsage({ count: 0, date: today });
            }
        } else {
            setUsage({ count: 0, date: today });
        }
    }, [userTier]);

    // Save usage
    useEffect(() => {
        localStorage.setItem(STORAGE_LIMIT_KEY, JSON.stringify(usage));
    }, [usage]);

    // Fetch voices on mount
    useEffect(() => {
        const fetchVoices = async () => {
            try {
                const { data, error } = await supabase.functions.invoke('google-tts', {
                    body: { action: 'listVoices' }
                });

                if (error) throw error;
                if (data.voices) {
                    const sortedVoices = (data.voices as Voice[]).sort((a, b) => a.name.localeCompare(b.name));
                    setVoices(sortedVoices);

                    // Set default voice for initial language
                    const initialVoice = sortedVoices.find(v => v.languageCodes.includes('pt-BR'));
                    if (initialVoice) setSelectedVoice(initialVoice.name);
                }
            } catch (err) {
                console.error('Error fetching voices:', err);
                setStatus({ type: 'error', message: 'Erro ao carregar lista de vozes' });
            } finally {
                setIsLoadingVoices(false);
            }
        };

        fetchVoices();
    }, []);

    // Filtered languages based on available voices
    const availableLanguages = useMemo(() => {
        const langs = new Set<string>();
        voices.forEach(v => v.languageCodes.forEach(lc => langs.add(lc)));
        return Array.from(langs).sort();
    }, [voices]);

    // Filtered voices based on selected language, gender and search term
    const filteredVoices = useMemo(() => {
        return voices.filter(v =>
            v.languageCodes.includes(selectedLanguage) &&
            (selectedGender === 'ALL' || v.ssmlGender === selectedGender) &&
            v.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [voices, selectedLanguage, selectedGender, searchTerm]);

    // Update selected voice when language or filters change
    useEffect(() => {
        if (filteredVoices.length > 0) {
            if (!filteredVoices.find(v => v.name === selectedVoice)) {
                setSelectedVoice(filteredVoices[0].name);
            }
        } else {
            setSelectedVoice('');
        }
    }, [selectedLanguage, selectedGender, filteredVoices]);

    const handlePreview = async () => {
        if (!selectedVoice || isPreviewing) return;

        setIsPreviewing(true);
        try {
            const previewText = selectedLanguage.startsWith('pt')
                ? "Olá! Esta é uma pequena demonstração desta voz no Umbra Hub."
                : "Hello! This is a short demonstration of this voice in Umbra Hub.";

            const { data, error } = await supabase.functions.invoke('google-tts', {
                body: {
                    text: previewText,
                    voice: selectedVoice,
                    languageCode: selectedLanguage
                }
            });

            if (error) throw error;
            if (data.audioContent) {
                const binaryString = window.atob(data.audioContent);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'audio/mp3' });
                const url = URL.createObjectURL(blob);

                const audio = new Audio(url);
                audio.play();
            }
        } catch (err) {
            console.error('Preview error:', err);
        } finally {
            setIsPreviewing(false);
        }
    };

    const handleGenerate = async () => {
        if (!textInput.trim()) {
            setStatus({ type: 'error', message: '❌ Por favor, digite algum texto' });
            return;
        }

        // Check limits based on tier
        const limit = userTier === ToolTier.FREE ? 3 : userTier === ToolTier.PRO ? 10 : 30;

        if (usage.count >= limit) {
            setShowUpgradeModal(true);
            return;
        }

        setIsGenerating(true);
        setStatus({ type: 'loading', message: 'Iniciando síntese de voz...' });
        setAudioUrl(null);
        setIsProcessingBatch(false);
        setBatchProgress({ current: 0, total: 0 });

        try {
            let fullText = textInput.trim();
            
            // Cleanup and Sanitize
            fullText = fullText.replace(/&(?!(?:amp|quot|lt|gt|apos);)/g, '&amp;');
            const emptyOrPlaceholderTagRegex = /<([a-zA-Z0-9]+)\b[^>]*>(?:\s*|\[texto\])<\/\1>/g;
            while (emptyOrPlaceholderTagRegex.test(fullText)) {
                fullText = fullText.replace(emptyOrPlaceholderTagRegex, '');
            }

            const isSSML = /<speak|<break|<prosody|<emphasis|<phoneme|<sub|<voice|<lexicon|<say-as|<mark/.test(fullText);
            
            // Split into chunks if long (approx 4500 bytes limit)
            const maxChars = 4500;
            const textChunks = fullText.length > maxChars ? splitTextIntoChunks(fullText, maxChars) : [fullText];
            
            if (textChunks.length > 1) {
                setIsProcessingBatch(true);
                setBatchProgress({ current: 0, total: textChunks.length });
                setStatus({ type: 'loading', message: `Processando parte 1 de ${textChunks.length}...` });
            }

            const audioChunks: Blob[] = [];

            for (let i = 0; i < textChunks.length; i++) {
                if (textChunks.length > 1) {
                    setBatchProgress(prev => ({ ...prev, current: i + 1 }));
                    setStatus({ type: 'loading', message: `Gerando áudio: Parte ${i + 1} de ${textChunks.length}...` });
                }

                const chunk = textChunks[i];
                const requestBody: any = {
                    voice: selectedVoice,
                    languageCode: selectedLanguage,
                    pitch: pitch,
                    speakingRate: speakingRate,
                    volumeGainDb: volumeGain
                };

                if (isSSML) {
                    requestBody.ssml = chunk.startsWith('<speak') ? chunk : `<speak>${chunk}</speak>`;
                } else {
                    requestBody.text = chunk;
                }

                const { data, error: invokeError } = await supabase.functions.invoke('google-tts', {
                    body: requestBody
                });

                if (invokeError || !data?.audioContent) {
                    throw new Error(invokeError?.message || 'Falha na resposta da função na parte ' + (i + 1));
                }

                // Decode base64 to binary
                const binaryString = atob(data.audioContent);
                const bytes = new Uint8Array(binaryString.length);
                for (let j = 0; j < binaryString.length; j++) {
                    bytes[j] = binaryString.charCodeAt(j);
                }
                
                audioChunks.push(new Blob([bytes], { type: 'audio/mp3' }));
            }

            // Merge all blobs
            const finalBlob = new Blob(audioChunks, { type: 'audio/mp3' });
            const url = URL.createObjectURL(finalBlob);
            setAudioUrl(url);
            setStatus({ type: 'success', message: textChunks.length > 1 ? `✅ Áudio completo gerado em ${textChunks.length} partes!` : '🚀 Áudio pronto!' });

            // Record usage
            setUsage(prev => {
                const updated = { count: prev.count + 1, lastUsed: new Date().toISOString() };
                localStorage.setItem(STORAGE_LIMIT_KEY, JSON.stringify(updated));
                return updated;
            });

            setTimeout(() => {
                if (audioRef.current) audioRef.current.play();
            }, 300);
        } catch (err: any) {
            console.error('TTS Error:', err);
            setStatus({ type: 'error', message: `❌ ${err.message || 'Erro na sintetização'}` });
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
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const getLanguageLabel = (code: string) => {
        const info = LANGUAGE_NAMES[code];
        return info ? `${info.flag} ${info.name}` : code;
    };

    const getVoiceCategory = (name: string) => {
        if (name.includes('Neural2')) return 'Neural High-Fi';
        if (name.includes('Studio')) return 'Studio (Premium)';
        if (name.includes('Polyglot')) return 'Polyglot';
        if (name.includes('Wavenet')) return 'WaveNet';
        if (name.includes('Chirp')) return 'Chirp (v3)';
        return 'Standard';
    };

    return (
        <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
            <header className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-purple/10 rounded-[28px] mb-6 shadow-2xl shadow-brand-purple/10 ring-1 ring-brand-purple/20">
                    <Volume2 className="w-10 h-10 text-brand-purple" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-purple via-brand-pink to-amber-500 bg-clip-text text-transparent uppercase">
                    Umbra Audios (Global)
                </h1>
                <p className="text-gray-500 font-medium tracking-wide uppercase text-[10px]">Acesso total à biblioteca de vozes do Google Cloud TTS</p>
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-brand-purple/30 to-transparent mx-auto mt-6" />
            </header>

            <div className="grid grid-cols-1 gap-8">
                {/* CONTROLS PANEL */}
                <div className="bg-background-mid border border-white/5 rounded-[32px] p-8 shadow-xl space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Language Selector */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Globe className="w-3 h-3 text-brand-purple" /> Idioma
                            </label>
                            <select
                                value={selectedLanguage}
                                onChange={e => setSelectedLanguage(e.target.value)}
                                className="w-full bg-background-light border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-brand-purple/50 outline-none cursor-pointer hover:border-white/20 transition-all shadow-inner"
                            >
                                {availableLanguages.map(lang => (
                                    <option key={lang} value={lang} className="bg-background-mid">
                                        {getLanguageLabel(lang)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Gender Filter */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <User className="w-3 h-3 text-brand-pink" /> Gênero
                            </label>
                            <div className="flex p-1 bg-background-light border border-white/10 rounded-2xl h-[52px]">
                                {(['ALL', 'MALE', 'FEMALE'] as const).map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setSelectedGender(g)}
                                        className={`flex-1 rounded-xl text-[10px] font-black transition-all uppercase tracking-tighter ${selectedGender === g
                                            ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20'
                                            : 'text-gray-600 hover:text-gray-400'
                                            }`}
                                    >
                                        {g === 'ALL' ? 'Todos' : g === 'MALE' ? 'Masc' : 'Fem'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Voice Selector */}
                        <div className="lg:col-span-2 space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Volume2 className="w-3 h-3 text-amber-500" /> Seleção de Voz ({filteredVoices.length})
                                </span>
                                {isLoadingVoices && <RefreshCw className="w-3 h-3 animate-spin text-brand-purple" />}
                            </label>
                            <div className="flex gap-3">
                                <div className="relative group flex-1">
                                    <select
                                        value={selectedVoice}
                                        onChange={e => setSelectedVoice(e.target.value)}
                                        className="w-full bg-background-light border border-white/10 rounded-2xl p-4 pl-12 text-xs font-bold text-white focus:border-brand-purple/50 outline-none appearance-none cursor-pointer hover:border-white/20 transition-all shadow-inner"
                                    >
                                        {filteredVoices.map(v => (
                                            <option key={v.name} value={v.name} className="bg-background-mid">
                                                {v.name.replace(selectedLanguage + '-', '')} - {getVoiceCategory(v.name)}
                                            </option>
                                        ))}
                                    </select>
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-hover:text-brand-purple transition-colors" />
                                </div>
                                <button
                                    onClick={handlePreview}
                                    disabled={!selectedVoice || isPreviewing}
                                    className="px-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-brand-purple hover:border-brand-purple/30 transition-all flex items-center justify-center disabled:opacity-30 group"
                                    title="Escutar Prévia"
                                >
                                    {isPreviewing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* AUDIO FILTERS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-white/5">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <AudioLines className="w-3 h-3 text-brand-purple" /> Pitch (Tom)
                                </label>
                                <span className={`text-[10px] font-black ${pitch === 0 ? 'text-gray-500' : 'text-brand-purple'}`}>{pitch > 0 ? `+${pitch}` : pitch}</span>
                            </div>
                            <input 
                                type="range" 
                                min="-5" max="5" step="1" 
                                value={pitch} 
                                onChange={e => setPitch(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-background-light rounded-lg appearance-none cursor-pointer accent-brand-purple"
                            />
                            {isStudioVoice && hasPitchAdjustment && (
                                <p className="text-[8px] font-medium text-amber-500/80 flex items-center gap-1 italic animate-pulse">
                                    ⚠️ Voz {selectedVoice.split('-').pop()} ignora ajuste de Pitch.
                                </p>
                            )}
                            <div className="flex justify-between text-[8px] font-black text-gray-700 uppercase tracking-tighter">
                                <span>Grave</span>
                                <span>Normal</span>
                                <span>Agudo</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <RefreshCw className="w-3 h-3 text-brand-pink" /> Velocidade
                                </label>
                                <span className={`text-[10px] font-black ${speakingRate === 1.0 ? 'text-gray-500' : 'text-brand-pink'}`}>{speakingRate.toFixed(2)}x</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.8" max="1.2" step="0.05" 
                                value={speakingRate} 
                                onChange={e => setSpeakingRate(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-background-light rounded-lg appearance-none cursor-pointer accent-brand-pink"
                            />
                            <div className="flex justify-between text-[8px] font-black text-gray-700 uppercase tracking-tighter">
                                <span>Lenta</span>
                                <span>Normal</span>
                                <span>Rápida</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <Volume2 className="w-3 h-3 text-amber-500" /> Volume Gain
                                </label>
                                <span className={`text-[10px] font-black ${volumeGain === 0 ? 'text-gray-500' : 'text-amber-500'}`}>{volumeGain > 0 ? `+${volumeGain}` : volumeGain} dB</span>
                            </div>
                            <input 
                                type="range" 
                                min="-5" max="5" step="1" 
                                value={volumeGain} 
                                onChange={e => setVolumeGain(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-background-light rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                            <div className="flex justify-between text-[8px] font-black text-gray-700 uppercase tracking-tighter">
                                <span>Baixo</span>
                                <span>Normal</span>
                                <span>Alto</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Mic className="w-3 h-3 text-brand-purple" /> Texto para Narração
                            </label>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-white/5 ${textInput.length > 95000 ? 'text-brand-pink' : 'text-gray-500'}`}>
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter mr-4 ${usage.count >= (userTier === ToolTier.FREE ? 3 : userTier === ToolTier.PRO ? 10 : 30) ? 'bg-brand-pink/20 text-brand-pink border border-brand-pink/30' : 'bg-brand-green/20 text-brand-green border border-brand-green/30'}`}>
                                    {Math.max(0, (userTier === ToolTier.FREE ? 3 : userTier === ToolTier.PRO ? 10 : 30) - usage.count)} / {userTier === ToolTier.FREE ? 3 : userTier === ToolTier.PRO ? 10 : 30} {userTier === ToolTier.FREE ? 'Áudios' : 'Destaque'} {userTier === ToolTier.FREE ? 'Restantes' : '/ Dia'}
                                </span>
                                {textInput.length.toLocaleString()} / 100.000 chars
                            </span>
                        </div>
                        
                        {/* SSML SHORTCUTS - ADVANCED TRICKS */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-brand-purple" /> Truques de Narrador (SSML)
                            </label>
                            
                            <div className="flex flex-wrap gap-2">
                                {/* Pausas */}
                                <div className="flex bg-background-light p-1 rounded-xl border border-white/5">
                                    <button 
                                        onClick={() => insertSSML('<break time="200ms"/>')}
                                        className="px-2 py-1 text-[8px] font-black text-gray-500 hover:text-white transition-all uppercase"
                                        title="Pausa Curta"
                                    >
                                        200ms
                                    </button>
                                    <button 
                                        onClick={() => insertSSML('<break time="400ms"/>')}
                                        className="px-2 py-1 text-[8px] font-black text-gray-500 hover:text-white transition-all uppercase border-l border-white/5"
                                        title="Pausa Natural"
                                    >
                                        400ms
                                    </button>
                                    <button 
                                        onClick={() => insertSSML('<break time="600ms"/>')}
                                        className="px-2 py-1 text-[8px] font-black text-gray-500 hover:text-white transition-all uppercase border-l border-white/5"
                                        title="Pausa Dramática"
                                    >
                                        600ms
                                    </button>
                                </div>

                                {/* Ritmo */}
                                <div className="flex bg-background-light p-1 rounded-xl border border-white/5">
                                    <button 
                                        onClick={() => insertSSML('<prosody rate="90%">', '</prosody>')}
                                        className="px-2 py-1 text-[8px] font-black text-gray-500 hover:text-brand-pink transition-all uppercase"
                                        title="Falar Lento"
                                    >
                                        Lento (90%)
                                    </button>
                                    <button 
                                        onClick={() => insertSSML('<prosody rate="110%">', '</prosody>')}
                                        className="px-2 py-1 text-[8px] font-black text-gray-500 hover:text-brand-pink transition-all uppercase border-l border-white/5"
                                        title="Falar Rápido"
                                    >
                                        Rápido (110%)
                                    </button>
                                </div>

                                {/* Ênfase */}
                                <div className="flex bg-background-light p-1 rounded-xl border border-white/5">
                                    <button 
                                        onClick={() => insertSSML('<emphasis level="weak">', '</emphasis>')}
                                        className="px-2 py-1 text-[8px] font-black text-gray-500 hover:text-amber-500 transition-all uppercase"
                                    >
                                        Fraca
                                    </button>
                                    <button 
                                        onClick={() => insertSSML('<emphasis level="moderate">', '</emphasis>')}
                                        className="px-2 py-1 text-[8px] font-black text-gray-500 hover:text-amber-500 transition-all uppercase border-l border-white/5"
                                    >
                                        Média
                                    </button>
                                    <button 
                                        onClick={() => insertSSML('<emphasis level="strong">', '</emphasis>')}
                                        className="px-2 py-1 text-[8px] font-black text-gray-500 hover:text-amber-500 transition-all uppercase border-l border-white/5"
                                    >
                                        Forte
                                    </button>
                                </div>

                                <button 
                                    onClick={applyDarkChannelPreset}
                                    className="px-3 py-1.5 bg-brand-purple/10 border border-brand-purple/30 rounded-xl text-[8px] font-black text-brand-purple hover:bg-brand-purple hover:text-white transition-all uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-brand-purple/10"
                                >
                                    🎭 Dark Preset
                                </button>

                                <button 
                                    onClick={loadStorytellingExample}
                                    className="px-3 py-1.5 bg-brand-pink/10 border border-brand-pink/30 rounded-xl text-[8px] font-black text-brand-pink hover:bg-brand-pink hover:text-white transition-all uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-brand-pink/10"
                                >
                                    🧠 Storytelling Example
                                </button>
                            </div>
                        </div>

                        <textarea
                            ref={textareaRef}
                            value={textInput}
                            onChange={e => setTextInput(e.target.value)}
                            placeholder="Cole o roteiro que deseja converter em voz neural de alta qualidade..."
                            className="w-full h-64 bg-background-deep/50 border border-white/10 rounded-[28px] p-6 text-sm leading-relaxed text-gray-300 focus:border-brand-purple/40 outline-none resize-none custom-scrollbar shadow-inner"
                            maxLength={100000}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !textInput.trim() || textInput.length > 100000 || isLoadingVoices || usage.count >= (userTier === ToolTier.FREE ? 3 : userTier === ToolTier.PRO ? 10 : 30)}
                            className={`py-5 text-white font-orbitron text-xs font-black tracking-[0.3em] rounded-2xl transition-all disabled:opacity-30 uppercase flex items-center justify-center gap-3 active:scale-95 group shadow-xl ${usage.count >= (userTier === ToolTier.FREE ? 3 : userTier === ToolTier.PRO ? 10 : 30)
                                ? 'bg-gray-800 border border-white/10 cursor-not-allowed'
                                : 'bg-gradient-to-r from-brand-purple to-brand-pink hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]'
                                }`}
                        >
                            {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : usage.count >= (userTier === ToolTier.FREE ? 3 : userTier === ToolTier.PRO ? 10 : 30) ? <Lock className="w-5 h-5" /> : <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                            {usage.count >= (userTier === ToolTier.FREE ? 3 : userTier === ToolTier.PRO ? 10 : 30) ? 'Limite Atingido' : 'Gerar Áudio Global'}
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
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <div className={`p-5 rounded-2xl border flex items-center gap-4 shadow-lg ${status.type === 'loading' ? 'bg-brand-purple/5 border-brand-purple/20 text-brand-purple' :
                            status.type === 'success' ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' :
                                'bg-brand-pink/10 border-brand-pink/20 text-brand-pink'
                            }`}>
                            {status.type === 'loading' ? <RefreshCw className="w-5 h-5 animate-spin" /> :
                                status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span className="text-xs font-bold uppercase tracking-widest flex-1">{status.message}</span>
                        </div>
                        
                        {isProcessingBatch && (
                            <div className="bg-background-mid border border-white/5 rounded-2xl p-4 space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-gray-500">Progresso do Lote</span>
                                    <span className="text-brand-purple">{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                                </div>
                                <div className="w-full h-2 bg-background-light rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-brand-purple to-brand-pink transition-all duration-500" 
                                        style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                    />
                                </div>
                                <div className="text-center text-[8px] font-bold text-gray-600 uppercase tracking-tighter">
                                    Parte {batchProgress.current} de {batchProgress.total} processada
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* PLAYER PANEL */}
                {audioUrl && (
                    <div className="bg-background-mid border border-brand-purple/30 rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden relative group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-purple via-brand-pink to-amber-500 opacity-50" />

                        <div className="absolute top-4 right-8 flex gap-2">
                            <div className="px-3 py-1 bg-brand-purple/10 rounded-full border border-brand-purple/20">
                                <span className="text-[9px] font-black text-brand-purple uppercase tracking-tighter">Premium Neural Output</span>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-8 mt-4">
                            <div className="flex-1 w-full space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-brand-purple/20 rounded-xl flex items-center justify-center">
                                            <AudioLines className="w-6 h-6 text-brand-purple" />
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-black text-white/50 uppercase tracking-widest leading-none mb-1">Modelo Selecionado</span>
                                            <span className="text-xs font-bold text-white uppercase">{selectedVoice.replace(selectedLanguage + '-', '')}</span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-700 uppercase">{selectedLanguage} · 48khz · MP3</span>
                                </div>
                                <audio ref={audioRef} src={audioUrl} controls className="w-full h-12 filter invert hue-rotate-180 opacity-80 hover:opacity-100 transition-opacity" />
                            </div>

                            <button
                                onClick={downloadAudio}
                                className="w-full md:w-auto px-10 py-5 bg-brand-green text-background-deep font-orbitron text-xs font-black tracking-[0.3em] rounded-2xl shadow-xl shadow-brand-green/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase group"
                            >
                                <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" /> Download MP3
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-brand-purple/5 border border-brand-purple/10 rounded-[32px] p-8 space-y-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <Sparkles className="w-5 h-5 text-brand-purple" />
                            <h4 className="font-orbitron text-[10px] font-black uppercase text-white tracking-widest">Tecnologia Global Google Cloud</h4>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">
                            Você tem acesso a mais de 200 vozes em dezenas de idiomas.
                            <span className="block mt-2 font-bold text-amber-500/80 uppercase text-[9px]">⚠️ Textos longos podem levar alguns minutos para processar.</span>
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Studio', desc: 'Podcast/News' },
                            { label: 'Neural2', desc: 'Deep Learning' },
                            { label: 'WaveNet', desc: 'Google Assistant' },
                            { label: 'Standard', desc: 'High Efficiency' }
                        ].map(item => (
                            <div key={item.label} className="p-3 bg-white/5 border border-white/5 rounded-2xl text-center">
                                <span className="block text-[10px] font-black text-white tracking-widest uppercase mb-1">{item.label}</span>
                                <span className="text-[8px] text-gray-600 font-bold uppercase tracking-tighter">{item.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* UPGRADE MODAL */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-background-deep/95 backdrop-blur-xl" onClick={() => setShowUpgradeModal(false)} />
                    <div className="relative bg-background-mid border border-white/10 rounded-[48px] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 text-center space-y-8">
                        <div className="w-24 h-24 bg-brand-purple/10 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-brand-purple/20 ring-1 ring-brand-purple/30">
                            <Lock className="w-12 h-12 text-brand-purple" />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl font-black tracking-tight uppercase font-orbitron">Limite do Plano <span className="text-brand-purple">{userTier}</span> Atingido</h2>
                            <p className="text-gray-500 font-medium leading-relaxed">
                                Você já atingiu seu limite de {userTier === ToolTier.FREE ? '3 áudios gratuitos' : userTier === ToolTier.PRO ? '10 áudios diários' : '30 áudios diários'}. <br />
                                Para continuar criando com vozes de cinema e sem limites, faça o upgrade para o próximo nível.
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <button
                                onClick={() => window.open('https://pay.cakto.com.br/3dko6xr_769683', '_blank')}
                                className="w-full py-5 bg-gradient-to-r from-brand-purple to-brand-pink text-white font-black rounded-2xl hover:scale-[1.02] transition-all uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-purple/20 flex items-center justify-center gap-3"
                            >
                                <ArrowUpCircle className="w-5 h-5" /> Liberar Uso Ilimitado
                            </button>
                            <button
                                onClick={() => setShowUpgradeModal(false)}
                                className="w-full py-4 text-gray-600 font-bold hover:text-white transition-all uppercase text-[10px] tracking-widest"
                            >
                                Continuar Navegando
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/5 opacity-50 grayscale hover:grayscale-0 transition-all">
                            <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Acesso Vitalício Garantido</div>
                        </div>

                        <button
                            onClick={() => setShowUpgradeModal(false)}
                            className="absolute top-6 right-6 p-3 text-gray-600 hover:text-white transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UmbraAudiosTool;
