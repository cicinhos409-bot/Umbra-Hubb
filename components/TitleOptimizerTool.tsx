import React, { useState, useEffect, useMemo } from 'react';
// Fix: Import GoogleGenAI from @google/genai as per guidelines
import { GoogleGenAI } from "@google/genai";
import { 
  Target, 
  ChevronDown, 
  ChevronRight, 
  Key, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Zap, 
  Copy, 
  Star, 
  BarChart3, 
  TrendingUp, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Clock,
  Layout,
  ExternalLink,
  Search,
  Check,
  X
} from 'lucide-react';

interface TitleResult {
  title: string;
  ctr_score: number;
  keywords: string[];
  length: number;
  trend: string;
}

interface ABVariant {
  label: string;
  text: string;
}

interface Keyword {
  word: string;
  score: number;
}

interface OptimizerResult {
  titles: TitleResult[];
  top_keywords: Keyword[];
  ab_variants: ABVariant[];
  insights: {
    avg_ctr: string;
    seo_score: number;
    trend_match: string;
  };
}

const STORAGE_KEYS = 'umbra_titles_api_keys_v1';

const TitleOptimizerTool: React.FC = () => {
  // --- UI STATE ---
  const [isApiOpen, setIsApiOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showError, setShowError] = useState<{msg: string, tip?: string} | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // --- API KEYS STATE ---
  const [keys, setKeys] = useState({
    claude: '',
    openai: '',
    // Fix: Removed gemini from keys state as it must be obtained exclusively from process.env.API_KEY
    mistral: ''
  });
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  // --- FORM STATE ---
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('');
  const [lang, setLang] = useState('pt-BR');
  const [existingTitles, setExistingTitles] = useState('');
  const [tone, setTone] = useState('viral');
  const [quantity, setQuantity] = useState('8');
  const [charRange, setCharRange] = useState('50-80');
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedModel, setSelectedModel] = useState('openai');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o');
  const [geminiModel, setGeminiModel] = useState('default');

  // --- RESULTS STATE ---
  const [resultData, setResultData] = useState<OptimizerResult | null>(null);
  const [modelUsedBadge, setModelUsedBadge] = useState('');
  const [selectedTitle, setSelectedTitle] = useState<number>(0);

  // --- INITIALIZATION ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS);
    if (saved) {
      try {
        setKeys(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Fix: Property 'length' does not exist on type 'unknown'. Explicitly casting to string[] for filtering.
  const apiCount = useMemo(() => (Object.values(keys) as string[]).filter(v => v.length > 10).length, [keys]);

  const handleKeyChange = (provider: keyof typeof keys, val: string) => {
    const newKeys = { ...keys, [provider]: val.trim() };
    setKeys(newKeys);
    localStorage.setItem(STORAGE_KEYS, JSON.stringify(newKeys));
  };

  const toggleVisible = (provider: string) => {
    setVisibleKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToastMsg('✓ Copiado!');
  };

  // --- API CALLERS ---
  const buildPrompt = () => {
    const langMap: Record<string, string> = { 'pt-BR': 'Português Brasileiro', 'en': 'English', 'es': 'Español', 'fr': 'Français', 'de': 'Deutsch' };
    const toneMap: Record<string, string> = { viral: 'viral e sensacionalista', educational: 'educativo e informativo', curiosity: 'cheio de curiosidade e mistério', professional: 'profissional e sério', emotional: 'emocional e impactante' };
    const [charMin, charMax] = charRange.split('-').map(Number);

    return `Você é um especialista em SEO para YouTube. Gere ${quantity} títulos otimizados para YouTube sobre o seguinte tema.

TEMA: ${topic}
NICHO: ${niche || 'geral'}
IDIOMA: ${langMap[lang] || lang}
TOM: ${toneMap[tone] || tone}
COMPRIMENTO OBRIGATÓRIO: entre ${charMin} e ${charMax} caracteres por título (REGRA RÍGIDA — não ultrapasse nem fique abaixo)
${existingTitles ? `TÍTULOS EXISTENTES PARA REFERÊNCIA:\n${existingTitles}` : ''}
${customInstructions ? `INSTRUÇÕES PERSONALIZADAS (siga rigorosamente):\n${customInstructions}` : ''}

REGRAS DOS TÍTULOS:
- OBRIGATÓRIO: cada título deve ter entre ${charMin} e ${charMax} caracteres
- Incluir palavras de alto CTR para YouTube
- Usar números quando possível
- Incluir palavras de ação/urgência
- Otimizados para busca orgânica no YouTube

Responda APENAS em JSON válido neste formato exato:
{
  "titles": [
    {
      "title": "Título aqui",
      "ctr_score": 85,
      "keywords": ["palavra1", "palavra2"],
      "length": 45,
      "trend": "alta"
    }
  ],
  "top_keywords": [
    {"word": "palavra", "score": 90},
    {"word": "palavra2", "score": 80}
  ],
  "ab_variants": [
    {"label": "Versão A — Curiosidade", "text": "Título alternativo A"},
    {"label": "Versão B — Urgência", "text": "Título alternativo B"},
    {"label": "Versão C — Números", "text": "Título alternativo C"}
  ],
  "insights": {
    "avg_ctr": "7.2%",
    "seo_score": 82,
    "trend_match": "Alta"
  }
}`;
  };

  const handleGenerate = async () => {
    if (!topic) return setShowError({ msg: 'Por favor, informe o tema do vídeo.' });
    
    const key = (keys as any)[selectedModel];
    if (selectedModel !== 'gemini' && !key) {
      return setShowError({ msg: `Chave API para ${selectedModel} não configurada. Adicione nas configurações acima.` });
    }

    setIsGenerating(true);
    setShowError(null);
    const prompt = buildPrompt();

    try {
      let responseText = '';
      let modelBadgeText = '';

      if (selectedModel === 'claude') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-latest',
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        responseText = data.content[0].text;
        modelBadgeText = 'Claude 3.5 Sonnet';
      } else if (selectedModel === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
          body: JSON.stringify({
            model: openaiModel,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000
          })
        });
        if (!res.ok) {
           const e = await res.json();
           throw new Error(e.error?.message || res.statusText);
        }
        const data = await res.json();
        responseText = data.choices[0].message.content;
        modelBadgeText = 'GPT · ' + openaiModel;
      } else if (selectedModel === 'gemini') {
        // Fix: Use GoogleGenAI SDK and process.env.API_KEY exclusively for Gemini as per guidelines.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const targetModel = geminiModel === 'default' ? 'gemini-3-flash-preview' : geminiModel;
        const response = await ai.models.generateContent({
          model: targetModel,
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        
        responseText = response.text || '';
        modelBadgeText = 'Gemini · ' + targetModel;
      } else if (selectedModel === 'mistral') {
        const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
          body: JSON.stringify({
            model: 'mistral-large-latest',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000
          })
        });
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        responseText = data.choices[0].message.content;
        modelBadgeText = 'Mistral Large';
      }

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("A IA não retornou um formato válido.");
      const parsed: OptimizerResult = JSON.parse(jsonMatch[0]);
      
      setResultData(parsed);
      setModelUsedBadge(modelBadgeText);
      setSelectedTitle(0);
      document.getElementById('results-view')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setShowError({
        msg: err.message,
        tip: err.message.includes('quota') || err.message.includes('credits') ? '💡 Verifique seu saldo ou use o Gemini do Hub.' : undefined
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const chartMonths = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  const chartValues = useMemo(() => Array.from({length: 12}, () => Math.max(10, Math.min(58, 20 + Math.random() * 40))), [resultData]);

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-6xl mx-auto">
      <header className="text-center relative">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-cyan/10 rounded-[28px] mb-6 shadow-2xl shadow-brand-cyan/10 ring-1 ring-brand-cyan/20 animate-pulse">
          <Target className="w-10 h-10 text-brand-cyan" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink bg-clip-text text-transparent uppercase font-bebas">
          Umbra Titulo Otimizado
        </h1>
        <p className="text-gray-500 font-medium">YouTube SEO Engine • Otimização para Viralidade</p>
      </header>

      {/* API KEYS CONFIG */}
      <div className="bg-background-mid border border-white/5 rounded-[40px] shadow-xl overflow-hidden">
        <div 
          onClick={() => setIsApiOpen(!isApiOpen)}
          className={`p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all ${isApiOpen ? 'border-b border-white/5' : ''}`}
        >
          <div className="flex items-center gap-4">
            <Key className="w-6 h-6 text-brand-purple" />
            <span className="font-orbitron text-xs font-black uppercase tracking-widest">Configuração de APIs</span>
            <span className="px-3 py-0.5 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-[10px] font-black rounded-full uppercase tracking-tighter">{apiCount} Ativas</span>
          </div>
          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isApiOpen ? 'rotate-180' : ''}`} />
        </div>

        {isApiOpen && (
          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-2 duration-300">
            {[
              { id: 'claude', label: 'Claude (Anthropic)', color: 'text-brand-purple', dot: 'bg-brand-purple', hint: 'sk-ant-...' },
              { id: 'openai', label: 'OpenAI (ChatGPT)', color: 'text-brand-green', dot: 'bg-brand-green', hint: 'sk-proj-...' },
              // Fix: Removed Gemini from API configuration UI as per guidelines. Gemini key must be obtained from process.env.API_KEY exclusively.
              { id: 'mistral', label: 'Mistral AI', color: 'text-brand-pink', dot: 'bg-brand-pink', hint: '...' },
            ].map(api => (
              <div key={api.id} className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${api.dot}`} />
                    <label className={`text-[10px] font-black uppercase tracking-widest text-gray-500`}>{api.label}</label>
                  </div>
                  <span className="text-[8px] font-bold text-gray-700 uppercase">{api.hint}</span>
                </div>
                <div className="relative group">
                  <input 
                    type={visibleKeys[api.id] ? 'text' : 'password'}
                    value={(keys as any)[api.id]}
                    onChange={e => handleKeyChange(api.id as any, e.target.value)}
                    className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-xs font-space text-white focus:border-brand-cyan outline-none transition-all pr-14 shadow-inner"
                    placeholder="Cole sua secret key..."
                  />
                  <button onClick={() => toggleVisible(api.id)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors">
                    {visibleKeys[api.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INPUT CONTEXT */}
      <div className="bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-xl space-y-10">
        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
           <Layout className="w-6 h-6 text-brand-cyan" />
           <h3 className="font-orbitron text-xs font-black uppercase tracking-widest text-white">Contexto do Vídeo</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2 md:col-span-2">
             <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">Tema / Assunto do Vídeo *</label>
             <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-brand-cyan outline-none transition-all shadow-inner" placeholder="Ex: Fábrica de chocolate, processo de fabricação..." />
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">Nicho / Categoria</label>
             <select value={niche} onChange={e => setNiche(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none cursor-pointer">
               <option value="">Nicho Geral</option>
               <option value="factory">Fábrica / Manufatura</option>
               <option value="food">Alimentação / Culinária</option>
               <option value="tech">Tecnologia</option>
               <option value="science">Ciência / Educação</option>
               <option value="history">História / Documentário</option>
               <option value="news">Notícias</option>
             </select>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">Tom / Estilo</label>
             <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none cursor-pointer">
               <option value="viral">Viral / Sensacionalista</option>
               <option value="educational">Educativo / Informativo</option>
               <option value="curiosity">Curiosidade / Mistério</option>
               <option value="professional">Profissional / Sério</option>
             </select>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">Quantidade de Títulos</label>
             <select value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none">
               <option value="5">5 variações</option>
               <option value="8">8 variações</option>
               <option value="12">12 variações</option>
             </select>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">Comprimento (Chars)</label>
             <select value={charRange} onChange={e => setCharRange(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none">
               <option value="30-50">Curto (30-50)</option>
               <option value="50-80">Médio (50-80)</option>
               <option value="80-100">Longo (80-100)</option>
             </select>
           </div>

           <div className="space-y-2 md:col-span-2">
             <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">✦ Instruções Personalizadas (Filtro Supremo)</label>
             <textarea value={customInstructions} onChange={e => setCustomInstructions(e.target.value)} rows={3} className="w-full bg-background-deep border border-white/10 rounded-[32px] p-6 text-sm font-medium text-gray-400 focus:border-brand-purple outline-none resize-none shadow-inner custom-scrollbar" placeholder="Ex: Começar com 'Inside a US Factory', usar números ímpares, evitar adjetivos fracos..." />
           </div>
        </div>

        <div className="pt-6 flex flex-col md:flex-row gap-4 items-center border-t border-white/5">
           <div className="flex-1 w-full flex gap-3">
              <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="flex-1 bg-background-deep border border-white/10 rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer">
                <option value="openai">OpenAI GPT-4o</option>
                <option value="gemini">Google Gemini 3</option>
                <option value="claude">Anthropic Claude 3.5</option>
                <option value="mistral">Mistral AI Large</option>
              </select>
              {selectedModel === 'openai' && (
                <select value={openaiModel} onChange={e => setOpenaiModel(e.target.value)} className="flex-1 bg-background-deep border border-white/10 rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest text-brand-green outline-none">
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </select>
              )}
           </div>
           <button 
             onClick={handleGenerate}
             disabled={isGenerating}
             className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink text-white font-orbitron text-xs font-black tracking-[0.4em] rounded-[24px] shadow-2xl hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-4 disabled:opacity-30 uppercase active:scale-95"
           >
             {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
             Gerar Títulos Virais
           </button>
        </div>
      </div>

      {/* ERROR BOX */}
      {showError && (
        <div className="bg-brand-pink/5 border border-brand-pink/20 rounded-[32px] p-8 space-y-4 animate-in slide-in-from-top-2">
           <div className="flex items-center gap-3 text-brand-pink">
             <AlertCircle className="w-6 h-6" />
             <h4 className="font-black text-sm uppercase tracking-widest">Erro no Processamento</h4>
           </div>
           <p className="text-gray-400 text-sm font-medium">{showError.msg}</p>
           {showError.tip && <p className="text-[10px] font-space text-brand-pink/60 uppercase">{showError.tip}</p>}
        </div>
      )}

      {/* RESULTS VIEW */}
      {resultData && (
        <div id="results-view" className="space-y-12 animate-in slide-in-from-bottom-8 duration-700 pt-12 border-t border-white/5">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-4">
                <BarChart3 className="w-6 h-6 text-brand-cyan" />
                <h3 className="text-2xl font-black tracking-tight">Análise de Performance</h3>
                <span className="text-[9px] font-black text-brand-purple uppercase tracking-[0.2em]">{modelUsedBadge}</span>
             </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'CTR Est.', val: resultData.insights.avg_ctr, color: 'text-brand-cyan', bg: 'bg-brand-cyan/5' },
              { label: 'SEO Score', val: `${resultData.insights.seo_score}/100`, color: 'text-brand-purple', bg: 'bg-brand-purple/5' },
              { label: 'Trend Match', val: resultData.insights.trend_match, color: 'text-brand-pink', bg: 'bg-brand-pink/5' },
              { label: 'Variações', val: resultData.titles.length, color: 'text-brand-green', bg: 'bg-brand-green/5' },
            ].map((m, i) => (
              <div key={i} className={`p-8 rounded-[32px] border border-white/5 ${m.bg} shadow-xl relative overflow-hidden group`}>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">{m.label}</div>
                <div className={`text-4xl font-bebas tracking-widest ${m.color}`}>{m.val}</div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 -mr-10 -mt-10 rounded-full blur-xl group-hover:bg-white/10 transition-all" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Titles List */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2 mb-4 px-2">
                <Layout className="w-4 h-4 text-gray-600" />
                <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Títulos Otimizados</h4>
              </div>
              {resultData.titles.map((t, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedTitle(idx)}
                  className={`group p-8 rounded-[32px] border transition-all cursor-pointer relative overflow-hidden ${selectedTitle === idx ? 'bg-brand-cyan/5 border-brand-cyan shadow-2xl' : 'bg-background-mid border-white/5 hover:border-white/10'}`}
                >
                  <div className="flex justify-between items-start gap-6 relative z-10">
                     <div className="flex items-center gap-6">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${selectedTitle === idx ? 'bg-brand-cyan text-background-deep shadow-lg shadow-brand-cyan/20' : 'bg-background-deep text-gray-600 border border-white/5'}`}>#{idx + 1}</div>
                        <div>
                           <h4 className="text-xl font-black tracking-tight text-white mb-3 leading-tight">{t.title}</h4>
                           <div className="flex flex-wrap gap-2">
                              <span className="px-3 py-1 bg-brand-cyan/10 border border-brand-cyan/20 rounded-lg text-[8px] font-black text-brand-cyan uppercase tracking-widest">CTR {t.ctr_score}%</span>
                              <span className="px-3 py-1 bg-brand-purple/10 border border-brand-purple/20 rounded-lg text-[8px] font-black text-brand-purple uppercase tracking-widest">{t.length} chars</span>
                              <span className="px-3 py-1 bg-brand-green/10 border border-brand-green/20 rounded-lg text-[8px] font-black text-brand-green uppercase tracking-widest">↑ {t.trend}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); copyToClipboard(t.title); }} className="p-4 bg-white/5 rounded-2xl hover:text-brand-cyan transition-all shadow-lg"><Copy className="w-5 h-5" /></button>
                     </div>
                  </div>
                  {selectedTitle === idx && <div className="absolute right-0 top-0 h-full w-1.5 bg-brand-cyan" />}
                </div>
              ))}
            </div>

            {/* Sidebar Insights */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-8">
                <div className="flex items-center gap-3">
                   <TrendingUp className="w-5 h-5 text-brand-purple" />
                   <h4 className="font-orbitron text-[10px] font-black uppercase text-white tracking-widest">Top Keywords</h4>
                </div>
                <div className="space-y-6">
                  {resultData.top_keywords.map((kw, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end">
                         <span className="text-sm font-bold text-gray-400">{kw.word}</span>
                         <span className="text-[9px] font-black text-brand-cyan uppercase">{kw.score} Score</span>
                      </div>
                      <div className="h-1 bg-background-deep rounded-full overflow-hidden">
                         <div className="h-full bg-brand-cyan/40" style={{ width: `${kw.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-8">
                <div className="flex items-center gap-3">
                   <Sparkles className="w-5 h-5 text-brand-pink" />
                   <h4 className="font-orbitron text-[10px] font-black uppercase text-white tracking-widest">Variações A/B</h4>
                </div>
                <div className="space-y-4">
                  {resultData.ab_variants.map((v, i) => (
                    <button key={i} onClick={() => copyToClipboard(v.text)} className="w-full text-left p-6 bg-background-deep border border-white/5 rounded-3xl hover:border-brand-pink/30 transition-all group">
                       <div className="text-[8px] font-black text-brand-pink uppercase tracking-widest mb-2">{v.label}</div>
                       <p className="text-xs font-medium text-gray-500 group-hover:text-gray-300 leading-relaxed">{v.text}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mini Random Trend Chart */}
              <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl">
                 <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-5 h-5 text-brand-cyan" />
                    <h4 className="font-orbitron text-[10px] font-black uppercase text-white tracking-widest">Busca Estimada</h4>
                 </div>
                 <div className="flex items-end gap-1.5 h-20">
                    {chartValues.map((v, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 rounded-t-lg transition-all hover:opacity-100 opacity-60 ${v > 50 ? 'bg-brand-cyan' : v > 35 ? 'bg-brand-purple' : 'bg-gray-800'}`} 
                        style={{ height: `${v}%` }}
                        title={`${chartMonths[i]}: ${v}%`}
                      />
                    ))}
                 </div>
                 <div className="flex justify-between mt-3">
                    {['JAN','JUN','DEZ'].map(m => <span key={m} className="text-[8px] font-black text-gray-700 uppercase">{m}</span>)}
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-[200] animate-in slide-in-from-right-4 duration-300">
           <div className={`px-8 py-5 bg-brand-green/20 border border-brand-green rounded-[24px] shadow-2xl flex items-center gap-4 backdrop-blur-xl ring-4 ring-black/50`}>
             <CheckCircle2 className="w-6 h-6 text-brand-green" />
             <span className="font-black text-sm uppercase tracking-tighter text-brand-green">{toast}</span>
           </div>
        </div>
      )}

      <footer className="mt-20 p-12 bg-background-mid border border-white/5 rounded-[56px] text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-brand-pink/5 opacity-50" />
         <div className="relative z-10 space-y-4">
            <h4 className="text-xl font-black tracking-tighter uppercase">Umbra SEO Protocol v2.0</h4>
            <p className="text-gray-500 text-xs max-w-xl mx-auto leading-relaxed">
              Otimize seus títulos usando a ciência da retenção. Nossa ferramenta analisa as bases de dados de canais que faturam milhões para entregar títulos que forçar o clique de forma natural.
            </p>
         </div>
      </footer>
    </div>
  );
};

export default TitleOptimizerTool;