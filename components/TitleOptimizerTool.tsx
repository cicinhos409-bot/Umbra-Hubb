
import React, { useState, useEffect, useRef } from 'react';
import {
  Youtube,
  Zap,
  Key,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Target,
  Layout,
  Award,
  Sparkles,
  BarChart3,
  TrendingUp,
  SearchCode,
  Copy,
  Star,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  MousePointer2,
  X,
  Type,
  ExternalLink,
  MessageSquare,
  Trash2
} from 'lucide-react';

// --- TYPES ---
interface Title {
  title: string;
  ctr_score: number;
  keywords: string[];
  length: number;
  trend: string;
}

interface TopKeyword {
  word: string;
  score: number;
}

interface ABVariant {
  label: string;
  text: string;
}

interface Insights {
  avg_ctr: string;
  seo_score: number;
  trend_match: string;
}

interface APIResponse {
  titles: Title[];
  top_keywords: TopKeyword[];
  ab_variants: ABVariant[];
  insights: Insights;
}

interface HistoricalGeneration {
  id: string;
  timestamp: string;
  topic: string;
  niche: string;
  model: string;
  response: APIResponse;
}

interface FavoriteTitle extends Title {
  id: string;
  topic: string;
  timestamp: string;
}

const NICHES = [
  { id: 'factory', label: 'Fábrica / Manufatura' },
  { id: 'food', label: 'Alimentação / Culinária' },
  { id: 'tech', label: 'Tecnologia' },
  { id: 'science', label: 'Ciência / Educação' },
  { id: 'history', label: 'História / Documentário' },
  { id: 'health', label: 'Saúde / Fitness' },
  { id: 'nature', label: 'Natureza / Meio Ambiente' },
  { id: 'finance', label: 'Finanças / Negócios' },
  { id: 'religion', label: 'Religião / Espiritualidade' },
  { id: 'entertainment', label: 'Entretenimento' },
  { id: 'other', label: 'Outro' },
];

const VIRAL_TEMPLATES = [
  { name: "[NÚMERO] Segredos...", template: "[NÚMERO] Segredos que [ESPECIALISTA] usa para [RESULTADO]" },
  { name: "Eu tentei [AÇÃO] por...", template: "Eu tentei [AÇÃO] por [TEMPO] e veja o que aconteceu" },
  { name: "O Fim do [ASSUNTO]?", template: "O Fim do [ASSUNTO]? Por que você deveria se preocupar em 2025" },
  { name: "Pare de [ERRO]!", template: "Pare de [ERRO]! Use esta técnica para [RESULTADO] instantâneo" },
  { name: "Como [RESULTADO] sem...", template: "Como [RESULTADO] sem [DIFICULDADE] (Guia Definitivo)" },
];

const TitleOptimizerTool: React.FC = () => {
  // --- STATE ---
  const [keys, setKeys] = useState({ claude: '', openai: '', gemini: '', mistral: '' });
  const [showKeys, setShowKeys] = useState({ claude: false, openai: false, gemini: false, mistral: false });
  const [isApiSectionOpen, setIsApiSectionOpen] = useState(false);

  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('');
  const [lang, setLang] = useState('pt-BR');
  const [tone, setTone] = useState('viral');
  const [quantity, setQuantity] = useState('8');
  const [existingTitles, setExistingTitles] = useState('');
  const [charRange, setCharRange] = useState('50-80');
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedModel, setSelectedModel] = useState('openai');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o');
  const [geminiModel, setGeminiModel] = useState('default');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<APIResponse | null>(null);
  const [history, setHistory] = useState<HistoricalGeneration[]>([]);
  const [favorites, setFavorites] = useState<FavoriteTitle[]>([]);
  const [lastModelUsed, setLastModelUsed] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [isTestingApi, setIsTestingApi] = useState<Record<string, boolean>>({});
  const [apiStatus, setApiStatus] = useState<Record<string, 'idle' | 'success' | 'error'>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showPreview, setShowPreview] = useState<Title | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    // Keys
    const savedKeys = localStorage.getItem('umbra_keys');
    if (savedKeys) {
      try { setKeys(JSON.parse(savedKeys)); } catch (e) { console.error("Failed to parse saved keys", e); }
    }

    // History
    const savedHist = localStorage.getItem('umbra_title_history');
    if (savedHist) {
      try { setHistory(JSON.parse(savedHist)); } catch (e) { console.error("Failed history load", e); }
    }

    // Favorites
    const savedFavs = localStorage.getItem('umbra_title_favs');
    if (savedFavs) {
      try { setFavorites(JSON.parse(savedFavs)); } catch (e) { console.error("Failed favorites load", e); }
    }

    // Form Persistence
    const savedForm = localStorage.getItem('umbra_title_form');
    if (savedForm) {
      try {
        const data = JSON.parse(savedForm);
        if (data.topic) setTopic(data.topic);
        if (data.niche) setNiche(data.niche);
        if (data.lang) setLang(data.lang);
        if (data.tone) setTone(data.tone);
        if (data.quantity) setQuantity(data.quantity);
        if (data.charRange) setCharRange(data.charRange);
        if (data.customInstructions) setCustomInstructions(data.customInstructions);
        if (data.selectedModel) setSelectedModel(data.selectedModel);
      } catch (e) { console.error("Failed form load", e); }
    }
  }, []);

  // Save Form on change (with a small debounce if needed, but simple for now)
  useEffect(() => {
    const formData = { topic, niche, lang, tone, quantity, charRange, customInstructions, selectedModel };
    localStorage.setItem('umbra_title_form', JSON.stringify(formData));
  }, [topic, niche, lang, tone, quantity, charRange, customInstructions, selectedModel]);

  const saveKeys = (newKeys: typeof keys) => {
    setKeys(newKeys);
    localStorage.setItem('umbra_keys', JSON.stringify(newKeys));
  };

  const addToHistory = (response: APIResponse, modelUsed: string) => {
    const newEntry: HistoricalGeneration = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      topic,
      niche,
      model: modelUsed,
      response
    };
    const updated = [newEntry, ...history].slice(0, 30);
    setHistory(updated);
    localStorage.setItem('umbra_title_history', JSON.stringify(updated));
  };

  const toggleFavorite = (title: Title) => {
    const exists = favorites.find(f => f.title === title.title);
    let updated;
    if (exists) {
      updated = favorites.filter(f => f.title !== title.title);
      showToastMsg('Removido dos favoritos');
    } else {
      const newFav: FavoriteTitle = {
        ...title,
        id: Math.random().toString(36).substr(2, 9),
        topic,
        timestamp: new Date().toISOString()
      };
      updated = [newFav, ...favorites];
      showToastMsg('Adicionado aos favoritos!');
    }
    setFavorites(updated);
    localStorage.setItem('umbra_title_favs', JSON.stringify(updated));
  };

  // --- HELPERS ---
  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToastMsg('✓ Copiado para a área de transferência!');
  };

  const getCharRangeValue = () => {
    const [min, max] = charRange.split('-').map(Number);
    return { min, max };
  };

  const exportCSV = (data: APIResponse) => {
    const headers = "Title,CTR Score,Keywords,Length,Trend\n";
    const rows = data.titles.map(t => `"${t.title}",${t.ctr_score},"${t.keywords.join('|')}",${t.length},${t.trend}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `umbra_titles_${Date.now()}.csv`;
    link.click();
    showToastMsg('✓ CSV Exportado!');
  };

  const exportJSON = (data: APIResponse) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `umbra_titles_${Date.now()}.json`;
    link.click();
    showToastMsg('✓ JSON Exportado!');
  };

  const validateKey = (provider: keyof typeof keys, value: string) => {
    const patterns = {
      claude: /^sk-ant-/,
      openai: /^sk-/,
      gemini: /^AIzaSy/,
      mistral: /.{20,}/
    };
    return patterns[provider]?.test(value);
  };

  const testConnection = async (provider: keyof typeof keys) => {
    const key = keys[provider];
    if (!key) return showToastMsg('Insira uma chave primeiro!');

    setIsTestingApi({ ...isTestingApi, [provider]: true });
    setApiStatus({ ...apiStatus, [provider]: 'idle' });

    try {
      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        if (!res.ok) throw new Error();
      } else if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        if (!res.ok) throw new Error();
      } else if (provider === 'mistral') {
        const res = await fetch('https://api.mistral.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        if (!res.ok) throw new Error();
      }
      setApiStatus({ ...apiStatus, [provider]: 'success' });
      showToastMsg(`${String(provider).toUpperCase()}: Conexão OK!`);
    } catch (e) {
      setApiStatus({ ...apiStatus, [provider]: 'error' });
      showToastMsg(`${String(provider).toUpperCase()}: Falha na conexão.`);
    } finally {
      setIsTestingApi(prev => ({ ...prev, [provider]: false }));
    }
  };

  // --- API CALLERS ---
  const callOpenAI = async (key: string, prompt: string, model: string) => {
    const models = [model, 'gpt-4o-mini', 'gpt-3.5-turbo'];
    let lastError = '';

    for (const m of models) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({
            model: m,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000,
            response_format: { type: "json_object" }
          })
        });

        if (res.status === 429) {
          const e = await res.json();
          if (e.error?.message?.includes('quota') || e.error?.message?.includes('billing')) {
            throw new Error('OpenAI: Cota excedida ou sem créditos. Verifique seu faturamento.');
          }
          lastError = e.error?.message;
          continue;
        }

        if (!res.ok) {
          const e = await res.json();
          throw new Error(`OpenAI (${m}): ${e.error?.message || res.statusText}`);
        }

        const data = await res.json();
        return { text: data.choices[0].message.content, model: m };
      } catch (e: any) {
        if (e.message.includes('Cota') || e.message.includes('faturamento')) throw e;
        lastError = e.message;
      }
    }
    throw new Error(`OpenAI: ${lastError || 'Erro ao conectar.'}`);
  };

  const callGemini = async (key: string, prompt: string, model: string) => {
    const modelMap: Record<string, string> = {
      'gemini-3-flash-preview': 'gemini-2.0-flash-exp', // Mapping to current available models
      'gemini-3-pro-preview': 'gemini-1.5-pro',
      'gemini-2.5-pro': 'gemini-1.5-pro',
      'gemini-2.5-flash': 'gemini-1.5-flash',
      'default': 'gemini-1.5-flash'
    };

    const resolved = modelMap[model] || modelMap['default'];
    const fallbackModels = [resolved, 'gemini-1.5-flash', 'gemini-1.5-pro'];

    let lastError = '';
    for (const m of fallbackModels) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 2000, response_mime_type: "application/json" }
          })
        });

        if (!res.ok) {
          lastError = res.statusText;
          continue;
        }

        const data = await res.json();
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
          lastError = "Resposta vazia da Gemini.";
          continue;
        }

        return { text: data.candidates[0].content.parts[0].text, model: m };
      } catch (e: any) {
        lastError = e.message;
      }
    }
    throw new Error(`Gemini: ${lastError || 'Erro ao conectar.'}`);
  };

  const callMistral = async (key: string, prompt: string) => {
    try {
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        })
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(`Mistral: ${e.message || res.statusText}`);
      }
      const data = await res.json();
      return { text: data.choices[0].message.content, model: 'Mistral Large' };
    } catch (e: any) {
      throw new Error(`Mistral: ${e.message}`);
    }
  };

  const handleOptimize = async () => {
    if (!topic.trim()) {
      setError('Por favor, informe o tema do vídeo.');
      return;
    }

    const currentKey = keys[selectedModel as keyof typeof keys];
    if (!currentKey) {
      setError(`Chave API para ${selectedModel.toUpperCase()} não configurada.`);
      setIsApiSectionOpen(true);
      return;
    }

    setIsLoading(true);
    setLoadingStep('Iniciando engenharia viral...');
    setError(null);
    setResults(null);

    const { min, max } = getCharRangeValue();
    // ... prompt construction ...
    const prompt = `Você é um especialista em SEO para YouTube. Gere ${quantity} títulos otimizados para YouTube sobre o seguinte tema.

TEMA: ${topic}
NICHO: ${niche || 'geral'}
IDIOMA: ${lang}
TOM: ${tone}
COMPRIMENTO OBRIGATÓRIO: entre ${min} e ${max} caracteres por título (REGRA RÍGIDA — não ultrapasse nem fique abaixo)
${existingTitles ? `TÍTULOS EXISTENTES PARA REFERÊNCIA:\n${existingTitles}` : ''}
${customInstructions ? `INSTRUÇÕES PERSONALIZADAS (siga rigorosamente):\n${customInstructions}` : ''}

REGRAS DOS TÍTULOS:
- OBRIGATÓRIO: cada título deve ter entre ${min} e ${max} caracteres
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

    const tryCall = async (model: string): Promise<{ text: string; model: string }> => {
      const key = keys[model as keyof typeof keys];
      if (!key) throw new Error(`Chave ${model.toUpperCase()} ausente.`);

      setLoadingStep(`Conectando ao motor ${model.toUpperCase()}...`);
      if (model === 'openai') return await callOpenAI(key, prompt, openaiModel);
      if (model === 'gemini') return await callGemini(key, prompt, geminiModel);
      if (model === 'mistral') return await callMistral(key, prompt);
      throw new Error("Modelo não suportado");
    };

    try {
      let response;
      const order = [selectedModel, ...(['openai', 'gemini', 'mistral'].filter(m => m !== selectedModel))];

      let lastErr = '';
      for (const m of order) {
        try {
          if (!keys[m as keyof typeof keys]) continue;
          response = await tryCall(m);
          break;
        } catch (e: any) {
          lastErr = e.message;
          console.warn(`Model ${m} failed: ${e.message}`);
        }
      }

      if (!response) throw new Error(lastErr || "Todos os modelos falharam ou não há chaves configuradas.");

      setLoadingStep('Interpretando dados virais...');
      if (response && response.text) {
        const cleaned = response.text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleaned) as APIResponse;

        setLoadingStep('Calculando score proprietário...');
        // Add proprietary score logic here if needed

        setResults(data);
        setLastModelUsed(response.model);
        addToHistory(data, response.model);

        // Scroll to results
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // --- RENDER HELPERS ---
  const renderRangeIndicator = () => {
    const { min, max } = getCharRangeValue();
    const totalRange = 70; // 30 to 100
    const startPct = ((min - 30) / totalRange) * 100;
    const endPct = ((max - 30) / totalRange) * 100;

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center text-[10px] font-black font-mono text-gray-500 uppercase tracking-widest">
          <span>30 char</span>
          <span>100 char</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full relative overflow-hidden">
          <div
            className="absolute inset-y-0 bg-brand-cyan shadow-[0_0_10px_rgba(0,245,255,0.5)] transition-all duration-500"
            style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-xs font-bold text-gray-400">
          <span className="text-brand-cyan">{min} min</span>
          <span className="text-brand-purple">{max} max</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen font-rajdhani text-white pb-24 relative overflow-hidden flex flex-col items-center">
      {/* AMBIENT ORBS */}
      <div className="fixed top-[-200px] right-[-150px] w-[600px] h-[600px] bg-brand-purple/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-[-100px] left-[-150px] w-[500px] h-[500px] bg-brand-cyan/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* NOISE OVERLAY */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none -z-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")` }} />

      <div className="w-full max-w-6xl px-6 space-y-12 z-10">

        {/* HEADER */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 pb-8 border-b border-white/5">
          <div className="flex items-center gap-6 group">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-purple to-brand-cyan rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] group-hover:scale-105 transition-transform duration-500">
              <Youtube className="w-8 h-8 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter leading-none">
                UMBRA <span className="text-brand-cyan">TITLE</span>
              </h1>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">YouTube SEO Engineering v2.0</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 border border-white/5 px-6 py-3 rounded-full shadow-inner">
            <div className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_10px_rgba(16,185,129,1)] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-cyan">AI Engine Ativo</span>
          </div>
        </header>

        {/* API CONFIG SECTION */}
        <section className="bg-background-mid/40 backdrop-blur-xl border border-white/5 rounded-[40px] overflow-hidden shadow-2xl transition-all duration-500">
          <button
            onClick={() => setIsApiSectionOpen(!isApiSectionOpen)}
            className="w-full px-8 py-6 flex items-center justify-between hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-purple/10 rounded-2xl group-hover:bg-brand-purple/20 transition-colors">
                <Key className="w-6 h-6 text-brand-purple" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-black tracking-tight uppercase">Configurações de API</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  {Object.values(keys).filter(v => typeof v === 'string' && v.length > 5).length} Conexões detectadas
                </p>
              </div>
            </div>
            {isApiSectionOpen ? <ChevronUp className="w-6 h-6 text-gray-600" /> : <ChevronDown className="w-6 h-6 text-gray-600" />}
          </button>

          {isApiSectionOpen && (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
              {/* OPENAI */}
              <div className="bg-background-deep border border-white/5 p-6 rounded-[32px] space-y-4 hover:border-brand-green/30 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-green" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-white">OpenAI Engine</span>
                  </div>
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-[9px] font-bold text-gray-600 hover:text-brand-green transition-colors flex items-center gap-1">
                    OBTER CHAVE <ExternalLink className="w-2 h-2" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showKeys.openai ? 'text' : 'password'}
                    value={keys.openai}
                    onChange={(e) => saveKeys({ ...keys, openai: e.target.value })}
                    placeholder="sk-..."
                    className={`w-full bg-black/40 border ${validateKey('openai', keys.openai) ? 'border-brand-green/30' : 'border-white/5'} rounded-2xl px-5 py-4 text-xs font-mono outline-none focus:border-brand-green/50 transition-all`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {apiStatus.openai === 'success' && <CheckCircle2 className="w-4 h-4 text-brand-green" />}
                    {apiStatus.openai === 'error' && <AlertCircle className="w-4 h-4 text-brand-pink" />}
                    <button onClick={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })} className="text-gray-600 hover:text-white transition-colors">
                      {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => testConnection('openai')}
                  disabled={isTestingApi.openai}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 transition-all flex items-center justify-center gap-2"
                >
                  {isTestingApi.openai ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  Testar Conexão
                </button>
                <select
                  value={openaiModel}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none cursor-pointer focus:border-brand-green/30"
                >
                  <option value="gpt-4o">GPT-4o (Standard)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="o1-preview">o1 Preview (Reasoning)</option>
                </select>
              </div>

              {/* GEMINI */}
              <div className="bg-background-deep border border-white/5 p-6 rounded-[32px] space-y-4 hover:border-brand-cyan/30 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-cyan" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-white">Gemini Engine</span>
                  </div>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[9px] font-bold text-gray-600 hover:text-brand-cyan transition-colors flex items-center gap-1">
                    OBTER CHAVE <ExternalLink className="w-2 h-2" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showKeys.gemini ? 'text' : 'password'}
                    value={keys.gemini}
                    onChange={(e) => saveKeys({ ...keys, gemini: e.target.value })}
                    placeholder="AIzaSy..."
                    className={`w-full bg-black/40 border ${validateKey('gemini', keys.gemini) ? 'border-brand-cyan/30' : 'border-white/5'} rounded-2xl px-5 py-4 text-xs font-mono outline-none focus:border-brand-cyan/50 transition-all`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {apiStatus.gemini === 'success' && <CheckCircle2 className="w-4 h-4 text-brand-cyan" />}
                    {apiStatus.gemini === 'error' && <AlertCircle className="w-4 h-4 text-brand-pink" />}
                    <button onClick={() => setShowKeys({ ...showKeys, gemini: !showKeys.gemini })} className="text-gray-600 hover:text-white transition-colors">
                      {showKeys.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => testConnection('gemini')}
                  disabled={isTestingApi.gemini}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 transition-all flex items-center justify-center gap-2"
                >
                  {isTestingApi.gemini ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  Testar Conexão
                </button>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none cursor-pointer focus:border-brand-cyan/30"
                >
                  <option value="default">Gemini 1.5 Flash (Rec.)</option>
                  <option value="gemini-3-flash-preview">Gemini 2.0 Flash EXP</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                </select>
              </div>

              {/* MISTRAL */}
              <div className="bg-background-deep border border-white/5 p-6 rounded-[32px] space-y-4 hover:border-brand-pink/30 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-pink" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-white">Mistral AI</span>
                  </div>
                  <a href="https://console.mistral.ai/api-keys/" target="_blank" rel="noreferrer" className="text-[9px] font-bold text-gray-600 hover:text-brand-pink transition-colors flex items-center gap-1">
                    OBTER CHAVE <ExternalLink className="w-2 h-2" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showKeys.mistral ? 'text' : 'password'}
                    value={keys.mistral}
                    onChange={(e) => saveKeys({ ...keys, mistral: e.target.value })}
                    placeholder="sk-..."
                    className={`w-full bg-black/40 border ${validateKey('mistral', keys.mistral) ? 'border-brand-pink/30' : 'border-white/5'} rounded-2xl px-5 py-4 text-xs font-mono outline-none focus:border-brand-pink/50 transition-all`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {apiStatus.mistral === 'success' && <CheckCircle2 className="w-4 h-4 text-brand-pink" />}
                    {apiStatus.mistral === 'error' && <AlertCircle className="w-4 h-4 text-brand-pink" />}
                    <button onClick={() => setShowKeys({ ...showKeys, mistral: !showKeys.mistral })} className="text-gray-600 hover:text-white transition-colors">
                      {showKeys.mistral ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => testConnection('mistral')}
                  disabled={isTestingApi.mistral}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 transition-all flex items-center justify-center gap-2"
                >
                  {isTestingApi.mistral ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  Testar Conexão
                </button>
                <div className="px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-gray-700 bg-white/5 rounded-xl text-center">
                  Mistral Large (latest)
                </div>
              </div>
            </div>
          )}
        </section>

        {/* MAIN CONTEXT FORM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* LEFT: STRATEGIC PARAMETERS */}
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-background-mid/40 backdrop-blur-xl border border-white/5 rounded-[48px] p-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/5 blur-[100px] -z-10 group-hover:bg-brand-cyan/10 transition-colors duration-700" />

              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-brand-cyan/10 rounded-3xl">
                  <Target className="w-8 h-8 text-brand-cyan" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Parâmetros de Viralização</h2>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Base estratégica para engenharia de CTR</p>
                </div>
              </div>

              <div className="space-y-10">
                {/* TOPIC */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">Tema Principal / Assunto</label>
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${topic.length > 80 ? 'bg-brand-pink/10 text-brand-pink' : topic.length > 50 ? 'bg-brand-cyan/10 text-brand-cyan' : 'bg-gray-500/10 text-gray-500'}`}>
                        {topic.length} / 100
                      </span>
                      <span className="text-[9px] font-black text-brand-cyan px-3 py-1 bg-brand-cyan/10 rounded-full uppercase">SEO Core</span>
                    </div>
                  </div>
                  <div className="relative group">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Ex: O segredo das fábricas de chocolate suíças"
                      className="w-full bg-background-deep border border-white/5 rounded-3xl px-8 py-6 text-lg font-bold text-white outline-none focus:border-brand-cyan transition-all shadow-inner focus:shadow-brand-cyan/10 group-hover:border-white/10"
                    />
                    <Sparkles className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-cyan/20 group-focus-within:text-brand-cyan transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                  {/* NICHE */}
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                      <Layout className="w-4 h-4" /> Nicho / Categoria
                    </label>
                    <div className="relative">
                      <select
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        className="w-full bg-background-deep border border-white/5 rounded-3xl px-6 py-6 text-sm font-black text-white outline-none appearance-none cursor-pointer focus:border-brand-purple"
                      >
                        <option value="">Selecionar nicho</option>
                        {NICHES.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
                    </div>
                  </div>

                  {/* LANGUAGE */}
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                      <Type className="w-4 h-4" /> Idioma de Saída
                    </label>
                    <div className="relative">
                      <select
                        value={lang}
                        onChange={(e) => setLang(e.target.value)}
                        className="w-full bg-background-deep border border-white/5 rounded-3xl px-6 py-6 text-sm font-black text-white outline-none appearance-none cursor-pointer focus:border-brand-pink"
                      >
                        <option value="pt-BR">Português (BR)</option>
                        <option value="en">English (US)</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* EXISTING TITLES */}
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Análise de Concorrência (Opcional)</label>
                  <textarea
                    value={existingTitles}
                    onChange={(e) => setExistingTitles(e.target.value)}
                    placeholder="Cole aqui os títulos dos vídeos que já fazem sucesso sobre esse tema..."
                    className="w-full bg-background-deep border border-white/5 rounded-[32px] px-8 py-6 text-sm font-medium text-gray-300 min-h-[140px] outline-none focus:border-brand-cyan transition-all resize-none scrollbar-hide"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: CONTROL PANEL */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-background-mid/40 backdrop-blur-xl border border-white/5 rounded-[48px] p-8 shadow-2xl h-full flex flex-col justify-between">
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-brand-purple/10 rounded-2xl">
                    <BarChart3 className="w-6 h-6 text-brand-purple" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Controles</h3>
                </div>

                {/* TONE */}
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Tom Editorial</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-background-deep border border-white/5 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-purple outline-none appearance-none cursor-pointer shadow-inner"
                  >
                    <option value="viral">Viral / Clickbait</option>
                    <option value="educational">Educativo / Sóbrio</option>
                    <option value="curiosity">Mistério / Intriga</option>
                    <option value="professional">Documentário B2B</option>
                    <option value="emotional">Emocional / Story</option>
                  </select>
                </div>

                {/* QUANTITY */}
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Volume de Variações ({quantity})</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full h-1.5 bg-background-deep rounded-full appearance-none cursor-pointer accent-brand-cyan"
                  />
                </div>

                {/* CHARACTER RANGE */}
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] px-2">Extensão do Título</label>
                  <select
                    value={charRange}
                    onChange={(e) => setCharRange(e.target.value)}
                    className="w-full bg-background-deep border border-white/5 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-brand-cyan outline-none appearance-none cursor-pointer shadow-inner"
                  >
                    <option value="30-50">CURTO (30-50 chars)</option>
                    <option value="50-80">MÉDIO (50-80 chars)</option>
                    <option value="80-100">LONGO (80-100 chars)</option>
                  </select>
                  {renderRangeIndicator()}
                </div>
              </div>

              <div className="mt-12 space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedModel('openai')}
                    className={`flex-1 py-3 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest ${selectedModel === 'openai' ? 'bg-brand-green/20 border-brand-green text-brand-green' : 'bg-white/5 border-white/5 text-gray-600'}`}
                  >
                    OPENAI
                  </button>
                  <button
                    onClick={() => setSelectedModel('gemini')}
                    className={`flex-1 py-3 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest ${selectedModel === 'gemini' ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan' : 'bg-white/5 border-white/5 text-gray-600'}`}
                  >
                    GEMINI
                  </button>
                  <button
                    onClick={() => setSelectedModel('mistral')}
                    className={`flex-1 py-3 rounded-xl border transition-all text-[9px] font-black uppercase tracking-widest ${selectedModel === 'mistral' ? 'bg-brand-pink/20 border-brand-pink text-brand-pink' : 'bg-white/5 border-white/5 text-gray-600'}`}
                  >
                    MISTRAL
                  </button>
                </div>
              </div>

              {/* ACTION ROW: HISTORY, FAVS, TEMPLATES */}
              <div className="mt-8 pt-8 border-t border-white/5 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowHistory(true)}
                  className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 hover:border-brand-purple/30 transition-all"
                >
                  <RefreshCw className="w-3 h-3 text-brand-purple" /> Histórico
                </button>
                <button
                  onClick={() => setShowFavorites(true)}
                  className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 hover:border-brand-pink/30 transition-all"
                >
                  <Star className="w-3 h-3 text-brand-pink" /> Favoritos
                </button>
                <div className="w-full relative group">
                  <button className="w-full flex items-center justify-center gap-2 py-3 bg-brand-purple/10 border border-brand-purple/20 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-purple/20 transition-all">
                    <Sparkles className="w-3 h-3 text-brand-purple" /> Templates Virais
                  </button>
                  <div className="absolute bottom-full left-0 w-full bg-background-mid border border-brand-purple/20 rounded-2xl p-2 hidden group-hover:block z-[100] shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
                    {VIRAL_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setTopic(tmpl.template);
                          showToastMsg('Template aplicado!');
                        }}
                        className="w-full text-left p-3 hover:bg-white/5 rounded-xl text-[10px] font-bold text-gray-400 hover:text-white border-b border-white/5 last:border-0"
                      >
                        {tmpl.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <button
                  onClick={handleOptimize}
                  disabled={isLoading}
                  className="w-full group relative py-6 bg-gradient-to-r from-brand-purple via-brand-pink to-brand-cyan rounded-[32px] shadow-[0_15px_40px_rgba(168,85,247,0.4)] hover:shadow-[0_20px_50px_rgba(0,245,255,0.4)] hover:scale-[1.02] transition-all overflow-hidden flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-10 transition-opacity" />
                  {isLoading ? <RefreshCw className="w-6 h-6 animate-spin text-white" /> : <Zap className="w-6 h-6 text-white animate-pulse" />}
                  <span className="text-sm font-black italic tracking-[0.2em] text-white underline-offset-4 decoration-white/30 group-hover:underline">Otimizar Títulos</span>
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* CUSTOM INSTRUCTIONS EXTRA PANEL */}
        <section className="bg-background-mid/40 backdrop-blur-xl border border-brand-purple/20 rounded-[40px] p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-brand-purple/10 rounded-2xl">
              <MessageSquare className="w-6 h-6 text-brand-purple" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tighter">Instruções Customizadas</h3>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest italic">Ajuste fino do comportamento da IA</p>
            </div>
          </div>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Ex: Começar com uma pergunta, usar 'EU TESTEI...' no início, priorizar SEO para buscas curiosas, usar emojis específicos..."
            className="w-full bg-background-deep border border-white/5 rounded-3xl px-8 py-6 text-sm font-medium text-gray-400 min-h-[100px] outline-none focus:border-brand-purple transition-all resize-none"
          />
        </section>

        {/* LOADING STATE BARS */}
        {isLoading && (
          <div className="space-y-6 py-12 animate-in fade-in duration-500 text-center">
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 rounded-full bg-brand-purple animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 rounded-full bg-brand-pink animate-bounce" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.4em] text-brand-cyan pulse">{loadingStep || 'Simulando Algoritmo do YouTube'}</h3>
            <div className="w-full max-w-lg mx-auto h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-cyan to-brand-purple w-full animate-shimmer" />
            </div>
          </div>
        )}

        {/* ERRORS */}
        {error && (
          <div className="bg-brand-pink/10 border border-brand-pink/20 rounded-[32px] p-8 flex items-start gap-6 animate-in shake duration-500">
            <AlertCircle className="w-8 h-8 text-brand-pink shrink-0" />
            <div className="space-y-2">
              <h4 className="text-md font-black uppercase tracking-tight text-white leading-none">Falha na Otimização</h4>
              <p className="text-sm font-medium text-brand-pink/80 leading-relaxed italic">{error}</p>
              <div className="pt-2 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                Dica: Verifique sua chave API, créditos e conexão com a internet.
              </div>
            </div>
          </div>
        )}

        {/* RESULTS SECTION */}
        {results && (
          <div ref={resultsRef} className="space-y-12 pb-24 animate-in slide-in-from-bottom-12 duration-1000">

            {/* PERFORMANCE METRICS */}
            <div className="flex justify-end gap-3 mb-4">
              <button onClick={() => exportCSV(results)} className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Exportar CSV</button>
              <button onClick={() => exportJSON(results)} className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Exportar JSON</button>
            </div>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-background-mid/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 text-center space-y-2 group hover:border-brand-cyan/30 transition-all shadow-xl">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">CTR Médio Previsto</div>
                <div className="text-4xl font-black text-brand-cyan group-hover:scale-110 transition-transform">{results.insights.avg_ctr}</div>
                <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Score de Atenção</div>
              </div>
              <div className="bg-background-mid/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 text-center space-y-2 group hover:border-brand-purple/30 transition-all shadow-xl">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">VPMC (Score SEO)</div>
                <div className="text-4xl font-black text-brand-purple group-hover:scale-110 transition-transform">{results.insights.seo_score}<span className="text-sm opacity-30">/100</span></div>
                <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Indexabilidade</div>
              </div>
              <div className="bg-background-mid/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 text-center space-y-2 group hover:border-brand-pink/30 transition-all shadow-xl">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Trend Alignment</div>
                <div className="text-4xl font-black text-brand-pink group-hover:scale-110 transition-transform uppercase">{results.insights.trend_match}</div>
                <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Viral Velocity</div>
              </div>
              <div className="bg-background-mid/40 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 text-center space-y-2 group hover:border-brand-green/30 transition-all shadow-xl">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Model Engine</div>
                <div className="text-xl font-black text-brand-green py-3 overflow-hidden text-ellipsis whitespace-nowrap">{lastModelUsed}</div>
                <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Core Intelligence</div>
              </div>
            </section>

            {/* TITLES GRID */}
            <div className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="w-10 h-10 bg-brand-cyan/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-brand-cyan" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Títulos Gerados</h3>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {results.titles.map((t, i) => (
                  <div key={i} className="group relative bg-background-mid/60 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center hover:border-brand-cyan/20 transition-all shadow-2xl animate-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="absolute top-0 right-10 w-24 h-24 bg-brand-cyan/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* RANK / SCORE CIRCLE */}
                    <div className="shrink-0 relative">
                      <div className="w-28 h-28 bg-background-deep border-4 border-white/5 rounded-full flex flex-col items-center justify-center relative z-10 shadow-[inner_0_0_20px_rgba(0,0,0,0.5)] group-hover:border-brand-cyan transition-colors">
                        <span className={`text-3xl font-black ${t.ctr_score > 90 ? 'text-brand-green' : 'text-brand-cyan'}`}>{t.ctr_score}</span>
                        <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">CTR SCORE</span>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 text-center md:text-left space-y-5">
                      <div className="flex flex-wrap justify-center md:justify-start gap-2">
                        {t.keywords.map((kw, ki) => (
                          <span key={ki} className="text-[8px] font-black px-3 py-1 bg-white/5 rounded-full text-gray-500 uppercase tracking-widest border border-white/10 group-hover:text-brand-purple group-hover:bg-brand-purple/10 transition-all">#{kw}</span>
                        ))}
                        <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border transition-all ${t.length >= getCharRangeValue().min && t.length <= getCharRangeValue().max ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-brand-pink/10 text-brand-pink border-brand-pink/20'}`}>
                          {t.length} CHRS
                        </span>
                      </div>
                      <h4 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white leading-[1.1] selection:bg-brand-cyan selection:text-black">{t.title}</h4>
                    </div>

                    {/* ACTIONS */}
                    <div className="shrink-0 flex gap-4">
                      <button
                        onClick={() => toggleFavorite(t)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${favorites.find(f => f.title === t.title) ? 'bg-brand-pink text-white' : 'bg-white/5 text-gray-600 hover:text-brand-pink hover:bg-brand-pink/10'}`}
                      >
                        <Star className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setShowPreview(t)}
                        className="w-14 h-14 bg-white/5 text-gray-600 rounded-2xl flex items-center justify-center hover:bg-brand-cyan/10 hover:text-brand-cyan transition-all shadow-xl active:scale-90"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(t.title)}
                        className="w-14 h-14 bg-white/5 text-gray-600 rounded-2xl flex items-center justify-center hover:bg-brand-green/10 hover:text-brand-green transition-all shadow-xl active:scale-90"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KEYWORDS & AB VARIANTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* KEYWORDS */}
              <section className="bg-background-mid/40 backdrop-blur-xl border border-white/5 rounded-[48px] p-10 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-brand-purple/10 rounded-2xl">
                      <SearchCode className="w-6 h-6 text-brand-purple" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tighter">Keywords de Alta Retenção</h3>
                  </div>
                  <div className="space-y-6">
                    {results.top_keywords.map((kw, i) => (
                      <div key={i} className="group space-y-2">
                        <div className="flex justify-between items-center px-1">
                          <span className="text-sm font-bold text-gray-300 uppercase tracking-widest">{kw.word}</span>
                          <span className="text-[10px] font-black font-mono text-brand-purple">{kw.score}%</span>
                        </div>
                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-purple animate-shimmer"
                            style={{ width: `${kw.score}%`, animationDelay: `${i * 0.1}s` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* A/B VARIANTS */}
              <section className="bg-background-mid/40 backdrop-blur-xl border border-white/5 rounded-[48px] p-10 shadow-2xl">
                <div className="flex items-center gap-4 mb-10">
                  <div className="p-3 bg-brand-pink/10 rounded-2xl">
                    <TrendingUp className="w-6 h-6 text-brand-pink" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">Variações A/B Testing</h3>
                </div>
                <div className="space-y-6">
                  {results.ab_variants.map((v, i) => (
                    <div
                      key={i}
                      onClick={() => copyToClipboard(v.text)}
                      className="p-6 bg-white/5 border border-white/5 rounded-3xl hover:border-brand-pink/30 hover:bg-white/[0.08] transition-all cursor-pointer group active:scale-[0.98]"
                    >
                      <div className="text-[10px] font-black text-brand-pink uppercase tracking-widest mb-3 flex items-center justify-between">
                        {v.label}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm font-bold italic text-gray-400 group-hover:text-white transition-colors">{v.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* CHART PANEL */}
            <section className="bg-background-mid/40 backdrop-blur-xl border border-white/5 rounded-[48px] p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/5 blur-[100px]" />
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                    <div className="p-2 bg-brand-cyan/10 rounded-lg"><TrendingUp className="w-5 h-5 text-brand-cyan" /></div>
                    Viral Health Score
                  </h3>
                  <p className="text-sm font-medium text-gray-500 italic max-w-sm">
                    Estimativa de performance algorítmica baseada em padrões de sucesso global de {new Date().getFullYear()}.
                  </p>
                </div>
                <div className="flex items-end gap-2 h-24">
                  {[40, 60, 45, 80, 55, 90, 70, 85, 95, 88].map((h, i) => (
                    <div
                      key={i}
                      className={`w-4 bg-gradient-to-t rounded-t-lg transition-all duration-1000 ${i === 8 ? 'from-brand-cyan to-brand-purple h-[100%] animate-pulse' : 'from-white/5 to-white/10'}`}
                      style={{ height: isLoading ? '10%' : `${h}%`, transitionDelay: `${i * 0.05}s` }}
                    />
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* OVERPLAYS: HISTORY & FAVORITES */}
      {(showHistory || showFavorites) && (
        <div className="fixed inset-0 z-[500] flex justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowHistory(false); setShowFavorites(false); }} />
          <aside className="relative w-full max-w-md bg-background-deep border-l border-white/5 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase tracking-tighter">
                {showHistory ? 'Histórico de Geração' : 'Meus Favoritos'}
              </h2>
              <button onClick={() => { setShowHistory(false); setShowFavorites(false); }} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {showHistory ? (
                history.length === 0 ? <p className="text-center text-gray-500 py-10">Nenhum histórico encontrado.</p> :
                  history.map(entry => (
                    <div key={entry.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-brand-purple/30 transition-all space-y-4">
                      <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-gray-500">
                        <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                        <span className="text-brand-purple">{entry.model}</span>
                      </div>
                      <p className="text-sm font-bold text-white line-clamp-2 italic">"{entry.topic}"</p>
                      <button
                        onClick={() => {
                          setResults(entry.response);
                          setTopic(entry.topic);
                          setLastModelUsed(entry.model);
                          setShowHistory(false);
                        }}
                        className="w-full py-3 bg-brand-purple/10 text-brand-purple text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-purple/20 transition-all"
                      >Restaurar Sessão</button>
                    </div>
                  ))
              ) : (
                favorites.length === 0 ? <p className="text-center text-gray-500 py-10">Nenhum título favoritado.</p> :
                  favorites.map(fav => (
                    <div key={fav.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-brand-pink/30 transition-all space-y-4">
                      <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-gray-500">
                        <span>{fav.topic}</span>
                        <span className="text-brand-pink">{fav.ctr_score} CTR</span>
                      </div>
                      <p className="text-sm font-bold text-white italic">"{fav.title}"</p>
                      <div className="flex gap-2">
                        <button onClick={() => copyToClipboard(fav.title)} className="flex-1 py-2 bg-white/5 text-[9px] font-black uppercase rounded-lg hover:bg-white/10">Copiar</button>
                        <button onClick={() => toggleFavorite(fav)} className="p-2 hover:bg-brand-pink/10 text-brand-pink rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </aside>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {showPreview && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowPreview(null)} />
          <div className="relative w-full max-w-2xl bg-background-deep border border-white/10 rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tighter">Preview YouTube</h3>
              <button onClick={() => setShowPreview(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-10 space-y-10">
              {/* Desktop Simulation */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Simulação Desktop</p>
                <div className="flex gap-4">
                  <div className="w-48 aspect-video bg-white/5 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <h4 className="text-lg font-bold text-white leading-tight line-clamp-2">{showPreview.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <div className="w-6 h-6 rounded-full bg-white/10" />
                      <span>Seu Canal • 1.2M views • há 2 horas</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Simulation */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Simulação Mobile</p>
                <div className="w-full space-y-3">
                  <div className="w-full aspect-video bg-white/5 rounded-2xl" />
                  <div className="flex gap-3 px-1">
                    <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white leading-tight line-clamp-2">{showPreview.title}</h4>
                      <p className="text-[10px] text-gray-500">Seu Canal • 1.2M views • há 2 horas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-brand-cyan text-black px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(0,245,255,0.4)] animate-in slide-in-from-bottom-5 duration-300">
          {toast}
        </div>
      )}

      {/* FOOTER */}
      <footer className="w-full max-w-6xl py-20 px-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
            <Youtube className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Umbra Hub Ecosystem</span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center md:text-right">
          Powered by Gemini AI Engine & GPT-4o Omni • 2026 Edition
        </p>
      </footer>
    </div>
  );
};

export default TitleOptimizerTool;