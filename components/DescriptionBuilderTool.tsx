
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  FileText, 
  Search, 
  Clock, 
  Target, 
  Copy, 
  Trash2, 
  Download, 
  Zap, 
  CheckCircle2, 
  Tag, 
  Plus, 
  Trash, 
  Hash, 
  RefreshCw,
  Loader2,
  ChevronRight,
  TrendingUp,
  FileCode,
  Globe,
  Upload,
  BarChart,
  Brain,
  // Fix: Add missing icon imports
  X,
  Settings
} from 'lucide-react';

interface Timestamp {
  time: string;
  label: string;
}

const NICHES = [
  { id: 'tech', label: 'Tecnologia', emoji: '💻', kw: ['tecnologia','inovação','digital','tutorial','dicas'] },
  { id: 'finance', label: 'Finanças', emoji: '💰', kw: ['finanças','investimentos','dinheiro','renda','resultados'] },
  { id: 'fitness', label: 'Fitness & Saúde', emoji: '💪', kw: ['saúde','exercício','treino','resultado','transformação'] },
  { id: 'business', label: 'Negócios', emoji: '📈', kw: ['negócios','empreendedorismo','estratégia','marketing','vendas'] },
  { id: 'gaming', label: 'Games', emoji: '🎮', kw: ['game','gameplay','dicas','estratégia','review'] },
  { id: 'cooking', label: 'Culinária', emoji: '🍕', kw: ['receita','culinária','comida','gastronomia','cozinha'] },
  { id: 'education', label: 'Educação', emoji: '📚', kw: ['aprender','conhecimento','estudo','educação','dicas'] },
  { id: 'lifestyle', label: 'Lifestyle', emoji: '✨', kw: ['rotina','produtividade','hábitos','qualidade de vida'] },
  { id: 'music', label: 'Música', emoji: '🎵', kw: ['música','artista','produção','técnica','som'] },
  { id: 'travel', label: 'Viagens', emoji: '✈️', kw: ['viagem','destino','aventura','turismo','roteiro'] },
  { id: 'news', label: 'Notícias', emoji: '📰', kw: ['notícia','análise','fatos','investigação','política'] },
  { id: 'motivation', label: 'Motivação', emoji: '🔥', kw: ['motivação','mentalidade','sucesso','evolução','foco'] },
];

const CTA_TEMPLATES = [
  { id: 'subscribe', label: '👍 Inscreva-se & Curtir', text: '✅ Se esse vídeo te ajudou, deixa o like 👍 e se inscreve no canal! Ativa o siminho 🔔 para não perder os próximos.' },
  { id: 'comment', label: '💬 Deixe um comentário', text: '💬 O que você achou? Conta nos comentários — respondo todos.' },
  { id: 'share', label: '📤 Compartilhe o vídeo', text: '📤 Compartilha com alguém que precisa ver isso. Cada compartilhamento ajuda o canal a crescer. 🙏' },
  { id: 'notification', label: '🔔 Ative o siminho', text: '🔔 Ativa o siminho para ser o primeiro a ver cada novo vídeo. Conteúdo novo toda semana.' },
  { id: 'playlist', label: '▶️ Próximo vídeo', text: '▶️ Continua na playlist para aprofundar ainda mais.' },
  { id: 'link', label: '🔗 Link na bio', text: '🔗 Todos os links e recursos mencionados estão na descrição abaixo. ⬇️' },
];

const DescriptionBuilderTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'description' | 'hashtags' | 'timestamps' | 'cta'>('description');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressText, setProgressText] = useState('');
  
  // Description State
  const [videoTitle, setVideoTitle] = useState('');
  const [niche, setNiche] = useState('tech');
  const [duration, setDuration] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [tone, setTone] = useState('profissional');
  const [language, setLanguage] = useState('pt-br');
  const [ctaId, setCtaId] = useState('subscribe');
  
  // Options
  const [useTimestamps, setUseTimestamps] = useState(true);
  const [useHashtags, setUseHashtags] = useState(true);
  const [useCTA, setUseCTA] = useState(true);
  const [useLinks, setUseLinks] = useState(true);

  // Results
  const [generatedResult, setGeneratedResult] = useState({
    full: '',
    html: '',
    hashtags: [] as string[],
    timestamps: [] as Timestamp[],
    score: 0
  });

  // Hashtag Hunter State
  const [hhTopic, setHhTopic] = useState('');
  const [hhQty, setHhQty] = useState('30');
  const [hhResults, setHhResults] = useState<{ low: string[], med: string[], high: string[] }>({ low: [], med: [], high: [] });
  const [hhCompAnalysis, setHhCompAnalysis] = useState<any[]>([]);

  // Timestamps State
  const [tsDuration, setTsDuration] = useState('');
  const [tsScript, setTsScript] = useState('');
  const [tsList, setTsList] = useState<Timestamp[]>([]);
  const [tsManualTime, setTsManualTime] = useState('');
  const [tsManualLabel, setTsManualLabel] = useState('');

  // CTA Builder State
  const [ctaGoal, setCtaGoal] = useState('subscribers');
  const [ctaChannelName, setCtaChannelName] = useState('');
  const [ctaResults, setCtaResults] = useState<any[]>([]);
  const [selectedCtaText, setSelectedCtaText] = useState('');

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Helpers
  const formatDuration = (secs: number) => {
    secs = Math.floor(secs);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${m}:${String(s).padStart(2,'0')}`;
  };

  const parseDuration = (str: string) => {
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
    if (parts.length === 2) return parts[0]*60 + parts[1];
    return 600;
  };

  const handleKwAdd = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && kwInput.trim()) {
      e.preventDefault();
      const val = kwInput.trim().replace(/,/g,'');
      if (!keywords.includes(val)) setKeywords([...keywords, val]);
      setKwInput('');
    }
  };

  const generateDescription = async () => {
    if (!videoTitle && !scriptText) return alert("⚠️ Adicione um título ou roteiro!");
    setIsGenerating(true);
    const steps = ['Analisando conteúdo...', 'Gerando introdução SEO...', 'Criando timestamps...', 'Otimizando hashtags...', 'Finalizando descrição...'];
    let si = 0;
    const iv = setInterval(() => setProgressText(steps[si++ % steps.length]), 600);

    try {
      const nicheData = NICHES.find(n => n.id === niche) || NICHES[0];
      const prompt = `Gere uma descrição de vídeo para o YouTube baseada nestas informações:
      Título: ${videoTitle}
      Nicho: ${nicheData.label}
      Tom: ${tone}
      Duração: ${duration || '10:00'}
      Palavras-chave: ${[...keywords, ...nicheData.kw].join(', ')}
      Resumo do Script: ${scriptText.slice(0, 1000)}
      Configuração: ${useTimestamps ? 'Incluir Timestamps' : ''}, ${useHashtags ? 'Incluir Hashtags' : ''}, ${useCTA ? 'Incluir CTA: ' + ctaId : ''}, ${useLinks ? 'Incluir Links Sociais' : ''}
      Idioma: ${language}
      
      Regras:
      1. Comece com uma intro curta e direta.
      2. Formato de timestamps: MM:SS Título.
      3. Use 5 a 8 hashtags específicas no final.
      4. Responda APENAS com a descrição completa formatada para copiar e colar.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { temperature: 0.7 }
      });

      const fullText = response.text;
      
      // Calculate SEO Score (Mock)
      let score = 30;
      if (videoTitle.length > 20) score += 20;
      if (scriptText.length > 200) score += 20;
      if (keywords.length > 3) score += 15;
      if (useHashtags) score += 15;

      setGeneratedResult({
        full: fullText,
        html: fullText.replace(/\n/g, '<br/>'),
        hashtags: fullText.match(/#\w+/g) || [],
        timestamps: [], // Extracted if needed
        score
      });
    } catch (err) {
      console.error(err);
      alert("Erro na geração. Verifique sua chave API.");
    } finally {
      clearInterval(iv);
      setIsGenerating(false);
    }
  };

  const findHashtags = async () => {
    if (!hhTopic) return alert("Digite um tema!");
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Gere uma lista de 30 hashtags virais para o tema: "${hhTopic}" no nicho ${niche}. 
        Divida em 3 grupos de 10: 
        1. Baixa competição (Alto volume)
        2. Média competição
        3. Alta competição (Nicho específico)
        Responda em JSON com as chaves: low, med, high (arrays de strings).`,
        config: { responseMimeType: 'application/json' }
      });

      const data = JSON.parse(response.text);
      setHhResults(data);
      
      // Comp Analysis Mock
      const analysis = data.low.slice(0, 8).map((tag: string) => ({
        tag,
        comp: Math.floor(Math.random() * 100),
        vol: Math.floor(Math.random() * 900 + 100) + 'K'
      }));
      setHhCompAnalysis(analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTimestamps = () => {
    if (!tsScript) return alert("Insira o roteiro!");
    const lines = tsScript.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const totalSecs = parseDuration(tsDuration || '10:00');
    
    const generated = lines.map((label, i) => ({
      time: formatDuration(i === 0 ? 0 : Math.round((i / lines.length) * totalSecs)),
      label: label.slice(0, 42)
    }));
    setTsList(generated);
  };

  const addTsManual = () => {
    if (!tsManualTime || !tsManualLabel) return;
    const newList = [...tsList, { time: tsManualTime, label: tsManualLabel }];
    newList.sort((a, b) => parseDuration(a.time) - parseDuration(b.time));
    setTsList(newList);
    setTsManualTime('');
    setTsManualLabel('');
  };

  const generateCTAs = () => {
    const goalMap: any = {
      subscribers: [
        { name: '🔥 FOMO', text: `Se você ainda não se inscreveu no ${ctaChannelName || '@SeuCanal'}, você está perdendo conteúdo exclusivo TODA SEMANA! Inscreve-se agora e ativa o siminho 🔔!` },
        { name: '💙 Comunidade', text: `Já somos mais de mil pessoas aprendendo juntas no ${ctaChannelName || '@SeuCanal'}! Vem fazer parte você também → Inscreva-se agora!` },
      ],
      engagement: [
        { name: '💬 Pergunta', text: `Mas e você — o que acha sobre isso? Me conta nos comentários 👇 Vou responder todo mundo!` },
      ],
      sales: [
        { name: '🛍️ Produto', text: `Quer ir mais fundo? O link para nosso treinamento está na descrição ⬇️. Use o cupom UMBRA para desconto exclusivo!` },
      ]
    };
    ctaResults;
    setCtaResults(goalMap[ctaGoal] || goalMap.subscribers);
  };

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      <header className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-cyan/10 rounded-[28px] mb-6 shadow-2xl shadow-brand-cyan/10 ring-1 ring-brand-cyan/20">
          <FileText className="w-10 h-10 text-brand-cyan" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink bg-clip-text text-transparent uppercase">
          Umbra Description Builder
        </h1>
        <p className="text-gray-500 font-medium">YouTube SEO Suite • Powered by Gemini IA</p>
      </header>

      {/* TABS */}
      <div className="flex flex-wrap gap-2 justify-center bg-background-mid p-2 rounded-[24px] border border-white/5">
        {[
          { id: 'description', label: 'Description Builder', icon: FileText },
          { id: 'hashtags', label: 'Hashtag Hunter', icon: Search },
          { id: 'timestamps', label: 'Timestamps', icon: Clock },
          { id: 'cta', label: 'CTA Builder', icon: Target },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-brand-cyan text-background-deep shadow-lg shadow-brand-cyan/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: INPUTS */}
        <div className="lg:col-span-7 space-y-8">
          
          {activeTab === 'description' && (
            <div className="space-y-8 animate-in slide-in-from-left-4">
              <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-6">
                 <div className="flex items-center gap-3 mb-2">
                   <Zap className="w-5 h-5 text-brand-cyan" />
                   <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Dados do Vídeo</h3>
                 </div>
                 <div className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Título do Vídeo</label>
                     <input type="text" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-brand-cyan outline-none transition-all" placeholder="Ex: Como Ganhar Dinheiro no YouTube em 2025" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Nicho</label>
                       <select value={niche} onChange={e => setNiche(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none">
                         {NICHES.map(n => <option key={n.id} value={n.id}>{n.emoji} {n.label}</option>)}
                       </select>
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Duração</label>
                       <input type="text" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none" placeholder="Ex: 12:34" />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Keywords</label>
                     <div className="flex flex-wrap gap-2 p-3 bg-background-deep border border-white/10 rounded-2xl min-h-[56px]">
                        {keywords.map((kw, i) => (
                          <span key={i} className="flex items-center gap-2 px-3 py-1 bg-brand-cyan/10 border border-brand-cyan/20 rounded-lg text-[10px] font-bold text-brand-cyan">
                            {kw} <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setKeywords(keywords.filter((_, idx) => idx !== i))} />
                          </span>
                        ))}
                        <input value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={handleKwAdd} className="bg-transparent border-none outline-none text-xs font-bold text-white flex-1 min-w-[80px]" placeholder="Adicionar..." />
                     </div>
                   </div>
                 </div>
              </section>

              <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-6">
                 <div className="flex items-center gap-3 mb-2">
                   <FileText className="w-5 h-5 text-brand-purple" />
                   <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Conteúdo</h3>
                 </div>
                 <textarea value={scriptText} onChange={e => setScriptText(e.target.value)} className="w-full h-64 bg-background-deep border border-white/10 rounded-[32px] p-6 text-sm font-medium text-gray-400 focus:border-brand-purple outline-none resize-none custom-scrollbar" placeholder="Cole o roteiro ou resumo do seu vídeo para extração de contexto..." />
              </section>

              <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-6">
                 <div className="flex items-center gap-3 mb-2">
                   <Settings className="w-5 h-5 text-brand-pink" />
                   <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Opções de Geração</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                     {[
                       { id: 'ts', label: 'Auto Timestamps', checked: useTimestamps, set: setUseTimestamps },
                       { id: 'ht', label: 'Hashtags SEO', checked: useHashtags, set: setUseHashtags },
                       { id: 'cta', label: 'CTA Automático', checked: useCTA, set: setUseCTA },
                       { id: 'lk', label: 'Links Sociais', checked: useLinks, set: setUseLinks },
                     ].map(opt => (
                       <div key={opt.id} className="flex items-center justify-between p-4 bg-background-deep rounded-2xl border border-white/5">
                         <span className="text-xs font-bold text-gray-400">{opt.label}</span>
                         <button onClick={() => opt.set(!opt.checked)} className={`w-10 h-5 rounded-full transition-all relative ${opt.checked ? 'bg-brand-cyan' : 'bg-white/10'}`}>
                           <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${opt.checked ? 'left-6' : 'left-1'}`} />
                         </button>
                       </div>
                     ))}
                   </div>
                   <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tom Narrativo</label>
                        <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-3 text-xs font-bold">
                          <option value="profissional">Profissional</option>
                          <option value="casual">Casual</option>
                          <option value="empolgante">Empolgante</option>
                          <option value="educativo">Educativo</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">CTA Principal</label>
                        <select value={ctaId} onChange={e => setCtaId(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-3 text-xs font-bold">
                          {CTA_TEMPLATES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </div>
                   </div>
                 </div>
              </section>

              <button 
                onClick={generateDescription}
                disabled={isGenerating}
                className="w-full py-6 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink text-white font-orbitron text-xs font-black tracking-[0.4em] rounded-[24px] shadow-2xl hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-4 disabled:opacity-30 uppercase active:scale-[0.98]"
              >
                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                Disparar SEO de Elite
              </button>
            </div>
          )}

          {activeTab === 'hashtags' && (
            <div className="space-y-8 animate-in slide-in-from-left-4">
              <section className="bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-xl space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-brand-purple shadow-xl"><TrendingUp className="w-6 h-6" /></div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight">Hunter de Engajamento</h3>
                      <p className="text-xs text-gray-500 font-medium">Encontre as melhores tags para o seu nicho.</p>
                    </div>
                 </div>
                 <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tema Principal</label>
                     <input type="text" value={hhTopic} onChange={e => setHhTopic(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-brand-purple transition-all" placeholder="Ex: marketing digital canais dark" />
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Quantidade</label>
                       <select value={hhQty} onChange={e => setHhQty(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-xs font-bold outline-none">
                         <option value="15">15 Hashtags</option>
                         <option value="30">30 Hashtags</option>
                         <option value="50">50 Hashtags</option>
                       </select>
                     </div>
                     <div className="flex items-end">
                       <button onClick={findHashtags} disabled={isGenerating} className="w-full py-4 bg-brand-purple text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand-purple/20 flex items-center justify-center gap-2">
                         {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                         Buscar Tags
                       </button>
                     </div>
                   </div>
                 </div>
              </section>
            </div>
          )}

          {activeTab === 'timestamps' && (
            <div className="space-y-8 animate-in slide-in-from-left-4">
              <section className="bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-xl space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green shadow-xl"><Clock className="w-6 h-6" /></div>
                  <h3 className="text-xl font-black tracking-tight">Timestamp Inteligente</h3>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Duração Total</label>
                    <input type="text" value={tsDuration} onChange={e => setTsDuration(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-sm font-bold" placeholder="Ex: 15:30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Títulos dos Capítulos (um por linha)</label>
                    <textarea value={tsScript} onChange={e => setTsScript(e.target.value)} className="w-full h-48 bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-medium outline-none" placeholder="Abertura&#10;O grande segredo&#10;Dica prática 1&#10;Conclusão" />
                  </div>
                  <button onClick={generateTimestamps} className="w-full py-5 bg-brand-green text-background-deep font-black rounded-xl text-[10px] uppercase tracking-widest hover:scale-105 transition-all">⏱️ Gerar Distribuição Automática</button>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'cta' && (
            <div className="space-y-8 animate-in slide-in-from-left-4">
               <section className="bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-xl space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-pink/10 rounded-2xl flex items-center justify-center text-brand-pink shadow-xl"><Target className="w-6 h-6" /></div>
                    <h3 className="text-xl font-black tracking-tight">Configurar CTA</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Objetivo do Vídeo</label>
                      <select value={ctaGoal} onChange={e => setCtaGoal(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-xs font-bold outline-none">
                        <option value="subscribers">Ganhar inscritos</option>
                        <option value="engagement">Aumentar engajamento</option>
                        <option value="sales">Vender produto/serviço</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nome do Canal</label>
                      <input type="text" value={ctaChannelName} onChange={e => setCtaChannelName(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-sm font-bold" placeholder="@SeuCanal" />
                    </div>
                    <button onClick={generateCTAs} className="w-full py-5 bg-brand-pink text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand-pink/20">🎯 Gerar Chamadas para Ação</button>
                  </div>
               </section>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: OUTPUTS */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Progress Overlay */}
          {isGenerating && (
            <div className="bg-background-mid border border-brand-cyan/20 rounded-[40px] p-8 shadow-2xl space-y-4 animate-pulse">
               <div className="flex items-center gap-4 text-brand-cyan">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="font-orbitron text-[10px] font-black uppercase tracking-widest">{progressText}</span>
               </div>
               <div className="h-1 bg-background-deep rounded-full overflow-hidden">
                  <div className="h-full bg-brand-cyan w-1/2 animate-shimmer" />
               </div>
            </div>
          )}

          {/* DESCRIPTION OUTPUT */}
          {activeTab === 'description' && generatedResult.full && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
               <div className="bg-background-mid border border-white/10 rounded-[40px] overflow-hidden shadow-2xl">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                     <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest flex items-center gap-2">
                        <FileCode className="w-4 h-4" /> SEO Result v1.0
                     </span>
                     <button 
                        onClick={() => { navigator.clipboard.writeText(generatedResult.full); alert("Copiado!"); }}
                        className="p-3 bg-background-deep rounded-xl hover:text-brand-cyan transition-all"
                     >
                        <Copy className="w-4 h-4" />
                     </button>
                  </div>
                  <div 
                    className="p-8 font-medium text-sm leading-loose text-gray-400 h-[500px] overflow-y-auto custom-scrollbar whitespace-pre-wrap select-all"
                    dangerouslySetInnerHTML={{ __html: generatedResult.html }}
                  />
                  <div className="p-6 bg-background-deep/50 border-t border-white/5 flex items-center gap-6">
                     <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                           <span className="text-gray-500">SEO Score</span>
                           <span className={generatedResult.score > 70 ? 'text-brand-green' : 'text-brand-purple'}>{generatedResult.score}/100</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                           <div className={`h-full transition-all duration-1000 ${generatedResult.score > 70 ? 'bg-brand-green' : 'bg-brand-purple'}`} style={{ width: `${generatedResult.score}%` }} />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* HASHTAG OUTPUT */}
          {activeTab === 'hashtags' && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              {['low', 'med', 'high'].map(lvl => (
                hhResults[lvl as keyof typeof hhResults].length > 0 && (
                  <div key={lvl} className="bg-background-mid border border-white/5 rounded-[32px] p-6 space-y-4 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-purple opacity-40" />
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 px-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${lvl === 'low' ? 'bg-brand-green' : lvl === 'med' ? 'bg-brand-cyan' : 'bg-brand-purple'}`} />
                      Tags {lvl === 'low' ? 'Fáceis' : lvl === 'med' ? 'Médias' : 'Elite'}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                       {hhResults[lvl as keyof typeof hhResults].map(tag => (
                         <button key={tag} onClick={() => navigator.clipboard.writeText(tag)} className="px-3 py-1.5 bg-background-deep border border-white/5 rounded-lg text-[11px] font-bold text-gray-400 hover:text-white transition-all">{tag}</button>
                       ))}
                    </div>
                  </div>
                )
              ))}

              {hhCompAnalysis.length > 0 && (
                <div className="bg-background-mid border border-white/5 rounded-[32px] p-8 shadow-xl space-y-6">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                    <BarChart className="w-5 h-5 text-brand-cyan" /> Análise de Competição
                  </h4>
                  <div className="space-y-6">
                    {hhCompAnalysis.map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-end">
                           <span className="text-[11px] font-black text-brand-cyan">{item.tag}</span>
                           <span className="text-[9px] font-bold text-gray-600 uppercase">{item.vol} posts · {item.comp}% comp.</span>
                        </div>
                        <div className="h-1 bg-background-deep rounded-full overflow-hidden">
                           <div className="h-full bg-brand-cyan opacity-40" style={{ width: `${item.comp}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TIMESTAMPS OUTPUT */}
          {activeTab === 'timestamps' && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
               <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-2xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                     <h3 className="text-xl font-black tracking-tight">Capítulos Gerados</h3>
                     <button onClick={() => { navigator.clipboard.writeText(tsList.map(t => `${t.time} ${t.label}`).join('\n')); alert("Copiado!"); }} className="p-3 bg-white/5 rounded-xl hover:text-brand-green transition-all shadow-lg"><Copy className="w-5 h-5" /></button>
                  </div>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {tsList.length === 0 ? (
                      <div className="py-20 text-center opacity-20">
                        <Clock className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase">Nenhum timestamp</p>
                      </div>
                    ) : (
                      tsList.map((ts, i) => (
                        <div key={i} className="flex items-center gap-6 p-4 bg-background-deep border border-white/5 rounded-2xl group">
                           <span className="font-orbitron text-xs font-black text-brand-green shrink-0">{ts.time}</span>
                           <span className="text-sm font-bold text-gray-400 flex-1">{ts.label}</span>
                           <button onClick={() => setTsList(tsList.filter((_, idx) => idx !== i))} className="opacity-0 group-hover:opacity-100 p-2 text-gray-700 hover:text-brand-pink transition-all"><Trash className="w-4 h-4" /></button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-8 border-t border-white/5 space-y-6">
                    <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">Adicionar Manual</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <input type="text" value={tsManualTime} onChange={e => setTsManualTime(e.target.value)} className="bg-background-deep border border-white/10 rounded-xl p-3 text-xs font-bold" placeholder="00:00" />
                       <input type="text" value={tsManualLabel} onChange={e => setTsManualLabel(e.target.value)} className="bg-background-deep border border-white/10 rounded-xl p-3 text-xs font-bold" placeholder="Nome da cena" />
                    </div>
                    <button onClick={addTsManual} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">+ Adicionar Manualmente</button>
                  </div>
               </div>
            </div>
          )}

          {/* CTA OUTPUT */}
          {activeTab === 'cta' && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
               {ctaResults.length === 0 ? (
                 <div className="bg-background-mid border border-2 border-dashed border-white/5 rounded-[40px] py-32 text-center opacity-30">
                    <Target className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-orbitron text-xs font-black uppercase">Configure e gere CTAs</p>
               </div>
               ) : (
                 ctaResults.map((c, i) => (
                   <div key={i} className="bg-background-mid border border-white/5 rounded-[32px] p-8 shadow-xl space-y-6 group hover:border-brand-pink/20 transition-all">
                      <div className="flex justify-between items-start">
                         <span className="px-4 py-1.5 bg-brand-pink/10 border border-brand-pink/20 rounded-full text-[10px] font-black text-brand-pink uppercase tracking-widest">{c.name}</span>
                         <button onClick={() => { navigator.clipboard.writeText(c.text); alert("Copiado!"); }} className="p-3 bg-background-deep rounded-xl opacity-0 group-hover:opacity-100 hover:text-brand-pink transition-all shadow-xl"><Copy className="w-4 h-4" /></button>
                      </div>
                      <p className="text-sm font-medium leading-relaxed text-gray-400">{c.text}</p>
                      <button 
                        onClick={() => { setScriptText(prev => prev + '\n\n' + c.text); setActiveTab('description'); }}
                        className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-pink hover:bg-white/10 transition-all"
                      >
                        + Adicionar à Descrição Principal
                      </button>
                   </div>
                 ))
               )}
            </div>
          )}

        </div>
      </main>

      <footer className="mt-20 p-12 bg-background-mid border border-white/5 rounded-[56px] text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-brand-pink/5 opacity-50" />
         <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-white/5 rounded-[24px] flex items-center justify-center mx-auto text-brand-purple shadow-xl"><Brain className="w-8 h-8" /></div>
            <h4 className="text-2xl font-black tracking-tighter">Otimização Multimodal</h4>
            <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">Nossa IA analisa padrões de retenção dos maiores canais do mundo para construir descrições que não só melhoram o SEO, mas prendem o espectador.</p>
            <div className="flex justify-center gap-4 flex-wrap">
               <div className="px-6 py-2 bg-background-deep border border-white/5 rounded-xl text-[10px] font-black text-gray-600 uppercase tracking-widest">Model: Gemini 3 Flash</div>
               <div className="px-6 py-2 bg-background-deep border border-white/5 rounded-xl text-[10px] font-black text-gray-600 uppercase tracking-widest">Strategy: Viral SEO v5</div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default DescriptionBuilderTool;
