
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Download, Copy, Edit3, Trash2, X, Save, Check,
  Filter, Zap, Code, FileText, BarChart3,
  MoreHorizontal, ChevronRight, Sparkles, ClipboardCheck, Terminal,
  Layers, History, Star
} from 'lucide-react';

interface Prompt {
  id: string;
  title: string;
  category: string;
  text: string;
  variables: string[];
  timestamp: number;
  isFavorite?: boolean;
}

const CATEGORIES = [
  { id: 'all',       name: 'Todos',        icon: Filter       },
  { id: 'viral',     name: 'Viralização',  icon: Zap          },
  { id: 'script',    name: 'Roteirização', icon: FileText     },
  { id: 'marketing', name: 'Conversão',    icon: BarChart3    },
  { id: 'code',      name: 'Automação',    icon: Code         },
  { id: 'other',     name: 'Especiais',    icon: MoreHorizontal },
];

const ELITE_LIBRARY: Prompt[] = [
  {
    id: 'lib-1',
    title: "Ganchos de Retenção (3 Segundos)",
    category: "viral",
    text: "Crie 5 variações de ganchos (hooks) para um vídeo de {{nicho}} que falem diretamente sobre {{problema_comum}}. Use o gatilho de curiosidade negativa e prometa uma solução em {{tempo}}.",
    variables: ["nicho", "problema_comum", "tempo"],
    timestamp: Date.now()
  },
  {
    id: 'lib-2',
    title: "Roteiro Faceless Estilo 'Documentário'",
    category: "script",
    text: "Estrutura de roteiro cinematográfico para canal dark. Nicho: {{nicho}}. Tópico: {{tema}}. O roteiro deve ter uma introdução de 30 segundos, 3 pontos de conflito e uma conclusão emocional.",
    variables: ["nicho", "tema"],
    timestamp: Date.now()
  },
  {
    id: 'lib-3',
    title: "Refinador de Prompt IA (Metaprompt)",
    category: "code",
    text: "Atue como um Engenheiro de Prompt. Analise o seguinte prompt: {{prompt_base}}. Reescreva-o usando a técnica Chain-of-Thought, adicionando exemplos Few-Shot e restrições de {{formato_saida}}.",
    variables: ["prompt_base", "formato_saida"],
    timestamp: Date.now()
  },
  {
    id: 'lib-4',
    title: "Títulos de Alto CTR (Clickbait Ético)",
    category: "marketing",
    text: "Gere 10 títulos altamente clicáveis para um vídeo sobre {{assunto}}. Os títulos devem seguir o padrão de 'lacuna de curiosidade' e evitar palavras de spam. Foco no público {{target}}.",
    variables: ["assunto", "target"],
    timestamp: Date.now()
  },
  {
    id: 'lib-5',
    title: "Chamada para Ação (CTA) Invisível",
    category: "marketing",
    text: "Escreva um encerramento de vídeo que peça para o usuário se inscrever sem parecer desesperado. O contexto é um vídeo sobre {{contexto}}. Use o gatilho de 'pertencimento ao grupo'.",
    variables: ["contexto"],
    timestamp: Date.now()
  }
];

const STORAGE_KEY = 'umbra_prompts_vault_v2';

const PromptVaultTool: React.FC = () => {
  const [prompts, setPrompts]             = useState<Prompt[]>([]);
  const [searchTerm, setSearchTerm]       = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [isFillerOpen, setIsFillerOpen]   = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [fillerValues, setFillerValues]   = useState<Record<string, string>>({});
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [toast, setToast]                 = useState<{ msg: string; type: 'success' | 'info' } | null>(null);

  const [formTitle, setFormTitle]       = useState('');
  const [formCategory, setFormCategory] = useState('viral');
  const [formText, setFormText]         = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setPrompts(JSON.parse(saved)); } catch { setPrompts(ELITE_LIBRARY); }
    } else {
      setPrompts(ELITE_LIBRARY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  }, [prompts]);

  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const extractVariables = (text: string) => {
    const regex = /\{\{([^}]+)\}\}/g;
    const vars: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const v = match[1].trim();
      if (!vars.includes(v)) vars.push(v);
    }
    return vars;
  };

  const detectedVariables = useMemo(() => extractVariables(formText), [formText]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter((p: Prompt) => {
      const matchesCategory = currentFilter === 'all' || p.category === currentFilter;
      const matchesSearch   = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              p.text.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [prompts, currentFilter, searchTerm]);

  const handleOpenModal = (p?: Prompt) => {
    if (p) {
      setEditingId(p.id);
      setFormTitle(p.title);
      setFormCategory(p.category);
      setFormText(p.text);
    } else {
      setEditingId(null);
      setFormTitle('');
      setFormCategory('viral');
      setFormText('');
    }
    setIsModalOpen(true);
  };

  const handleOpenFiller = (p: Prompt) => {
    setSelectedPrompt(p);
    const initialValues: Record<string, string> = {};
    p.variables.forEach(v => { initialValues[v] = ''; });
    setFillerValues(initialValues);
    setIsFillerOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newPrompt: Prompt = {
      id: editingId || `p-${Date.now()}`,
      title: formTitle,
      category: formCategory,
      text: formText,
      variables: extractVariables(formText),
      timestamp: Date.now()
    };
    if (editingId) {
      setPrompts(prompts.map((p: Prompt) => p.id === editingId ? newPrompt : p));
      showToast('Prompt atualizado!');
    } else {
      setPrompts([newPrompt, ...prompts]);
      showToast('Adicionado ao cofre!');
    }
    setIsModalOpen(false);
  };

  const toggleFavorite = (id: string) => {
    setPrompts(prompts.map((p: Prompt) => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
    showToast('Preferência atualizada', 'info');
  };

  const handleCopyFinal = () => {
    if (!selectedPrompt) return;
    let finalText = selectedPrompt.text;
    Object.entries(fillerValues).forEach(([key, val]) => {
      finalText = finalText.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), val || `[${key}]`);
    });
    navigator.clipboard.writeText(finalText);
    showToast('Prompt preenchido copiado!');
    setIsFillerOpen(false);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `umbra_prompts_${Date.now()}.json`;
    a.click();
    showToast('Backup exportado!');
  };

  const totalVariables = prompts.reduce((a: number, p: Prompt) => a + p.variables.length, 0);
  const totalFavorites = prompts.filter((p: Prompt) => p.isFavorite).length;

  return (
    <div className="max-w-7xl mx-auto py-10 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 10px; }
        .prompt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
      `}</style>

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center md:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
              Sincronização v2.5
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
              {prompts.length} Prompts
            </span>
            {totalFavorites > 0 && (
              <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-black text-amber-700 uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {totalFavorites} Favorito{totalFavorites > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Prompt Vault</h1>
          <p className="text-gray-600 font-black mt-1">O cofre de elite para criadores — templates dinâmicos com variáveis preenchíveis.</p>
        </div>
      </div>

      {/* ── STATS + ACTIONS CARD ── */}
      <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
          {/* Stats */}
          <div className="flex items-center gap-6">
            {[
              { label: 'Biblioteca', value: prompts.length },
              { label: 'Variáveis',  value: totalVariables },
              { label: 'Favoritos',  value: totalFavorites },
              { label: 'Storage',    value: 'Local'        },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-black text-gray-900 leading-none">{s.value}</div>
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-black text-xs uppercase tracking-widest text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" /> Exportar
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="px-5 py-2.5 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Novo Template
            </button>
          </div>
        </div>
      </section>

      {/* ── SEARCH + FILTER CARD ── */}
      <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Filter className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900">Filtrar Biblioteca</h3>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {filteredPrompts.length} de {prompts.length} prompts
            </p>
          </div>
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 gap-3 focus-within:border-black transition-all">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por título ou conteúdo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 py-3.5 bg-transparent outline-none text-sm font-black text-gray-900 placeholder:text-gray-400"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCurrentFilter(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                  currentFilter === cat.id
                    ? 'bg-black text-white border-black'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" /> {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMPTS GRID ── */}
      {filteredPrompts.length === 0 ? (
        <div className="py-32 bg-white border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
            <History className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Nenhum prompt encontrado</h3>
          <p className="text-gray-500 font-black text-sm max-w-xs leading-relaxed mb-8">
            Tente mudar o filtro ou crie um novo template agora mesmo.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="px-8 py-3.5 bg-black text-white font-black rounded-xl text-xs uppercase tracking-[0.2em] hover:bg-gray-900 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Criar Template
          </button>
        </div>
      ) : (
        <>
          {/* Section divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] whitespace-nowrap">
              {filteredPrompts.length} template{filteredPrompts.length !== 1 ? 's' : ''}
            </span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <div className="prompt-grid">
            {filteredPrompts.map((p: Prompt) => {
              const cat = CATEGORIES.find(c => c.id === p.category);
              return (
                <article
                  key={p.id}
                  className="group bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden hover:border-gray-400 hover:shadow-md transition-all duration-200"
                >
                  {/* Card header */}
                  <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shrink-0">
                        {cat && <cat.icon className="w-4 h-4 text-primary" />}
                      </div>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        {cat?.name}
                      </span>
                    </div>
                    {p.isFavorite && (
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-5 flex flex-col flex-1 gap-4">
                    <h3 className="text-base font-black text-gray-900 leading-tight">
                      {p.title}
                    </h3>

                    <p className="text-sm text-gray-500 font-black leading-relaxed line-clamp-4 flex-1">
                      {p.text}
                    </p>

                    {/* Variables */}
                    <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                      {p.variables.length > 0
                        ? p.variables.map(v => (
                          <span key={v} className="px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-[9px] font-mono font-black text-gray-600">
                            {`{{${v}}}`}
                          </span>
                        ))
                        : <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sem variáveis</span>
                      }
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleOpenFiller(p)}
                        className="flex-1 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-900 active:scale-95 transition-all"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" /> Preencher & Copiar
                      </button>
                      <button
                        onClick={() => toggleFavorite(p.id)}
                        className={`p-3 rounded-xl border transition-all ${
                          p.isFavorite
                            ? 'bg-amber-50 border-amber-200 text-amber-500'
                            : 'bg-white border-gray-200 text-gray-400 hover:border-amber-200 hover:text-amber-400'
                        }`}
                        title="Favoritar"
                      >
                        <Star className={`w-4 h-4 ${p.isFavorite ? 'fill-amber-400' : ''}`} />
                      </button>
                      <div className="relative group/menu">
                        <button className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:border-gray-400 hover:text-gray-700 transition-all">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 bottom-full mb-2 w-44 bg-white border border-gray-200 rounded-xl p-1.5 shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20">
                          <button
                            onClick={() => handleOpenModal(p)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-xs font-black text-gray-700 hover:bg-gray-50 transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Editar
                          </button>
                          <button
                            onClick={() => { setPrompts(prompts.filter((item: Prompt) => item.id !== p.id)); showToast('Prompt removido'); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-xs font-black text-red-600 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* ── FOOTER ── */}
      <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-black text-gray-900 italic uppercase tracking-tighter">Umbra Prompt Vault</div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Elite Vault System v2.5.0 — Armazenamento 100% Local</p>
        </div>
        <div className="flex items-center gap-6">
          {[
            { label: 'Prompts',    value: String(prompts.length) },
            { label: 'Categorias', value: '5'                    },
            { label: 'Storage',    value: 'Local'                },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-lg font-black text-gray-900">{stat.value}</div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FILLER MODAL ── */}
      {isFillerOpen && selectedPrompt && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsFillerOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">

            <div className="bg-black text-white px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Preencher Prompt</h2>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mt-0.5">{selectedPrompt.title}</p>
              </div>
              <button
                onClick={() => setIsFillerOpen(false)}
                className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {selectedPrompt.variables.length > 0 ? (
                <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar">
                  {selectedPrompt.variables.map(v => (
                    <div key={v} className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                        Valor para <span className="font-mono text-gray-900">{`{{${v}}}`}</span>
                      </label>
                      <input
                        type="text"
                        value={fillerValues[v] || ''}
                        onChange={e => setFillerValues({ ...fillerValues, [v]: e.target.value })}
                        placeholder="Digite aqui..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:border-black outline-none transition-all"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-500 font-black text-sm">Nenhuma variável detectada no template.</p>
                </div>
              )}

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 font-black italic leading-relaxed">
                {selectedPrompt.text.substring(0, 150)}...
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsFillerOpen(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-900 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCopyFinal}
                  className="flex-[2] py-4 bg-black text-white font-black rounded-xl text-xs uppercase tracking-[0.2em] hover:bg-gray-900 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <ClipboardCheck className="w-4 h-4" /> Copiar Resultado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDITOR MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">

            <div className="bg-black text-white px-8 py-6 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter italic">
                  {editingId ? 'Editar Template' : 'Criar Template'}
                </h2>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-0.5">
                  {editingId ? 'Atualize o prompt no cofre' : 'Adicione um novo prompt ao cofre'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Terminal className="w-3 h-3" /> Título do Prompt
                  </label>
                  <input
                    required
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="Ex: Refinador de Títulos"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:border-black outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-3 h-3" /> Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:border-black outline-none appearance-none cursor-pointer transition-all"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Corpo do Prompt</label>
                  <span className="px-3 py-1 bg-gray-900 text-white rounded-lg text-[9px] font-mono font-black">
                    Use {`{{variavel}}`}
                  </span>
                </div>
                <textarea
                  required
                  value={formText}
                  onChange={e => setFormText(e.target.value)}
                  placeholder={`Seu prompt base aqui... Ex: Crie roteiros sobre {{assunto}} para meu público {{target}}.`}
                  className="w-full h-56 bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 text-sm font-black leading-relaxed text-gray-900 focus:border-black outline-none resize-none transition-all custom-scrollbar"
                />
              </div>

              {detectedVariables.length > 0 && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Variáveis Detectadas</label>
                  <div className="flex flex-wrap gap-2 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    {detectedVariables.map(v => (
                      <span key={v} className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-[10px] font-mono font-black">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2 pb-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-900 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-black text-white font-black rounded-xl text-xs uppercase tracking-[0.3em] hover:bg-gray-900 active:scale-95 transition-all"
                >
                  {editingId ? 'Confirmar Edição' : 'Guardar no Cofre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-[400] animate-in slide-in-from-right-4 duration-300">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shrink-0">
              {toast.type === 'success'
                ? <Check    className="w-5 h-5 text-white" />
                : <Sparkles className="w-5 h-5 text-white" />}
            </div>
            <div>
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Cofre Umbra</div>
              <div className="text-sm font-black text-gray-900">{toast.msg}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptVaultTool;
