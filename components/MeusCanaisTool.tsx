
import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderPlus, 
  Plus, 
  MoreVertical, 
  Trash2, 
  Archive, 
  ExternalLink, 
  Layout, 
  Video, 
  FileText, 
  StickyNote,
  Youtube,
  X,
  Calendar,
  Clock,
  Link as LinkIcon,
  Download,
  Upload,
  Activity,
  Edit2,
  ChevronRight,
  Info,
  Tag,
  AlignLeft,
  Settings
} from 'lucide-react';

const STORAGE_KEY = 'umbra_hub_meus_canais_v5';

// Types
interface VideoItem {
  id: string;
  title: string;
  status: 'draft' | 'scheduled' | 'published';
  script: string;
  tags: string;
  description: string;
  archived: boolean;
  createdAt: number;
}

interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

interface ScriptItem {
  id: string;
  name: string;
  size: string;
  content: string;
  createdAt: number;
}

interface Channel {
  id: string;
  name: string;
  color: string;
  folderId: string | null;
  references: string;
  notes: string;
  schedule: string;
  additional: string;
  videos: VideoItem[];
  channelNotes: NoteItem[];
  scripts: ScriptItem[];
  archived: boolean;
  youtubeUrl?: string;
  createdAt: number;
  updatedAt: number;
}

interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

const COLORS = ['#00f5ff', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

const MeusCanaisTool: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showArchivedVideos, setShowArchivedVideos] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'videos' | 'notes' | 'scripts'>('info');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [editingEntityId, setEditingEntityId] = useState<string | null>(null);

  // Form States
  const [folderForm, setFolderForm] = useState({ name: '', color: COLORS[0] });
  const [channelForm, setChannelForm] = useState({ 
    name: '', color: COLORS[0], folderId: '', references: '', notes: '', schedule: '', additional: '' 
  });
  const [videoForm, setVideoForm] = useState({ 
    title: '', status: 'draft' as 'draft' | 'scheduled' | 'published', script: '', tags: '', description: '' 
  });
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });
  const [ytForm, setYtForm] = useState({ url: '' });

  // Persistence: Load
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.folders) setFolders(data.folders);
        if (data.channels) setChannels(data.channels);
      } catch (e) { console.error("Falha ao carregar dados", e); }
    }
    setIsLoaded(true);
  }, []);

  // Persistence: Save
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ folders, channels }));
    }
  }, [folders, channels, isLoaded]);

  // Utilities
  const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
  const formatDate = (t: number) => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  // Folder Actions
  const submitFolder = () => {
    if (!folderForm.name.trim()) return;
    const newFolder = { ...folderForm, id: uid(), createdAt: Date.now() };
    setFolders([...folders, newFolder]);
    setFolderForm({ name: '', color: COLORS[0] });
    setActiveModal(null);
  };

  const deleteFolder = (id: string) => {
    if (confirm('Excluir pasta? Os canais nela ficarão "Sem Pasta".')) {
      setFolders(folders.filter(f => f.id !== id));
      setChannels(channels.map(ch => ch.folderId === id ? { ...ch, folderId: null } : ch));
    }
  };

  // Channel Actions
  const openNewChannelModal = () => {
    setEditingEntityId(null);
    setChannelForm({ name: '', color: COLORS[0], folderId: '', references: '', notes: '', schedule: '', additional: '' });
    setActiveModal('channel');
  };

  const submitChannel = () => {
    if (!channelForm.name.trim()) return;

    if (editingEntityId) {
      setChannels(channels.map(ch => ch.id === editingEntityId ? {
        ...ch,
        ...channelForm,
        folderId: channelForm.folderId || null,
        updatedAt: Date.now()
      } : ch));
      setEditingEntityId(null);
    } else {
      const newChannel: Channel = {
        ...channelForm,
        id: uid(),
        folderId: channelForm.folderId || null,
        videos: [],
        channelNotes: [],
        scripts: [],
        archived: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setChannels([...channels, newChannel]);
    }
    
    setChannelForm({ name: '', color: COLORS[0], folderId: '', references: '', notes: '', schedule: '', additional: '' });
    setActiveModal(null);
  };

  const editChannel = (ch: Channel) => {
    setEditingEntityId(ch.id);
    setChannelForm({
      name: ch.name,
      color: ch.color,
      folderId: ch.folderId || '',
      references: ch.references,
      notes: ch.notes,
      schedule: ch.schedule,
      additional: ch.additional
    });
    setActiveModal('channel');
    setOpenDropdown(null);
  };

  const toggleArchiveChannel = (id: string) => {
    setChannels(channels.map(ch => ch.id === id ? { ...ch, archived: !ch.archived } : ch));
    setOpenDropdown(null);
  };

  const deleteChannel = (id: string) => {
    if (confirm('Excluir este canal? Todos os dados vinculados serão perdidos permanentemente.')) {
      setChannels(channels.filter(ch => ch.id !== id));
      setOpenDropdown(null);
    }
  };

  // Video Actions
  const submitVideo = () => {
    if (!videoForm.title.trim() || !currentChannelId) return;
    const newVideo: VideoItem = { ...videoForm, id: uid(), archived: false, createdAt: Date.now() };
    setChannels(channels.map(ch => ch.id === currentChannelId ? { ...ch, videos: [...(ch.videos || []), newVideo], updatedAt: Date.now() } : ch));
    setVideoForm({ title: '', status: 'draft', script: '', tags: '', description: '' });
    setActiveModal('detail');
  };

  const toggleArchiveVideo = (chId: string, vId: string) => {
    setChannels(channels.map(ch => ch.id === chId ? {
      ...ch,
      videos: ch.videos.map(v => v.id === vId ? { ...v, archived: !v.archived } : v),
      updatedAt: Date.now()
    } : ch));
  };

  const deleteVideo = (chId: string, vId: string) => {
    if (confirm('Excluir este plano de vídeo?')) {
      setChannels(channels.map(ch => ch.id === chId ? { ...ch, videos: ch.videos.filter(v => v.id !== vId), updatedAt: Date.now() } : ch));
    }
  };

  // Note Actions
  const submitNote = () => {
    if (!noteForm.title.trim() || !currentChannelId) return;
    const newNote: NoteItem = { ...noteForm, id: uid(), createdAt: Date.now() };
    setChannels(channels.map(ch => ch.id === currentChannelId ? { ...ch, channelNotes: [...(ch.channelNotes || []), newNote], updatedAt: Date.now() } : ch));
    setNoteForm({ title: '', content: '' });
    setActiveModal('detail');
  };

  const deleteNote = (chId: string, nId: string) => {
    if (confirm('Excluir esta nota?')) {
      setChannels(channels.map(ch => ch.id === chId ? { ...ch, channelNotes: ch.channelNotes.filter(n => n.id !== nId), updatedAt: Date.now() } : ch));
    }
  };

  // Script Actions
  const handleScriptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentChannelId) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const newScript: ScriptItem = {
        id: uid(),
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        content,
        createdAt: Date.now()
      };
      setChannels(channels.map(ch => ch.id === currentChannelId ? { ...ch, scripts: [...(ch.scripts || []), newScript], updatedAt: Date.now() } : ch));
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  const deleteScript = (chId: string, sId: string) => {
    if (confirm('Excluir este roteiro?')) {
      setChannels(channels.map(ch => ch.id === chId ? { ...ch, scripts: ch.scripts.filter(s => s.id !== sId), updatedAt: Date.now() } : ch));
    }
  };

  // YT Link
  const linkYt = () => {
    if (!ytForm.url.trim() || !currentChannelId) return;
    setChannels(channels.map(ch => ch.id === currentChannelId ? { ...ch, youtubeUrl: ytForm.url, updatedAt: Date.now() } : ch));
    setYtForm({ url: '' });
    setActiveModal('detail');
  };

  const currentChannel = channels.find(ch => ch.id === currentChannelId);

  const renderChannelCard = (ch: Channel) => {
    const folder = folders.find(f => f.id === ch.folderId);
    return (
      <div key={ch.id} onClick={() => { setCurrentChannelId(ch.id); setDetailTab('info'); setActiveModal('detail'); }} className="group bg-background-mid border border-white/5 rounded-[32px] p-8 hover:border-brand-purple/40 transition-all cursor-pointer relative overflow-hidden shadow-xl">
        {ch.archived && <div className="absolute top-4 left-4 px-2 py-0.5 bg-gray-800 text-[8px] font-black uppercase tracking-widest rounded text-gray-400 z-10">Arquivado</div>}
        
        <div className="absolute top-6 right-6" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === ch.id ? null : ch.id); }}>
          <button className="p-2 bg-white/5 rounded-xl hover:text-white transition-colors"><MoreVertical className="w-4 h-4 text-gray-600" /></button>
          {openDropdown === ch.id && (
            <div className="absolute right-0 top-12 bg-background-light border border-white/10 rounded-2xl p-2 z-50 w-44 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <button onClick={(e) => { e.stopPropagation(); editChannel(ch); }} className="w-full text-left px-4 py-3 text-xs font-bold text-gray-300 hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors">
                <Edit2 className="w-4 h-4" /> Editar
              </button>
              <button onClick={(e) => { e.stopPropagation(); toggleArchiveChannel(ch.id); }} className="w-full text-left px-4 py-3 text-xs font-bold text-gray-300 hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors">
                <Archive className="w-4 h-4" /> {ch.archived ? 'Desarquivar' : 'Arquivar'}
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button onClick={(e) => { e.stopPropagation(); deleteChannel(ch.id); }} className="w-full text-left px-4 py-3 text-xs font-bold text-brand-pink hover:bg-brand-pink/10 rounded-xl flex items-center gap-3 transition-colors">
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center font-black text-2xl shadow-2xl transition-transform group-hover:scale-110" style={{ background: ch.color }}>
            {ch.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="text-xl font-black mb-1 leading-none group-hover:text-brand-cyan transition-colors">{ch.name}</h4>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black flex items-center gap-2">
              <FolderPlus className="w-3 h-3" /> {folder?.name || 'Sem Pasta'}
            </p>
          </div>
        </div>
        
        <div className="bg-background-deep/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between group-hover:bg-brand-purple/5 group-hover:border-brand-purple/10 transition-all">
          <div className="flex items-center gap-3">
            <Video className="w-4 h-4 text-brand-purple" />
            <span className="text-xs font-bold text-gray-400">{(ch.videos || []).length} Vídeos</span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black text-gray-700 uppercase tracking-widest">
            Painel <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background-deep text-white font-rajdhani relative overflow-x-hidden pb-20">
      <style>{`
        .orb { position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.08; pointer-events: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
      
      <div className="orb w-[600px] h-[600px] bg-brand-purple top-[-100px] left-[-100px]" />
      <div className="orb w-[500px] h-[500px] bg-brand-cyan bottom-[-100px] right-[-100px]" />

      <div className="relative z-10">
        <header className="px-8 py-10 flex flex-wrap items-center justify-between gap-6 border-b border-white/5 bg-background-mid/30 backdrop-blur-sm">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">Meus Canais</h1>
            <p className="text-gray-500 font-medium">Gerencie todos os seus canais do YouTube em um só lugar</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowArchived(!showArchived)} className={`px-5 py-2.5 border rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${showArchived ? 'bg-brand-cyan text-background-deep border-brand-cyan' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
              <Archive className="w-4 h-4" /> {showArchived ? 'Ocultar Arquivados' : 'Mostrar Arquivados'}
            </button>
            <button onClick={() => { setFolderForm({ name: '', color: COLORS[0] }); setActiveModal('folder'); }} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-brand-cyan" /> Nova Pasta
            </button>
            <button onClick={openNewChannelModal} className="px-5 py-2.5 bg-brand-purple rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-purple/90 transition-all flex items-center gap-2 shadow-lg shadow-brand-purple/20">
              <Plus className="w-4 h-4" /> Novo Canal
            </button>
          </div>
        </header>

        <main className="p-8 space-y-12">
          {/* Folders List */}
          {folders.length > 0 && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-500">
              <h2 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Layout className="w-3 h-3" /> Pastas Ativas
              </h2>
              <div className="flex flex-wrap gap-3">
                {folders.map(f => (
                  <div key={f.id} className="group px-4 py-3 bg-background-mid border border-white/5 rounded-2xl flex items-center gap-3 hover:border-brand-cyan/40 transition-all cursor-pointer">
                    <div className="w-3 h-3 rounded-md shadow-sm" style={{ background: f.color }} />
                    <span className="text-sm font-bold">{f.name}</span>
                    <span className="text-[10px] bg-background-light px-2 py-0.5 rounded-lg text-gray-500 font-black">
                      {channels.filter(ch => ch.folderId === f.id && !ch.archived).length}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); deleteFolder(f.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-brand-pink transition-all">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Main Channels Content */}
          <section className="animate-in fade-in duration-700">
            {channels.length === 0 ? (
              <div className="py-32 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-5xl mb-8">📺</div>
                <h3 className="text-3xl font-black mb-3">Nenhum canal cadastrado</h3>
                <p className="text-gray-500 max-w-md mb-10 text-lg leading-relaxed">Comece criando seu primeiro canal para gerenciar seu conteúdo, estratégias e roteiros de forma profissional.</p>
                <button onClick={openNewChannelModal} className="px-12 py-5 bg-brand-purple text-white font-black rounded-2xl uppercase tracking-[0.2em] text-sm shadow-2xl shadow-brand-purple/30 hover:scale-105 transition-all">Criar Primeiro Canal</button>
              </div>
            ) : (
              <div className="space-y-16">
                {/* No Folder Group */}
                {channels.filter(ch => !ch.folderId && (showArchived || !ch.archived)).length > 0 && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-white/5" />
                      <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Canais Sem Pasta</h3>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {channels.filter(ch => !ch.folderId && (showArchived || !ch.archived)).map(renderChannelCard)}
                    </div>
                  </div>
                )}

                {/* Folder Groups */}
                {folders.map(folder => {
                  const folderChannels = channels.filter(ch => ch.folderId === folder.id && (showArchived || !ch.archived));
                  if (folderChannels.length === 0) return null;
                  return (
                    <div key={folder.id} className="space-y-8">
                      <div className="flex items-center gap-5">
                        <div className="w-2 h-6 rounded-full" style={{ background: folder.color }} />
                        <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">{folder.name}</h3>
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{folderChannels.length} Canais</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {folderChannels.map(renderChannelCard)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* --- MODALS --- */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background-deep/95 backdrop-blur-2xl" onClick={() => setActiveModal(null)} />
          
          {/* Folder Modal */}
          {activeModal === 'folder' && (
            <div className="relative bg-background-mid border border-white/5 rounded-[48px] p-12 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-brand-cyan/10 rounded-2xl flex items-center justify-center text-brand-cyan"><FolderPlus className="w-6 h-6" /></div>
                <h2 className="text-3xl font-black tracking-tight">Nova Pasta</h2>
              </div>
              <p className="text-gray-500 text-sm mb-10">Agrupe seus canais por nicho, idioma ou categoria de monetização.</p>
              
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-3">Nome da Pasta</label>
                  <input type="text" value={folderForm.name} onChange={e => setFolderForm({...folderForm, name: e.target.value})} className="w-full bg-background-light border border-white/5 rounded-2xl p-5 focus:border-brand-cyan outline-none transition-all font-bold" placeholder="Ex: Nicho de Horror" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-3">Cor da Pasta (Opcional)</label>
                  <div className="flex gap-3">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setFolderForm({...folderForm, color: c})} className={`w-10 h-10 rounded-xl transition-all ${folderForm.color === c ? 'scale-110 ring-2 ring-white shadow-xl' : 'opacity-30 hover:opacity-100'}`} style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setActiveModal(null)} className="flex-1 py-5 bg-white/5 text-gray-400 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-white/10 transition-all">Cancelar</button>
                  <button onClick={submitFolder} className="flex-2 py-5 bg-brand-cyan text-background-deep font-black rounded-2xl hover:bg-brand-cyan/90 transition-all uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-cyan/20">Criar Pasta</button>
                </div>
              </div>
            </div>
          )}

          {/* Channel Modal */}
          {activeModal === 'channel' && (
            <div className="relative bg-background-mid border border-white/5 rounded-[48px] p-12 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-brand-purple"><Youtube className="w-6 h-6" /></div>
                <h2 className="text-3xl font-black tracking-tight">{editingEntityId ? 'Editar Canal' : 'Novo Canal'}</h2>
              </div>
              <p className="text-gray-500 text-sm mb-10">Configure as bases estratégicas do seu canal dark.</p>
              
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block">Nome do Canal</label>
                    <input type="text" value={channelForm.name} onChange={e => setChannelForm({...channelForm, name: e.target.value})} className="w-full bg-background-light border border-white/5 rounded-2xl p-5 focus:border-brand-purple outline-none transition-all font-bold" placeholder="Ex: Curiosidades Insanas" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block">Vincular a Pasta</label>
                    <select value={channelForm.folderId || ''} onChange={e => setChannelForm({...channelForm, folderId: e.target.value || null})} className="w-full bg-background-light border border-white/5 rounded-2xl p-5 outline-none font-bold appearance-none cursor-pointer">
                      <option value="">Sem Pasta (Raiz)</option>
                      {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block flex items-center gap-2"><LinkIcon className="w-3 h-3" /> Canais de Referência (URLs)</label>
                  <textarea value={channelForm.references} onChange={e => setChannelForm({...channelForm, references: e.target.value})} className="w-full h-28 bg-background-light border border-white/5 rounded-2xl p-5 focus:border-brand-purple outline-none resize-none text-sm font-medium" placeholder="Cole URLs de canais do YouTube que servem de inspiração..." />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block flex items-center gap-2"><AlignLeft className="w-3 h-3" /> Notas Gerais</label>
                  <textarea value={channelForm.notes} onChange={e => setChannelForm({...channelForm, notes: e.target.value})} className="w-full h-28 bg-background-light border border-white/5 rounded-2xl p-5 focus:border-brand-purple outline-none resize-none text-sm font-medium" placeholder="Estratégia, público-alvo, nicho..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block flex items-center gap-2"><Clock className="w-3 h-3" /> Horários de Postagem</label>
                    <input type="text" value={channelForm.schedule} onChange={e => setChannelForm({...channelForm, schedule: e.target.value})} className="w-full bg-background-light border border-white/5 rounded-2xl p-5 font-bold text-sm" placeholder="Ex: Ter e Qui às 18:00" />
                    <p className="text-[9px] text-gray-600 uppercase font-black">Defina quando você costuma publicar vídeos</p>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block flex items-center gap-2"><Info className="w-3 h-3" /> Notas Adicionais</label>
                    <input type="text" value={channelForm.additional} onChange={e => setChannelForm({...channelForm, additional: e.target.value})} className="w-full bg-background-light border border-white/5 rounded-2xl p-5 font-bold text-sm" placeholder="Meta, tags frequentes..." />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block">Visual do Card</label>
                  <div className="flex gap-3">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setChannelForm({...channelForm, color: c})} className={`w-10 h-10 rounded-xl transition-all ${channelForm.color === c ? 'scale-110 ring-2 ring-white shadow-xl' : 'opacity-30 hover:opacity-100'}`} style={{ background: c }} />
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button onClick={() => setActiveModal(null)} className="flex-1 py-5 bg-white/5 text-gray-400 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-white/10 transition-all">Cancelar</button>
                  <button onClick={submitChannel} className="flex-2 py-5 bg-brand-purple text-white font-black rounded-2xl hover:bg-brand-purple/90 transition-all uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-purple/30">
                    {editingEntityId ? 'Salvar Alterações' : 'Criar Canal'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Detailed View Modal (Channel Dashboard) */}
          {activeModal === 'detail' && currentChannel && (
            <div className="relative bg-background-mid border border-white/10 rounded-[56px] w-full max-w-6xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              {/* Modal Header */}
              <div className="p-12 border-b border-white/5 flex items-center gap-10 bg-background-mid/50 backdrop-blur-xl">
                <div className="w-28 h-28 rounded-[40px] flex items-center justify-center font-black text-5xl shadow-2xl transition-transform hover:scale-105" style={{ background: currentChannel.color }}>
                  {currentChannel.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h2 className="text-4xl font-black tracking-tighter">{currentChannel.name}</h2>
                    {currentChannel.archived && <span className="px-3 py-1 bg-brand-pink/20 text-brand-pink border border-brand-pink/30 rounded-full text-[9px] font-black uppercase tracking-widest">Arquivado</span>}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <FolderPlus className="w-3.5 h-3.5" /> {folders.find(f => f.id === currentChannel.folderId)?.name || 'Sem Pasta'}
                    </div>
                    <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Criado em {formatDate(currentChannel.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => editChannel(currentChannel)} className="p-5 bg-white/5 rounded-[24px] text-gray-500 hover:text-white hover:bg-white/10 transition-all shadow-xl" title="Configurações"><Settings className="w-7 h-7" /></button>
                  <button onClick={() => setActiveModal(null)} className="p-5 bg-white/5 rounded-[24px] text-gray-500 hover:text-white hover:bg-white/10 transition-all shadow-xl"><X className="w-7 h-7" /></button>
                </div>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-white/5 px-12 bg-background-deep/20">
                {[
                  { id: 'info', name: 'Informações do Canal', icon: Layout },
                  { id: 'videos', name: 'Vídeos Planejados', icon: Video },
                  { id: 'notes', name: 'Notas e Ideias', icon: StickyNote },
                  { id: 'scripts', name: 'Roteiros', icon: FileText }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setDetailTab(tab.id as any)} className={`flex items-center gap-4 px-10 py-7 text-xs font-black uppercase tracking-[0.2em] border-b-4 transition-all relative ${detailTab === tab.id ? 'border-brand-cyan text-brand-cyan bg-brand-cyan/5' : 'border-transparent text-gray-600 hover:text-gray-400 hover:bg-white/5'}`}>
                    <tab.icon className={`w-5 h-5 ${detailTab === tab.id ? 'text-brand-cyan' : 'text-gray-600'}`} /> {tab.name}
                  </button>
                ))}
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-background-deep/10">
                
                {/* INFO TAB */}
                {detailTab === 'info' && (
                  <div className="space-y-12 animate-in fade-in duration-500 max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-10">
                        <div className="bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-2xl relative group overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-brand-cyan/10 transition-all" />
                          <h4 className="text-[11px] font-black text-brand-cyan uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                            <AlignLeft className="w-5 h-5" /> Notas Gerais
                          </h4>
                          <p className="text-sm leading-relaxed text-gray-400 font-medium whitespace-pre-wrap min-h-[120px]">{currentChannel.notes || 'Nenhuma estratégia central registrada.'}</p>
                        </div>
                        <div className="bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-2xl relative group overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-purple/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-brand-purple/10 transition-all" />
                          <h4 className="text-[11px] font-black text-brand-purple uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                            <LinkIcon className="w-5 h-5" /> Canais de Referência
                          </h4>
                          <p className="text-sm leading-relaxed text-brand-purple/60 font-medium break-all min-h-[120px]">{currentChannel.references || 'Sem referências externas cadastradas.'}</p>
                        </div>
                      </div>
                      <div className="space-y-10">
                        <div className="bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-2xl relative group overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-green/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-brand-green/10 transition-all" />
                          <h4 className="text-[11px] font-black text-brand-green uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                            <Calendar className="w-5 h-5" /> Escala de Postagem
                          </h4>
                          <div className="p-6 bg-brand-green/5 border border-brand-green/10 rounded-[24px]">
                            <p className="text-lg font-black text-brand-green tracking-tight">{currentChannel.schedule || 'A definir...'}</p>
                            <p className="text-[9px] text-gray-600 uppercase font-black mt-2">Frequência ideal detectada</p>
                          </div>
                        </div>
                        <div className="bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-2xl relative group overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-pink/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-brand-pink/10 transition-all" />
                          <h4 className="text-[11px] font-black text-brand-pink uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                            <Info className="w-5 h-5" /> Notas Adicionais
                          </h4>
                          <p className="text-sm font-medium text-gray-400 min-h-[40px]">{currentChannel.additional || 'Nenhum lembrete extra.'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-brand-cyan/10 via-brand-purple/10 to-brand-pink/10 border border-white/10 rounded-[40px] p-12 text-center shadow-2xl">
                          <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-brand-cyan shadow-xl"><Youtube className="w-8 h-8" /></div>
                          <h4 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-4">Estatísticas Reais</h4>
                          <p className="text-xs text-gray-500 mb-8 max-w-[240px] mx-auto leading-relaxed">Conecte o canal para monitorar views, inscritos e engajamento em tempo real.</p>
                          {currentChannel.youtubeUrl ? (
                            <div className="space-y-6">
                              <p className="text-xs font-bold text-brand-cyan bg-brand-cyan/5 p-4 rounded-2xl border border-brand-cyan/10 break-all">{currentChannel.youtubeUrl}</p>
                              <div className="flex gap-3 justify-center">
                                <button onClick={() => setActiveModal('yt-link')} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest transition-all">Alterar Link</button>
                                <a href={currentChannel.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-cyan text-background-deep font-black rounded-xl text-[9px] uppercase tracking-widest shadow-xl shadow-brand-cyan/20 transition-all hover:scale-105">
                                  <ExternalLink className="w-3.5 h-3.5" /> Abrir YouTube
                                </a>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setActiveModal('yt-link')} className="px-10 py-4 bg-brand-cyan text-background-deep font-black rounded-[20px] text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-brand-cyan/20 hover:scale-105 transition-all">Vincular Agora</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* VIDEOS TAB */}
                {detailTab === 'videos' && (
                  <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div>
                        <h3 className="text-3xl font-black tracking-tight">Vídeos Planejados</h3>
                        <p className="text-xs text-gray-600 font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                           {(currentChannel.videos || []).length} vídeos no arsenal <ChevronRight className="w-3 h-3" /> {formatDate(Date.now())}
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setShowArchivedVideos(!showArchivedVideos)} className={`px-6 py-3.5 border rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl ${showArchivedVideos ? 'bg-brand-cyan text-background-deep border-brand-cyan' : 'bg-white/5 border-white/10 text-gray-500 hover:bg-white/10'}`}>
                          {showArchivedVideos ? 'Ocultar Arquivados' : 'Mostrar Arquivados'}
                        </button>
                        <button onClick={() => { setVideoForm({ title: '', status: 'draft', script: '', tags: '', description: '' }); setActiveModal('video'); }} className="px-8 py-3.5 bg-brand-cyan text-background-deep font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-brand-cyan/20">
                          <Plus className="w-5 h-5" /> Novo Vídeo
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid gap-6">
                      {(currentChannel.videos || []).filter(v => showArchivedVideos || !v.archived).length === 0 ? (
                        <div className="py-32 bg-background-mid border border-2 border-dashed border-white/5 rounded-[56px] text-center shadow-inner">
                          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-800"><Video className="w-10 h-10" /></div>
                          <h4 className="text-2xl font-black mb-2">Nenhum vídeo no radar</h4>
                          <p className="text-gray-600 text-sm mb-10 max-w-sm mx-auto leading-relaxed">Sua linha de produção está vazia. Planeje o próximo conteúdo agora mesmo.</p>
                          <button onClick={() => setActiveModal('video')} className="px-12 py-5 bg-brand-cyan text-background-deep font-black rounded-2xl uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-cyan/20 transition-all hover:scale-105">Adicionar Vídeo</button>
                        </div>
                      ) : (
                        (currentChannel.videos || []).filter(v => showArchivedVideos || !v.archived).map(v => (
                          <div key={v.id} className="p-10 bg-background-mid border border-white/5 rounded-[40px] flex items-center justify-between group hover:border-brand-cyan/20 transition-all shadow-2xl relative overflow-hidden">
                            {v.archived && <div className="absolute top-0 left-0 bg-gray-800 text-[8px] font-black uppercase px-3 py-1 text-gray-500 rounded-br-xl">Arquivado</div>}
                            <div className="flex items-center gap-8">
                              <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-xl transition-transform group-hover:scale-110 ${
                                v.status === 'published' ? 'bg-brand-green/20 text-brand-green border border-brand-green/30' : 
                                v.status === 'scheduled' ? 'bg-brand-purple/20 text-brand-purple border border-brand-purple/30' : 
                                'bg-white/5 text-gray-600 border border-white/10'
                              }`}>
                                <Video className="w-8 h-8" />
                              </div>
                              <div>
                                <h5 className="text-xl font-black mb-2 tracking-tight group-hover:text-brand-cyan transition-colors">{v.title}</h5>
                                <div className="flex gap-4 items-center">
                                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm ${
                                    v.status === 'published' ? 'bg-brand-green text-background-deep' : 
                                    v.status === 'scheduled' ? 'bg-brand-purple text-white' : 
                                    'bg-gray-800 text-gray-500'
                                  }`}>{v.status === 'draft' ? 'Rascunho' : v.status === 'scheduled' ? 'Agendado' : 'Publicado'}</span>
                                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" /> {formatDate(v.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                               <button onClick={() => toggleArchiveVideo(currentChannel.id, v.id)} className="p-4 bg-white/5 rounded-2xl hover:text-brand-cyan hover:bg-white/10 transition-all" title={v.archived ? "Desarquivar" : "Arquivar"}><Archive className="w-5 h-5" /></button>
                               <button onClick={() => deleteVideo(currentChannel.id, v.id)} className="p-4 bg-white/5 rounded-2xl hover:text-brand-pink hover:bg-brand-pink/10 transition-all"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* NOTES TAB */}
                {detailTab === 'notes' && (
                  <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div>
                        <h3 className="text-3xl font-black tracking-tight">Notas e Ideias</h3>
                        <p className="text-xs text-gray-600 font-bold uppercase tracking-[0.2em] mt-1">
                           Central de rascunhos estratégicos <ChevronRight className="w-3 h-3 inline" /> {(currentChannel.channelNotes || []).length} salvas
                        </p>
                      </div>
                      <button onClick={() => { setNoteForm({ title: '', content: '' }); setActiveModal('note'); }} className="px-8 py-3.5 bg-brand-purple text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-brand-purple/30">
                        <Plus className="w-5 h-5" /> Nova Nota
                      </button>
                    </div>
                    
                    {(currentChannel.channelNotes || []).length === 0 ? (
                      <div className="py-32 bg-background-mid border border-2 border-dashed border-white/5 rounded-[56px] text-center shadow-inner">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-800"><StickyNote className="w-10 h-10" /></div>
                        <h4 className="text-2xl font-black mb-2">Nenhuma nota rascunhada</h4>
                        <p className="text-gray-600 text-sm mb-10 max-w-sm mx-auto leading-relaxed">Crie notas amplas para rascunhar títulos, hooks e estratégias virais em lote.</p>
                        <button onClick={() => setActiveModal('note')} className="px-12 py-5 bg-brand-purple text-white font-black rounded-2xl uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-purple/30 transition-all hover:scale-105">Criar Primeira Nota</button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {(currentChannel.channelNotes || []).map(n => (
                          <div key={n.id} className="p-10 bg-background-mid border border-white/5 rounded-[48px] space-y-6 hover:border-brand-purple/40 transition-all shadow-2xl group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-purple/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-brand-purple/10 transition-all" />
                            <div className="flex items-center justify-between relative z-10">
                              <h4 className="text-2xl font-black tracking-tighter group-hover:text-brand-purple transition-colors">{n.title}</h4>
                              <button onClick={() => deleteNote(currentChannel.id, n.id)} className="opacity-0 group-hover:opacity-100 p-3 bg-white/5 rounded-xl text-gray-600 hover:text-brand-pink transition-all shadow-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <p className="text-sm text-gray-400 leading-loose font-medium whitespace-pre-wrap">{n.content}</p>
                            <div className="pt-6 border-t border-white/5 text-[9px] text-gray-700 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                              <Calendar className="w-3 h-3" /> Registrada em {formatDate(n.createdAt)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SCRIPTS TAB */}
                {detailTab === 'scripts' && (
                  <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="bg-background-mid border border-2 border-dashed border-white/10 rounded-[64px] p-24 text-center shadow-2xl relative group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto mb-10 text-brand-cyan shadow-inner group-hover:scale-110 transition-transform"><FileText className="w-12 h-12" /></div>
                      <h4 className="text-3xl font-black mb-4 tracking-tight">Cofre de Roteiros</h4>
                      <p className="text-gray-500 text-sm mb-12 max-w-md mx-auto leading-relaxed">Mantenha sua biblioteca de arquivos .TXT centralizada. Acesse rapidamente qualquer narração ou instrução do canal.</p>
                      
                      <label className="inline-flex items-center gap-4 px-12 py-6 bg-brand-cyan text-background-deep font-black rounded-[28px] uppercase tracking-[0.2em] text-sm cursor-pointer hover:scale-105 transition-all shadow-2xl shadow-brand-cyan/30 active:scale-95">
                        <Upload className="w-6 h-6" /> Fazer Upload .TXT
                        <input type="file" accept=".txt" onChange={handleScriptUpload} className="hidden" />
                      </label>
                    </div>

                    <div className="grid gap-6">
                      {(currentChannel.scripts || []).map(script => (
                        <div key={script.id} className="p-8 bg-background-mid border border-white/5 rounded-[40px] flex items-center justify-between hover:border-brand-cyan/30 transition-all shadow-xl group">
                          <div className="flex items-center gap-8">
                             <div className="w-16 h-16 bg-background-deep rounded-[20px] flex items-center justify-center text-gray-700 border border-white/5 group-hover:border-brand-cyan/20 transition-all shadow-inner"><FileText className="w-8 h-8" /></div>
                             <div>
                               <h5 className="text-lg font-black tracking-tight mb-1">{script.name}</h5>
                               <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                 {script.size} <ChevronRight className="w-3 h-3" /> {formatDate(script.createdAt)}
                               </p>
                             </div>
                          </div>
                          <div className="flex gap-4">
                             <button onClick={() => {
                               const blob = new Blob([script.content], { type: 'text/plain' });
                               const url = URL.createObjectURL(blob);
                               const a = document.createElement('a');
                               a.href = url;
                               a.download = script.name;
                               a.click();
                             }} className="p-4 bg-white/5 rounded-[20px] text-gray-500 hover:text-brand-cyan hover:bg-white/10 transition-all shadow-lg" title="Baixar"><Download className="w-5.5 h-5.5" /></button>
                             <button onClick={() => deleteScript(currentChannel.id, script.id)} className="p-4 bg-white/5 rounded-[20px] text-gray-500 hover:text-brand-pink hover:bg-brand-pink/10 transition-all opacity-0 group-hover:opacity-100 shadow-lg" title="Excluir"><Trash2 className="w-5.5 h-5.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* New Video Plan Modal Form */}
          {activeModal === 'video' && (
            <div className="relative bg-background-mid border border-white/10 rounded-[56px] p-16 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300">
               <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-brand-cyan/10 rounded-2xl flex items-center justify-center text-brand-cyan shadow-xl"><Video className="w-6 h-6" /></div>
                  <h2 className="text-3xl font-black mb-1 tracking-tighter">Planejar Vídeo</h2>
               </div>
               <p className="text-gray-500 text-sm mb-12 font-medium">Defina as bases do seu novo conteúdo viral.</p>
               
               <div className="space-y-8">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block">Título do Vídeo</label>
                   <input type="text" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} className="w-full bg-background-light border border-white/5 rounded-[24px] p-6 focus:border-brand-cyan outline-none transition-all font-black text-lg" placeholder="Ex: O Segredo de Tesla" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block">Status do Fluxo</label>
                     <select value={videoForm.status} onChange={e => setVideoForm({...videoForm, status: e.target.value as any})} className="w-full bg-background-light border border-white/5 rounded-[24px] p-6 outline-none font-black appearance-none cursor-pointer">
                       <option value="draft">Rascunho</option>
                       <option value="scheduled">Agendado</option>
                       <option value="published">Publicado</option>
                     </select>
                   </div>
                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block flex items-center gap-2"><Tag className="w-3 h-3" /> Tags</label>
                     <input type="text" value={videoForm.tags} onChange={e => setVideoForm({...videoForm, tags: e.target.value})} className="w-full bg-background-light border border-white/5 rounded-[24px] p-6 font-bold text-sm" placeholder="tag1, tag2..." />
                     <p className="text-[9px] text-gray-700 uppercase font-black">Categorize para organização</p>
                   </div>
                 </div>
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block">Roteiro Completo</label>
                   <textarea value={videoForm.script} onChange={e => setVideoForm({...videoForm, script: e.target.value})} className="w-full h-44 bg-background-light border border-white/5 rounded-[32px] p-6 focus:border-brand-cyan outline-none resize-none text-sm font-medium leading-relaxed" placeholder="Escreva ou cole o roteiro final aqui..." />
                 </div>
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block">Descrição do Vídeo</label>
                   <textarea value={videoForm.description} onChange={e => setVideoForm({...videoForm, description: e.target.value})} className="w-full h-32 bg-background-light border border-white/5 rounded-[32px] p-6 focus:border-brand-cyan outline-none resize-none text-sm font-medium leading-relaxed" placeholder="Metadados para o YouTube..." />
                 </div>
                 <div className="grid grid-cols-2 gap-6 pt-6">
                    <button onClick={() => setActiveModal('detail')} className="py-5 bg-white/5 text-gray-400 font-black rounded-3xl uppercase tracking-widest text-xs hover:bg-white/10 transition-all">Cancelar</button>
                    <button onClick={submitVideo} className="py-5 bg-brand-cyan text-background-deep font-black rounded-3xl hover:bg-brand-cyan/90 transition-all uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand-cyan/30">Criar Plano de Vídeo</button>
                 </div>
               </div>
            </div>
          )}

          {/* New Note Modal Form */}
          {activeModal === 'note' && (
            <div className="relative bg-background-mid border border-white/10 rounded-[56px] p-16 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300">
               <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-brand-purple shadow-xl"><StickyNote className="w-6 h-6" /></div>
                  <h2 className="text-3xl font-black mb-1 tracking-tighter">Nova Nota</h2>
               </div>
               <p className="text-gray-500 text-sm mb-12 font-medium">Documente ideias amplas, hooks ou pesquisas.</p>
               
               <div className="space-y-10">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block">Título da Nota</label>
                   <input type="text" value={noteForm.title} onChange={e => setNoteForm({...noteForm, title: e.target.value})} className="w-full bg-background-light border border-white/5 rounded-[24px] p-6 focus:border-brand-purple outline-none transition-all font-black text-lg" placeholder="Ex: Brainstorming Setembro" />
                 </div>
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block">Conteúdo</label>
                   <textarea value={noteForm.content} onChange={e => setNoteForm({...noteForm, content: e.target.value})} className="w-full h-72 bg-background-light border border-white/5 rounded-[32px] p-8 focus:border-brand-purple outline-none transition-all resize-none text-sm font-medium leading-loose shadow-inner" placeholder="Desenvolva suas ideias aqui..." />
                   <p className="mt-4 text-[10px] text-gray-700 italic font-medium leading-relaxed">💡 Dica: Use este espaço para ter uma visão ampla de todos seus roteiros e títulos, facilitando o planejamento do canal.</p>
                 </div>
                 <div className="grid grid-cols-2 gap-6 pt-4">
                    <button onClick={() => setActiveModal('detail')} className="py-5 bg-white/5 text-gray-400 font-black rounded-3xl uppercase tracking-widest text-xs hover:bg-white/10 transition-all">Cancelar</button>
                    <button onClick={submitNote} className="py-5 bg-brand-purple text-white font-black rounded-3xl hover:bg-brand-purple/90 transition-all uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand-purple/30">Registrar Nota</button>
                 </div>
               </div>
            </div>
          )}

          {/* YT Link Modal */}
          {activeModal === 'yt-link' && (
            <div className="relative bg-background-mid border border-white/10 rounded-[56px] p-16 w-full max-w-md shadow-2xl text-center animate-in zoom-in-95 duration-300">
               <div className="w-24 h-24 bg-brand-pink/10 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-brand-pink shadow-2xl"><Youtube className="w-12 h-12" /></div>
               <h2 className="text-3xl font-black mb-2 tracking-tighter">Vincular YouTube</h2>
               <p className="text-gray-500 text-sm mb-12 font-medium leading-relaxed">Integre seu canal para visualizar métricas estratégicas diretamente no arsenal.</p>
               
               <div className="space-y-8">
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block text-left">URL do Canal</label>
                   <input type="text" value={ytForm.url} onChange={e => setYtForm({url: e.target.value})} className="w-full bg-background-light border border-white/5 rounded-[24px] p-6 mb-2 focus:border-brand-pink outline-none transition-all font-bold text-center text-brand-pink" placeholder="https://youtube.com/@seucanal" />
                   <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest">Aceita @handle ou ID (/channel/ID)</p>
                 </div>
                 
                 <div className="flex gap-4">
                    <button onClick={() => setActiveModal('detail')} className="flex-1 py-5 bg-white/5 text-gray-400 font-black rounded-[24px] uppercase tracking-widest text-xs hover:bg-white/10 transition-all">Cancelar</button>
                    <button onClick={linkYt} className="flex-2 py-5 bg-brand-pink text-white font-black rounded-[24px] hover:bg-brand-pink/90 transition-all uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand-pink/30">Vincular Arsenal</button>
                 </div>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MeusCanaisTool;
