
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Terminal, 
  Zap, 
  Copy, 
  Trash2, 
  RefreshCw,
  Clock,
  Eye,
  EyeOff,
  Cpu,
  ChevronRight,
  Database,
  Lock,
  Server,
  Key as KeyIcon,
  Bot,
  Sparkles
} from 'lucide-react';

const MASTER_PROMPT = `Você é um Motor de Engenharia Reversa de Roteiros Virais.
Você não cria roteiros ainda.
Primeiro, você absorve, desmonta, abstrai e generaliza estruturas narrativas.
Você receberá UM OU MAIS ROTEIROS COMPLETOS.
Trate todos como dados de treino estrutural.
Sua missão é construir um MODELO MENTAL UNIFICADO capaz de gerar roteiros superiores aos originais.

FASE 1 — ABSORÇÃO TOTAL
Extraia do roteiro: Estrutura macro, Gancho inicial (técnica), Promessa, Conflito, Escalada, Clímax, Fechamento e Tom.

FASE 3 — MODELO GERADOR
Saída FINAL obrigatória:
MODELO UNIFICADO v1.0
├── GANCHO: [fórmula]
├── PROMESSA: [função]
├── ESCALADA: [progressão]
├── CLÍMAX: [inversão]
├── FECHAMENTO: [eco]
└── PARÂMETROS: [nicho/tom/duração]`;

const UmbraScriptTool: React.FC = () => {
  // --- API CONFIG STATE ---
  const [provider, setProvider] = useState<'openai' | 'claude' | 'gemini' | 'mistral'>('gemini');
  const [userApiKey, setUserApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const [phase, setPhase] = useState(1);
  const [phaseStatus, setPhaseStatus] = useState(['Aguardando roteiros...', 'Aguardando análise...', 'Aguardando extração...']);
  const [scripts, setScripts] = useState(['', '', '']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelStructure, setModelStructure] = useState<string | null>(null);
  const [resultScript, setResultScript] = useState<string | null>(null);
  
  // Generation Params
  const [minWords, setMinWords] = useState(600);
  const [maxWords, setMaxWords] = useState(1000);
  const [perspective, setPerspective] = useState('1ª Pessoa');
  const [tone, setTone] = useState('dramatico');
  const [niche, setNiche] = useState('historia');
  const [videoTitle, setVideoTitle] = useState('');

  const executeAiCall = async (prompt: string, modelType: 'flash' | 'pro') => {
    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const modelName = modelType === 'flash' ? 'gemini-3-flash-preview' : 'gemini-3-pro-preview';
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: { temperature: modelType === 'flash' ? 0.3 : 0.7 }
      });
      return response.text;
    } else {
      let endpoint = '';
      let headers: any = { 'Content-Type': 'application/json' };
      let body: any = {};

      if (provider === 'openai') {
        endpoint = 'https://api.openai.com/v1/chat/completions';
        headers['Authorization'] = `Bearer ${userApiKey}`;
        body = {
          model: modelType === 'flash' ? 'gpt-4o-mini' : 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: modelType === 'flash' ? 0.3 : 0.7
        };
      } else if (provider === 'claude') {
        endpoint = 'https://api.anthropic.com/v1/messages';
        headers['x-api-key'] = userApiKey;
        headers['anthropic-version'] = '2023-06-01';
        body = {
          model: modelType === 'flash' ? 'claude-3-haiku-20240307' : 'claude-3-5-sonnet-latest',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }]
        };
      } else if (provider === 'mistral') {
        endpoint = 'https://api.mistral.ai/v1/chat/completions';
        headers['Authorization'] = `Bearer ${userApiKey}`;
        body = {
          model: 'mistral-large-latest',
          messages: [{ role: 'user', content: prompt }]
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(`Erro na API ${provider.toUpperCase()}`);
      const data = await res.json();
      
      if (provider === 'openai' || provider === 'mistral') return data.choices[0].message.content;
      if (provider === 'claude') return data.content[0].text;
      return "";
    }
  };

  const handleAnalyze = async () => {
    if (!scripts[0].trim()) return alert("Insira pelo menos um roteiro para análise.");
    if (provider !== 'gemini' && !userApiKey) return alert(`Por favor, insira sua API Key para ${provider.toUpperCase()}`);
    
    setIsAnalyzing(true);
    setPhase(1);
    setPhaseStatus(['Analisando estruturas...', 'Calculando síntese...', 'Gerando modelo...']);

    try {
      const prompt = `${MASTER_PROMPT}\n\nROTEIROS DE ENTRADA:\n${scripts.filter(s => s.trim()).join('\n---\n')}`;
      const result = await executeAiCall(prompt, 'flash');
      
      setModelStructure(result || "Erro na extração.");
      setPhase(2);
      setPhaseStatus(['Absorção concluída ✓', 'Síntese finalizada ✓', 'Pronto para gerar...']);
    } catch (error) {
      console.error(error);
      alert("Erro na análise. Verifique sua chave de API.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!modelStructure) return;
    if (provider !== 'gemini' && !userApiKey) return alert(`Por favor, insira sua API Key para ${provider.toUpperCase()}`);
    
    setIsGenerating(true);
    
    const genPrompt = `USANDO O MODELO EXTRAÍDO:
    ${modelStructure}
    
    GERE UM ROTEIRO COMPLETO PARA O VÍDEO: ${videoTitle}
    Configurações: 
    - Perspectiva Narrativa: ${perspective}
    - Tom Narrativo: ${tone}
    - Nicho: ${niche}
    - Extensão Alvo: ${minWords} a ${maxWords} palavras.
    
    REGRAS CRÍTICAS DE SAÍDA: 
    - Output APENAS o texto corrido para narração.
    - REMOVA COMPLETAMENTE timestamps, marcações [CENA], (pausas) ou cabeçalhos.
    - O texto deve ser 100% limpo, pronto para ser lido por um narrador.`;

    try {
      const result = await executeAiCall(genPrompt, 'pro');
      setResultScript(result || "Erro na geração.");
      setPhase(3);
      setPhaseStatus(['Absorção concluída ✓', 'Síntese finalizada ✓', 'Geração completa ✓']);
    } catch (error) {
      console.error(error);
      alert("Erro na geração. Verifique sua cota de API.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert("Copiado para a área de transferência!");
  };

  return (
    <div className="font-rajdhani animate-in fade-in duration-700 pb-20 space-y-8">
      
      {/* API CONFIGURATION PANEL */}
      <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-8 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/5 blur-[100px] -z-10" />
        
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h3 className="font-bebas text-2xl tracking-widest text-white uppercase flex items-center gap-2">
               CONFIGURAÇÃO DE API
            </h3>
          </div>
          
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              ⚡ Provedor de IA
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'openai', label: 'OpenAI', icon: '🤖' },
                { id: 'claude', label: 'Claude', icon: '🔮' },
                { id: 'gemini', label: 'Gemini', icon: '💎' },
                { id: 'mistral', label: 'Mistral', icon: '🌊' }
              ].map((api) => (
                <button 
                  key={api.id}
                  onClick={() => setProvider(api.id as any)}
                  className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all ${
                    provider === api.id 
                    ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan shadow-[0_0_20px_rgba(0,245,255,0.15)]' 
                    : 'bg-background-deep border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10'
                  }`}
                >
                  <span className="text-2xl">{api.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{api.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                🔑 API Key
              </label>
              {provider === 'gemini' && (
                <span className="text-[9px] font-black text-brand-green uppercase bg-brand-green/10 px-3 py-1 rounded-full animate-pulse border border-brand-green/20">
                  Chave Interna Premium Ativa
                </span>
              )}
            </div>
            <div className="relative group">
              <input 
                type={showKey ? 'text' : 'password'}
                value={provider === 'gemini' ? '••••••••••••••••••••••••••••' : userApiKey}
                disabled={provider === 'gemini'}
                onChange={e => setUserApiKey(e.target.value)}
                className={`w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-xs font-space outline-none transition-all pr-14 shadow-inner ${
                  provider === 'gemini' ? 'text-brand-green/50 border-brand-green/20' : 'text-brand-cyan focus:border-brand-cyan'
                }`}
                placeholder={provider === 'gemini' ? 'Configurado pelo Sistema' : "sk-..."}
              />
              {provider !== 'gemini' && (
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Phases Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((num) => (
          <div key={num} className={`p-4 rounded-xl border transition-all ${
            phase >= num ? 'bg-brand-purple/10 border-brand-purple/40 shadow-lg shadow-brand-purple/5' : 'bg-white/5 border-white/5 opacity-40'
          }`}>
            <div className="font-bebas text-xs tracking-[0.2em] text-brand-cyan/70 mb-1">FASE 0{num}</div>
            <div className="font-orbitron text-[10px] font-black text-white mb-2 uppercase tracking-wider">
              {num === 1 ? 'ABSORÇÃO TOTAL' : num === 2 ? 'SÍNTESE UNIFICADORA' : 'MODELO GERADOR'}
            </div>
            <div className={`text-[10px] font-space tracking-wider ${phase >= num ? 'text-brand-cyan' : 'text-gray-600'}`}>
              {phaseStatus[num-1]}
            </div>
          </div>
        ))}
      </div>

      {/* Input Scripts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {scripts.map((s, idx) => (
          <div key={idx} className="relative group flex flex-col">
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="font-space text-[10px] text-brand-purple font-black tracking-[0.2em] uppercase">⬡ Roteiro 0{idx+1}</span>
              <button onClick={() => {
                const newScripts = [...scripts];
                newScripts[idx] = '';
                setScripts(newScripts);
              }} className="text-[10px] text-gray-600 hover:text-brand-pink font-bold transition-colors">LIMPAR</button>
            </div>
            <textarea 
              value={s}
              onChange={(e) => {
                const newScripts = [...scripts];
                newScripts[idx] = e.target.value;
                setScripts(newScripts);
              }}
              placeholder={`Cole aqui o roteiro viral 0${idx+1}...`}
              className="w-full h-72 bg-background-mid border border-white/5 rounded-[24px] p-6 text-xs font-space leading-relaxed focus:outline-none focus:border-brand-purple/40 focus:bg-background-light transition-all resize-none shadow-inner"
            />
            <div className="absolute bottom-6 right-8 font-bebas text-6xl text-white/[0.03] pointer-events-none group-hover:text-white/[0.06] transition-colors">0{idx+1}</div>
          </div>
        ))}
      </div>

      <button 
        onClick={handleAnalyze}
        disabled={isAnalyzing || !scripts[0]}
        className="group relative w-full py-5 bg-gradient-to-r from-brand-purple/20 to-brand-cyan/20 border border-brand-purple/50 hover:border-brand-cyan text-white font-orbitron text-xs font-black tracking-[0.3em] rounded-2xl shadow-xl transition-all active:scale-[0.99] disabled:opacity-30 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-brand-purple/10 to-brand-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative flex items-center justify-center gap-3">
          {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4 text-brand-cyan" />}
          ANALISAR E EXTRAIR MOTOR SUPREMO
        </span>
      </button>

      {/* Extracted Model Display */}
      {modelStructure && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-background-mid border border-white/10 rounded-[32px] p-8 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
               <Cpu className="w-5 h-5 text-brand-pink" />
               <h3 className="font-orbitron text-[10px] font-black text-white tracking-[0.2em] uppercase">Modelo Gerador Unificado v2.0</h3>
            </div>
            <div className="bg-background-deep/50 border border-white/5 rounded-2xl p-6 font-space text-[11px] leading-loose text-brand-cyan/70 whitespace-pre-wrap shadow-inner max-h-80 overflow-y-auto custom-scrollbar">
              {modelStructure}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => copyToClipboard(modelStructure)} className="px-6 py-2.5 bg-brand-purple/10 border border-brand-purple/20 rounded-xl text-[10px] font-black text-brand-purple hover:bg-brand-purple/20 transition-all flex items-center gap-2 tracking-widest uppercase">
                <Copy className="w-3.5 h-3.5" /> Copiar Matriz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generator Params */}
      {modelStructure && (
        <div className="bg-background-mid border border-white/10 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/5 blur-[100px] -z-10" />
          
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green shadow-lg shadow-brand-green/10">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-orbitron text-xl font-black text-white tracking-tighter uppercase">Engenharia Reversa Ativa</h2>
              <p className="text-[10px] font-space text-gray-500 uppercase tracking-widest">Configure os parâmetros para a geração superior</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-10">
            <div className="space-y-4">
              <label className="block font-space text-[10px] text-gray-500 font-bold uppercase tracking-widest">📏 Extensão (Palavras)</label>
              <div className="flex items-center gap-4">
                <input type="number" value={minWords} onChange={e => setMinWords(parseInt(e.target.value))} className="w-full bg-background-light border border-white/5 rounded-xl px-4 py-3 text-xs text-white font-space focus:border-brand-green/50 outline-none transition-all" />
                <span className="text-gray-700 font-bold">→</span>
                <input type="number" value={maxWords} onChange={e => setMaxWords(parseInt(e.target.value))} className="w-full bg-background-light border border-white/5 rounded-xl px-4 py-3 text-xs text-white font-space focus:border-brand-green/50 outline-none transition-all" />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block font-space text-[10px] text-gray-500 font-bold uppercase tracking-widest">👁 Perspectiva Narrativa</label>
              <select value={perspective} onChange={e => setPerspective(e.target.value)} className="w-full bg-background-light border border-white/5 rounded-xl px-4 py-3 text-xs text-white font-bold appearance-none cursor-pointer focus:border-brand-purple/50 outline-none transition-all">
                <option value="1ª Pessoa">1ª Pessoa</option>
                <option value="2ª Pessoa">2ª Pessoa</option>
                <option value="3ª Pessoa">3ª Pessoa</option>
                <option value="Onisciente">Onisciente</option>
                <option value="Narrador Oculto">Narrador Oculto</option>
                <option value="Testemunha">Testemunha</option>
                <option value="Confissão">Confissão</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="block font-space text-[10px] text-gray-500 font-bold uppercase tracking-widest">🎭 Tom Narrativo</label>
              <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-background-light border border-white/5 rounded-xl px-4 py-3 text-xs text-white font-bold appearance-none cursor-pointer focus:border-brand-pink/50 outline-none transition-all">
                <option value="epico">Épico (Grandioso e Heroico)</option>
                <option value="tragico">Trágico (Fatalidade e Sofrimento)</option>
                <option value="melancolico">Melancólico (Nostálgico e Íntimo)</option>
                <option value="otimista">Optimista (Esperançoso)</option>
                <option value="pessimista">Pesimista (Sombrío)</option>
                <option value="ironico">Irônico (Sutilmente Crítico)</option>
                <option value="satirico">Satírico (Burla e Crítica)</option>
                <option value="humoristico">Humorístico (Leve e Divertido)</option>
                <option value="dramatico">Dramático (Intenso Emocionalmente)</option>
                <option value="romantico">Romântico (Sentimental)</option>
                <option value="realista">Realista (Sóbrio e Crível)</option>
                <option value="crudo">Crudo (Direto e Duro)</option>
                <option value="poetico">Poético (Metafórico e Musical)</option>
                <option value="misterioso">Misterioso (Suspense e Intriga)</option>
                <option value="oscuro">Oscuro (Perturbador e Denso)</option>
                <option value="reflexivo">Reflexivo (Filosófico)</option>
                <option value="alegorico">Alegórico (Simbólico)</option>
                <option value="infantil">Infantil (Simples e Terno)</option>
                <option value="epico-comico">Épico-cômico (Grandioso e Humor)</option>
                <option value="intimo">Íntimo (Mundo Interior)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 mb-10">
            <label className="block font-space text-[10px] text-gray-500 font-bold uppercase tracking-widest">✍️ Título do Vídeo</label>
            <textarea 
              value={videoTitle} 
              onChange={e => setVideoTitle(e.target.value)} 
              placeholder="Ex: A queda secreta do Império Romano..." 
              className="w-full bg-background-light border border-white/5 rounded-2xl px-6 py-4 text-sm text-white font-medium h-24 resize-none focus:border-brand-green/50 outline-none transition-all" 
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !videoTitle}
            className="w-full py-5 bg-brand-green text-background-deep font-orbitron text-xs font-black tracking-[0.4em] rounded-2xl hover:bg-brand-green/90 hover:shadow-2xl hover:shadow-brand-green/20 transition-all disabled:opacity-30 flex items-center justify-center gap-3 uppercase"
          >
            {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            DISPARAR GERAÇÃO SUPREMA
          </button>
        </div>
      )}

      {/* Result Display */}
      {resultScript && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="bg-background-mid border border-white/10 rounded-[48px] p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink" />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="px-5 py-2.5 bg-brand-cyan/10 border border-brand-cyan/20 rounded-xl text-[10px] font-space font-black text-brand-cyan tracking-widest uppercase">
                  {resultScript.split(/\s+/).length} PALAVRAS
                </div>
                <div className="px-5 py-2.5 bg-brand-green/10 border border-brand-green/20 rounded-lg text-[10px] font-space font-black text-brand-green tracking-widest uppercase flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> ~{Math.ceil(resultScript.split(/\s+/).length / 140)} MINUTOS
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => copyToClipboard(resultScript)} className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest text-gray-300">
                  <Copy className="w-4 h-4" /> Copiar Roteiro
                </button>
                <button onClick={() => setResultScript(null)} className="p-3 bg-white/5 hover:bg-brand-pink/10 border border-white/10 rounded-xl transition-all text-gray-500 hover:text-brand-pink">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="text-gray-200 text-lg leading-[1.9] font-rajdhani whitespace-pre-wrap max-h-[700px] overflow-y-auto custom-scrollbar pr-4">
              {resultScript}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UmbraScriptTool;
