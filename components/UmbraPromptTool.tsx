import React, { useState, useEffect, useRef } from 'react';
import {
    Mic,
    Music,
    Zap,
    Play,
    CheckCircle2,
    Trash2,
    Copy,
    AlertCircle,
    Settings,
    Upload,
    Clock,
    RefreshCw,
    Sparkles,
    Terminal,
    Brain,
    Cpu,
    Info
} from 'lucide-react';

// --- Constants (Exactly as umbra-prompt-v3.html) ---
const SEG_SEC = 8;
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-large-latest';

const SYSTEM_UMBRA = `# Umbra Prompt v3.0 — AGENTE OTIMIZADO VEO 3

---

## VISÃO GERAL
Este agente cria e gerencia prompts sincronizados para o Veo 3.

### REGRAS CRÍTICAS DE CONTEÚDO (POLÍTICAS VEO 3)
- **IDADE MÍNIMA**: 13 anos.
- **SEM FAMOSOS**: Proibido referências a celebridades/políticos.
- **ZERO ÁUDIO**: NUNCA mencione som, voz, fala, silêncio. Use "Visual-only scene".
- **FORMATO DE PERSONAGEM**: \`[age] years old [sexo], [etnia], [físico], [cabelo], wearing [roupa]\`.

### SISTEMA DE PERSONAGENS PRINCIPAIS [1], [2], [3]
- **[1], [2], [3]**: Referem-se às imagens enviadas como "Elementos" no Veo 3 para consistência.
- **Modo Texto Simples**: Se não houver personagens principais, use \`[]\` ou \`[N/A]\`.
- **Figurantes**: Devem ser descritos detalhadamente em CADA prompt.

### ESTRUTURA DE PROMPT (OBRIGATÓRIA)
- **Cabeçalho**: \`PROMPT [Nº] [CHARACTERS] | [TIMESTAMP]:\`
- **Corpo**: 
  1. Live-action cinematic film, photorealistic, real human actors, [genre] movie.
  2. Visual-only scene.
  3. **CÂMERA** (Sempre primeiro).
  4. **CHARACTER + ACTION** (Incluir Intensidade [1-8]).
  5. **ENVIRONMENT + LIGHTING**.
  6. Clean frame. 8K, photorealistic.

### REGRA DE OURO
- No primeiro prompt onde um personagem [1, 2, 3] aparecer, forneça a descrição física completa. Nos seguintes, use apenas "Character 1", etc.

=== OUTPUT RULES ===
- Reply ONLY with the raw prompt started by the header.
- NO markdown, NO quotes.
- Format: \`PROMPT 001 [1, 2] | 00:00 - 00:08: [Body content]\``;

interface ProcessedPrompt {
    id: number;
    ts: string;
    transcript: string;
    prompt: string;
    status: 'pending' | 'whisper' | 'mistral' | 'done' | 'error';
    error?: string;
}

const UmbraPromptTool: React.FC = () => {
    // --- States ---
    const [groqKey, setGroqKey] = useState('');
    const [mistralKey, setMistralKey] = useState('');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const [duration, setDuration] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cancelled, setCancelled] = useState(false);
    const [prompts, setPrompts] = useState<ProcessedPrompt[]>([]);
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [logs, setLogs] = useState<{ msg: string; type: string; time: string }[]>([]);
    const [progress, setProgress] = useState(0);
    const [showConfig, setShowConfig] = useState(false);

    // --- Briefing States (Agente Otimizado v3.0) ---
    const [narrativeMode, setNarrativeMode] = useState<'visual' | 'verbal'>('visual');
    const [visualApproach, setVisualApproach] = useState<'documentary' | 'motion' | 'hybrid'>('documentary');
    const [coverageLevel, setCoverageLevel] = useState<'key' | 'full'>('full');
    const [videoDuration, setVideoDuration] = useState('2:00');
    const [includeCharacters, setIncludeCharacters] = useState(true);

    const audioRef = useRef<HTMLAudioElement>(null);
    const logEndRef = useRef<HTMLDivElement>(null);

    // --- Init ---
    useEffect(() => {
        const gk = localStorage.getItem('groq_key');
        const mk = localStorage.getItem('mistral_key');
        if (gk) setGroqKey(gk);
        if (mk) setMistralKey(mk);
    }, []);

    useEffect(() => {
        if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // --- Audio Utils (Identical to umbra-prompt-v3.html) ---
    const toWav = (buf: AudioBuffer) => {
        const sr = buf.sampleRate, samp = buf.getChannelData(0);
        const dLen = samp.length * 2, ab = new ArrayBuffer(44 + dLen), v = new DataView(ab);
        const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
        ws(0, 'RIFF'); v.setUint32(4, 36 + dLen, true); ws(8, 'WAVE');
        ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
        v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
        v.setUint16(32, 2, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, dLen, true);
        let off = 44;
        for (let i = 0; i < samp.length; i++, off += 2) {
            const s = Math.max(-1, Math.min(1, samp[i]));
            v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        return ab;
    };

    const extractSegment = (buf: AudioBuffer, startSec: number, endSec: number): Promise<Blob | null> => {
        return new Promise(resolve => {
            const sr = buf.sampleRate;
            const s0 = Math.floor(startSec * sr), s1 = Math.floor(endSec * sr);
            const fc = s1 - s0;
            if (fc <= 0) { resolve(null); return; }
            const ch = Math.min(buf.numberOfChannels, 2);
            const offCtx = new OfflineAudioContext(ch, fc, sr);
            const segBuf = offCtx.createBuffer(ch, fc, sr);
            for (let c = 0; c < ch; c++) segBuf.copyToChannel(buf.getChannelData(c).slice(s0, s1), c);
            const src = offCtx.createBufferSource();
            src.buffer = segBuf; src.connect(offCtx.destination); src.start();
            offCtx.startRendering().then(r => resolve(new Blob([toWav(r)], { type: 'audio/wav' })));
        });
    };

    const addLog = (msg: string, type: string = '') => {
        const n = new Date();
        const ts = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')} `;
        setLogs(prev => [...prev.slice(-49), { msg, type, time: ts }]);
    };

    const fmtTs = (sec: number) => {
        const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} `;
    };

    const handleFile = async (e: any) => {
        let file: File | null = null;
        if (e.target?.files) file = e.target.files[0];
        else if (e.dataTransfer?.files) file = e.dataTransfer.files[0];

        if (file && file.type.startsWith('audio')) {
            setAudioFile(file);
            addLog(`✓ Áudio carregado: ${file.name} `, 'info');
            try {
                const ab = await file.arrayBuffer();
                const ctx = new AudioContext();
                const decoded = await ctx.decodeAudioData(ab.slice(0));
                setAudioBuffer(decoded);
                setDuration(decoded.duration);
            } catch (err) {
                addLog(`⚠ Erro ao decodificar: ${err} `, 'error');
            }
        }
    };

    const startProcess = async () => {
        if (!audioBuffer) return;
        // Prioritize input state over localStorage to ensure immediate changes work
        const keyGroq = groqKey.trim() || localStorage.getItem('groq_key') || '';
        const keyMistral = mistralKey.trim() || localStorage.getItem('mistral_key') || '';

        if (!keyGroq || !keyMistral) {
            addLog('⚠ Chaves de API ausentes (Groq/Mistral).', 'error');
            setShowConfig(true);
            return;
        }

        // Log partial keys for debugging (last 4 chars)
        addLog(`Usando keys: Groq(...${keyGroq.slice(-4)}) | Mistral(...${keyMistral.slice(-4)})`, 'info');

        setIsProcessing(true);
        setCancelled(false);
        setPrompts([]);
        setProgress(0);
        setLogs([]);

        const totalSec = audioBuffer.duration;
        const totalSegs = Math.ceil(totalSec / SEG_SEC);
        addLog(`Pipeline: Groq Whisper → Mistral ${MISTRAL_MODEL} | ${totalSegs} segmentos`, 'info');

        for (let i = 1; i <= totalSegs; i++) {
            if (cancelled) { addLog('Cancelado pelo usuário.', 'error'); break; }

            const startSec = (i - 1) * SEG_SEC;
            const endSec = Math.min(i * SEG_SEC, totalSec);
            const tsLabel = `${fmtTs(startSec)}–${fmtTs(endSec)} `;

            const newPrompt: ProcessedPrompt = { id: i, ts: tsLabel, transcript: '', prompt: '', status: 'pending' };
            setPrompts(prev => [...prev, newPrompt]);
            setCurrentStep(i - 1);

            try {
                // Step 1: Extract
                addLog(`[${i}/${totalSegs}] ⚙ Extraindo ${tsLabel}...`);
                const blob = await extractSegment(audioBuffer, startSec, endSec);
                if (!blob) throw new Error('Falha na extração');

                // Step 2: Groq Whisper (Proxy)
                setPrompts(prev => prev.map(p => p.id === i ? { ...p, status: 'whisper' } : p));
                addLog(`[${i}/${totalSegs}] 🎙 Transcrevendo via Groq(Whisper)...`, 'blue');

                const whisFd = new FormData();
                whisFd.append('file', blob, `seg_${i}.wav`);

                const whisRes = await fetch('/api/groq_proxy', {
                    method: 'POST',
                    headers: { 'X-Groq-Key': keyGroq },
                    body: whisFd
                });

                if (!whisRes.ok) {
                    const eJson = await whisRes.json().catch(() => ({}));
                    throw new Error(eJson?.error?.message || eJson?.msg || `Groq falhou: HTTP ${whisRes.status} `);
                }

                let transcript = (await whisRes.text()).trim();
                if (!transcript) transcript = '[sem fala]';
                setPrompts(prev => prev.map(p => p.id === i ? { ...p, transcript, status: 'mistral' } : p));
                addLog(`[${i}] ✓ Transcrição concluída.`, 'success');

                // Step 3: Mistral (Proxy)
                addLog(`[${i}/${totalSegs}] ✦ Gerando prompt via Proxy(Mistral)...`, 'purple');

                const briefingContext = `
PROJECT BRIEFING:
- Narrative Mode: ${narrativeMode === 'visual' ? 'VISUAL NARRATIVE (Images count the story)' : 'VERBAL NARRATIVE (Speech conducts)'}
- Visual Approach: ${visualApproach.toUpperCase()}
- Main Characters [1, 2, 3]: ${includeCharacters ? 'YES (Use [1], [2], [3] notation for reference consistency)' : 'NO (Use [] or [N/A] in header, simple text mode)'}
- Estimated Duration: ${videoDuration}
`;

                const userMsg = `${briefingContext}\nSegment ${i}/${totalSegs} | Timestamp: ${tsLabel}\nPortuguese transcription: "${transcript}"\n\nGenerate the Veo 3 scene prompt for this moment following all rules.`;

                const mistRes = await fetch('/api/prompt_proxy', {
                    method: 'POST',
                    headers: {
                        'X-Mistral-Key': keyMistral,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: MISTRAL_MODEL,
                        max_tokens: 400,
                        temperature: 0.7,
                        messages: [{ role: 'system', content: SYSTEM_UMBRA }, { role: 'user', content: userMsg }]
                    })
                });

                if (!mistRes.ok) {
                    const eJson = await mistRes.json().catch(() => ({}));
                    throw new Error(eJson?.message || eJson?.error?.message || eJson?.msg || `Mistral proxy falhou: HTTP ${mistRes.status}`);
                }

                const mData = await mistRes.json();
                const prompt = mData.choices?.[0]?.message?.content?.trim() || '';
                setPrompts(prev => prev.map(p => p.id === i ? { ...p, prompt, status: 'done' } : p));
                addLog(`[${i}] ✓ Prompt gerado.`, 'success');

            } catch (err: any) {
                setPrompts(prev => prev.map(p => p.id === i ? { ...p, status: 'error', error: err.message } : p));
                addLog(`[${i}] ❌ ERRO: ${err.message}`, 'error');
            }

            setProgress(Math.round((i / totalSegs) * 100));
            if (i < totalSegs && !cancelled) await new Promise(r => setTimeout(r, 250));
        }

        setIsProcessing(false);
        addLog('✓ Processamento concluído.', 'info');
    };

    const copyPrompt = (text: string) => {
        navigator.clipboard.writeText(text);
        addLog('✓ Prompt copiado.', 'success');
    };

    const copyAllPrompts = () => {
        const text = prompts
            .filter(p => p.status === 'done')
            .map(p => p.prompt)
            .join('\n\n');
        if (!text) {
            addLog('⚠ Nenhum prompt disponível para copiar.', 'error');
            return;
        }
        navigator.clipboard.writeText(text);
        addLog('✓ Todos os prompts copiados.', 'success');
    };

    const saveKeys = () => {
        const gk = groqKey.trim();
        const mk = mistralKey.trim();
        if (gk) localStorage.setItem('groq_key', gk);
        if (mk) localStorage.setItem('mistral_key', mk);
        setShowConfig(false);
        addLog('✓ Configurações de API salvas (Groq/Mistral).', 'success');
    };

    const testGroq = async () => {
        const key = groqKey.trim() || localStorage.getItem('groq_key') || '';
        if (!key) { addLog('⚠ Insira a chave Groq para testar.', 'error'); return; }
        addLog('🧪 Testando conexão com Groq...', 'info');
        try {
            const res = await fetch('/api/groq_proxy', {
                method: 'POST',
                headers: { 'X-Groq-Key': key },
                body: new FormData()
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok || (res.status === 400 && data.error?.message?.includes("file"))) {
                addLog('✅ Groq Conectado (Autenticação OK)!', 'success');
            } else {
                addLog(`❌ Falha Groq: HTTP ${res.status} | ${data.msg || data.error?.message || 'Erro Desconhecido'}`, 'error');
            }
        } catch (err: any) {
            addLog(`❌ Erro no teste Groq: ${err.message}`, 'error');
        }
    };

    const testMistral = async () => {
        const key = mistralKey.trim() || localStorage.getItem('mistral_key') || '';
        if (!key) { addLog('⚠ Insira a chave Mistral para testar.', 'error'); return; }
        addLog('🧪 Testando conexão com Mistral...', 'info');
        try {
            const res = await fetch('/api/prompt_proxy', {
                method: 'POST',
                headers: { 'X-Mistral-Key': key, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: MISTRAL_MODEL, messages: [{ role: 'user', content: 'hi' }], max_tokens: 5 })
            });
            const data = await res.json();
            if (res.ok) {
                addLog('✅ Mistral Conectado!', 'success');
            } else {
                addLog(`❌ Mistral Falhou: ${data.msg || data.error?.message || res.status}`, 'error');
            }
        } catch (err: any) {
            addLog(`❌ Erro no teste: ${err.message}`, 'error');
        }
    };

    return (
        <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-4xl mx-auto">
            {/* Header */}
            <header className="text-center relative">
                <div className="flex justify-center mb-6">
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-brand-purple to-brand-cyan rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition" />
                        <div className="relative w-24 h-24 bg-background-mid border-2 border-white/10 rounded-[40px] flex items-center justify-center shadow-2xl">
                            <Mic className="w-12 h-12 text-brand-purple" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-cyan rounded-2xl flex items-center justify-center border-4 border-background-deep text-background-deep font-black text-xs">V3</div>
                    </div>
                </div>
                <h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-white via-brand-purple to-brand-cyan bg-clip-text text-transparent uppercase">Umbra Prompt</h1>
                <div className="flex items-center justify-center gap-2">
                    <span className="text-gray-500 font-bold text-xs uppercase tracking-[0.3em]">versão 3.0</span>
                    <span className="w-1 h-1 bg-gray-800 rounded-full" />
                    <span className="text-brand-purple font-bold text-[10px] uppercase tracking-widest">Groq + Mistral Large</span>
                </div>
                <button onClick={() => setShowConfig(!showConfig)} className={`absolute top-0 right-0 p-4 rounded-2xl border transition-all ${showConfig ? 'bg-brand-purple text-white border-brand-purple shadow-lg' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                    <Settings className={`w-5 h-5 ${showConfig ? 'rotate-90' : ''} transition-transform duration-500`} />
                </button>
            </header>

            {/* Config Panel */}
            {showConfig && (
                <div className="bg-background-mid border border-brand-purple/20 rounded-[32px] p-8 animate-in slide-in-from-top-4 duration-500 shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="flex items-center justify-between"><span className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-cyan tracking-widest"><Cpu className="w-3 h-3" /> Groq API Key</span><span className="text-[8px] text-gray-600 uppercase">Whisper v3</span></label>
                            <input type="password" value={groqKey} onChange={e => setGroqKey(e.target.value)} placeholder="gsk_..." className="w-full bg-background-deep border-2 border-white/5 rounded-xl p-4 text-xs font-mono text-gray-400 focus:border-brand-purple/50 outline-none transition-all" />
                            <button onClick={testGroq} className="w-full py-2 bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-brand-cyan/20 transition-all">Testar Conexão Groq</button>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between"><span className="flex items-center gap-2 text-[10px] font-black uppercase text-brand-purple tracking-widest"><Brain className="w-3 h-3" /> Mistral Key</span><span className="text-[8px] text-gray-600 uppercase">Mistral Large</span></label>
                            <input type="password" value={mistralKey} onChange={e => setMistralKey(e.target.value)} placeholder="mistral-..." className="w-full bg-background-deep border-2 border-white/5 rounded-xl p-4 text-xs font-mono text-gray-400 focus:border-brand-purple/50 outline-none transition-all" />
                            <button onClick={testMistral} className="w-full py-2 bg-brand-purple/10 text-brand-purple border border-brand-purple/20 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-brand-purple/20 transition-all">Testar Conexão Mistral</button>
                        </div>
                    </div>
                    <button onClick={saveKeys} className="mt-8 w-full py-4 bg-white text-background-deep font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-brand-purple hover:text-white transition-all shadow-xl active:scale-95">Salvar Configurações</button>
                </div>
            )}

            {/* Project Briefing Panel */}
            <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 mb-8 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                    <Sparkles className="w-5 h-5 text-brand-cyan" />
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Briefing do Projeto</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Narrative Mode */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-brand-purple tracking-widest flex items-center gap-2">
                            <Brain className="w-3 h-3" /> Modo de Narrativa
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setNarrativeMode('visual')}
                                className={`p-4 rounded-2xl border transition-all text-left group ${narrativeMode === 'visual' ? 'bg-brand-purple/20 border-brand-purple' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-2 rounded-lg ${narrativeMode === 'visual' ? 'bg-brand-purple text-white' : 'bg-white/5 text-gray-500'}`}>🎬</div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${narrativeMode === 'visual' ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>Visual</span>
                                </div>
                                <p className="text-[9px] text-gray-600 leading-tight">A imagem conta a história sozinha. Foco em ações.</p>
                            </button>
                            <button
                                onClick={() => setNarrativeMode('verbal')}
                                className={`p-4 rounded-2xl border transition-all text-left group ${narrativeMode === 'verbal' ? 'bg-brand-purple/20 border-brand-purple' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`p-2 rounded-lg ${narrativeMode === 'verbal' ? 'bg-brand-purple text-white' : 'bg-white/5 text-gray-500'}`}>🗣️</div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${narrativeMode === 'verbal' ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>Verbal</span>
                                </div>
                                <p className="text-[9px] text-gray-600 leading-tight">A palavra conduz a história. Imagem apoia.</p>
                            </button>
                        </div>
                    </div>

                    {/* Secondary Elements */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Duração Final
                                </label>
                                <input
                                    type="text"
                                    value={videoDuration}
                                    onChange={e => setVideoDuration(e.target.value)}
                                    placeholder="ex: 2:00"
                                    className="w-full bg-background-deep border border-white/5 rounded-xl p-3 text-xs font-bold text-white focus:border-brand-purple/50 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-brand-cyan" /> Personagens
                                </label>
                                <button
                                    onClick={() => setIncludeCharacters(!includeCharacters)}
                                    className={`w-full py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${includeCharacters ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                >
                                    {includeCharacters ? 'Com [1, 2, 3]' : 'Modo Texto'}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                <Play className="w-3 h-3" /> Abordagem Visual
                            </label>
                            <div className="flex gap-2">
                                {[
                                    { id: 'documentary', label: 'Documentário', icon: '🎥' },
                                    { id: 'motion', label: 'Motion Graphics', icon: '⚡' },
                                    { id: 'hybrid', label: 'Híbrido (Live + Motion)', icon: '🌓' }
                                ].map(app => (
                                    <button
                                        key={app.id}
                                        onClick={() => setVisualApproach(app.id as any)}
                                        className={`flex-1 py-3 px-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${visualApproach === app.id ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan shadow-lg shadow-brand-cyan/5' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                    >
                                        <span className="mr-1">{app.icon}</span> {app.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tool Logic Card */}
            <div className="bg-background-mid border border-white/5 rounded-[40px] p-1 shadow-2xl overflow-hidden backdrop-blur-xl">
                <div className="p-10 space-y-8">
                    <div onDragOver={e => e.preventDefault()} onDrop={handleFile} className={`relative border-2 border-dashed rounded-[32px] p-12 text-center transition-all group overflow-hidden ${audioFile ? 'border-brand-green/30 bg-brand-green/5' : 'border-white/10 hover:border-brand-purple/40 hover:bg-white/5'}`}>
                        <input type="file" accept="audio/*" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className="relative z-0 space-y-4">
                            <div className={`w-20 h-20 mx-auto rounded-[24px] flex items-center justify-center transition-transform group-hover:scale-110 ${audioFile ? 'bg-brand-green/20 text-brand-green' : 'bg-white/5 text-gray-600'}`}>
                                {audioFile ? <CheckCircle2 className="w-10 h-10" /> : <Upload className="w-10 h-10" />}
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">{audioFile ? audioFile.name : 'Arraste o áudio do roteiro'}</h3>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{audioFile ? `${fmtTs(duration)} · ${Math.ceil(duration / SEG_SEC)} Segmentos` : 'MP3 · WAV · M4A · OGG · WEBM'}</p>
                        </div>
                    </div>

                    {audioFile && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 p-4 bg-background-deep border border-white/5 rounded-2xl flex items-center gap-4">
                                    <Music className="w-5 h-5 text-brand-purple" />
                                    <audio ref={audioRef} src={URL.createObjectURL(audioFile)} controls className="flex-1 h-8 opacity-60" />
                                </div>
                                <button onClick={startProcess} disabled={isProcessing} className="px-10 py-5 bg-gradient-to-r from-brand-purple to-brand-cyan text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30">
                                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />} {isProcessing ? 'Processando' : 'Gerar Prompts'}
                                </button>
                            </div>

                            {isProcessing && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-brand-purple uppercase tracking-widest">Pipeline de Processamento</span>
                                            <h4 className="text-white text-xs font-bold uppercase">Segmento {currentStep + 1} de {Math.ceil(duration / SEG_SEC)}</h4>
                                        </div>
                                        <span className="text-2xl font-black text-white italic">{progress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-brand-purple to-brand-cyan transition-all duration-500 shadow-lg" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            )}

                            <div className="bg-background-deep border border-white/10 rounded-3xl overflow-hidden shadow-inner">
                                <div className="bg-white/5 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3"><Terminal className="w-3 h-3 text-gray-500" /><span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Console Output</span></div>
                                    <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-brand-pink/20" /><div className="w-2 h-2 rounded-full bg-brand-cyan/20" /><div className="w-2 h-2 rounded-full bg-brand-purple/20" /></div>
                                </div>
                                <div className="h-44 overflow-y-auto p-6 space-y-1.5 scrollbar-hide font-mono text-[9px]">
                                    {logs.map((log, i) => (
                                        <div key={i} className="flex gap-4 animate-in slide-in-from-left-2 duration-300">
                                            <span className="text-gray-700 font-bold shrink-0">[{log.time}]</span>
                                            <span className={`leading-relaxed ${log.type === 'error' ? 'text-brand-pink' : log.type === 'success' ? 'text-brand-green' : log.type === 'blue' ? 'text-brand-cyan' : log.type === 'purple' ? 'text-brand-purple' : 'text-gray-500'}`}>{log.msg}</span>
                                        </div>
                                    ))}
                                    <div ref={logEndRef} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3"><Sparkles className="w-6 h-6 text-brand-cyan" /> Feed Veo 3</h2>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={prompts.length === 0}
                            onClick={copyAllPrompts}
                            className="px-4 py-2 bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-cyan/20 transition-all disabled:opacity-20 flex items-center gap-2"
                        >
                            <Copy className="w-3.5 h-3.5" /> Copiar Todos
                        </button>
                        <button
                            disabled={prompts.length === 0}
                            onClick={() => setPrompts([])}
                            className="px-4 py-2 bg-brand-pink/10 text-brand-pink border border-brand-pink/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-pink/20 transition-all disabled:opacity-20 flex items-center gap-2"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Limpar
                        </button>
                    </div>
                </div>
                {prompts.length === 0 ? (
                    <div className="bg-background-mid/50 border border-white/5 rounded-[40px] py-24 text-center opacity-30 select-none">
                        <Sparkles className="w-12 h-12 mx-auto text-gray-700 mb-6" />
                        <h4 className="text-white font-black uppercase tracking-widest text-sm">Aguardando Input</h4>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {prompts.slice().reverse().map(p => (
                            <div key={p.id} className="group relative bg-background-mid border border-white/5 rounded-[32px] overflow-hidden transition-all duration-500 hover:border-brand-purple/30 shadow-xl">
                                <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors duration-500 ${p.status === 'done' ? 'bg-brand-green' : p.status === 'error' ? 'bg-brand-pink' : 'bg-brand-purple animate-pulse'}`} />
                                <div className="p-8">
                                    <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-10 h-10 bg-background-deep rounded-xl flex items-center justify-center border border-white/5 text-brand-purple font-black italic text-xs">#{String(p.id).padStart(2, '0')}</div>
                                            <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${p.status === 'done' ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' : 'bg-brand-purple/10 border-brand-purple/32 text-brand-purple animate-pulse'}`}>
                                                {p.status === 'done' ? 'Prompt Finalizado' : 'Processando...'}
                                            </div>
                                        </div>
                                        <button onClick={() => copyPrompt(p.prompt)} disabled={p.status !== 'done'} className="px-6 py-3 bg-white/5 hover:bg-brand-purple hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-20 flex items-center gap-2"><Copy className="w-3.5 h-3.5" /> Copiar</button>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="p-5 bg-background-deep/40 rounded-2xl border border-white/5">
                                            <span className="text-[8px] font-black text-brand-purple uppercase tracking-[0.2em] mb-2 block">Transcrição (Groq)</span>
                                            <p className={`text-xs font-bold italic leading-relaxed ${p.transcript ? 'text-gray-400' : 'text-gray-700 animate-pulse'}`}>{p.transcript || 'Aguardando...'}</p>
                                        </div>
                                        <div className={`p-6 bg-background-deep rounded-2xl border transition-all duration-500 ${p.status === 'done' ? 'border-brand-purple/20 bg-brand-purple/5' : 'border-white/5'}`}>
                                            {p.status === 'done' ? <p className="text-[11px] font-medium text-white leading-relaxed select-all">{p.prompt}</p> :
                                                p.status === 'error' ? <div className="text-brand-pink font-bold text-[10px] uppercase flex items-center gap-3"><AlertCircle className="w-4 h-4 shrink-0" /> {p.error}</div> :
                                                    <div className="flex items-center gap-3 text-gray-700 font-black text-[9px] uppercase tracking-widest"><RefreshCw className="w-4 h-4 animate-spin" /> Gerando com Mistral...</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-background-mid border border-white/10 rounded-[40px] p-8 flex items-center gap-6 opacity-60">
                <Info className="w-10 h-10 text-brand-cyan shrink-0" />
                <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed">O Umbra Prompt v3.0 garante conformidade total com as regras do Veo 3, evitando falhas de áudio e gerando cenas cinematográficas de alta fidelidade.</p>
            </div>
        </div>
    );
};

export default UmbraPromptTool;
