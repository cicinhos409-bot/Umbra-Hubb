
import React, { useState, useEffect, useRef } from 'react';
import { 
    Sparkles, 
    Zap, 
    Copy, 
    Download, 
    RefreshCw, 
    CheckCircle2, 
    AlertCircle, 
    Play, 
    Lock,
    ChevronRight,
    Search,
    Brain,
    Rocket,
    BarChart3
} from 'lucide-react';

const API_BASE_URL = 'https://umbra-hubb-production.up.railway.app';

interface UmbraYouStorytellingProps {
  userTier?: string;
}

const UmbraYouStorytelling: React.FC<UmbraYouStorytellingProps> = ({ userTier }) => {
    // Basic Form State
    const [channelName, setChannelName] = useState('');
    const [platform, setPlatform] = useState('youtube');
    const [niche, setNiche] = useState('');
    const [topic, setTopic] = useState('');
    const [style, setStyle] = useState('tutorial');
    const [baseScript, setBaseScript] = useState('');
    const [hookType, setHookType] = useState('ambicao');
    
    // Metrics
    const [m1, setM1] = useState('');
    const [m2, setM2] = useState('');
    const [m3, setM3] = useState('');
    const [msurp, setMsurp] = useState('');
    const [refChannels, setRefChannels] = useState('');

    // Settings
    const [tone, setTone] = useState('empolgado');
    const [pace, setPace] = useState('moderado');
    const [model, setModel] = useState('mistral-large-latest');
    const [wordCount, setWordCount] = useState(500);
    const [moneyLvl, setMoneyLvl] = useState(2);
    
    // Multiselect Techniques
    const [techs, setTechs] = useState<string[]>(['fomo', 'objecoes', 'cta_meio']);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [output, setOutput] = useState<string | null>(null);
    const [loadStep, setLoadStep] = useState(0);

    const outputRef = useRef<HTMLDivElement>(null);

    const toggleTech = (tech: string) => {
        setTechs(prev => prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]);
    };

    const techMeta: Record<string, { label: string, color: string, desc: string }> = {
        fomo: { label: 'FOMO', color: '#ff3a5c', desc: 'Prenda o espectador até o fim.' },
        objecoes: { label: 'Eliminar Objeções', color: '#ff6b6b', desc: 'Quebre dúvidas em segundos.' },
        cta_meio: { label: 'CTA no Meio', color: '#ffd95a', desc: 'Pedido de interatividade estratégica.' },
        tripla_mot: { label: 'Tripla Motivação', color: '#ff8c42', desc: 'Cobre diversão, crescimento e dinheiro.' },
        empatia: { label: 'Ponte de Empatia', color: '#f87171', desc: 'Crie conexão imediata.' },
        indice: { label: 'Índice Numerado', color: '#4d9fff', desc: 'Crie um contrato de conteúdo.' },
        esforco: { label: 'Escassez por Esforço', color: '#60a5fa', desc: 'Valorize seu método exclusivo.' },
        celebrities: { label: 'Prova com Famosos', color: '#a78bfa', desc: 'Aumente autoridade com exemplos.' },
        calculo: { label: 'Cálculo de Lucro', color: '#34d399', desc: 'Mostre a matemática do sucesso.' },
        progressao: { label: 'Progressão de Níveis', color: '#10b981', desc: 'Do iniciante ao profissional.' },
        honestidade: { label: 'Honestidade sobre Falhas', color: '#00e5a0', desc: 'Gere confiança genuína.' },
        benchmark: { label: 'Benchmark ao Vivo', color: '#06d6a0', desc: 'Compare e opine com autoridade.' },
        pro_tip: { label: 'Pro Tip Embutido', color: '#22d3ee', desc: 'Segredos que só especialistas sabem.' },
        demo_antes: { label: 'Demo Antes do Tutorial', color: '#38bdf8', desc: 'Hook visual poderoso.' },
        narrativa_final: { label: 'Narrativa Emocional Final', color: '#818cf8', desc: 'Impacto profundo no encerramento.' },
        desafio: { label: 'Desafio Interativo', color: '#c084fc', desc: 'Gere engajamento real.' },
    };

    const generate = async () => {
        if (!topic && !baseScript) {
            setError('Preencha o tema do vídeo ou cole um roteiro base.');
            return;
        }

        setLoading(true);
        setError(null);
        setOutput(null);
        setLoadStep(1);

        // Simulation of loading steps
        const stepInterval = setInterval(() => {
            setLoadStep(prev => (prev < 6 ? prev + 1 : prev));
        }, 1500);

        try {
            const platformMap: Record<string, string> = { youtube: 'YouTube', shorts: 'YouTube Shorts', reels: 'Instagram Reels', instagram: 'Instagram Feed' };
            
            const systemPrompt = `Você é o melhor redator de roteiros virais para YouTube e TikTok do Brasil. Escreva em português brasileiro natural.`;
            
            const userPrompt = `Crie um roteiro viral completo pronto para gravar.
            CANAL: ${channelName || 'meu canal'}
            PLATAFORMA: ${platformMap[platform]}
            NICHE: ${niche}
            TEMA: ${topic}
            ESTILO: ${style}
            TONALIDADE: ${tone}
            RITMO: ${pace}
            TAMANHO ALVO: ${wordCount} palavras
            HOOK: ${hookType}
            TECNICAS: ${techs.join(', ')}
            DADOS: ${m1}, ${m2}, ${m3}
            ${baseScript ? `BASE: "${baseScript}"` : ''}
            
            FORMATO: Divida em [HOOK], [DESENVOLVIMENTO], [FECHAMENTO]. Use marcadores [PAUSA], [ACELERA].`;

            const res = await fetch(`${API_BASE_URL}/api/mistral`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ]
                })
            });

            if (!res.ok) throw new Error('Falha ao conectar com o motor de IA.');
            
            const data = await res.json();
            setOutput(data.choices[0].message.content);
            
            setTimeout(() => {
                outputRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 300);

        } catch (err: any) {
            setError(err.message);
        } finally {
            clearInterval(stepInterval);
            setLoading(false);
            setLoadStep(0);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20 font-rajdhani">
            <header className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-brand-purple/10 border border-brand-purple/20 rounded-full text-[10px] font-black tracking-[0.2em] text-brand-purple uppercase">
                    <Sparkles className="w-4 h-4 animate-pulse" /> IA Storytelling v2.0
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
                    Umbra You <span className="text-brand-purple">Storytelling</span>
                </h1>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg font-medium">
                    O gerador de roteiros mais avançado do mercado, treinado no algoritmo de retenção dos maiores canais gringos.
                </p>
                <div className="flex justify-center gap-12 pt-8">
                    <div className="text-center"><div className="text-3xl font-black text-brand-purple">10</div><div className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Canais Analisados</div></div>
                    <div className="text-center"><div className="text-3xl font-black text-brand-pink">25+</div><div className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Técnicas Virais</div></div>
                    <div className="text-center"><div className="text-3xl font-black text-brand-cyan">Turbo</div><div className="text-[10px] text-gray-600 uppercase font-black tracking-widest">Acesso VIP</div></div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* CONFIGS COLUMN */}
                <div className="lg:col-span-8 space-y-8">
                    {/* STEP 1: IDENTIDADE */}
                    <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-brand-purple/10 transition-all" />
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-brand-purple/20 rounded-2xl flex items-center justify-center text-brand-purple font-black text-xl">01</div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Identidade & Canal</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Nome do Canal</label>
                                <input value={channelName} onChange={e => setChannelName(e.target.value)} placeholder="Ex: Umbra Tech" className="w-full bg-background-light border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-brand-purple/50 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Plataforma</label>
                                <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full bg-background-light border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-brand-purple/50 outline-none">
                                    <option value="youtube">YouTube (Longo)</option>
                                    <option value="shorts">Shorts / TikTok</option>
                                    <option value="reels">Instagram Reels</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Nicho do Canal</label>
                                <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Ex: IA e Automação" className="w-full bg-background-light border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-brand-purple/50 outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Tema Principal</label>
                                <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ex: Guia definitivo Midjourney" className="w-full bg-background-light border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-brand-purple/50 outline-none" />
                            </div>
                        </div>

                        <div className="mt-8 space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Estilo de Conteúdo</label>
                            <div className="flex flex-wrap gap-2">
                                {['tutorial', 'storytelling', 'listicle', 'educativo', 'misterio', 'documental'].map(s => (
                                    <button key={s} onClick={() => setStyle(s)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${style === s ? 'bg-brand-purple text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* STEP 2: ROTEIRO BASE */}
                    <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-brand-cyan/20 rounded-2xl flex items-center justify-center text-brand-cyan font-black text-xl">02</div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Roteiro Base / Ideia (Opcional)</h3>
                        </div>
                        <textarea value={baseScript} onChange={e => setBaseScript(e.target.value)} rows={5} placeholder="Cole aqui seu rascunho ou transcrição para otimizar..." className="w-full bg-background-light border border-white/10 rounded-[28px] p-6 text-sm font-medium focus:border-brand-cyan/50 outline-none resize-none transition-all" />
                        <p className="mt-4 text-[10px] text-gray-500 italic">A IA irá reestruturar seu texto aplicando as técnicas de retenção selecionadas.</p>
                    </section>

                    {/* STEP 3: HOOK & PROVA */}
                    <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 font-black text-xl">03</div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Gatilhos de Hook & Prova</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
                            {[
                                { id: 'ambicao', icon: '💰', label: 'Ambição' },
                                { id: 'exclusividade', icon: '🔒', label: 'Exclusividade' },
                                { id: 'ameaca', icon: '⚡', label: 'Ameaça' },
                                { id: 'urgencia', icon: '⏳', label: 'Urgência' },
                                { id: 'dor', icon: '🎯', label: 'Dor' },
                            ].map(h => (
                                <button key={h.id} onClick={() => setHookType(h.id)} className={`flex flex-col items-center justify-center p-4 rounded-3xl border transition-all ${hookType === h.id ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-lg' : 'bg-background-light border-white/10 text-gray-500 hover:border-white/20'}`}>
                                    <span className="text-2xl mb-2">{h.icon}</span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">{h.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Métrica Prova 1</label><input value={m1} onChange={e => setM1(e.target.value)} placeholder="Ex: 500k views em 7 dias" className="w-full bg-background-light border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Métrica Prova 2</label><input value={m2} onChange={e => setM2(e.target.value)} placeholder="Ex: R$ 12k p/ mês" className="w-full bg-background-light border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none" /></div>
                        </div>
                    </section>

                    {/* STEP 4: TÉCNICAS DE RETENÇÃO */}
                    <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-brand-pink/20 rounded-2xl flex items-center justify-center text-brand-pink font-black text-xl">04</div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Técnicas de Retenção Ativa</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {Object.entries(techMeta).map(([id, meta]) => (
                                <button key={id} onClick={() => toggleTech(id)} className={`flex items-start gap-3 p-4 rounded-2xl border transition-all text-left group ${techs.includes(id) ? 'bg-white/5 border-white/20' : 'bg-background-light border-white/5 opacity-60 hover:opacity-100 hover:border-white/10'}`}>
                                    <div className={`mt-1 w-4 h-4 rounded border flex items-center justify-center transition-colors ${techs.includes(id) ? 'bg-brand-purple border-brand-purple' : 'border-white/20'}`}>
                                        {techs.includes(id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-[11px] font-black uppercase tracking-tight text-white mb-0.5">{meta.label}</div>
                                        <div className="text-[9px] text-gray-500 truncate">{meta.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* SIDEBAR COLUMN */}
                <div className="lg:col-span-4 space-y-8">
                    <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-2xl sticky top-24">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                             Calibração do Motor <div className="h-px flex-1 bg-white/5" />
                        </h4>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Modelo Mistral IA</label>
                                <select value={model} onChange={e => setModel(e.target.value)} className="w-full bg-background-light border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-brand-purple/50 outline-none">
                                    <optgroup label="🔝 Alta Performance" className="bg-background-mid">
                                        <option value="mistral-large-latest">Mistral Large 3 (Poderoso)</option>
                                        <option value="mistral-medium-latest">Mistral Medium</option>
                                    </optgroup>
                                    <optgroup label="⚡ Leves & Rápidos" className="bg-background-mid">
                                        <option value="mistral-small-latest">Mistral Small 3.2</option>
                                        <option value="open-mistral-7b">Mistral 7B (Leve)</option>
                                    </optgroup>
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Tonalidade</label>
                                <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-background-light border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-brand-purple/50 outline-none">
                                    <option value="empolgado">Empolgado & Viral</option>
                                    <option value="misterioso">Misterioso (Curiosidade)</option>
                                    <option value="serio">Sério & Autoritativo</option>
                                    <option value="cinematografico">Cinematográfico</option>
                                </select>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-gray-500">Tamanho Alvo</span>
                                    <span className="text-brand-purple">{wordCount} palavras</span>
                                </div>
                                <input type="range" min="150" max="2500" step="50" value={wordCount} onChange={e => setWordCount(parseInt(e.target.value))} className="w-full h-1.5 bg-background-light rounded-lg appearance-none cursor-pointer accent-brand-purple" />
                            </div>

                            <div className="space-y-4 pt-4">
                                <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Intensidade Financeira</label>
                                <div className="flex gap-2">
                                    {[0, 1, 2, 3].map(lvl => (
                                        <button key={lvl} onClick={() => setMoneyLvl(lvl)} className={`flex-1 py-3 rounded-xl border transition-all flex items-center justify-center ${moneyLvl === lvl ? 'bg-brand-green/10 border-brand-green/30 text-brand-green shadow-lg shadow-brand-green/10' : 'bg-background-light border-white/5 text-gray-600'}`}>
                                            {lvl === 0 ? 'Ø' : Array(lvl).fill('$').join('')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button onClick={generate} disabled={loading} className="w-full py-6 mt-8 bg-gradient-to-r from-brand-purple to-brand-pink rounded-2xl text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-brand-purple/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                                Gerar Roteiro Viral
                            </button>

                            {error && (
                                <div className="p-4 bg-brand-pink/10 border border-brand-pink/20 rounded-2xl flex items-center gap-3 text-brand-pink">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span className="text-[10px] font-bold uppercase tracking-tight">{error}</span>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* LOADING STATE */}
            {loading && (
                <div className="bg-background-mid border border-white/5 rounded-[48px] p-20 text-center shadow-2xl animate-in zoom-in-95 duration-500">
                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`w-3 h-3 rounded-full animate-bounce ${i === 1 ? 'bg-brand-purple' : i === 2 ? 'bg-brand-pink' : 'bg-brand-cyan'}`} style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Injetando Inteligência Viral</h3>
                    <div className="flex flex-wrap justify-center gap-3 max-w-lg mx-auto">
                        {['Hook', 'Objeções', 'Estrutura', 'Gatilhos', 'Tom', 'Finalizando'].map((s, idx) => (
                            <div key={s} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-500 ${loadStep > idx ? 'bg-brand-green/10 border-brand-green/30 text-brand-green' : loadStep === idx + 1 ? 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple animate-pulse' : 'bg-white/5 border-white/5 text-gray-700'}`}>
                                {s}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* OUTPUT SECTION */}
            {output && (
                <div ref={outputRef} className="animate-in slide-in-from-bottom-8 duration-700">
                    <section className="bg-background-mid border border-brand-purple/30 rounded-[48px] overflow-hidden shadow-2xl">
                        <div className="p-8 md:p-10 border-b border-white/5 bg-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">Roteiro Completo Pronto</h3>
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Otimizado para ${platform.toUpperCase()} · ${style.toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => { navigator.clipboard.writeText(output); }} className="px-6 py-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-2 text-gray-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group">
                                    <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" /> Copiar Texto
                                </button>
                                <button className="px-8 py-4 bg-brand-purple text-white shadow-xl shadow-brand-purple/20 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                                    <Download className="w-4 h-4" /> Exportar .txt
                                </button>
                            </div>
                        </div>

                        <div className="p-10 md:p-16">
                            <div className="flex flex-wrap gap-2 mb-10">
                                {techs.map(t => techMeta[t] && (
                                    <div key={t} className="flex items-center gap-2 px-3 py-1.5 bg-background-light border border-white/5 rounded-full">
                                        <div className="w-2 h-2 rounded-full" style={{ background: techMeta[t].color }} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{techMeta[t].label}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="prose prose-invert max-w-none">
                                <div className="text-lg md:text-xl leading-[2] text-gray-300 font-medium whitespace-pre-wrap selection:bg-brand-purple/30">
                                    {output}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-black/20 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Brain className="w-5 h-5 text-gray-600" />
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Processado via Mistral ${model.split('-')[1]} AI Engine</span>
                            </div>
                            <button onClick={generate} className="text-[10px] font-black text-brand-purple uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all">
                                Gerar Variação <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default UmbraYouStorytelling;
