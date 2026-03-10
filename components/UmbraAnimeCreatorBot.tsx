
import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Key, ChevronRight, ChevronLeft, X, Save, Download, FileText, CheckCircle2, Clock, Info, SkipForward, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'mp_api_key_mistral';
const PROGRESS_KEY = 'umbra_anime_creator_progress_v1';

interface Answer {
    section: string;
    question: string;
    answer: string;
}

const QUESTIONS = [
    // História & Roteiro
    { section: "🎭 HISTÓRIA & ROTEIRO", q: "Qual é a premissa principal do seu anime? Como seu personagem foi parar nesse outro mundo?" },
    { section: "🎭 HISTÓRIA & ROTEIRO", q: "Qual é o poder especial do protagonista e como ele foi adquirido?" },
    { section: "🎭 HISTÓRIA & ROTEIRO", q: "Qual é a penalidade ou custo desse poder? (ex: memórias, vida útil, emoções)" },
    { section: "🎭 HISTÓRIA & ROTEIRO", q: "Quais são as regras do seu mundo? Existem níveis, classes e skills?" },
    { section: "🎭 HISTÓRIA & ROTEIRO", q: "Como funciona o sistema de magia? Tem elementos, palavras de ativação, gestos?" },
    { section: "🎭 HISTÓRIA & ROTEIRO", q: "Qual é o conflito principal do primeiro episódio? O que o protagonista precisa resolver?" },
    { section: "🎭 HISTÓRIA & ROTEIRO", q: "Existe uma organização vilã ou antagonista já estabelecida desde o início?" },
    { section: "🎭 HISTÓRIA & ROTEIRO", q: "Como funciona a economia e a política do mundo? Existem reinos, guildas, facções?" },
    { section: "🎭 HISTÓRIA & ROTEIRO", q: "Quais são os limites do poder do protagonista? O que ele NÃO pode fazer?" },
    { section: "🎭 HISTÓRIA & ROTEIRO", q: "Qual é o gancho final (cliffhanger) do primeiro episódio para prender o espectador?" },
    // Personagens
    { section: "👤 PERSONAGENS", q: "Qual é o design completo do protagonista? (cor de cabelo, roupa, estatura, traços marcantes)" },
    { section: "👤 PERSONAGENS", q: "Ele terá uma 'guia' invisível/voz? Qual é a personalidade dela?" },
    { section: "👤 PERSONAGENS", q: "Qual será o mascote ou monstro companheiro? Qual sua forma e habilidade principal?" },
    { section: "👤 PERSONAGENS", q: "Quais expressões faciais são essenciais para cada personagem principal? (liste as 5 principais)" },
    { section: "👤 PERSONAGENS", q: "Qual é o arquétipo de cada personagem? (ex: herói inocente, mentor sábio, rival arrogante)" },
    { section: "👤 PERSONAGENS", q: "Como os personagens secundários se diferenciam visualmente do protagonista?" },
    { section: "👤 PERSONAGENS", q: "Quais personagens aparecem só neste episódio e quais serão recorrentes na série?" },
    { section: "👤 PERSONAGENS", q: "Quais são as falas/bordões que definem a personalidade de cada personagem?" },
    // Produção Visual
    { section: "🎬 PRODUÇÃO VISUAL", q: "Vai usar animação 2D, 3D ou uma combinação? Qual estilo predomina?" },
    { section: "🎬 PRODUÇÃO VISUAL", q: "Quais cenários precisam ser criados do zero e quais podem ser reutilizados entre cenas?" },
    { section: "🎬 PRODUÇÃO VISUAL", q: "Quais momentos precisam de VFX especiais? (magia, interfaces, partículas, explosões)" },
    { section: "🎬 PRODUÇÃO VISUAL", q: "Qual será a paleta de cores para cada hora do dia? (manhã, tarde, noite, entardecer)" },
    { section: "🎬 PRODUÇÃO VISUAL", q: "Quantos frames por segundo (FPS) sua animação terá? (12fps é padrão de anime)" },
    // Interface UI
    { section: "🖥️ INTERFACE (UI)", q: "Como será o design dos menus de status do personagem? (estilo, cores, bordas)" },
    { section: "🖥️ INTERFACE (UI)", q: "Qual o estilo visual das interfaces — pergaminho medieval, futurista, digital, holográfico?" },
    { section: "🖥️ INTERFACE (UI)", q: "Como o protagonista interage com o menu? (toque no ar, voz, piscar de olhos, gesto)" },
    { section: "🖥️ INTERFACE (UI)", q: "Haverá notificações ou alertas do sistema? Como eles aparecerão na tela?" },
    // Áudio
    { section: "🔊 ÁUDIO", q: "Quem vai dublar cada personagem principal? Você tem acesso a vozes ou vai usar síntese de voz?" },
    { section: "🔊 ÁUDIO", q: "Qual o estilo da trilha sonora para cada tipo de cena? (batalha, cidade, descanso, mistério)" },
    { section: "🔊 ÁUDIO", q: "A abertura (OP) e o encerramento (ED) já estão definidos? Qual estilo musical?" },
    { section: "🔊 ÁUDIO", q: "Como será feito o Lip Sync? (animação labial ou estilo 'boca de aba'?)" },
    // Ferramentas
    { section: "🛠️ FERRAMENTAS & PIPELINE", q: "Qual software de animação 2D vai usar? (OpenToonz, Krita, Clip Studio EX, Toon Boom...)" },
    { section: "🛠️ FERRAMENTAS & PIPELINE", q: "Qual software de composição/efeitos usará para juntar tudo? (DaVinci Resolve, After Effects...)" },
    { section: "🛠️ FERRAMENTAS & PIPELINE", q: "Você trabalha sozinho ou tem uma equipe? Quem é responsável por cada parte do pipeline?" },
    { section: "🛠️ FERRAMENTAS & PIPELINE", q: "Qual plataforma usará para publicar o anime? (YouTube, Crunchyroll, redes sociais)" },
    // Orçamento
    { section: "💰 ORÇAMENTO & RECURSOS", q: "Qual é o orçamento total disponível para produzir o primeiro episódio?" },
    { section: "💰 ORÇAMENTO & RECURSOS", q: "Quantas horas por semana você (e a equipe) conseguem dedicar à produção?" },
    { section: "💰 ORÇAMENTO & RECURSOS", q: "Existe um plano para monetizar o anime? (YouTube AdSense, Patreon, merchandise)" },
    { section: "💰 ORÇAMENTO & RECURSOS", q: "Qual é o prazo estimado para o primeiro episódio ficar pronto?" },
];

const UmbraAnimeCreatorBot: React.FC = () => {
    const [apiKey, setApiKey] = useState<string>(localStorage.getItem(STORAGE_KEY) || '');
    const [showApiModal, setShowApiModal] = useState<boolean>(!apiKey);
    const [currentIndex, setCurrentIndex] = useState<number>(-1);
    const [answers, setAnswers] = useState<Record<number, Answer>>({});
    const [input, setInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<string>('Olá! Clique abaixo para iniciar sua jornada de criação.');
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [reviewMode, setReviewMode] = useState<boolean>(false);
    const [reviewContent, setReviewContent] = useState<string>('');
    const [toast, setToast] = useState<string | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Initial Load from Persistence
    useEffect(() => {
        const saved = localStorage.getItem(PROGRESS_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setCurrentIndex(data.currentIndex);
                setAnswers(data.answers || {});
                if (data.currentIndex >= QUESTIONS.length) {
                    setIsComplete(true);
                }
            } catch (e) {
                console.error("Failed to load progress", e);
            }
        }
    }, []);

    // Save Progress
    useEffect(() => {
        if (currentIndex >= 0) {
            localStorage.setItem(PROGRESS_KEY, JSON.stringify({
                currentIndex,
                answers,
                lastUpdated: Date.now()
            }));
        }
    }, [currentIndex, answers]);

    const showToastMessage = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const handleSendMessage = async (isSkip = false) => {
        const text = isSkip ? 'Pulei esta pergunta.' : input.trim();
        if (!text && !isSkip) return;
        if (!apiKey) {
            setShowApiModal(true);
            return;
        }

        setIsLoading(true);

        // Store Answer
        const currentQ = QUESTIONS[currentIndex];
        const newAnswers = { ...answers, [currentIndex]: { section: currentQ.section, question: currentQ.q, answer: text } };
        setAnswers(newAnswers);
        setInput('');

        try {
            // Mistral Contextual Feedback
            // We pass all previous answers to allow it to find inconsistencies
            const previousContext = (Object.values(newAnswers) as Answer[])
                .map(a => `Q: ${a.question}\nA: ${a.answer}`)
                .join('\n\n');

            const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'mistral-large-latest',
                    messages: [
                        {
                            role: 'system',
                            content: `Você é o Umbra Anime Creator Bot, um consultor sênior de produção de animes. 
                            Sua tarefa é analisar a resposta atual do usuário em relação ao contexto de tudo o que ele disse antes. 
                            Se houver alguma inconsistência (ex: um sistema de magia que quebra as regras de mundo mencionadas antes), aponte de forma gentil.
                            Se não, dê um feedback motivador e uma dica técnica valiosa. 
                            Mantenha o tom profissional, mas entusiasta. Responda em Português Brasileiro.`
                        },
                        {
                            role: 'user',
                            content: `CONTEXTO DO PROJETO:\n${previousContext}\n\nRESPOSTA ATUAL PARA "${currentQ.q}": ${text}\n\nDê um feedback curto (máximo 4 frases) antes de passarmos para a próxima pergunta.`
                        }
                    ],
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            setFeedback(data.choices[0].message.content);

            if (currentIndex + 1 < QUESTIONS.length) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setIsComplete(true);
            }

        } catch (e) {
            showToastMessage('⚠️ Erro de conexão. Próxima pergunta...');
            if (currentIndex + 1 < QUESTIONS.length) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setIsComplete(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleReviewMode = async () => {
        if (!apiKey) {
            setShowApiModal(true);
            return;
        }
        setReviewMode(true);
        setIsLoading(true);

        try {
            const fullProfile = (Object.values(answers) as Answer[])
                .map(a => `[${a.section}] ${a.question}: ${a.answer}`)
                .join('\n');

            const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'mistral-large-latest',
                    messages: [
                        {
                            role: 'system',
                            content: `Você é um Consultor Criativo e Diretor de Produção de Anime.
                            Analise o projeto completo do usuário e forneça:
                            1. Uma CRÍTICA DE CONSISTÊNCIA (Pontos fortes e falhas lógicas).
                            2. ESTIMATIVA DE TEMPO (Baseado na equipe e software).
                            3. CONSELHO DE OURO para o sucesso do lançamento.
                            Seja detalhado e use markdown.`
                        },
                        { role: 'user', content: `PROJETO COMPLETO:\n${fullProfile}` }
                    ],
                    max_tokens: 2000,
                })
            });

            const data = await response.json();
            setReviewContent(data.choices[0].message.content);
        } catch (e) {
            showToastMessage('⚠️ Erro na revisão.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setInput(answers[currentIndex - 1]?.answer || '');
            setFeedback('Editando pergunta anterior...');
        }
    };

    const resetQuest = () => {
        if (window.confirm('Reiniciar toda a jornada? Isso apagará seu progresso atual.')) {
            localStorage.removeItem(PROGRESS_KEY);
            setCurrentIndex(-1);
            setAnswers({});
            setIsComplete(false);
            setReviewMode(false);
            setReviewContent('');
        }
    };

    const exportBible = () => {
        const sections: Record<string, string[]> = {};
        (Object.values(answers) as Answer[]).forEach(a => {
            if (!sections[a.section]) sections[a.section] = [];
            sections[a.section].push(`### ${a.question}\n**R:** ${a.answer}\n`);
        });

        let doc = `# BÍBLIA DO PROJETO: ANIME CREATOR\n\nGerado em: ${new Date().toLocaleDateString()}\n\n`;
        Object.entries(sections).forEach(([sec, items]) => {
            doc += `## ${sec}\n${items.join('\n')}\n---\n\n`;
        });

        if (reviewContent) {
            doc += `\n# ANÁLISE DO CONSULTOR\n\n${reviewContent}`;
        }

        const blob = new Blob([doc], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Project_Bible_Anime.md`;
        a.click();
        showToastMessage('✦ Bíblia exportada em Markdown!');
    };

    const progressPercentage = currentIndex === -1 ? 0 : Math.round(((currentIndex + 1) / QUESTIONS.length) * 100);

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-[#fafafa] text-[#111] font-serif relative overflow-hidden rounded-[40px] border border-gray-200 shadow-2xl">
            {/* Header */}
            <header className="px-8 py-6 border-b border-gray-200 flex items-center justify-between bg-white/70 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold">🎌</div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Anime Creator Bot</h1>
                        <p className="text-[10px] text-gray-500 font-sans uppercase tracking-[0.2em]">Sua bíblia de produção automatizada</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {(isComplete || currentIndex > 0) && (
                        <button onClick={exportBible} className="flex items-center gap-2 px-4 py-2 border border-black rounded-xl text-xs font-bold hover:bg-black hover:text-white transition-all">
                            <Download className="w-3.5 h-3.5" /> Exportar Bíblia
                        </button>
                    )}
                    <button onClick={resetQuest} className="p-2 text-gray-400 hover:text-red-500 transition-all" title="Reiniciar">
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-gray-100 relative overflow-hidden">
                <div
                    className="h-full bg-black transition-all duration-700 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {currentIndex === -1 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-8 animate-in fade-in zoom-in duration-700">
                        <div className="text-6xl">📖</div>
                        <h2 className="text-3xl font-bold text-black tracking-tighter">O Caminho do Criador</h2>
                        <p className="text-gray-600 leading-relaxed italic">
                            "Um anime de sucesso não nasce da sorte, mas de um planejamento impecável. Vou guiar você por 39 questões fundamentais para transformar sua ideia em uma produção real."
                        </p>
                        <button
                            onClick={() => setCurrentIndex(0)}
                            className="px-12 py-4 bg-black text-white rounded-2xl font-bold text-sm tracking-widest hover:scale-105 transition-all shadow-xl"
                        >
                            INICIAR JORNADA →
                        </button>
                    </div>
                ) : isComplete && !reviewMode ? (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-8 animate-in fade-in zoom-in duration-700">
                        <div className="text-6xl">✨</div>
                        <h2 className="text-3xl font-bold text-black tracking-tighter">Jornada Concluída</h2>
                        <p className="text-gray-600 leading-relaxed">
                            Você respondeu todas as questões fundamentais. Agora, permita que eu faça uma revisão profunda do seu projeto, aponte inconsistências e estime seu tempo de produção.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={handleReviewMode} className="px-10 py-4 bg-black text-white rounded-2xl font-bold text-sm hover:scale-105 transition-all">Modo Revisão 🧠</button>
                            <button onClick={exportBible} className="px-10 py-4 border border-black text-black rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all">Download Bíblia</button>
                        </div>
                    </div>
                ) : reviewMode ? (
                    <div className="space-y-8 animate-in fade-in duration-700 max-w-4xl mx-auto">
                        <header className="flex items-center gap-4 text-black border-b border-gray-100 pb-4">
                            <Info className="w-6 h-6" />
                            <h3 className="text-2xl font-bold">Relatório do Consultor</h3>
                        </header>
                        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm prose prose-neutral max-w-none">
                            {isLoading ? (
                                <div className="space-y-4">
                                    <div className="h-4 bg-gray-100 rounded-full w-3/4 animate-pulse"></div>
                                    <div className="h-4 bg-gray-100 rounded-full w-full animate-pulse"></div>
                                    <div className="h-4 bg-gray-100 rounded-full w-5/6 animate-pulse"></div>
                                    <div className="h-4 bg-gray-100 rounded-full w-2/3 animate-pulse"></div>
                                </div>
                            ) : (
                                <div className="text-gray-800 leading-relaxed font-sans whitespace-pre-wrap">
                                    {reviewContent}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center pb-20">
                            <button onClick={() => setReviewMode(false)} className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black">Voltar ao Resumo</button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto space-y-12 pb-20">
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">
                            <span>{QUESTIONS[currentIndex].section}</span>
                            <span>{currentIndex + 1} / {QUESTIONS.length}</span>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gray-100 p-6 rounded-3xl rounded-tl-none border border-gray-200">
                                <h3 className="text-xl font-bold text-gray-900 leading-snug">{QUESTIONS[currentIndex].q}</h3>
                            </div>

                            {feedback && !isLoading && (
                                <div className="animate-in fade-in slide-in-from-left-4 duration-500 flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-[10px] shrink-0 italic">U</div>
                                    <div className="text-[13px] text-gray-600 font-sans italic pt-1 leading-relaxed border-l-2 border-gray-100 pl-4">
                                        {feedback}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 pt-10">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Desenvolva sua ideia aqui..."
                                className="w-full bg-white border border-gray-200 focus:border-black rounded-3xl p-6 text-sm italic font-medium outline-none transition-all shadow-sm min-h-[150px] resize-none"
                            />

                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    <button onClick={handleBack} disabled={currentIndex === 0 || isLoading} className="p-4 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:text-black disabled:opacity-30 transition-all">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleSendMessage(true)} disabled={isLoading} className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-200 rounded-2xl text-xs font-bold text-gray-400 hover:text-black hover:border-black transition-all">
                                        <SkipForward className="w-4 h-4" /> Pular
                                    </button>
                                </div>

                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!input.trim() || isLoading}
                                    className="px-10 py-4 bg-black text-white rounded-2xl font-bold text-sm flex items-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-xl"
                                >
                                    {isLoading ? 'Analisando...' : 'Próxima Fase →'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #eee; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ccc; }
            `}</style>

            {/* API Key Modal */}
            {showApiModal && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-white/95 backdrop-blur-xl">
                    <div className="w-full max-w-sm flex flex-col items-center gap-8 animate-in zoom-in duration-500">
                        <div className="text-6xl grayscale">🔑</div>
                        <div className="text-center space-y-3">
                            <h2 className="text-2xl font-bold text-black tracking-tighter">Liberação do Consultor</h2>
                            <p className="text-gray-500 text-[13px] leading-relaxed">Insira sua Mistral API Key para ativar o Umbra Anime Creator. Usamos o modelo **Mistral-Large** para análises profundas.</p>
                        </div>

                        <div className="w-full space-y-4">
                            <input
                                type="password"
                                placeholder="Insira sua chave..."
                                className="w-full bg-gray-100 border border-gray-200 focus:border-black rounded-2xl px-6 py-4 text-xs font-mono outline-none transition-all"
                                defaultValue={apiKey}
                                id="creatorApiInput"
                            />
                            <button
                                onClick={() => {
                                    const val = (document.getElementById('creatorApiInput') as HTMLInputElement).value;
                                    localStorage.setItem(STORAGE_KEY, val);
                                    setApiKey(val);
                                    setShowApiModal(false);
                                    showToastMessage('✦ Consultor pronto.');
                                }}
                                className="w-full py-4 bg-black text-white rounded-2xl font-bold uppercase text-[10px] tracking-[0.3em] shadow-2xl hover:translate-y-[-2px] transition-all"
                            >
                                Iniciar Conexão →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-24 right-8 z-[250] px-6 py-3 bg-black text-white border border-gray-800 rounded-full font-bold text-[10px] tracking-widest shadow-2xl animate-in slide-in-from-right-10">
                    {toast}
                </div>
            )}
        </div>
    );
};

export default UmbraAnimeCreatorBot;
