import React, { useState, useEffect } from 'react';
import {
  Zap,
  Sparkles,
  Copy,
  CheckCircle2,
  Trash2,
  History,
  Layout,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Package,
  MapPin,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';

// Hardcoded API Keys
const MISTRAL_KEY = 'UCNgkoAkHk5ZvJRjy7EI1PjFoZrx8wKw';
const GEMINI_KEYS = [
  'AIzaSyAAMXblFJS_aSrroYDnYZdo4DRT2KHzXu4',
  'AIzaSyByBYVqa9fXqWkw-0AVs3ifFGA8okgw8TM',
  'AIzaSyCC8FhQHyTFhO1-2zFgEQtGy47Yt6ipeyw',
  'AIzaSyAej2ZKvhOtHFTGpePGX3pXedFwkukEyJs'
];

interface UmbraViralAIToolProps {
  userTier?: string;
}

interface PromptResult {
  imagem: string;
  take1: string;
  take2: string;
  take3: string;
  chatgpt: string;
}

interface HistoryItem {
  id: number;
  produto: string;
  local: string;
  data: string;
  preview: string;
  prompts: PromptResult;
}

const UmbraViralAITool: React.FC<UmbraViralAIToolProps> = ({ userTier }) => {
  // Form State
  const [produto, setProduto] = useState('');
  const [categoria, setCategoria] = useState('perfume');
  const [beneficio, setBeneficio] = useState('');
  const [genero, setGenero] = useState('mulher brasileira bonita e atlética');
  const [estilo, setEstilo] = useState('roupa esportiva, cabelo preso, suada do treino');
  const [local, setLocal] = useState('');
  const [pergunta1, setPergunta1] = useState('');
  const [resposta1, setResposta1] = useState('');
  const [pergunta2, setPergunta2] = useState('');
  const [resposta2, setResposta2] = useState('');

  // Advanced Options
  const [optImagem, setOptImagem] = useState(true);
  const [optTake1, setOptTake1] = useState(true);
  const [optTake2, setOptTake2] = useState(true);
  const [optTake3, setOptTake3] = useState(true);
  const [optIngles, setOptIngles] = useState(false);

  // Result State
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<PromptResult | null>(null);
  const [activeTab, setActiveTab] = useState<'imagem' | 'take1' | 'take2' | 'take3' | 'chatgpt'>('imagem');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('umbraViralHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (newPrompts: PromptResult) => {
    const newItem: HistoryItem = {
      id: Date.now(),
      produto: produto || 'Produto Sem Nome',
      local: local || 'Local não definido',
      data: new Date().toLocaleString('pt-BR'),
      preview: (resposta1 || 'Sem resposta').substring(0, 80) + '...',
      prompts: newPrompts
    };
    const updatedHistory = [newItem, ...history].slice(0, 20);
    setHistory(updatedHistory);
    localStorage.setItem('umbraViralHistory', JSON.stringify(updatedHistory));
  };

  const deleteHistoryItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('umbraViralHistory', JSON.stringify(updatedHistory));
    showToast('Item removido do histórico');
  };

  const loadFromHistory = (item: HistoryItem) => {
    setPrompts(item.prompts);
    showToast('Prompt carregado do histórico');
    window.scrollTo({ top: document.getElementById('output-section')?.offsetTop || 0, behavior: 'smooth' });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const setDialogo = (tipo: string) => {
    const dialogos: any = {
      perfume: {
        p1: 'O que te atrai mais em um homem?',
        r1: 'Ah, eu não sou muito exigente não, mas no mínimo o cara tem que ser bem cheiroso.',
        p2: 'Mas qual perfume você mais gosta em um homem?',
        r2: `Ah, eu sou apaixonada em homem que usa ${produto || '[PRODUTO]'}. Quando eu sinto esse cheiro de longe, eu já sei que ele é o cara.`
      },
      rejuvenescimento: {
        p1: 'Posso te perguntar uma coisa? Quantos anos você tem?',
        r1: 'Tenho 55 anos! Por quê, pareceu mais novo?',
        p2: 'Nossa, não acredito! Qual é o seu segredo?',
        r2: `Ah, uso ${produto || '[PRODUTO]'} todo dia. Mudou completamente a minha pele, não abro mão.`
      },
      emagrecimento: {
        p1: 'Você sempre foi assim ou perdeu peso recentemente?',
        r1: 'Perdi bastante peso nos últimos meses, foi uma transformação incrível.',
        p2: 'E o que você usou além da dieta e exercício?',
        r2: `Usei ${produto || '[PRODUTO]'} e fez toda a diferença. Acelerou muito o processo.`
      },
      cabelo: {
        p1: 'Gente, seu cabelo tá incrível! O que você faz?',
        r1: 'Ai, obrigada! Eu cuido bastante, né? Mas demorou pra chegar nesse nível.',
        p2: 'Qual produto você não abre mão no cabelo?',
        r2: `O ${produto || '[PRODUTO]'} salvou meu cabelo. Sério, antes ele era horrível.`
      },
      pele: {
        p1: 'Sua pele tá perfeita, qual é o seu segredo?',
        r1: 'Gente, eu cuido bastante da pele, né? Mas achei um produto que fez diferença de verdade.',
        p2: 'E qual produto é esse que você tá usando?',
        r2: `É o ${produto || '[PRODUTO]'}. Comecei a usar faz dois meses.`
      }
    };
    const d = dialogos[tipo];
    setPergunta1(d.p1);
    setResposta1(d.r1);
    setPergunta2(d.p2);
    setResposta2(d.r2);
  };

  const callGemini = async (promptText: string) => {
    let lastError = null;
    for (const apiKey of GEMINI_KEYS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig: { responseMimeType: 'application/json', temperature: 0.8 }
            })
          }
        );
        if (!response.ok) throw new Error(`Gemini status ${response.status}`);
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        return JSON.parse(text.replace(/```json|```/g, '').trim());
      } catch (e) {
        lastError = e;
        console.warn('Gemini Key failed, trying next...');
      }
    }
    throw lastError;
  };

  const handleGenerate = async () => {
    if (!produto.trim()) {
      showToast('⚠️ Insira o nome do produto');
      return;
    }
    setLoading(true);
    setPrompts(null);

    const aiPrompt = `Você é um especialista em marketing viral para TikTok Shop.
Gere 4 roteiros de vídeo extremamente realistas para o produto "${produto}" na categoria "${categoria}".
Benefício principal: "${beneficio}"
Personagem: "${genero}" com estilo "${estilo}"
Local: "${local || 'ambiente condizente'}"
Diálogo base: P1: "${pergunta1}" / R1: "${resposta1}" / P2: "${pergunta2}" / R2: "${resposta2}"

Regras:
- Use linguagem natural (Português do Brasil).
- Descrição visual rica focado em "Shot on iPhone", "9:16", "Smartphone style".
- O Take 1 é o gancho (entrevista).
- O Take 2 é a continuação/revelação.
- O Take 3 é o foco no produto/venda.
- A Imagem Base deve servir de referência visual perfeita.

Retorne um JSON com as chaves: imagem, take1, take2, take3, chatgpt (um prompt recomendando como adaptar isso).
Se a opção Inglês estiver ativa, gere os textos de diálogo em Inglês, mas descrições técnicas em Inglês também.
Idioma solicitado: ${optIngles ? 'Inglês' : 'Português'}.`;

    try {
      const result = await callGemini(aiPrompt);
      setPrompts(result);
      saveToHistory(result);
      showToast('✅ Prompts gerados com sucesso!');
    } catch (err) {
      console.error(err);
      showToast('❌ Erro ao gerar com IA. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-[1100px] mx-auto py-10 px-6 font-syne text-[#f0f0f8] relative z-10">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] bg-[#c8ff0010] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-200px] left-[-100px] w-[600px] h-[600px] bg-[#a78bfa0d] blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="text-center mb-14 relative z-10">
        <div className="inline-flex items-center gap-2 bg-[#c8ff0015] border border-[#c8ff0030] text-[#c8ff00] px-4 py-1.5 rounded-full mb-5 font-mono text-[11px] tracking-widest uppercase">
          <span className="w-1.5 h-1.5 bg-[#c8ff00] rounded-full animate-pulse" />
          TikTok Shop IA
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[0.9] mb-5">
          Gerador de <br />
          <span className="text-[#c8ff00] italic">Prompts Viral</span>
        </h1>
        <p className="text-[#6b6b8a] text-lg max-w-lg mx-auto font-instrument leading-relaxed">
          Crie campanhas magnéticas de vídeo estilo entrevista para explodir no TikTok Shop.
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 relative z-10">

        {/* Left Col: Product & Character */}
        <div className="space-y-6">
          {/* Card 1: Produto */}
          <section className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#c8ff00] to-transparent opacity-50" />
            <h2 className="flex items-center gap-3 text-[#c8ff00] text-[13px] font-bold uppercase tracking-widest mb-6">
              <span className="w-6 h-6 bg-[#c8ff0020] rounded-md flex items-center justify-center text-[10px]">1</span>
              Produto
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-[#6b6b8a] uppercase tracking-widest block">Nome <span className="text-[#c8ff00]">*</span></label>
                  <input
                    type="text"
                    value={produto}
                    onChange={(e) => setProduto(e.target.value)}
                    placeholder="Ex: Attraction Man"
                    className="w-full bg-[#12121a] border border-[#2a2a3a] rounded-xl px-4 py-3 text-sm focus:border-[#c8ff00] outline-none transition-all font-instrument"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-mono text-[#6b6b8a] uppercase tracking-widest block">Categoria</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-[#12121a] border border-[#2a2a3a] rounded-xl px-4 py-3 text-sm focus:border-[#c8ff00] outline-none transition-all font-instrument appearance-none"
                  >
                    <option value="perfume">Perfume</option>
                    <option value="skincare">Skincare</option>
                    <option value="suplemento">Suplemento</option>
                    <option value="cosmetico">Cosmético</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-[#6b6b8a] uppercase tracking-widest block">Benefício Principal</label>
                <input
                  type="text"
                  value={beneficio}
                  onChange={(e) => setBeneficio(e.target.value)}
                  placeholder="Ex: Cheiro que dura o dia todo"
                  className="w-full bg-[#12121a] border border-[#2a2a3a] rounded-xl px-4 py-3 text-sm focus:border-[#c8ff00] outline-none transition-all font-instrument"
                />
              </div>
            </div>
          </section>

          {/* Card 2: Personagem */}
          <section className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#ff6b35] to-transparent opacity-50" />
            <h2 className="flex items-center gap-3 text-[#ff6b35] text-[13px] font-bold uppercase tracking-widest mb-6">
              <span className="w-6 h-6 bg-[#ff6b3520] rounded-md flex items-center justify-center text-[10px]">2</span>
              Personagem
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-[#6b6b8a] uppercase tracking-widest block">Gênero</label>
                <select
                  value={genero}
                  onChange={(e) => setGenero(e.target.value)}
                  className="w-full bg-[#12121a] border border-[#2a2a3a] rounded-xl px-4 py-3 text-sm focus:border-[#ff6b35] outline-none transition-all font-instrument"
                >
                  <option value="mulher brasileira bonita e atlética">Mulher Jovem</option>
                  <option value="homem brasileiro bonito e atlético">Homem Jovem</option>
                  <option value="mulher brasileira madura e elegante">Mulher Madura</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-mono text-[#6b6b8a] uppercase tracking-widest block">Estilo Visual</label>
                <select
                  value={estilo}
                  onChange={(e) => setEstilo(e.target.value)}
                  className="w-full bg-[#12121a] border border-[#2a2a3a] rounded-xl px-4 py-3 text-sm focus:border-[#ff6b35] outline-none transition-all font-instrument"
                >
                  <option value="roupa esportiva, cabelo preso">Fitness</option>
                  <option value="vestido elegante, maquiagem">Festa</option>
                  <option value="roupa casual urbana">Urbano</option>
                </select>
              </div>
            </div>
          </section>
        </div>

        {/* Right Col: Scenario & Dialogue */}
        <div className="space-y-6">
          {/* Card 3: Cenário */}
          <section className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#a78bfa] to-transparent opacity-50" />
            <h2 className="flex items-center gap-3 text-[#a78bfa] text-[13px] font-bold uppercase tracking-widest mb-6">
              <span className="w-6 h-6 bg-[#a78bfa20] rounded-md flex items-center justify-center text-[10px]">3</span>
              Cenário
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {['Academia', 'Praia', 'Shopping', 'Restaurante'].map(loc => (
                <button
                  key={loc}
                  onClick={() => setLocal(loc)}
                  className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] uppercase transition-all ${local === loc ? 'bg-[#a78bfa20] border-[#a78bfa] text-[#a78bfa]' : 'bg-[#1a1a26] border-[#2a2a3a] text-[#6b6b8a] hover:border-[#a78bfa40]'}`}
                >
                  {loc}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Descreva o local em detalhes..."
              className="w-full bg-[#12121a] border border-[#2a2a3a] rounded-xl px-4 py-3 text-sm focus:border-[#a78bfa] outline-none transition-all font-instrument"
            />
          </section>

          {/* Card 4: Diálogo */}
          <section className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-8 relative overflow-hidden">
            <h2 className="flex items-center gap-3 text-[#f0f0f8] text-[13px] font-bold uppercase tracking-widest mb-6">
              <span className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center text-[10px]">4</span>
              Diálogo
            </h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {['perfume', 'rejuvenescimento', 'emagrecimento', 'cabelo'].map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setDialogo(tipo)}
                  className="px-3 py-1.5 rounded-lg bg-[#1a1a26] border border-[#2a2a3a] text-[#6b6b8a] font-mono text-[10px] uppercase hover:border-[#c8ff0040] transition-all"
                >
                  {tipo}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <textarea
                value={pergunta1}
                onChange={(e) => setPergunta1(e.target.value)}
                placeholder="Pergunta 1..."
                className="w-full bg-[#12121a] border border-[#2a2a3a] rounded-xl px-4 py-2 text-xs focus:border-[#c8ff00] outline-none transition-all font-instrument h-16 resize-none"
              />
              <textarea
                value={resposta1}
                onChange={(e) => setResposta1(e.target.value)}
                placeholder="Resposta 1..."
                className="w-full bg-[#12121a] border border-[#2a2a3a] rounded-xl px-4 py-2 text-xs focus:border-[#c8ff00] outline-none transition-all font-instrument h-20 resize-none"
              />
            </div>
          </section>
        </div>
      </div>

      {/* Advanced Options */}
      <section className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6 mb-10 relative z-10">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" checked={optIngles} onChange={(e) => setOptIngles(e.target.checked)} className="sr-only" />
            <div className={`w-10 h-6 rounded-full relative transition-all ${optIngles ? 'bg-[#c8ff00]' : 'bg-[#2a2a3a]'}`}>
              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${optIngles ? 'translate-x-4 h-4 w-4 bg-[#0a0a0f]' : ''}`} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Modo Gringa (Inglês)</span>
          </label>
          <div className="h-4 w-[1px] bg-[#2a2a3a] hidden sm:block" />
          <div className="flex gap-4">
            {['Imagem', 'Take 1', 'Take 2', 'Take 3'].map((t, idx) => (
              <label key={t} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#6b6b8a] cursor-pointer hover:text-white transition-colors">
                <input type="checkbox" className="accent-[#c8ff00]" defaultChecked /> {t}
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className={`w-full relative z-10 py-5 rounded-2xl font-extrabold text-lg uppercase tracking-widest transition-all overflow-hidden group mb-10 ${loading ? 'bg-[#2a2a3a] text-[#6b6b8a]' : 'bg-[#c8ff00] text-[#0a0a0f] hover:scale-[1.01] hover:shadow-[0_0_40px_#c8ff0030]'}`}
      >
        <div className="flex items-center justify-center gap-3">
          {loading ? (
            <div className="w-5 h-5 border-2 border-[#6b6b8a] border-t-white rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          {loading ? 'Sincronizando com a IA...' : 'GERAR PROMPTS VIRAL'}
        </div>
      </button>

      {/* Output Section */}
      {prompts && (
        <section id="output-section" className="bg-[#16161f] border border-[#2a2a3a] rounded-3xl p-8 mb-10 relative z-10 animate-in slide-in-from-bottom-10 duration-700">
          <div className="flex gap-1 bg-[#12121a] p-1.5 rounded-2xl border border-[#2a2a3a] mb-8 overflow-x-auto no-scrollbar">
            {[
              { id: 'imagem', icon: <ImageIcon className="w-4 h-4" />, label: 'Imagem' },
              { id: 'take1', icon: <Video className="w-4 h-4" />, label: 'Take 1' },
              { id: 'take2', icon: <Video className="w-4 h-4" />, label: 'Take 2' },
              { id: 'take3', icon: <Package className="w-4 h-4" />, label: 'Produto' },
              { id: 'chatgpt', icon: <MessageSquare className="w-4 h-4" />, label: 'ChatGPT' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#c8ff00] text-[#0a0a0f]' : 'text-[#6b6b8a] hover:text-white'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#1a1a26] border-b border-[#2a2a3a] flex items-center justify-between">
              <span className="text-[#c8ff00] text-[10px] font-mono font-bold uppercase tracking-[0.2em]">Prompt Gerado</span>
              <button
                onClick={() => copyToClipboard(prompts[activeTab], activeTab)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${copiedIndex === activeTab ? 'bg-[#c8ff0020] text-[#c8ff00] border-[#c8ff00]' : 'bg-[#1a1a26] text-[#6b6b8a] hover:text-[#f0f0f8] border border-[#2a2a3a]'}`}
              >
                {copiedIndex === activeTab ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedIndex === activeTab ? 'Copiado' : 'Copiar Text'}
              </button>
            </div>
            <div className="p-8">
              <pre className="text-sm font-instrument leading-relaxed text-[#c8c8e8] whitespace-pre-wrap break-all">
                {prompts[activeTab]}
              </pre>
            </div>
          </div>
        </section>
      )}

      {/* History */}
      <section className="relative z-10 border-t border-[#2a2a3a] pt-12">
        <h2 className="flex items-center gap-3 text-[#6b6b8a] text-[11px] font-bold uppercase tracking-[0.3em] mb-8">
          <History className="w-4 h-4" /> Histórico Recente
        </h2>
        {history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map(item => (
              <div
                key={item.id}
                onClick={() => loadFromHistory(item)}
                className="bg-[#16161f] border border-[#2a2a3a] rounded-2xl p-6 cursor-pointer hover:border-[#c8ff00] hover:-translate-y-1 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-[#a78bfa15] border border-[#a78bfa30] text-[#a78bfa] rounded-lg font-mono text-[9px] uppercase">{item.produto}</span>
                  <button onClick={(e) => deleteHistoryItem(item.id, e)} className="text-[#6b6b8a] hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
                <h4 className="text-sm font-bold mb-2">📍 {item.local}</h4>
                <p className="text-[11px] text-[#6b6b8a] leading-relaxed line-clamp-2 h-8">{item.preview}</p>
                <div className="mt-4 text-[9px] font-mono text-[#4a4a5a]">{item.data}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#16161f05] rounded-3xl border border-dashed border-[#2a2a3a] text-[#4a4a5a] font-mono text-xs">
            Nenhum prompt salvo no histórico
          </div>
        )}
      </section>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-[100] bg-[#c8ff00] text-[#0a0a0f] px-8 py-4 rounded-2xl font-bold translate-y-0 opacity-100 shadow-[0_10px_40px_rgba(200,255,0,0.3)] animate-in slide-in-from-bottom-5 duration-300">
          {toast}
        </div>
      )}

      <footer className="mt-20 text-center text-[#4a4a5a] text-[10px] font-mono tracking-[0.5em] uppercase">
        UmbraViral AI · TikTok Shop Engine · v1.0
      </footer>
    </div>
  );
};

export default UmbraViralAITool;
