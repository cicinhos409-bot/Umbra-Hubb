
import React, { useState, useEffect, useRef } from 'react';
import { Send, Download, Trash2, Key, Bot, User, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'mp_api_key_mistral';
const CHAT_HISTORY_KEY = 'umbra_persona_chat_history';

const SYSTEM_PROMPT = `Você é um Mestre especializado em criação de personagens para Inteligência Artificial — um verdadeiro grimório vivo de criação.

Seu objetivo é ajudar o usuário a criar personagens ricos, detalhados e prontos para uso em ferramentas de IA de imagem e vídeo (Midjourney, DALL-E, Stable Diffusion, Sora, Kling, Seedance, etc.) ou para escrita criativa, RPG e jogos.

PARA CADA PERSONAGEM, ENTREGUE:

1. **FICHA DO PERSONAGEM** — Identidade completa (nome, origem, idade aparente, raça/espécie)
2. **APARÊNCIA VISUAL** — Descrição ultradetalhada: traços faciais, cor de olhos, cabelo, corpo, cicatrizes, marcas, expressão padrão
3. **VESTUÁRIO & ACESSÓRIOS** — Roupas, armaduras, adornos, armas, cor predominante da paleta
4. **PERSONALIDADE** — 3-5 traços marcantes, motivações, medos, segredos
5. **PROMPT PARA IA** — Um prompt pronto e otimizado para a ferramenta mencionada (ou geral se não especificado), em inglês, encapsulado claramente

REGRAS:
- Seja cinematográfico e evocativo nas descrições
- Os prompts de IA devem ser em inglês, detalhados, com termos técnicos como "cinematic lighting", "8k", "detailed", "photorealistic" ou equivalentes ao estilo pedido
- Adapte o estilo ao universo do personagem (fantasy, sci-fi, anime, realista, etc.)
- Se o usuário pedir iterações (mudar algo), refine mantendo o contexto
- Mantenha o tom épico e profissional de um narrador de RPG
- Responda sempre em português, exceto o prompt de IA que deve ser em inglês`;

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

const UmbraPersonaChat: React.FC = () => {
    const [apiKey, setApiKey] = useState<string>(localStorage.getItem(STORAGE_KEY) || '');
    const [showApiModal, setShowApiModal] = useState<boolean>(!apiKey);
    const [input, setInput] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [toast, setToast] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
        if (savedHistory) {
            setMessages(JSON.parse(savedHistory));
        } else {
            setMessages([]);
        }
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        }
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const showToastMessage = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const saveApiKey = (key: string) => {
        if (!key.trim()) return;
        localStorage.setItem(STORAGE_KEY, key.trim());
        setApiKey(key.trim());
        setShowApiModal(false);
        showToastMessage('✦ Grimório ativado com sucesso!');
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;
        if (!apiKey) {
            setShowApiModal(true);
            return;
        }

        const userMessage: Message = { role: 'user', content: input.trim() };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'mistral-large-latest',
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        ...newMessages.map(m => ({ role: m.role, content: m.content }))
                    ],
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || `Erro ${response.status}`);
            }

            const data = await response.json();
            const aiContent = data.choices[0].message.content;

            setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
        } catch (err: any) {
            showToastMessage(`⚠️ Erro: ${err.message}`);
            if (err.message.includes('401') || err.message.includes('invalid')) {
                setApiKey('');
                localStorage.removeItem(STORAGE_KEY);
                setShowApiModal(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        if (window.confirm('Deseja limpar todo o histórico desta sessão?')) {
            setMessages([]);
            localStorage.removeItem(CHAT_HISTORY_KEY);
            showToastMessage('✦ Histórico limpo');
        }
    };

    const downloadChat = () => {
        if (messages.length === 0) {
            showToastMessage('⚠ Nenhuma conversa para baixar');
            return;
        }

        let content = `GRIMÓRIO DE PERSONAGENS — HISTÓRICO DE CRIAÇÃO\n`;
        content += `Data: ${new Date().toLocaleString('pt-BR')}\n`;
        content += `${'═'.repeat(60)}\n\n`;

        messages.forEach(msg => {
            const role = msg.role === 'user' ? '◈ VOCÊ' : '✦ MESTRE';
            content += `${role}\n${msg.content}\n\n${'─'.repeat(40)}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `personagens_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToastMessage('✦ Histórico salvo!');
    };

    const formatMessage = (text: string) => {
        // Simple markdown-like formatting for the UI
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^\- (.*$)/gim, '<li>$1</li>');

        // Handle code blocks for prompts
        formatted = formatted.replace(/```([\s\S]*?)```/g, (match, p1) => {
            // Note: in a real React environment, you'd use a markdown library or dangerouslySetInnerHTML carefully
            return `<div class="prompt-box bg-black/40 border-l-4 border-brand-cyan p-4 my-4 font-mono text-sm relative group">
                <button class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-cyan/20 hover:bg-brand-cyan/40 text-brand-cyan px-2 py-1 rounded text-[10px]" onclick="navigator.clipboard.writeText(\`${p1.trim()}\`);">COPIAR</button>
                <div class="text-brand-cyan/60 text-[10px] uppercase mb-2">Prompt Gerado</div>
                ${p1.trim()}
           </div>`;
        });

        return formatted.split('\n').map((line, i) => <p key={i} dangerouslySetInnerHTML={{ __html: line }} />);
    };

    const quickPrompts = [
        { label: '⚔️ Guerreiro Élfico', text: 'Crie um guerreiro élfico, estilo fantasia dark, para Midjourney' },
        { label: '🧛 Vampira Gótica', text: 'Crie uma vampira elegante, estilo gótico vitoriano, para Stable Diffusion' },
        { label: '🧙 Mago Ancião', text: 'Crie um mago ancião misterioso, estilo Pixar 3D' },
        { label: '🤖 Android Cyberpunk', text: 'Crie um android futurista, cyberpunk, para vídeos Kling' },
        { label: '⛩️ Samurai Anime', text: 'Crie uma guerreira samurai feminina, estilo anime, para Sora' },
        { label: '🦹 Vilão Carismático', text: 'Crie um vilão carismático, estilo DC Comics, visual impressionante' },
    ];

    return (
        <div className="min-h-[calc(100vh-160px)] font-rajdhani text-white flex flex-col relative overflow-hidden rounded-[40px] bg-background-mid border border-white/5">
            {/* Styles for specific elements like prompt boxes */}
            <style>{`
                .prompt-box strong { color: #00f5ff; }
                h3 { font-size: 1.1rem; font-weight: 800; color: #a855f7; margin-top: 1rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 1px; }
                li { list-style-type: none; padding-left: 1rem; position: relative; }
                li::before { content: '✦'; position: absolute; left: 0; color: #00f5ff; font-size: 0.8rem; }
            `}</style>

            {/* Header */}
            <header className="flex items-center justify-between p-6 border-b border-white/5 bg-black/20 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border-2 border-brand-purple/50 rounded-full flex items-center justify-center bg-brand-purple/10 text-brand-purple animate-pulse">
                        ✦
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-widest text-brand-cyan uppercase">Umbra Persona</h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Criador de Personagens · Powered by Mistral AI</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={downloadChat} className="p-2.5 bg-white/5 rounded-xl hover:text-brand-cyan transition-all" title="Baixar Histórico">
                        <Download className="w-5 h-5" />
                    </button>
                    <button onClick={clearChat} className="p-2.5 bg-white/5 rounded-xl hover:text-brand-pink transition-all" title="Limpar Chat">
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => setShowApiModal(true)} className="p-2.5 bg-white/5 rounded-xl hover:text-brand-purple transition-all" title="Configurar API">
                        <Key className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-40">
                        <Bot className="w-20 h-20 text-brand-purple" />
                        <div className="max-w-md">
                            <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter">O Mestre aguarda...</h2>
                            <p className="text-sm font-medium">Inicie uma conversa para despertar o Grimório de Personagens. Descreva sua visão e eu darei vida a ela.</p>
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple' : 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan'}`}>
                            {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>
                        <div className={`max-w-[80%] p-5 rounded-[24px] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-brand-purple/10 border border-brand-purple/20 text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none'}`}>
                            {msg.role === 'assistant' ? (
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-cyan mb-3 block">Mestre de Criação</div>
                                    {formatMessage(msg.content)}
                                </div>
                            ) : (
                                msg.content
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-4 animate-pulse">
                        <div className="w-10 h-10 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="max-w-[80%] p-5 rounded-[24px] bg-white/5 border border-white/10 rounded-tl-none">
                            <div className="flex gap-2">
                                <span className="w-2 h-2 bg-brand-cyan rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-brand-cyan rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-2 h-2 bg-brand-cyan rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar border-t border-white/5 bg-black/10">
                {quickPrompts.map((p, i) => (
                    <button key={i} onClick={() => setInput(p.text)} className="whitespace-nowrap px-4 py-2 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold text-gray-500 hover:text-brand-cyan hover:border-brand-cyan/30 transition-all uppercase tracking-widest">
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-black/20 border-t border-white/5">
                <div className="relative flex items-center gap-4">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        placeholder="Descreva o personagem que deseja criar..."
                        className="w-full bg-background-deep border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:border-brand-purple transition-all resize-none pr-16 min-h-[56px] custom-scrollbar"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 p-3 bg-brand-purple text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-center text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-4">
                    Enter para enviar · Shift+Enter para nova linha
                </p>
            </div>

            {/* API Modal */}
            {showApiModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-background-deep/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-background-mid border border-brand-purple/30 rounded-[32px] p-8 shadow-2xl relative">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-brand-purple mx-auto mb-6 shadow-xl">
                                <Key className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Acesso ao Grimório</h2>
                            <p className="text-sm text-gray-500 font-medium">Insira sua chave da API Mistral para ativar o Mestre de Criação de Personagens.</p>

                            <div className="space-y-4 pt-4">
                                <input
                                    type="password"
                                    placeholder="Sua Mistral API Key..."
                                    className="w-full bg-background-deep border border-white/10 rounded-xl px-5 py-4 text-sm font-bold outline-none focus:border-brand-cyan transition-all"
                                    defaultValue={apiKey}
                                    onBlur={(e) => saveApiKey(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    onClick={() => {
                                        const input = document.querySelector('input[type="password"]') as HTMLInputElement;
                                        saveApiKey(input.value);
                                    }}
                                    className="w-full py-4 bg-brand-purple text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-brand-purple/20 hover:scale-[1.02] active:scale-98 transition-all"
                                >
                                    ✦ Ativar Grimório
                                </button>
                                <a href="https://console.mistral.ai/" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-gray-600 hover:text-brand-cyan uppercase tracking-widest block transition-colors mt-2">
                                    Não tem uma chave? Obtenha aqui
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-brand-cyan text-background-deep rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-brand-cyan/20 animate-in slide-in-from-bottom-4 duration-300">
                    {toast}
                </div>
            )}
        </div>
    );
};

export default UmbraPersonaChat;
