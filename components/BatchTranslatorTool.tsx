
import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  Globe,
  Languages,
  Zap,
  Settings,
  Key,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Brain
} from 'lucide-react';

interface Language {
  code: string;
  name: string;
  popular?: boolean;
  european?: boolean;
  asian?: boolean;
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'Inglês', popular: true },
  { code: 'es', name: 'Espanhol', popular: true },
  { code: 'fr', name: 'Francês', popular: true, european: true },
  { code: 'de', name: 'Alemão', popular: true, european: true },
  { code: 'it', name: 'Italiano', popular: true, european: true },
  { code: 'pt', name: 'Português', popular: true },
  { code: 'ru', name: 'Russo', popular: true, european: true },
  { code: 'ja', name: 'Japonês', popular: true, asian: true },
  { code: 'zh', name: 'Chinês', popular: true, asian: true },
  { code: 'ko', name: 'Coreano', popular: true, asian: true },
  { code: 'ar', name: 'Árabe', popular: true },
  { code: 'hi', name: 'Hindi', asian: true },
  { code: 'nl', name: 'Holandês', european: true },
  { code: 'pl', name: 'Polonês', european: true },
  { code: 'tr', name: 'Turco' },
  { code: 'sv', name: 'Sueco', european: true },
  { code: 'da', name: 'Dinamarquês', european: true },
  { code: 'no', name: 'Norueguês', european: true },
  { code: 'fi', name: 'Finlandês', european: true },
  { code: 'cs', name: 'Tcheco', european: true },
  { code: 'el', name: 'Grego', european: true },
  { code: 'he', name: 'Hebraico' },
  { code: 'id', name: 'Indonésio', asian: true },
  { code: 'th', name: 'Tailandês', asian: true },
  { code: 'vi', name: 'Vietnamita', asian: true },
  { code: 'uk', name: 'Ucraniano', european: true },
  { code: 'ro', name: 'Romeno', european: true },
  { code: 'hu', name: 'Húngaro', european: true },
  { code: 'bg', name: 'Búlgaro', european: true },
  { code: 'hr', name: 'Croata', european: true },
  { code: 'sk', name: 'Eslovaco', european: true },
  { code: 'lt', name: 'Lituano', european: true },
  { code: 'lv', name: 'Letão', european: true },
  { code: 'et', name: 'Estoniano', european: true },
  { code: 'sl', name: 'Esloveno', european: true },
  { code: 'ca', name: 'Catalão', european: true },
  { code: 'ms', name: 'Malaio', asian: true },
  { code: 'bn', name: 'Bengali', asian: true },
  { code: 'ta', name: 'Tâmil', asian: true },
  { code: 'te', name: 'Telugu', asian: true },
  { code: 'mr', name: 'Marati', asian: true },
  { code: 'fa', name: 'Persa' },
  { code: 'sw', name: 'Suaíli' },
  { code: 'af', name: 'Africâner' },
  { code: 'sq', name: 'Albanês', european: true },
  { code: 'am', name: 'Amárico' },
  { code: 'az', name: 'Azerbaijano' },
  { code: 'eu', name: 'Basco', european: true },
  { code: 'be', name: 'Bielorrusso', european: true },
  { code: 'bs', name: 'Bósnio', european: true },
  { code: 'gl', name: 'Galego', european: true },
  { code: 'ka', name: 'Georgiano' },
  { code: 'gu', name: 'Gujarati', asian: true },
  { code: 'is', name: 'Islandês', european: true },
  { code: 'kn', name: 'Canarês', asian: true },
  { code: 'km', name: 'Khmer', asian: true },
  { code: 'lo', name: 'Laosiano', asian: true },
  { code: 'mk', name: 'Macedônio', european: true },
  { code: 'ml', name: 'Malaiala', asian: true },
  { code: 'mn', name: 'Mongol', asian: true },
  { code: 'my', name: 'Birmanês', asian: true },
  { code: 'ne', name: 'Nepalês', asian: true },
  { code: 'pa', name: 'Punjabi', asian: true },
  { code: 'si', name: 'Cingalês', asian: true },
  { code: 'ur', name: 'Urdu', asian: true },
  { code: 'uz', name: 'Uzbeque' },
  { code: 'cy', name: 'Galês', european: true },
  { code: 'yi', name: 'Iídiche' }
];

// Define interface for translation data
interface TranslationData {
  language: string;
  text: string;
  error?: boolean;
}

const BatchTranslatorTool: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [selectedLangs, setSelectedLangs] = useState<Set<string>>(new Set());
  const [selectedAPI, setSelectedAPI] = useState<'openai' | 'claude' | 'gemini'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [contextType, setContextType] = useState('prompt');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [translations, setTranslations] = useState<Record<string, TranslationData>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectGroup = (type: 'popular' | 'european' | 'asian' | 'all' | 'none') => {
    if (type === 'none') {
      setSelectedLangs(new Set());
      return;
    }
    const filtered = LANGUAGES.filter(l => {
      if (type === 'all') return true;
      return (l as any)[type];
    }).map(l => l.code);
    setSelectedLangs(new Set(filtered));
  };

  const toggleLang = (code: string) => {
    setSelectedLangs(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const translateText = async (text: string, targetLangName: string, context: string) => {
    const contextPrompts: Record<string, string> = {
      prompt: `Traduza o seguinte prompt de IA para ${targetLangName}, mantendo a clareza, especificidade e tom profissional. Preserve palavras técnicas importantes.`,
      subtitle: `Traduza a seguinte legenda para ${targetLangName}, mantendo o tempo e formatação. Mantenha natural e sincronizado.`,
      general: `Traduza o seguinte texto para ${targetLangName} de forma natural e fluente.`,
      marketing: `Traduza o seguinte texto de marketing para ${targetLangName}, mantendo o impacto, persuasão e apelo emocional.`
    };

    const fullPrompt = `${contextPrompts[context]}\n\nTexto original:\n${text}\n\nResponda APENAS com a tradução, sem explicações ou texto adicional.`;

    if (selectedAPI === 'gemini') {
      const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text().trim();
    } else if (selectedAPI === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'system', content: `Você é um tradutor especializado em ${context}.` }, { role: 'user', content: fullPrompt }],
          temperature: 0.3
        })
      });
      if (!response.ok) throw new Error('Falha na API OpenAI');
      const data = await response.json();
      return data.choices[0].message.content.trim();
    } else {
      // Claude
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-latest',
          max_tokens: 4096,
          messages: [{ role: 'user', content: fullPrompt }]
        })
      });
      if (!response.ok) throw new Error('Falha na API Claude');
      const data = await response.json();
      return data.content[0].text.trim();
    }
  };

  const handleTranslateAll = async () => {
    if (!inputText.trim()) return setErrorMsg('Insira o texto para traduzir');
    if (selectedLangs.size === 0) return setErrorMsg('Selecione pelo menos um idioma');
    if (selectedAPI !== 'gemini' && !apiKey) return setErrorMsg(`Insira sua API Key da ${selectedAPI}`);

    setIsProcessing(true);
    setErrorMsg(null);
    setTranslations({});
    setProgress(0);

    const langsToProcess: string[] = Array.from(selectedLangs);
    const total = langsToProcess.length;
    let completed = 0;

    for (const code of langsToProcess) {
      const lang = LANGUAGES.find(l => l.code === code);
      try {
        const text = await translateText(inputText, lang?.name || code, contextType);
        setTranslations(prev => {
          const next = { ...prev };
          next[code] = { language: lang?.name || code, text };
          return next;
        });
      } catch (err: any) {
        setTranslations(prev => {
          const next = { ...prev };
          next[code] = { language: lang?.name || code, text: `[Erro: ${err.message}]`, error: true };
          return next;
        });
      }
      completed++;
      setProgress(Math.round((completed / total) * 100));
    }

    setIsProcessing(false);
  };

  const exportData = (format: 'json' | 'csv' | 'txt') => {
    let content = '';
    let mime = 'text/plain';
    let ext = 'txt';

    if (format === 'json') {
      content = JSON.stringify(translations, null, 2);
      mime = 'application/json';
      ext = 'json';
    } else if (format === 'csv') {
      content = 'Idioma,Codigo,Traducao\n' + (Object.entries(translations) as [string, TranslationData][]).map(([code, d]) => `"${d.language}","${code}","${d.text.replace(/"/g, '""')}"`).join('\n');
      mime = 'text/csv';
      ext = 'csv';
    } else {
      content = (Object.entries(translations) as [string, TranslationData][]).map(([_, d]) => `=== ${d.language} ===\n${d.text}\n\n`).join('');
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `umbra_translations_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-5xl mx-auto">
      <header className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-purple/10 rounded-[28px] mb-6 shadow-2xl shadow-brand-purple/10 ring-1 ring-brand-purple/20">
          <Globe className="w-10 h-10 text-brand-purple" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink bg-clip-text text-transparent uppercase">
          Umbra Batch Translator
        </h1>
        <p className="text-gray-500 font-medium">Tradução em lote otimizada para Canais Dark e Edição</p>
      </header>

      {/* API CONFIG */}
      <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-8 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <Key className="w-5 h-5 text-brand-cyan" />
          <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Configuração do Motor</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'openai', name: 'OpenAI (GPT-4o)', color: 'bg-[#10a37f]' },
            { id: 'claude', name: 'Claude 3.5', color: 'bg-[#cc785c]' },
            { id: 'gemini', name: 'Google Gemini', color: 'bg-[#4285f4]' },
          ].map(api => (
            <button
              key={api.id}
              onClick={() => setSelectedAPI(api.id as any)}
              className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-center gap-4 ${selectedAPI === api.id ? 'border-brand-purple bg-brand-purple/5' : 'border-white/5 bg-background-light/50 grayscale hover:grayscale-0'}`}
            >
              <div className={`w-10 h-10 ${api.color} rounded-lg flex items-center justify-center font-bold text-white shadow-xl`}>
                {api.name.charAt(0)}
              </div>
              <span className="text-xs font-black uppercase tracking-tighter">{api.name}</span>
            </button>
          ))}
        </div>

        {selectedAPI !== 'gemini' && (
          <div className="animate-in slide-in-from-top-2">
            <input
              type="password"
              placeholder={`Digite sua ${selectedAPI === 'openai' ? 'OpenAI Secret Key' : 'Claude API Key'}...`}
              className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-xs font-space text-brand-cyan focus:border-brand-cyan/40 outline-none"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <p className="text-[9px] text-gray-600 mt-2 flex items-center gap-2 uppercase font-bold tracking-tighter">
              <AlertCircle className="w-3 h-3" /> Sua chave é usada apenas para as requisições de tradução.
            </p>
          </div>
        )}

        {selectedAPI === 'gemini' && (
          <div className="p-4 bg-brand-cyan/5 border border-brand-cyan/10 rounded-2xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-brand-cyan" />
            <p className="text-[10px] text-brand-cyan/70 font-bold uppercase tracking-widest">Usando motor interno da plataforma (Quota incluída)</p>
          </div>
        )}
      </div>

      {/* TRANSLATION SETUP */}
      <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-brand-purple" />
            <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Tipo de Conteúdo</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'prompt', label: 'Prompt de IA' },
              { id: 'subtitle', label: 'Legendas' },
              { id: 'general', label: 'Texto Geral' },
              { id: 'marketing', label: 'Marketing' },
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setContextType(type.id)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${contextType === type.id ? 'bg-brand-purple border-brand-purple text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'}`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-brand-pink" />
              <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Texto Original</h3>
            </div>
            <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">{inputText.length} Caracteres</span>
          </div>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Cole aqui o prompt, roteiro ou legenda que deseja traduzir..."
            className="w-full h-48 bg-background-deep border border-white/5 rounded-[32px] p-8 text-sm leading-relaxed text-gray-300 focus:border-brand-purple/40 outline-none resize-none custom-scrollbar shadow-inner"
          />
        </div>

        {/* LANGUAGES */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Languages className="w-5 h-5 text-brand-green" />
              <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Selecionar Idiomas ({selectedLangs.size})</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => selectGroup('popular')} className="px-3 py-1.5 bg-white/5 rounded-lg text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white hover:bg-white/10">Populares</button>
              <button onClick={() => selectGroup('european')} className="px-3 py-1.5 bg-white/5 rounded-lg text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white hover:bg-white/10">Europeus</button>
              <button onClick={() => selectGroup('asian')} className="px-3 py-1.5 bg-white/5 rounded-lg text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white hover:bg-white/10">Asiáticos</button>
              <button onClick={() => selectGroup('all')} className="px-3 py-1.5 bg-white/5 rounded-lg text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white hover:bg-white/10">Todos</button>
              <button onClick={() => selectGroup('none')} className="px-3 py-1.5 bg-white/5 rounded-lg text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-brand-pink hover:bg-brand-pink/10">Limpar</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-64 overflow-y-auto p-4 bg-background-deep/50 rounded-[32px] border border-white/5 custom-scrollbar">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => toggleLang(lang.code)}
                className={`p-3 rounded-xl border text-[10px] font-bold text-left transition-all truncate flex items-center gap-2 ${selectedLangs.has(lang.code) ? 'bg-brand-green/10 border-brand-green text-brand-green' : 'bg-background-light border-white/5 text-gray-600 hover:border-white/20'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${selectedLangs.has(lang.code) ? 'bg-brand-green' : 'bg-gray-800'}`} />
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-brand-pink/10 border border-brand-pink/20 rounded-2xl text-brand-pink text-xs font-bold uppercase tracking-widest flex items-center gap-3">
            <AlertCircle className="w-5 h-5" /> {errorMsg}
          </div>
        )}

        <button
          onClick={handleTranslateAll}
          disabled={isProcessing}
          className="w-full py-6 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink text-white font-orbitron text-xs font-black tracking-[0.4em] rounded-[24px] shadow-2xl hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-4 disabled:opacity-30 uppercase active:scale-[0.98]"
        >
          {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
          Disparar Tradução em Lote
        </button>
      </div>

      {/* RESULTS */}
      {Object.keys(translations).length > 0 && (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-brand-green" />
              <h2 className="text-2xl font-black tracking-tight">Traduções Concluídas</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => exportData('json')} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-brand-cyan transition-all" title="JSON"><FileJson className="w-5 h-5" /></button>
              <button onClick={() => exportData('csv')} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-brand-green transition-all" title="CSV"><FileSpreadsheet className="w-5 h-5" /></button>
              <button onClick={() => exportData('txt')} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-brand-purple transition-all" title="TXT"><FileText className="w-5 h-5" /></button>
              <button onClick={() => {
                const all = (Object.entries(translations) as [string, TranslationData][]).map(([_, d]) => `=== ${d.language} ===\n${d.text}\n\n`).join('');
                navigator.clipboard.writeText(all);
              }} className="px-6 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                <Copy className="w-4 h-4" /> Copiar Tudo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(Object.entries(translations) as [string, TranslationData][]).map(([code, d]) => (
              <div key={code} className={`p-8 bg-background-mid border rounded-[32px] shadow-xl group transition-all hover:border-white/10 ${d.error ? 'border-brand-pink/20' : 'border-white/5'}`}>
                <div className="flex justify-between items-center mb-6">
                  <span className="px-4 py-1.5 bg-background-deep border border-white/5 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${d.error ? 'bg-brand-pink' : 'bg-brand-green'}`} />
                    {d.language}
                  </span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(d.text); }}
                    className="p-3 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 hover:text-brand-cyan transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className={`text-sm leading-relaxed font-medium ${d.error ? 'text-brand-pink/70 italic' : 'text-gray-400'}`}>
                  {d.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchTranslatorTool;
