
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Copy, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  Check, 
  Filter, 
  Tag, 
  Zap, 
  Wrench, 
  Book,
  Code,
  FileText,
  BarChart3,
  MoreHorizontal
} from 'lucide-react';

interface Prompt {
  id: string;
  title: string;
  category: string;
  text: string;
  variables: string[];
  timestamp: number;
}

const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: Filter },
  { id: 'marketing', name: 'Marketing', icon: Zap },
  { id: 'code', name: 'Código', icon: Code },
  { id: 'writing', name: 'Escrita', icon: FileText },
  { id: 'analysis', name: 'Análise', icon: BarChart3 },
  { id: 'other', name: 'Outros', icon: MoreHorizontal },
];

const STORAGE_KEY = 'umbra_prompts_vault_v1';

const PromptVaultTool: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('marketing');
  const [formText, setFormText] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPrompts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load prompts", e);
      }
    } else {
      // Sample data
      const initial = [
        {
          id: '1',
          title: "Email de Vendas",
          category: "marketing",
          text: "Escreva um email de vendas profissional para {{nome_cliente}} sobre {{produto}}. O email deve destacar {{beneficio_principal}} e incluir um call-to-action claro.",
          variables: ["nome_cliente", "produto", "beneficio_principal"],
          timestamp: Date.now()
        },
        {
          id: '2',
          title: "Code Review",
          category: "code",
          text: "Faça uma revisão detalhada do seguinte código {{linguagem}}:\n\n{{codigo}}\n\nFoco em: {{aspectos}}",
          variables: ["linguagem", "codigo", "aspectos"],
          timestamp: Date.now()
        }
      ];
      setPrompts(initial);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  }, [prompts]);

  const showToast = (msg: string) => {
    setToast(msg);
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
    return prompts.filter(p => {
      const matchesCategory = currentFilter === 'all' || p.category === currentFilter;
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
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
      setFormCategory('marketing');
      setFormText('');
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newPrompt: Prompt = {
      id: editingId || Date.now().toString(),
      title: formTitle,
      category: formCategory,
      text: formText,
      variables: extractVariables(formText),
      timestamp: Date.now()
    };

    if (editingId) {
      setPrompts(prompts.map(p => p.id === editingId ? newPrompt : p));
      showToast('Prompt atualizado com sucesso!');
    } else {
      setPrompts([newPrompt, ...prompts]);
      showToast('Prompt criado com sucesso!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir este prompt?')) {
      setPrompts(prompts.filter(p => p.id !== id));
      showToast('Prompt excluído.');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copiado para área de transferência!');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `umbra_prompts_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Biblioteca exportada!');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (Array.isArray(imported)) {
            setPrompts([...imported, ...prompts]);
            showToast(`${imported.length} prompts importados!`);
          }
        } catch (err) {
          alert('Arquivo inválido!');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      <header className="text-center bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-cyan/10 pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-purple/10 rounded-[28px] mb-6 shadow-2xl shadow-brand-purple/10 ring-1 ring-brand-purple/20">
            <Lock className="w-10 h-10 text-brand-purple" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-purple via-brand-pink to-brand-cyan bg-clip-text text-transparent uppercase font-bebas">
            Umbra Prompt Vault
          </h1>
          <p className="text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Salve, organize e reutilize seus melhores prompts com variáveis e templates inteligentes para escalar sua produção.
          </p>
        </div>
      </header>

      {/* QUICK STATS / FEATURES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Book, title: "Library", desc: "Biblioteca completa", color: "text-brand-purple" },
          { icon: Wrench, title: "Variables", desc: "Suporte dinâmico", color: "text-brand-cyan" },
          { icon: Tag, title: "Categories", desc: "Organização fluida", color: "text-brand-pink" },
          { icon: Zap, title: "Quick Access", desc: "Busca instantânea", color: "text-brand-green" },
        ].map((f, i) => (
          <div key={i} className="bg-background-mid border border-white/5 rounded-[24px] p-6 shadow-xl flex flex-col items-center text-center group hover:border-white/10 transition-all">
            <f.icon className={`w-8 h-8 mb-3 ${f.color} transition-transform group-hover:scale-110`} />
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-1">{f.title}</h4>
            <p className="text-[10px] text-gray-500 font-medium">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CONTROLS */}
      <div className="bg-background-mid border border-white/5 rounded-[32px] p-4 flex flex-wrap items-center gap-4 shadow-xl">
        <button 
          onClick={() => handleOpenModal()}
          className="px-8 py-3.5 bg-brand-purple text-white font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-brand-purple/20 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Novo Prompt
        </button>
        
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-brand-cyan transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar nos prompts do cofre..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-background-deep border border-white/5 rounded-2xl py-3.5 pl-14 pr-6 text-sm font-bold text-white focus:border-brand-cyan outline-none transition-all"
          />
        </div>

        <div className="flex gap-2">
          <button onClick={handleExport} className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-brand-cyan hover:bg-white/10 transition-all" title="Exportar">
            <Download className="w-5 h-5" />
          </button>
          <label className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-brand-purple hover:bg-white/10 transition-all cursor-pointer" title="Importar">
            <Upload className="w-5 h-5" />
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap justify-center gap-2">
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id}
            onClick={() => setCurrentFilter(cat.id)}
            className={`flex items-center gap-3 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${currentFilter === cat.id ? 'bg-brand-cyan border-brand-cyan text-background-deep shadow-lg shadow-brand-cyan/20' : 'bg-background-mid border-white/5 text-gray-500 hover:text-white'}`}
          >
            <cat.icon className="w-3.5 h-3.5" /> {cat.name}
          </button>
        ))}
      </div>

      {/* PROMPTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrompts.length === 0 ? (
          <div className="col-span-full py-32 text-center opacity-20">
             <Lock className="w-16 h-16 mx-auto mb-6" />
             <p className="font-orbitron text-xs font-black uppercase tracking-widest">Cofre Vazio ou Sem Resultados</p>
          </div>
        ) : (
          filteredPrompts.map(p => (
            <div key={p.id} className="group bg-background-mid border border-white/5 rounded-[40px] p-8 space-y-6 hover:border-brand-purple/30 transition-all shadow-xl relative overflow-hidden flex flex-col">
               <div className="absolute top-0 right-0 w-24 h-24 bg-brand-purple/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-brand-purple/10 transition-all" />
               
               <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="px-3 py-1 bg-brand-purple/10 border border-brand-purple/20 rounded-lg text-[8px] font-black text-brand-purple uppercase tracking-widest mb-2 inline-block">
                      {CATEGORIES.find(c => c.id === p.category)?.name || 'Outros'}
                    </span>
                    <h3 className="text-xl font-black tracking-tight text-white group-hover:text-brand-cyan transition-colors">{p.title}</h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                     <button onClick={() => handleOpenModal(p)} className="p-2.5 bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all"><Edit3 className="w-4 h-4" /></button>
                     <button onClick={() => handleDelete(p.id)} className="p-2.5 bg-white/5 rounded-xl text-gray-500 hover:text-brand-pink transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
               </div>

               <p className="text-sm text-gray-400 font-medium leading-relaxed line-clamp-4 flex-1">
                 {p.text}
               </p>

               {p.variables.length > 0 && (
                 <div className="flex flex-wrap gap-2 py-2">
                   {p.variables.map(v => (
                     <span key={v} className="px-2.5 py-1 bg-background-deep border border-white/5 rounded-lg text-[9px] font-mono text-brand-cyan/70">
                       {{v}}
                     </span>
                   ))}
                 </div>
               )}

               <div className="pt-4 border-t border-white/5">
                  <button 
                    onClick={() => handleCopy(p.text)}
                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                  >
                    <Copy className="w-4 h-4" /> Copiar Template
                  </button>
               </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-background-deep/95 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />
           <div className="relative bg-background-mid border border-white/10 rounded-[48px] p-10 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-brand-purple"><Save className="w-6 h-6" /></div>
                    <h2 className="text-2xl font-black tracking-tight">{editingId ? 'Editar Prompt' : 'Novo Prompt'}</h2>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleSave} className="space-y-8 overflow-y-auto custom-scrollbar pr-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">Título do Template</label>
                       <input 
                         required
                         type="text" 
                         value={formTitle}
                         onChange={e => setFormTitle(e.target.value)}
                         placeholder="Ex: Roteiro para Narrador IA"
                         className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-brand-purple outline-none transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">Categoria</label>
                       <select 
                         value={formCategory}
                         onChange={e => setFormCategory(e.target.value)}
                         className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-bold text-white focus:border-brand-purple outline-none appearance-none cursor-pointer"
                       >
                         {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                           <option key={c.id} value={c.id}>{c.name}</option>
                         ))}
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <div className="flex justify-between items-center px-2">
                       <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Conteúdo do Prompt</label>
                       <span className="text-[8px] font-black text-brand-cyan uppercase tracking-widest">Use {"{{variavel}}"} para criar campos dinâmicos</span>
                    </div>
                    <textarea 
                      required
                      value={formText}
                      onChange={e => setFormText(e.target.value)}
                      placeholder="Cole seu prompt base aqui..."
                      className="w-full h-64 bg-background-deep border border-white/10 rounded-[32px] p-8 text-sm font-medium leading-relaxed text-gray-400 focus:border-brand-purple outline-none resize-none shadow-inner custom-scrollbar"
                    />
                 </div>

                 {detectedVariables.length > 0 && (
                   <div className="space-y-2 animate-in slide-in-from-top-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Variáveis Detectadas</label>
                      <div className="flex flex-wrap gap-2 p-4 bg-background-deep/50 border border-white/5 rounded-2xl">
                         {detectedVariables.map(v => (
                           <span key={v} className="px-3 py-1.5 bg-brand-cyan/10 border border-brand-cyan/20 rounded-lg text-[9px] font-mono text-brand-cyan">
                             {{v}}
                           </span>
                         ))}
                      </div>
                   </div>
                 )}

                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-white/5 border border-white/5 text-gray-500 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-white/10 transition-all">Cancelar</button>
                    <button type="submit" className="flex-2 py-5 bg-brand-purple text-white font-black rounded-2xl hover:bg-brand-purple/90 transition-all uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-purple/20">
                      {editingId ? 'Salvar Alterações' : 'Adicionar ao Cofre'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-[200] animate-in slide-in-from-right-4 duration-300">
           <div className="px-8 py-5 bg-brand-purple rounded-[24px] shadow-2xl flex items-center gap-4 border border-brand-purple/50 backdrop-blur-xl ring-4 ring-black/50">
             <Check className="w-6 h-6 text-white" />
             <span className="font-black text-sm uppercase tracking-tighter text-white">{toast}</span>
           </div>
        </div>
      )}

      <footer className="mt-20 py-20 text-center opacity-40 border-t border-white/5">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500">Umbra Engine • Prompt Synchronization System v2.1</p>
      </footer>
    </div>
  );
};

export default PromptVaultTool;
