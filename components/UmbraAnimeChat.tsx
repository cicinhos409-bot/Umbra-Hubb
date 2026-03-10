
import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Key, ImageIcon, Download, Plus, ChevronRight, X, Menu } from 'lucide-react';

const STORAGE_KEY = 'mp_api_key_mistral';
const CHAT_HISTORY_ANIME_v3_KEY = 'umbra_anime_chat_v3_library';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: any;
}

interface Character {
    id: string;
    name: string;
    description: string;
    genres: string[];
    history: Message[];
    lastUpdated: number;
    phase: 'investigation' | 'generation';
}

const GENRES = [
    'Ação', 'Artes Marciais', 'Aventura', 'Comédia', 'Demônios', 'Drama',
    'Ecchi', 'Escolar', 'Esporte', 'Fantasia', 'Ficção científica', 'Harém',
    'Histórico', 'Horror', 'Jogo', 'Light Novel', 'Magia', 'Mecha', 'Militar',
    'Mistério', 'Musical', 'Romance', 'Samurai', 'Seinen', 'Shoujo', 'Shounen',
    'Slice Of Life', 'Sobrenatural', 'Super Poderes', 'Suspense', 'Terror',
    'Yaoi', 'Yuri'
];

const SYSTEM_PROMPT_v3 = (genres: string[]) => `Você é um agente especialista em criação de personagens de anime e mangá. Você trabalha em DUAS FASES obrigatórias.

${genres.length > 0 ? `\nGÊNEROS: ${genres.join(', ')}\n` : ''}

FASE 1 — INVESTIGAÇÃO
- Analise descrições e imagens.
- Peça que escolham um ESTILO (1-12 do seu conhecimento).
- Confirme Físico, Vestimenta, Armas, Pose, Clima.
- SÓ mude para Fase 2 quando o usuário der OK.

FASE 2 — GERAÇÃO
Entregue:
1. Prompt Narrativo (Em Português)
2. Anatomia do Prompt
3. PROMPTS TÉCNICOS (EM INGLÊS!) para:
   - Midjourney (com pesos ::)
   - Flux / SDXL (descritivo)
   - Negative Prompt

IMPORTANTE: Prompts de imagem DEVEM estar em blocos de código e EM INGLÊS.`;

const UmbraAnimeChat: React.FC = () => {
    const [apiKey, setApiKey] = useState<string>(localStorage.getItem(STORAGE_KEY) || '');
    const [showApiModal, setShowApiModal] = useState<boolean>(!apiKey);
    const [input, setInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [toast, setToast] = useState<string | null>(null);

    // Character Library State
    const [characters, setCharacters] = useState<Character[]>([]);
    const [activeCharId, setActiveCharId] = useState<string | null>(null);
    const [showLibrary, setShowLibrary] = useState(false);

    // Genre Selection
    const [showGenreScreen, setShowGenreScreen] = useState(false);
    const [tempGenres, setTempGenres] = useState<string[]>([]);

    // Multi-Image State
    const [attachedImages, setAttachedImages] = useState<{ base64: string, mime: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        const saved = localStorage.getItem(CHAT_HISTORY_ANIME_v3_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setCharacters(parsed);
                if (parsed.length > 0) setActiveCharId(parsed[0].id);
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }

        // Listener for copy button toasts
        const handleUmbraToast = (e: any) => showToastMessage(e.detail);
        window.addEventListener('umbra-toast', handleUmbraToast);
        return () => window.removeEventListener('umbra-toast', handleUmbraToast);
    }, []);

    // Save on update
    useEffect(() => {
        if (characters.length > 0) {
            localStorage.setItem(CHAT_HISTORY_ANIME_v3_KEY, JSON.stringify(characters));
        }
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [characters]);

    const activeChar = characters.find(c => c.id === activeCharId);

    const showToastMessage = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const createNewCharacter = (genres: string[]) => {
        const newChar: Character = {
            id: Date.now().toString(),
            name: 'Novo Personagem',
            description: '',
            genres: genres,
            history: [],
            lastUpdated: Date.now(),
            phase: 'investigation'
        };
        setCharacters([newChar, ...characters]);
        setActiveCharId(newChar.id);
        setShowGenreScreen(false);
        setTempGenres([]);
        showToastMessage('✦ Nova forja iniciada!');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach((file: File) => {
            if (attachedImages.length >= 3) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = (event.target?.result as string).split(',')[1];
                setAttachedImages(prev => [...prev, { base64, mime: file.type }]);
            };
            reader.readAsDataURL(file);
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        setAttachedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async (textOverride?: string) => {
        const textToSend = textOverride || input.trim();
        if ((!textToSend && attachedImages.length === 0) || isLoading) return;
        if (!apiKey) {
            setShowApiModal(true);
            return;
        }

        let charToUpdate = activeChar;
        if (!charToUpdate) {
            // Create a default if none active
            const newChar: Character = {
                id: Date.now().toString(),
                name: textToSend.slice(0, 20) || 'Personagem s/ nome',
                description: textToSend,
                genres: [],
                history: [],
                lastUpdated: Date.now(),
                phase: 'investigation'
            };
            setCharacters([newChar, ...characters]);
            setActiveCharId(newChar.id);
            charToUpdate = newChar;
        }

        const userMessageContent: any = attachedImages.length > 0
            ? [
                ...attachedImages.map(img => ({
                    type: 'image_url',
                    image_url: { url: `data:${img.mime};base64,${img.base64}` }
                })),
                { type: 'text', text: textToSend || 'Analise estas referências.' }
            ]
            : textToSend;

        const userMessage: Message = { role: 'user', content: userMessageContent };
        const updatedHistory = [...charToUpdate.history, userMessage];

        // Optimistic update
        setCharacters(prev => prev.map(c => c.id === charToUpdate?.id ? { ...c, history: updatedHistory, lastUpdated: Date.now() } : c));

        setInput('');
        setAttachedImages([]);
        setIsLoading(true);

        try {
            const isVision = attachedImages.length > 0 || charToUpdate.history.some(m => Array.isArray(m.content));

            const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: isVision ? 'pixtral-large-latest' : 'mistral-large-latest',
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT_v3(charToUpdate.genres) },
                        ...updatedHistory.map(m => ({
                            role: m.role,
                            content: m.content
                        }))
                    ],
                    max_tokens: 2500,
                    temperature: 0.7
                })
            });

            if (!response.ok) throw new Error(`Mistral Error: ${response.status}`);

            const data = await response.json();
            const aiContent = data.choices?.[0]?.message?.content;

            if (aiContent) {
                const aiMessage: Message = { role: 'assistant', content: aiContent };
                const isPhase2 = aiContent.includes('FASE 2') || aiContent.includes('GERAÇÃO');

                setCharacters(prev => prev.map(c => c.id === charToUpdate?.id ? {
                    ...c,
                    history: [...updatedHistory, aiMessage],
                    phase: isPhase2 ? 'generation' : 'investigation',
                    lastUpdated: Date.now()
                } : c));
            }
        } catch (err: any) {
            showToastMessage(`⚠️ Erro: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadChat = () => {
        if (!activeChar) return;
        const text = activeChar.history.map(m => {
            const content = typeof m.content === 'string' ? m.content : '[ Conteúdo Visual ]';
            return `${m.role.toUpperCase()}: ${content}`;
        }).join('\n\n---\n\n');

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `umbra_anime_${activeChar.name.replace(/\s+/g, '_')}.txt`;
        a.click();
        showToastMessage('✦ Arquivo pronto para download');
    };

    const renderFormattedMessage = (content: any) => {
        if (Array.isArray(content)) {
            const textPart = content.find(p => p.type === 'text')?.text || '';
            const images = content.filter(p => p.type === 'image_url');
            return (
                <div className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                        {images.map((img, i) => (
                            <img key={i} src={typeof img.image_url === 'string' ? img.image_url : img.image_url.url} alt="Reference" className="w-24 h-24 object-cover rounded-lg border border-white/10" />
                        ))}
                    </div>
                    <div>{textPart}</div>
                </div>
            );
        }

        const text = String(content);
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#00e5ff]">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="text-[#6666aa] italic">$1</em>');

        // Enhanced prompt boxes
        formatted = formatted.replace(/```([\s\S]*?)```/g, (match, p1) => {
            const isEnglish = /[a-zA-Z]/.test(p1) && !p1.includes(' ') || p1.split(' ').length > 5;
            const escapedPrompt = p1.trim().replace(/'/g, "\\'").replace(/`/g, "\\`").replace(/\n/g, "\\n");
            return `<div class="bg-[#04040c] border border-[#00e5ff]/30 rounded-xl p-4 my-4 font-mono text-xs relative group overflow-x-auto">
                <div class="absolute -top-2.5 left-3 bg-[#04040c] px-2 text-[9px] tracking-[3px] text-[#00e5ff] font-bold uppercase transition-all group-hover:text-white">
                    ${isEnglish ? 'Technical Prompt (EN)' : 'Engine Data'}
                </div>
                <button class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/30 px-2 py-1 rounded text-[9px]" onclick="navigator.clipboard.writeText('${escapedPrompt}'); window.dispatchEvent(new CustomEvent('umbra-toast', {detail: 'Copiado!'}));">COPIAR</button>
                <div class="text-[#aaddff] leading-relaxed whitespace-pre-wrap">${p1.trim()}</div>
            </div>`;
        });

        return <div dangerouslySetInnerHTML={{ __html: formatted }} className="whitespace-pre-wrap leading-relaxed" />;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-[#07070f] text-[#e4e4f0] font-syne relative overflow-hidden rounded-[40px] border border-[#1e1e3a] shadow-2xl">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] left-[80%] w-[40%] h-[40%] rounded-full bg-[#7c6dfa]/5 blur-[120px]" />
                <div className="absolute bottom-[20%] right-[70%] w-[50%] h-[50%] rounded-full bg-[#c44dff]/5 blur-[120px]" />
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
                .font-syne { font-family: 'Syne', sans-serif; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e1e3a; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #7c6dfa; }
            `}</style>

            {/* Header */}
            <header className="relative z-20 flex items-center justify-between p-5 border-b border-[#1e1e3a] bg-[#0f0f1e]/60 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowLibrary(!showLibrary)} className="p-2 border border-[#1e1e3a] rounded-xl hover:bg-[#1e1e3a] transition-all relative">
                        <Menu className="w-5 h-5 text-[#6666aa]" />
                        {characters.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#7c6dfa] rounded-full text-[8px] flex items-center justify-center font-bold">{characters.length}</span>}
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-extrabold uppercase tracking-tight">Anime Forge <span className="text-[#00e5ff] ml-1 text-xs">v3</span></h1>
                            {activeChar?.phase === 'generation' && (
                                <span className="bg-[#00ffaa]/10 text-[#00ffaa] border border-[#00ffaa]/30 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">Phase 2</span>
                            )}
                        </div>
                        <span className="text-[10px] text-[#6666aa] font-medium tracking-widest uppercase">
                            {activeChar?.name || 'Iniciando forja...'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={downloadChat} className="p-2.5 bg-[#141428] border border-[#1e1e3a] rounded-xl text-[#6666aa] hover:text-[#7c6dfa] hover:bg-[#7c6dfa]/5 transition-all" title="Exportar Character Data">
                        <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => setShowGenreScreen(true)} className="p-2.5 bg-[#7c6dfa] shadow-[0_0_15px_rgba(124,109,250,0.3)] border border-[#7c6dfa]/40 rounded-xl text-white hover:scale-105 transition-all">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative z-10">
                {/* Library Sidebar (Mobile Drawer / Desktop Inline) */}
                <div className={`absolute md:relative z-30 h-full w-[280px] bg-[#0c0c18] border-r border-[#1e1e3a] transition-all duration-300 transform ${showLibrary ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-5 border-b border-[#1e1e3a] flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#6666aa]">Grimório de Elenco</h3>
                        <button onClick={() => setShowLibrary(false)} className="md:hidden p-1 text-[#6666aa] hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-2">
                        {characters.length === 0 ? (
                            <div className="p-10 text-center space-y-3">
                                <div className="text-2xl opacity-20">📖</div>
                                <p className="text-[10px] text-[#333355] uppercase font-bold">Nenhum registro encontrado</p>
                            </div>
                        ) : (
                            characters.map(char => (
                                <button
                                    key={char.id}
                                    onClick={() => { setActiveCharId(char.id); setShowLibrary(false); }}
                                    className={`w-full group text-left p-4 rounded-2xl border transition-all relative overflow-hidden ${activeCharId === char.id ? 'bg-[#7c6dfa]/10 border-[#7c6dfa]/40 text-white' : 'bg-[#141428]/40 border-[#1e1e3a] text-[#6666aa] hover:border-[#7c6dfa]/30 hover:bg-[#141428]'}`}
                                >
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${activeCharId === char.id ? 'bg-[#7c6dfa] shadow-lg shadow-[#7c6dfa]/20' : 'bg-[#1e1e3a]'}`}>{char.name.charAt(0)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-xs truncate">{char.name}</div>
                                            <div className="text-[9px] opacity-60 font-mono mt-1">{new Date(char.lastUpdated).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    {activeCharId === char.id && <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#7c6dfa]/5 pointer-events-none" />}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); if (window.confirm('Excluir personagem?')) setCharacters(prev => prev.filter(c => c.id !== char.id)); }}
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 transition-all"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Chat Content */}
                <div className="flex-1 flex flex-col relative">
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        {!activeChar || activeChar.history.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-8 animate-in fade-in zoom-in duration-700">
                                <div className="relative">
                                    <div className="text-7xl drop-shadow-[0_0_30px_rgba(124,109,250,0.6)] animate-pulse">🎭</div>
                                    <div className="absolute -bottom-2 -right-2 bg-[#7c6dfa] p-2 rounded-full border-4 border-[#07070f]">
                                        <Plus className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">Qual alma vamos forjar hoje?</h2>
                                    <p className="text-[#6666aa] text-sm leading-relaxed mb-8">Descreva seu personagem de anime com todos os detalhes que imaginar. O agente Mistral v3 guiará você desde a investigação até os prompts técnicos otimizados em inglês.</p>

                                    <div className="grid grid-cols-1 gap-2 w-full">
                                        {[
                                            "Um Shinigami renegado com uma foice de vidro obsidiana...",
                                            "Guerreira Cyberpunk de Neo-Tokyo, braços robóticos dourados...",
                                            "Mago das Sombras estilo anos 90, manto azul e chapéu de bico..."
                                        ].map((ex, i) => (
                                            <button key={i} onClick={() => handleSendMessage(ex)} className="p-4 bg-[#141428]/40 border border-[#1e1e3a] rounded-2xl text-xs text-[#6666aa] hover:text-[#e4e4f0] hover:border-[#7c6dfa] hover:bg-[#7c6dfa]/5 transition-all text-left flex items-center gap-3">
                                                <ChevronRight className="w-3 h-3 text-[#7c6dfa]" /> {ex}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            activeChar.history.map((msg, idx) => (
                                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-400`}>
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${msg.role === 'user' ? 'bg-[#00e5ff]/10 border-[#00e5ff]/20 text-[#00e5ff]' : 'bg-[#7c6dfa]/10 border-[#7c6dfa]/30 text-[#7c6dfa]'}`}>
                                        {msg.role === 'user' ? 'U' : 'A'}
                                    </div>
                                    <div className={`max-w-[85%] p-5 rounded-3xl text-[14px] shadow-sm ${msg.role === 'user' ? 'bg-[#1e1e3a]/40 border border-white/5 rounded-tr-none' : 'bg-[#141428] border border-[#1e1e3a] rounded-tl-none'}`}>
                                        {renderFormattedMessage(msg.content)}
                                    </div>
                                </div>
                            ))
                        )}
                        {isLoading && (
                            <div className="flex gap-4 animate-pulse">
                                <div className="w-10 h-10 rounded-2xl bg-[#1e1e3a] border border-[#1e1e3a] flex items-center justify-center text-[#7c6dfa]">⚡</div>
                                <div className="p-5 rounded-3xl bg-[#141428] border border-[#1e1e3a] rounded-tl-none">
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 bg-[#7c6dfa] rounded-full animate-bounce [animation-duration:1s]"></div>
                                        <div className="w-2 h-2 bg-[#7c6dfa] rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.2s]"></div>
                                        <div className="w-2 h-2 bg-[#7c6dfa] rounded-full animate-bounce [animation-duration:1s] [animation-delay:0.4s]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-6 border-t border-[#1e1e3a] bg-[#07070f]/80 backdrop-blur-md">
                        {attachedImages.length > 0 && (
                            <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                                {attachedImages.map((img, i) => (
                                    <div key={i} className="relative w-16 h-16 shrink-0 group">
                                        <img src={`data:${img.mime};base64,${img.base64}`} className="w-full h-full object-cover rounded-xl border border-[#7c6dfa]/40" alt="Reference" />
                                        <button onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {attachedImages.length < 3 && (
                                    <button onClick={() => fileInputRef.current?.click()} className="w-16 h-16 rounded-xl border-2 border-dashed border-[#1e1e3a] flex items-center justify-center text-[#6666aa] hover:border-[#7c6dfa] hover:text-[#7c6dfa] transition-all">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="relative flex items-end gap-3 bg-[#111122]/80 border border-[#1e1e3a] rounded-3xl p-3 focus-within:border-[#7c6dfa] transition-all shadow-xl">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-3 rounded-2xl transition-all ${attachedImages.length > 0 ? 'bg-[#7c6dfa]/20 text-[#7c6dfa]' : 'text-[#6666aa] hover:text-white hover:bg-white/5'}`}
                                title="Anexar referências visuais (Máx 3)"
                            >
                                <ImageIcon className="w-5 h-5" />
                            </button>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                placeholder="Descreva seu personagem ou peça uma parte específica..."
                                className="flex-1 bg-transparent border-none text-[15px] px-2 py-2.5 outline-none resize-none min-h-[48px] max-h-[180px] custom-scrollbar text-[#e4e4f0] placeholder:text-[#333355]"
                            />
                            <button
                                onClick={() => handleSendMessage()}
                                disabled={(!input.trim() && attachedImages.length === 0) || isLoading}
                                className="w-12 h-12 bg-gradient-to-br from-[#7c6dfa] to-[#c44dff] text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-[0_4px_15px_rgba(124,109,250,0.4)] shrink-0"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <p className="text-[10px] text-[#333355] font-mono uppercase tracking-[0.2em]">Enter para enviar · Shift+Enter nova linha</p>
                            <div className="flex gap-4 text-[9px] text-[#333355] font-black uppercase tracking-widest">
                                <span>Midjourney</span>
                                <span>Flux</span>
                                <span>SDXL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Genre Screen Modal */}
            {showGenreScreen && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center p-8 bg-[#07070f] animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl flex-1 flex flex-col py-10 overflow-hidden">
                        <div className="text-center space-y-3 mb-10">
                            <div className="text-5xl mb-4 grayscale hover:grayscale-0 transition-all cursor-default scale-110">🗡️</div>
                            <h2 className="text-3xl font-black bg-gradient-to-r from-[#7c6dfa] to-[#00e5ff] bg-clip-text text-transparent uppercase tracking-tight">Vibe & Gênero</h2>
                            <p className="text-[#6666aa] text-sm">Selecione os gêneros que definem a atmosfera do seu anime.</p>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
                            <div className="flex flex-wrap gap-2 justify-center pb-10">
                                {GENRES.map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setTempGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                                        className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border ${tempGenres.includes(g) ? 'bg-[#7c6dfa] border-[#7c6dfa] text-white shadow-lg shadow-[#7c6dfa]/30' : 'bg-[#141428] border-[#1e1e3a] text-[#6666aa] hover:border-[#7c6dfa]/50 hover:text-white'}`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-8 border-t border-[#1e1e3a] flex gap-4 w-full justify-center">
                            <button onClick={() => createNewCharacter([])} className="px-8 py-4 border border-[#1e1e3a] text-[#6666aa] rounded-2xl text-xs font-black uppercase hover:text-white transition-all">Pular</button>
                            <button onClick={() => createNewCharacter(tempGenres)} className="px-10 py-4 bg-[#7c6dfa] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#7c6dfa]/30 hover:scale-105 active:scale-95 transition-all">Iniciar Forja →</button>
                        </div>
                    </div>
                </div>
            )}

            {/* API Key Modal */}
            {showApiModal && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-[#07070f]/95 backdrop-blur-xl">
                    <div className="w-full max-w-sm flex flex-col items-center gap-8">
                        <div className="relative">
                            <div className="text-7xl drop-shadow-[0_0_30px_rgba(124,109,250,0.8)] animate-bounce [animation-duration:3s]">⚔️</div>
                            <div className="absolute -inset-4 bg-[#7c6dfa]/20 blur-2xl rounded-full -z-10"></div>
                        </div>
                        <div className="text-center space-y-3">
                            <h2 className="text-3xl font-black bg-gradient-to-br from-[#7c6dfa] to-[#c44dff] bg-clip-text text-transparent uppercase tracking-tighter">Primeira Conexão</h2>
                            <p className="text-[#6666aa] text-sm leading-relaxed">Conecte sua Mistral API Key para despertar o Anime Forge v3. Seus dados morrem no seu navegador.</p>
                        </div>

                        <div className="w-full space-y-4">
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333355]" />
                                <input
                                    type="password"
                                    placeholder="Sk-..."
                                    className="w-full bg-[#111122] border border-[#1e1e3a] focus:border-[#7c6dfa] rounded-2xl px-12 py-5 text-xs font-mono outline-none transition-all placeholder:text-[#333355]"
                                    defaultValue={apiKey}
                                    id="apiInput"
                                    onKeyDown={(e) => { if (e.key === 'Enter') { const k = (e.currentTarget as HTMLInputElement).value; localStorage.setItem(STORAGE_KEY, k); setApiKey(k); setShowApiModal(false); } }}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const val = (document.getElementById('apiInput') as HTMLInputElement).value;
                                    localStorage.setItem(STORAGE_KEY, val);
                                    setApiKey(val);
                                    setShowApiModal(false);
                                    showToastMessage('✦ Forja conectada!');
                                }}
                                className="w-full py-5 bg-gradient-to-r from-[#7c6dfa] to-[#c44dff] text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-[#7c6dfa]/30 hover:translate-y-[-2px] active:translate-y-[0px] transition-all"
                            >
                                Ingressar na Forja →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-28 right-8 z-[250] px-6 py-3 bg-[#0f0f1e]/90 backdrop-blur-md border border-[#7c6dfa]/40 text-[#7c6dfa] rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl animate-in slide-in-from-right-10 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-[#7c6dfa] rounded-full animate-pulse"></div>
                    {toast}
                </div>
            )}
        </div>
    );
};

export default UmbraAnimeChat;
