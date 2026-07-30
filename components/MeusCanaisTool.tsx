
import React, { useState, useEffect, useRef } from 'react';
import {
  FolderPlus, Plus, MoreVertical, Trash2, Archive, ExternalLink, Layout,
  Video, FileText, StickyNote, Youtube, X, Calendar, Clock, Link as LinkIcon,
  Download, Upload, Edit2, ChevronRight, Info, Tag, AlignLeft, Settings,
  Copy, Cloud, CloudOff
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { saveToCloud, loadFromCloud, exportJSON, importJSON } from '../services/canalService';
import { useToast } from '../contexts/ToastContext';
import { trackChannelCreated, trackScriptUploaded, trackScriptCopied, trackExportBackup, trackImportBackup } from '../services/analytics';

const STORAGE_KEY = 'umbra_hub_meus_canais_v5';

interface VideoItem {
  id: string; title: string; status: 'draft' | 'scheduled' | 'published';
  script: string; tags: string; description: string; archived: boolean; createdAt: number;
}
interface NoteItem {
  id: string; title: string; content: string; createdAt: number;
}
interface ScriptItem {
  id: string; name: string; size: string; content: string; createdAt: number;
}
interface Channel {
  id: string; name: string; color: string; folderId: string | null;
  references: string; notes: string; schedule: string; additional: string;
  videos: VideoItem[]; channelNotes: NoteItem[]; scripts: ScriptItem[];
  archived: boolean; youtubeUrl?: string; createdAt: number; updatedAt: number;
}
interface Folder {
  id: string; name: string; color: string; createdAt: number;
}

const COLORS = ['#3b82f6', '#a78bfa', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const MeusCanaisTool: React.FC = () => {
  const { showToast } = useToast();
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
  const [cloudSynced, setCloudSynced] = useState<boolean | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [folderForm, setFolderForm] = useState({ name: '', color: COLORS[0] });
  const [channelForm, setChannelForm] = useState({ name: '', color: COLORS[0], folderId: '', references: '', notes: '', schedule: '', additional: '' });
  const [videoForm, setVideoForm] = useState({ title: '', status: 'draft' as 'draft' | 'scheduled' | 'published', script: '', tags: '', description: '' });
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });
  const [ytForm, setYtForm] = useState({ url: '' });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const cloud = await loadFromCloud(user.id);
        if (cloud) {
          setFolders(cloud.folders as Folder[]);
          setChannels(cloud.channels as Channel[]);
          setCloudSynced(true);
          setIsLoaded(true);
          return;
        }
      }
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.folders) setFolders(data.folders);
          if (data.channels) setChannels(data.channels);
        } catch { /* silent */ }
      }
      setIsLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const data = { folders, channels };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) saveToCloud(user.id, data).then(ok => setCloudSynced(ok));
    });
  }, [folders, channels, isLoaded]);

  const handleExport = () => {
    exportJSON({ folders, channels });
    trackExportBackup();
    showToast('Backup exportado com sucesso!');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importJSON(file);
      if (confirm(`Importar backup? Isso substituirá ${channels.length} canal(is) atual(is).`)) {
        setFolders(data.folders as Folder[]);
        setChannels(data.channels as Channel[]);
        trackImportBackup();
        showToast('Backup importado com sucesso!');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao importar', 'error');
    }
    e.target.value = '';
  };

  const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
  const formatDate = (t: number) => new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  const submitFolder = () => {
    if (!folderForm.name.trim()) return;
    setFolders([...folders, { ...folderForm, id: uid(), createdAt: Date.now() }]);
    setFolderForm({ name: '', color: COLORS[0] });
    setActiveModal(null);
    showToast('Pasta criada!');
  };

  const deleteFolder = (id: string) => {
    if (confirm('Excluir pasta? Os canais nela ficarão "Sem Pasta".')) {
      setFolders(folders.filter((f: Folder) => f.id !== id));
      setChannels(channels.map((ch: Channel) => ch.folderId === id ? { ...ch, folderId: null } : ch));
      showToast('Pasta removida');
    }
  };

  const openNewChannelModal = () => {
    setEditingEntityId(null);
    setChannelForm({ name: '', color: COLORS[0], folderId: '', references: '', notes: '', schedule: '', additional: '' });
    setActiveModal('channel');
  };

  const submitChannel = () => {
    if (!channelForm.name.trim()) return;
    if (editingEntityId) {
      setChannels(channels.map((ch: Channel) => ch.id === editingEntityId ? { ...ch, ...channelForm, folderId: channelForm.folderId || null, updatedAt: Date.now() } : ch));
      showToast('Canal atualizado!');
      setEditingEntityId(null);
    } else {
      const newChannel: Channel = { ...channelForm, id: uid(), folderId: channelForm.folderId || null, videos: [], channelNotes: [], scripts: [], archived: false, createdAt: Date.now(), updatedAt: Date.now() };
      setChannels([...channels, newChannel]);
      trackChannelCreated();
      showToast('Canal criado!');
    }
    setChannelForm({ name: '', color: COLORS[0], folderId: '', references: '', notes: '', schedule: '', additional: '' });
    setActiveModal(null);
  };

  const editChannel = (ch: Channel) => {
    setEditingEntityId(ch.id);
    setChannelForm({ name: ch.name, color: ch.color, folderId: ch.folderId || '', references: ch.references, notes: ch.notes, schedule: ch.schedule, additional: ch.additional });
    setActiveModal('channel');
    setOpenDropdown(null);
  };

  const toggleArchiveChannel = (id: string) => {
    setChannels(channels.map((ch: Channel) => ch.id === id ? { ...ch, archived: !ch.archived } : ch));
    setOpenDropdown(null);
    showToast('Canal arquivado');
  };

  const deleteChannel = (id: string) => {
    if (confirm('Excluir este canal? Todos os dados serão perdidos.')) {
      setChannels(channels.filter((ch: Channel) => ch.id !== id));
      setOpenDropdown(null);
      showToast('Canal excluído');
    }
  };

  const submitVideo = () => {
    if (!videoForm.title.trim() || !currentChannelId) return;
    const newVideo: VideoItem = { ...videoForm, id: uid(), archived: false, createdAt: Date.now() };
    setChannels(channels.map((ch: Channel) => ch.id === currentChannelId ? { ...ch, videos: [...(ch.videos || []), newVideo], updatedAt: Date.now() } : ch));
    setVideoForm({ title: '', status: 'draft', script: '', tags: '', description: '' });
    setActiveModal('detail');
    showToast('Vídeo adicionado!');
  };

  const toggleArchiveVideo = (chId: string, vId: string) => {
    setChannels(channels.map((ch: Channel) => ch.id === chId ? { ...ch, videos: ch.videos.map((v: VideoItem) => v.id === vId ? { ...v, archived: !v.archived } : v), updatedAt: Date.now() } : ch));
  };

  const deleteVideo = (chId: string, vId: string) => {
    if (confirm('Excluir este vídeo?')) {
      setChannels(channels.map((ch: Channel) => ch.id === chId ? { ...ch, videos: ch.videos.filter((v: VideoItem) => v.id !== vId), updatedAt: Date.now() } : ch));
      showToast('Vídeo removido');
    }
  };

  const submitNote = () => {
    if (!noteForm.title.trim() || !currentChannelId) return;
    const newNote: NoteItem = { ...noteForm, id: uid(), createdAt: Date.now() };
    setChannels(channels.map((ch: Channel) => ch.id === currentChannelId ? { ...ch, channelNotes: [...(ch.channelNotes || []), newNote], updatedAt: Date.now() } : ch));
    setNoteForm({ title: '', content: '' });
    setActiveModal('detail');
    showToast('Nota salva!');
  };

  const deleteNote = (chId: string, nId: string) => {
    if (confirm('Excluir esta nota?')) {
      setChannels(channels.map((ch: Channel) => ch.id === chId ? { ...ch, channelNotes: ch.channelNotes.filter((n: NoteItem) => n.id !== nId), updatedAt: Date.now() } : ch));
      showToast('Nota removida');
    }
  };

  const handleScriptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentChannelId) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newScript: ScriptItem = { id: uid(), name: file.name, size: `${(file.size / 1024).toFixed(1)} KB`, content: event.target?.result as string, createdAt: Date.now() };
      setChannels(channels.map((ch: Channel) => ch.id === currentChannelId ? { ...ch, scripts: [...(ch.scripts || []), newScript], updatedAt: Date.now() } : ch));
      trackScriptUploaded();
      showToast('Roteiro enviado!');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const deleteScript = (chId: string, sId: string) => {
    if (confirm('Excluir este roteiro?')) {
      setChannels(channels.map((ch: Channel) => ch.id === chId ? { ...ch, scripts: ch.scripts.filter((s: ScriptItem) => s.id !== sId), updatedAt: Date.now() } : ch));
      showToast('Roteiro removido');
    }
  };

  const linkYt = () => {
    if (!ytForm.url.trim() || !currentChannelId) return;
    setChannels(channels.map((ch: Channel) => ch.id === currentChannelId ? { ...ch, youtubeUrl: ytForm.url, updatedAt: Date.now() } : ch));
    setYtForm({ url: '' });
    setActiveModal('detail');
    showToast('Canal vinculado!');
  };

  const currentChannel = channels.find((ch: Channel) => ch.id === currentChannelId);

  const activeChannels   = channels.filter((c: Channel) => !c.archived).length;
  const totalVideos      = channels.reduce((a: number, c: Channel) => a + (c.videos || []).length, 0);

  // ── CHANNEL CARD ────────────────────────────────────────────────────────────
  const renderChannelCard = (ch: Channel) => {
    const folder     = folders.find((f: Folder) => f.id === ch.folderId);
    const videoCount = (ch.videos || []).length;
    const noteCount  = (ch.channelNotes || []).length;
    return (
      <div
        key={ch.id}
        onClick={() => { setCurrentChannelId(ch.id); setDetailTab('info'); setActiveModal('detail'); }}
        className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-400 hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        {/* Colored accent bar */}
        <div className="h-1 w-full shrink-0" style={{ background: ch.color }} />

        {/* Card header */}
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg text-white shrink-0 group-hover:scale-105 transition-transform duration-200"
              style={{ background: ch.color }}
            >
              {ch.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-black text-gray-900 truncate leading-tight">{ch.name}</h4>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                <FolderPlus className="w-2.5 h-2.5" /> {folder?.name || 'Sem Pasta'}
              </p>
            </div>
          </div>

          {/* Dropdown */}
          <div className="relative shrink-0" onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === ch.id ? null : ch.id); }}>
            <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
              <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
            </button>
            {openDropdown === ch.id && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-2xl p-1.5 z-50 w-44 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                <button onClick={(e) => { e.stopPropagation(); editChannel(ch); }} className="w-full text-left px-4 py-2.5 text-xs font-black text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                <button onClick={(e) => { e.stopPropagation(); toggleArchiveChannel(ch.id); }} className="w-full text-left px-4 py-2.5 text-xs font-black text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors">
                  <Archive className="w-3.5 h-3.5" /> {ch.archived ? 'Desarquivar' : 'Arquivar'}
                </button>
                <div className="h-px bg-gray-100 my-1" />
                <button onClick={(e) => { e.stopPropagation(); deleteChannel(ch.id); }} className="w-full text-left px-4 py-2.5 text-xs font-black text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="p-5">
          {ch.archived && (
            <div className="inline-flex items-center px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-500 mb-3">
              Arquivado
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <Video className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs font-black text-gray-700">{videoCount}</span>
              <span className="text-[9px] text-gray-400 uppercase tracking-widest">vídeos</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <StickyNote className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-xs font-black text-gray-700">{noteCount}</span>
              <span className="text-[9px] text-gray-400 uppercase tracking-widest">notas</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between text-[10px] text-gray-400 font-black uppercase tracking-widest pt-4 border-t border-gray-100 group-hover:text-gray-700 transition-colors">
            <span>Abrir Painel</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8 pb-20">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 10px; }
        .dark-scrollbar::-webkit-scrollbar { width: 4px; }
        .dark-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
      `}</style>

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
          <Youtube className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center md:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
              Central de Canais
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
              {activeChannels} Ativo{activeChannels !== 1 ? 's' : ''}
            </span>
            {cloudSynced !== null && (
              <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 ${
                cloudSynced
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-gray-100 border-gray-200 text-gray-500'
              }`}>
                {cloudSynced ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
                {cloudSynced ? 'Nuvem' : 'Local'}
              </span>
            )}
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Meus Canais</h1>
          <p className="text-gray-600 font-black mt-1">Gerencie vídeos, notas e roteiros de todos os seus canais em um só lugar.</p>
        </div>
      </div>

      {/* ── STATS + ACTIONS CARD ── */}
      <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
          {/* Stats */}
          <div className="flex items-center gap-6">
            {[
              { label: 'Canais',  value: activeChannels },
              { label: 'Pastas',  value: folders.length },
              { label: 'Vídeos',  value: totalVideos },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black text-gray-900 leading-none">{s.value}</div>
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-black text-xs uppercase tracking-widest text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" /> Exportar
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-black text-xs uppercase tracking-widest text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" /> Importar
            </button>
            <input ref={importInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`px-4 py-2.5 border rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                showArchived
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <Archive className="w-3.5 h-3.5" /> {showArchived ? 'Ocultar' : 'Arquivados'}
            </button>
            <button
              onClick={() => { setFolderForm({ name: '', color: COLORS[0] }); setActiveModal('folder'); }}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-black text-xs uppercase tracking-widest text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
            >
              <FolderPlus className="w-3.5 h-3.5" /> Nova Pasta
            </button>
            <button
              onClick={openNewChannelModal}
              className="px-5 py-2.5 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> Novo Canal
            </button>
          </div>
        </div>
      </section>

      {/* ── FOLDERS ── */}
      {folders.length > 0 && (
        <section className="animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] whitespace-nowrap flex items-center gap-2">
              <Layout className="w-3 h-3" /> Pastas
            </h2>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
          <div className="flex flex-wrap gap-2.5">
            {folders.map(f => (
              <div
                key={f.id}
                className="group flex items-center gap-2.5 px-4 py-2 bg-white border border-gray-200 rounded-full hover:bg-gray-900 hover:border-gray-900 hover:text-white transition-all duration-200 cursor-default"
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: f.color }} />
                <span className="text-sm font-black text-gray-800 group-hover:text-white transition-colors">{f.name}</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 group-hover:bg-white/20 text-gray-500 group-hover:text-white/80 font-black transition-all">
                  {channels.filter(ch => ch.folderId === f.id && !ch.archived).length}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteFolder(f.id); }}
                  className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CHANNELS ── */}
      <section className="animate-in fade-in duration-700">
        {channels.length === 0 ? (
          <div className="py-24 flex flex-col items-center text-center bg-white border border-dashed border-gray-200 rounded-2xl">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
              <Youtube className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Nenhum canal criado</h3>
            <p className="text-gray-500 font-black max-w-sm mb-8 leading-relaxed text-sm">
              Comece criando seu primeiro canal para gerenciar conteúdo, estratégias e roteiros.
            </p>
            <button
              onClick={openNewChannelModal}
              className="px-10 py-4 bg-black text-white font-black rounded-xl uppercase tracking-[0.2em] text-sm hover:bg-gray-900 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Criar Primeiro Canal
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* No-folder group */}
            {channels.filter(ch => !ch.folderId && (showArchived || !ch.archived)).length > 0 && (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-gray-100" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] whitespace-nowrap">Sem Pasta</span>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channels.filter(ch => !ch.folderId && (showArchived || !ch.archived)).map(renderChannelCard)}
                </div>
              </div>
            )}

            {/* Folder groups */}
            {folders.map(folder => {
              const folderChannels = channels.filter(ch => ch.folderId === folder.id && (showArchived || !ch.archived));
              if (folderChannels.length === 0) return null;
              return (
                <div key={folder.id} className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-5 rounded-full shrink-0" style={{ background: folder.color }} />
                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em]">{folder.name}</h3>
                    <div className="h-px flex-1 bg-gray-100" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {folderChannels.length} canal{folderChannels.length > 1 ? 'is' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {folderChannels.map(renderChannelCard)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── MODALS ── */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal(null)} />

          {/* FOLDER MODAL */}
          {activeModal === 'folder' && (
            <div className="relative bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
              <div className="bg-black text-white px-8 py-7 flex items-center gap-4">
                <div className="w-11 h-11 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
                  <FolderPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tighter uppercase italic">Nova Pasta</h2>
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Agrupe canais por nicho ou idioma</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="ml-auto p-2.5 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Nome da Pasta</label>
                  <input
                    type="text"
                    value={folderForm.name}
                    onChange={e => setFolderForm({...folderForm, name: e.target.value})}
                    onKeyDown={e => e.key === 'Enter' && submitFolder()}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-black outline-none transition-all font-black text-gray-900"
                    placeholder="Ex: Nicho de Horror"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Cor</label>
                  <div className="flex gap-3">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setFolderForm({...folderForm, color: c})} className={`w-9 h-9 rounded-xl transition-all ${folderForm.color === c ? 'scale-110 ring-2 ring-black ring-offset-2' : 'opacity-40 hover:opacity-80'}`} style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setActiveModal(null)} className="flex-1 py-4 bg-gray-100 text-gray-900 font-black rounded-xl uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">Cancelar</button>
                  <button onClick={submitFolder} className="flex-1 py-4 bg-black text-white font-black rounded-xl uppercase tracking-[0.2em] text-xs hover:bg-gray-900 active:scale-95 transition-all">Criar Pasta</button>
                </div>
              </div>
            </div>
          )}

          {/* CHANNEL MODAL */}
          {activeModal === 'channel' && (
            <div className="relative bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-300">
              <div className="bg-black text-white px-8 py-7 flex items-center gap-4">
                <div className="w-11 h-11 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
                  <Youtube className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tighter uppercase italic">{editingEntityId ? 'Editar Canal' : 'Novo Canal'}</h2>
                  <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Configure as bases estratégicas do canal</p>
                </div>
                <button onClick={() => setActiveModal(null)} className="ml-auto p-2.5 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Nome do Canal</label>
                    <input type="text" value={channelForm.name} onChange={e => setChannelForm({...channelForm, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-black outline-none transition-all font-black text-gray-900" placeholder="Ex: Curiosidades Insanas" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Pasta</label>
                    <select value={channelForm.folderId || ''} onChange={e => setChannelForm({...channelForm, folderId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none font-black text-gray-900 appearance-none cursor-pointer focus:border-black transition-all">
                      <option value="">Sem Pasta (Raiz)</option>
                      {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block flex items-center gap-2"><LinkIcon className="w-3 h-3" /> Canais de Referência</label>
                  <textarea value={channelForm.references} onChange={e => setChannelForm({...channelForm, references: e.target.value})} className="w-full h-24 bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-black outline-none resize-none text-sm font-black text-gray-900 transition-all" placeholder="URLs de canais de inspiração..." />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block flex items-center gap-2"><AlignLeft className="w-3 h-3" /> Notas Gerais</label>
                  <textarea value={channelForm.notes} onChange={e => setChannelForm({...channelForm, notes: e.target.value})} className="w-full h-24 bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-black outline-none resize-none text-sm font-black text-gray-900 transition-all" placeholder="Estratégia, público-alvo, nicho..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block flex items-center gap-2"><Clock className="w-3 h-3" /> Horários de Postagem</label>
                    <input type="text" value={channelForm.schedule} onChange={e => setChannelForm({...channelForm, schedule: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-black text-sm text-gray-900 focus:border-black outline-none transition-all" placeholder="Ex: Ter e Qui às 18:00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block flex items-center gap-2"><Info className="w-3 h-3" /> Notas Adicionais</label>
                    <input type="text" value={channelForm.additional} onChange={e => setChannelForm({...channelForm, additional: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-black text-sm text-gray-900 focus:border-black outline-none transition-all" placeholder="Meta, tags frequentes..." />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Cor do Card</label>
                  <div className="flex gap-3">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setChannelForm({...channelForm, color: c})} className={`w-9 h-9 rounded-xl transition-all ${channelForm.color === c ? 'scale-110 ring-2 ring-black ring-offset-2' : 'opacity-40 hover:opacity-80'}`} style={{ background: c }} />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={() => setActiveModal(null)} className="flex-1 py-4 bg-gray-100 text-gray-900 font-black rounded-xl uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">Cancelar</button>
                  <button onClick={submitChannel} className="flex-1 py-4 bg-black text-white font-black rounded-xl uppercase tracking-[0.2em] text-xs hover:bg-gray-900 active:scale-95 transition-all">
                    {editingEntityId ? 'Salvar Alterações' : 'Criar Canal'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DETAIL MODAL */}
          {activeModal === 'detail' && currentChannel && (
            <div className="relative bg-white border border-gray-200 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              {/* Black Header */}
              <div className="bg-black text-white px-8 py-7 flex items-center gap-6 shrink-0">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl text-white shrink-0"
                  style={{ background: currentChannel.color }}
                >
                  {currentChannel.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h2 className="text-2xl font-black tracking-tighter italic uppercase text-white">{currentChannel.name}</h2>
                    {currentChannel.archived && (
                      <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[9px] font-black uppercase tracking-widest text-white/60">Arquivado</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-[10px] font-black text-white/60 uppercase tracking-widest">
                      <FolderPlus className="w-3 h-3" /> {folders.find(f => f.id === currentChannel.folderId)?.name || 'Sem Pasta'}
                    </span>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> {formatDate(currentChannel.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => editChannel(currentChannel)} className="p-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all" title="Editar canal">
                    <Settings className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={() => setActiveModal(null)} className="p-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 bg-white shrink-0 overflow-x-auto">
                {[
                  { id: 'info',    name: 'Informações', icon: Layout   },
                  { id: 'videos',  name: 'Vídeos',      icon: Video    },
                  { id: 'notes',   name: 'Notas',       icon: StickyNote },
                  { id: 'scripts', name: 'Roteiros',    icon: FileText },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id as any)}
                    className={`flex items-center gap-2.5 px-7 py-5 text-[11px] font-black uppercase tracking-[0.2em] border-b-2 whitespace-nowrap transition-all ${
                      detailTab === tab.id
                        ? 'border-black text-black bg-black/5'
                        : 'border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 ${detailTab === tab.id ? 'text-black' : 'text-gray-400'}`} />
                    {tab.name}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-8 bg-gray-50 custom-scrollbar">

                {/* INFO TAB */}
                {detailTab === 'info' && (
                  <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                              <AlignLeft className="w-4 h-4 text-primary" />
                            </div>
                            <h4 className="text-sm font-black text-gray-900">Notas Gerais</h4>
                          </div>
                          <div className="p-6">
                            <p className="text-sm leading-relaxed text-gray-700 font-black whitespace-pre-wrap min-h-[80px]">
                              {currentChannel.notes || <span className="text-gray-400">Nenhuma estratégia registrada.</span>}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                              <LinkIcon className="w-4 h-4 text-primary" />
                            </div>
                            <h4 className="text-sm font-black text-gray-900">Referências</h4>
                          </div>
                          <div className="p-6">
                            <p className="text-sm leading-relaxed text-gray-500 font-black break-all min-h-[80px]">
                              {currentChannel.references || <span className="text-gray-400">Sem referências cadastradas.</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                              <Calendar className="w-4 h-4 text-primary" />
                            </div>
                            <h4 className="text-sm font-black text-gray-900">Escala de Postagem</h4>
                          </div>
                          <div className="p-6">
                            <div className="p-4 bg-gray-900 rounded-xl">
                              <p className="text-base font-black text-white">{currentChannel.schedule || 'A definir...'}</p>
                              <p className="text-[9px] text-white/40 uppercase font-black mt-1">Frequência de publicação</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                              <Info className="w-4 h-4 text-primary" />
                            </div>
                            <h4 className="text-sm font-black text-gray-900">Notas Adicionais</h4>
                          </div>
                          <div className="p-6">
                            <p className="text-sm font-black text-gray-700 min-h-[40px]">
                              {currentChannel.additional || <span className="text-gray-400">Nenhum lembrete extra.</span>}
                            </p>
                          </div>
                        </div>
                        {/* YouTube link card */}
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                              <Youtube className="w-4 h-4 text-red-500" />
                            </div>
                            <h4 className="text-sm font-black text-gray-900">Canal YouTube</h4>
                          </div>
                          <div className="p-6 text-center">
                            {currentChannel.youtubeUrl ? (
                              <div className="space-y-3">
                                <p className="text-xs font-black text-gray-600 bg-gray-50 border border-gray-200 p-3 rounded-xl break-all">{currentChannel.youtubeUrl}</p>
                                <div className="flex gap-3 justify-center">
                                  <button onClick={() => setActiveModal('yt-link')} className="px-4 py-2.5 bg-gray-100 border border-gray-200 hover:bg-gray-200 rounded-xl text-[10px] font-black text-gray-700 uppercase tracking-widest transition-all">Alterar</button>
                                  <a href={currentChannel.youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-900 active:scale-95 transition-all">
                                    <ExternalLink className="w-3.5 h-3.5" /> Abrir
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <p className="text-xs font-black text-gray-500 mb-4 leading-relaxed">Vincule seu canal para acesso rápido.</p>
                                <button onClick={() => setActiveModal('yt-link')} className="px-6 py-3 bg-black text-white font-black rounded-xl text-[10px] uppercase tracking-[0.2em] hover:bg-gray-900 active:scale-95 transition-all">
                                  Vincular Agora
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* VIDEOS TAB */}
                {detailTab === 'videos' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Vídeos Planejados</h3>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">
                          {(currentChannel.videos || []).length} no arsenal
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowArchivedVideos(!showArchivedVideos)}
                          className={`px-4 py-2.5 border rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${showArchivedVideos ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'}`}
                        >
                          {showArchivedVideos ? 'Ocultar' : 'Arquivados'}
                        </button>
                        <button
                          onClick={() => { setVideoForm({ title: '', status: 'draft', script: '', tags: '', description: '' }); setActiveModal('video'); }}
                          className="px-5 py-2.5 bg-black text-white font-black rounded-xl text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-gray-900 active:scale-95 transition-all"
                        >
                          <Plus className="w-4 h-4" /> Novo Vídeo
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {(currentChannel.videos || []).filter(v => showArchivedVideos || !v.archived).length === 0 ? (
                        <div className="py-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-center">
                          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-primary/20">
                            <Video className="w-7 h-7 text-primary" />
                          </div>
                          <h4 className="text-lg font-black text-gray-900 mb-2">Nenhum vídeo planejado</h4>
                          <p className="text-gray-500 text-sm mb-7 max-w-xs mx-auto font-black leading-relaxed">Adicione seu primeiro vídeo ao arsenal.</p>
                          <button onClick={() => setActiveModal('video')} className="px-8 py-3.5 bg-black text-white font-black rounded-xl uppercase tracking-[0.2em] text-xs hover:bg-gray-900 active:scale-95 transition-all">Adicionar Vídeo</button>
                        </div>
                      ) : (
                        (currentChannel.videos || []).filter(v => showArchivedVideos || !v.archived).map(v => (
                          <div key={v.id} className="group bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between hover:border-gray-300 transition-all relative overflow-hidden">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${v.status === 'published' ? 'bg-green-500' : v.status === 'scheduled' ? 'bg-purple-500' : 'bg-gray-300'}`} />
                            {v.archived && <div className="absolute top-3 right-3 px-2 py-0.5 bg-gray-100 border border-gray-200 text-[8px] font-black uppercase rounded-full text-gray-400">Arquivado</div>}
                            <div className="flex items-center gap-4 pl-4">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${v.status === 'published' ? 'bg-green-50 border-green-200 text-green-600' : v.status === 'scheduled' ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                <Video className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="text-sm font-black text-gray-900 mb-1">{v.title}</h5>
                                <div className="flex gap-2 items-center flex-wrap">
                                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${v.status === 'published' ? 'bg-green-100 text-green-700' : v.status === 'scheduled' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {v.status === 'draft' ? 'Rascunho' : v.status === 'scheduled' ? 'Agendado' : 'Publicado'}
                                  </span>
                                  {v.tags && <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1"><Tag className="w-2.5 h-2.5" /> {v.tags}</span>}
                                  <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(v.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                              <button onClick={() => toggleArchiveVideo(currentChannel.id, v.id)} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-400 transition-all" title={v.archived ? 'Desarquivar' : 'Arquivar'}><Archive className="w-4 h-4 text-gray-500" /></button>
                              <button onClick={() => deleteVideo(currentChannel.id, v.id)} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-red-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* NOTES TAB */}
                {detailTab === 'notes' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Notas e Ideias</h3>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">
                          {(currentChannel.channelNotes || []).length} nota{(currentChannel.channelNotes || []).length !== 1 ? 's' : ''} salva{(currentChannel.channelNotes || []).length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => { setNoteForm({ title: '', content: '' }); setActiveModal('note'); }}
                        className="px-5 py-2.5 bg-black text-white font-black rounded-xl text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-gray-900 active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Nova Nota
                      </button>
                    </div>

                    {(currentChannel.channelNotes || []).length === 0 ? (
                      <div className="py-20 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-center">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-primary/20">
                          <StickyNote className="w-7 h-7 text-primary" />
                        </div>
                        <h4 className="text-lg font-black text-gray-900 mb-2">Sem notas ainda</h4>
                        <p className="text-gray-500 text-sm mb-7 max-w-xs mx-auto font-black leading-relaxed">Rascunhe títulos, hooks e estratégias virais.</p>
                        <button onClick={() => setActiveModal('note')} className="px-8 py-3.5 bg-black text-white font-black rounded-xl uppercase tracking-[0.2em] text-xs hover:bg-gray-900 active:scale-95 transition-all">Criar Nota</button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(currentChannel.channelNotes || []).map(n => (
                          <div key={n.id} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-all">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-start justify-between gap-3">
                              <h4 className="text-sm font-black text-gray-900 leading-tight">{n.title}</h4>
                              <button
                                onClick={() => deleteNote(currentChannel.id, n.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:text-red-500 transition-all shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="p-6">
                              <p className="text-sm text-gray-600 leading-relaxed font-black whitespace-pre-wrap line-clamp-6">{n.content}</p>
                              <div className="pt-4 mt-4 border-t border-gray-100 text-[9px] text-gray-400 font-black uppercase tracking-[0.3em] flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> {formatDate(n.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SCRIPTS TAB */}
                {detailTab === 'scripts' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Upload card */}
                    <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-gray-900">Cofre de Roteiros</h4>
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Arquivos .TXT</p>
                        </div>
                      </div>
                      <div className="p-8">
                        <label className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all group">
                          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                            <Upload className="w-7 h-7 text-gray-400 group-hover:text-gray-600 transition-colors" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 mb-1">Clique para fazer upload</p>
                            <p className="text-xs font-black text-gray-500">Arquivos .TXT — Centralize sua biblioteca de roteiros</p>
                          </div>
                          <span className="px-6 py-3 bg-black text-white font-black rounded-xl text-xs uppercase tracking-[0.2em] group-hover:bg-gray-900 transition-colors flex items-center gap-2">
                            <Upload className="w-4 h-4" /> Fazer Upload .TXT
                          </span>
                          <input type="file" accept=".txt" onChange={handleScriptUpload} className="hidden" />
                        </label>
                      </div>
                    </section>

                    {(currentChannel.scripts || []).length > 0 && (
                      <div className="space-y-3">
                        {(currentChannel.scripts || []).map(script => (
                          <div key={script.id} className="group bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between hover:border-gray-300 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 bg-gray-900 rounded-xl flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h5 className="text-sm font-black text-gray-900 mb-1">{script.name}</h5>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                  {script.size} <ChevronRight className="w-3 h-3" /> {formatDate(script.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { navigator.clipboard.writeText(script.content); trackScriptCopied(); showToast('Roteiro copiado!'); }}
                                className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-400 transition-all opacity-0 group-hover:opacity-100"
                                title="Copiar"
                              >
                                <Copy className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => {
                                  const blob = new Blob([script.content], { type: 'text/plain' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url; a.download = script.name; a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-400 transition-all"
                                title="Baixar"
                              >
                                <Download className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => deleteScript(currentChannel.id, script.id)}
                                className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* VIDEO MODAL */}
          {activeModal === 'video' && (
            <div className="relative bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
              <div className="bg-black text-white px-7 py-6 flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center"><Video className="w-5 h-5 text-white" /></div>
                <div>
                  <h2 className="text-lg font-black tracking-tighter uppercase italic">Planejar Vídeo</h2>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Defina as bases do novo conteúdo</p>
                </div>
                <button onClick={() => setActiveModal('detail')} className="ml-auto p-2.5 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all"><X className="w-4 h-4 text-white" /></button>
              </div>
              <div className="p-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Título do Vídeo</label>
                  <input type="text" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-black outline-none transition-all font-black text-lg text-gray-900" placeholder="Ex: O Segredo de Tesla" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Status</label>
                    <select value={videoForm.status} onChange={e => setVideoForm({...videoForm, status: e.target.value as any})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 outline-none font-black text-gray-900 appearance-none cursor-pointer focus:border-black transition-all">
                      <option value="draft">Rascunho</option>
                      <option value="scheduled">Agendado</option>
                      <option value="published">Publicado</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block flex items-center gap-2"><Tag className="w-3 h-3" /> Tags</label>
                    <input type="text" value={videoForm.tags} onChange={e => setVideoForm({...videoForm, tags: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-black text-sm text-gray-900 focus:border-black outline-none transition-all" placeholder="tag1, tag2..." />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Roteiro</label>
                  <textarea value={videoForm.script} onChange={e => setVideoForm({...videoForm, script: e.target.value})} className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-black outline-none resize-none text-sm font-black text-gray-900 transition-all" placeholder="Roteiro ou notas do vídeo..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Descrição YouTube</label>
                  <textarea value={videoForm.description} onChange={e => setVideoForm({...videoForm, description: e.target.value})} className="w-full h-24 bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-black outline-none resize-none text-sm font-black text-gray-900 transition-all" placeholder="Metadados para o YouTube..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setActiveModal('detail')} className="flex-1 py-4 bg-gray-100 text-gray-900 font-black rounded-xl uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">Cancelar</button>
                  <button onClick={submitVideo} className="flex-1 py-4 bg-black text-white font-black rounded-xl uppercase tracking-[0.2em] text-xs hover:bg-gray-900 active:scale-95 transition-all">Criar Plano</button>
                </div>
              </div>
            </div>
          )}

          {/* NOTE MODAL */}
          {activeModal === 'note' && (
            <div className="relative bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
              <div className="bg-black text-white px-7 py-6 flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center"><StickyNote className="w-5 h-5 text-white" /></div>
                <div>
                  <h2 className="text-lg font-black tracking-tighter uppercase italic">Nova Nota</h2>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Documente ideias, hooks e pesquisas</p>
                </div>
                <button onClick={() => setActiveModal('detail')} className="ml-auto p-2.5 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all"><X className="w-4 h-4 text-white" /></button>
              </div>
              <div className="p-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Título</label>
                  <input type="text" value={noteForm.title} onChange={e => setNoteForm({...noteForm, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-black outline-none transition-all font-black text-lg text-gray-900" placeholder="Ex: Brainstorming Setembro" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Conteúdo</label>
                  <textarea value={noteForm.content} onChange={e => setNoteForm({...noteForm, content: e.target.value})} className="w-full h-52 bg-gray-50 border border-gray-200 rounded-xl p-5 focus:border-black outline-none transition-all resize-none text-sm font-black text-gray-900 leading-loose" placeholder="Desenvolva suas ideias aqui..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setActiveModal('detail')} className="flex-1 py-4 bg-gray-100 text-gray-900 font-black rounded-xl uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">Cancelar</button>
                  <button onClick={submitNote} className="flex-1 py-4 bg-black text-white font-black rounded-xl uppercase tracking-[0.2em] text-xs hover:bg-gray-900 active:scale-95 transition-all">Salvar Nota</button>
                </div>
              </div>
            </div>
          )}

          {/* YT LINK MODAL */}
          {activeModal === 'yt-link' && (
            <div className="relative bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
              <div className="bg-black text-white px-7 py-6 flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center"><Youtube className="w-5 h-5 text-white" /></div>
                <div>
                  <h2 className="text-lg font-black tracking-tighter uppercase italic">Vincular YouTube</h2>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Integre o canal ao arsenal</p>
                </div>
                <button onClick={() => setActiveModal('detail')} className="ml-auto p-2.5 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all"><X className="w-4 h-4 text-white" /></button>
              </div>
              <div className="p-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">URL do Canal</label>
                  <input type="text" value={ytForm.url} onChange={e => setYtForm({url: e.target.value})} onKeyDown={e => e.key === 'Enter' && linkYt()} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-black outline-none transition-all font-black text-gray-900" placeholder="https://youtube.com/@seucanal" />
                  <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Aceita @handle ou ID de canal</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setActiveModal('detail')} className="flex-1 py-4 bg-gray-100 text-gray-900 font-black rounded-xl uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">Cancelar</button>
                  <button onClick={linkYt} className="flex-1 py-4 bg-black text-white font-black rounded-xl uppercase tracking-[0.2em] text-xs hover:bg-gray-900 active:scale-95 transition-all">Vincular</button>
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
