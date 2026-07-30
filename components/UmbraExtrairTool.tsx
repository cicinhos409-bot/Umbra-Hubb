
import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Youtube,
  Key,
  Search,
  Download,
  Copy,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  ExternalLink,
  ChevronRight,
  Info,
  Type
} from 'lucide-react';
import { Supadata, SupadataError, Transcript } from '@supadata/js';

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
  timeLabel: string;
}

const UmbraExtrairTool: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [lang, setLang] = useState('');
  const [viewMode, setViewMode] = useState<'seg' | 'raw'>('seg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [videoInfo, setVideoInfo] = useState<{ id: string; title: string; lang: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<{ id: string; text: string; status: 'wait' | 'run' | 'ok' | 'fail' }[]>([
    { id: 'l1', text: 'Conectando à Supadata API...', status: 'wait' },
    { id: 'l2', text: 'Processando transcrição...', status: 'wait' },
    { id: 'l3', text: 'Organizando segmentos...', status: 'wait' },
  ]);

  const fmtTime = (ms: number) => {
    const tot = Math.floor(ms / 1000);
    const h = Math.floor(tot / 3600);
    const m = Math.floor((tot % 3600) / 60);
    const s = tot % 60;
    return (h > 0 ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  };

  const getVid = (url: string) => {
    try {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
      ];
      for (const p of patterns) {
        const m = url.trim().match(p);
        if (m) return m[1];
      }
    } catch { }
    return null;
  };

  const updateLog = (id: string, status: 'wait' | 'run' | 'ok' | 'fail') => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const handleExtract = async () => {
    const videoId = getVid(urlInput);
    if (!videoId) return setError('URL do YouTube inválida.');

    setIsProcessing(true);
    setError(null);
    setSegments([]);
    setVideoInfo(null);
    setLogs(logs.map(l => ({ ...l, status: 'wait' })));

    try {
      const apiKey = import.meta.env.VITE_SUPADATA_API_KEY;
      if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY_CHANGE_ME') {
        throw new Error('Supadata API Key não configurada. Adicione VITE_SUPADATA_API_KEY ao seu ambiente.');
      }

      const supadata = new Supadata({ apiKey });

      // Step 1: Connect & Fetch
      updateLog('l1', 'run');

      const transcriptResult = await supadata.transcript({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        lang: lang || undefined,
        text: false
      });

      updateLog('l1', 'ok');

      // Step 2: Process Content
      updateLog('l2', 'run');

      let content: any[] = [];
      let finalLang = lang || 'auto';

      if ('jobId' in transcriptResult) {
        let attempts = 0;
        const maxAttempts = 30; // 1 minute max polling

        while (attempts < maxAttempts) {
          const jobResult = await supadata.transcript.getJobStatus(transcriptResult.jobId);
          if (jobResult.status === 'completed' && jobResult.result) {
            const transcriptData = jobResult.result as Transcript;
            content = Array.isArray(transcriptData.content) ? transcriptData.content : [];
            finalLang = transcriptData.lang || finalLang;
            break;
          } else if (jobResult.status === 'failed') {
            throw new Error(`O processamento falhou: ${jobResult.error?.message || 'Erro desconhecido'}`);
          }

          attempts++;
          await new Promise(r => setTimeout(r, 2000));
        }

        if (content.length === 0) {
          throw new Error(`O processamento demorou muito. ID do Job: ${transcriptResult.jobId}`);
        }
      } else {
        const transcriptData = transcriptResult as Transcript;
        content = Array.isArray(transcriptData.content) ? transcriptData.content : [];
        finalLang = transcriptData.lang || finalLang;
      }

      if (!Array.isArray(content) || content.length === 0) {
        throw new Error('Nenhum conteúdo retornado pela API.');
      }

      const mapped = content.map((s: any) => ({
        text: (s.text || '').trim(),
        offset: s.offset || 0,
        duration: s.duration || 0,
        timeLabel: fmtTime(s.offset || 0)
      })).filter(s => s.text);
      updateLog('l2', 'ok');

      // Step 3: Organize
      updateLog('l3', 'run');
      setSegments(mapped);

      // Fetch OEmbed Title
      let title = videoId;
      try {
        const oe = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (oe.ok) {
          const oed = await oe.json();
          title = oed.title;
        }
      } catch { }

      setVideoInfo({ id: videoId, title, lang: finalLang });
      updateLog('l3', 'ok');
    } catch (err: any) {
      if (err instanceof SupadataError) {
        setError(`${err.message} (${err.error})`);
      } else {
        setError(err.message);
      }
      updateLog('l1', 'fail');
      updateLog('l2', 'fail');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    const text = segments.map(s => s.text).join(' ');
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

  const downloadFile = (type: 'txt' | 'srt') => {
    if (!videoInfo) return;
    let content = '';
    const safeTitle = videoInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (type === 'txt') {
      content = segments.map(s => `[${s.timeLabel}] ${s.text}`).join('\n');
    } else {
      segments.forEach((s, i) => {
        const srtT = (ms: number) => {
          const d = Math.round(ms);
          const h = Math.floor(d / 3600000);
          const m = Math.floor((d % 3600000) / 60000);
          const sc = Math.floor((d % 60000) / 1000);
          const ms_part = d % 1000;
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')},${String(ms_part).padStart(3, '0')}`;
        };
        content += `${i + 1}\n${srtT(s.offset)} --> ${srtT(s.offset + s.duration)}\n${s.text}\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `umbra_${safeTitle}.${type}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSegments = segments.filter(s => s.text.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-5xl mx-auto">
      <header className="text-center relative">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-brand-cyan/10 rounded-2xl mb-6 shadow-2xl ring-1 ring-brand-cyan/20">
          <Scissors className="w-12 h-12 text-brand-cyan" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink bg-clip-text text-transparent uppercase font-bebas">
          Umbra Extrair
        </h1>
        <p className="text-gray-900 font-black">Transcrição de Alta Precisão • YouTube Crawler v2.0</p>
      </header>

      {/* INPUT PANEL */}
      <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xl space-y-8">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest px-2">Link do Vídeo</label>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 bg-white border border-gray-200 rounded-2xl p-5 text-sm font-black text-gray-900 focus:border-brand-purple transition-all outline-none"
            />
            <button
              onClick={handleExtract}
              disabled={isProcessing}
              className="px-12 py-5 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink text-white font-orbitron text-xs font-black tracking-[0.4em] rounded-[24px] shadow-2xl hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-4 disabled:opacity-30 uppercase active:scale-95"
            >
              {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Youtube className="w-5 h-5" />}
              Extrair Agora
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8 pt-4 border-t border-gray-200">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Idioma Forçado (Opcional)</label>
            <select value={lang} onChange={e => setLang(e.target.value)} className="bg-white border border-gray-200 rounded-xl p-3 text-[10px] font-black outline-none">
              <option value="">Automático</option>
              <option value="pt-BR">Português BR</option>
              <option value="en">Inglês</option>
              <option value="es">Espanhol</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-gray-900 uppercase tracking-widest">Estilo de Exibição</label>
            <div className="flex bg-white p-1 rounded-xl">
              <button onClick={() => setViewMode('seg')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewMode === 'seg' ? 'bg-brand-cyan text-background-deep' : 'text-gray-900'}`}>Sincronizado</button>
              <button onClick={() => setViewMode('raw')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${viewMode === 'raw' ? 'bg-brand-cyan text-background-deep' : 'text-gray-900'}`}>Texto Puro</button>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESSING LOGS */}
      {(isProcessing || logs[0].status !== 'wait') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {logs.map(log => (
            <div key={log.id} className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${log.status === 'ok' ? 'bg-brand-green/10 border-brand-green/30 text-brand-green' : log.status === 'run' ? 'bg-brand-cyan/10 border-brand-cyan/40 text-brand-cyan' : 'bg-white border-gray-200 text-gray-900'}`}>
              {log.status === 'run' ? <RefreshCw className="w-4 h-4 animate-spin" /> : log.status === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase tracking-widest">{log.text}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-6 bg-brand-pink/10 border border-brand-pink/20 rounded-3xl flex items-center gap-4 text-brand-pink animate-in slide-in-from-top-2">
          <AlertCircle className="w-6 h-6" />
          <div className="text-xs font-black uppercase tracking-widest">{error}</div>
        </div>
      )}

      {/* RESULTS AREA */}
      {videoInfo && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-brand-cyan/10 transition-all" />

            <div className="flex flex-col lg:flex-row gap-8 items-center mb-8 border-b border-gray-200 pb-8">
              <img src={`https://img.youtube.com/vi/${videoInfo.id}/mqdefault.jpg`} className="w-48 h-28 rounded-2xl object-cover shadow-2xl border border-gray-200" />
              <div className="flex-1 text-center lg:text-left space-y-2">
                <h3 className="text-xl font-black tracking-tight leading-tight">{videoInfo.title}</h3>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-[10px] font-black text-gray-900 uppercase tracking-widest">
                  <span>ID: {videoInfo.id}</span>
                  <span className="text-brand-cyan">Idioma: {videoInfo.lang}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={copyToClipboard} className="p-4 bg-gray-50 rounded-2xl hover:text-brand-cyan transition-all shadow-xl" title="Copiar"><Copy className="w-5 h-5" /></button>
                <button onClick={() => downloadFile('txt')} className="p-4 bg-gray-50 rounded-2xl hover:text-brand-green transition-all shadow-xl" title="Baixar TXT"><FileText className="w-5 h-5" /></button>
                <button onClick={() => downloadFile('srt')} className="p-4 bg-gray-50 rounded-2xl hover:text-brand-purple transition-all shadow-xl" title="Baixar SRT"><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="relative mb-8">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-900" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Pesquisar termo na transcrição..."
                className="w-full bg-white/50 border border-gray-200 rounded-2xl py-4 pl-14 pr-6 text-sm font-black text-gray-900 outline-none focus:border-brand-cyan transition-all shadow-inner"
              />
            </div>

            <div className="bg-white/50 border border-gray-200 rounded-2xl p-8 max-h-[500px] overflow-y-auto custom-scrollbar shadow-inner relative">
              {viewMode === 'raw' ? (
                <div className="text-sm font-black leading-relaxed text-gray-900 whitespace-pre-wrap select-text">
                  {segments.map(s => s.text).join(' ')}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSegments.length > 0 ? filteredSegments.map((s, i) => (
                    <div key={i} className="flex gap-6 group hover:bg-gray-50 p-4 rounded-2xl transition-all">
                      <span className="font-orbitron text-[10px] font-black text-brand-cyan opacity-40 group-hover:opacity-100 transition-opacity shrink-0">{s.timeLabel}</span>
                      <p className="text-sm font-black text-gray-900 group-hover:text-gray-900 select-text">{s.text}</p>
                    </div>
                  )) : (
                    <div className="py-20 text-center text-gray-700 font-black uppercase tracking-widest text-xs">Nenhum segmento encontrado para sua busca</div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { label: 'Palavras', val: segments.map(s => s.text).join(' ').split(/\s+/).length },
                { label: 'Segmentos', val: segments.length },
                { label: 'Duração', val: segments.length ? segments[segments.length - 1].timeLabel : '—' },
                { label: 'Caracteres', val: segments.map(s => s.text).join(' ').length },
              ].map(s => (
                <div key={s.label} className="bg-white/50 border border-gray-200 p-5 rounded-2xl text-center shadow-inner">
                  <div className="text-lg font-black text-gray-900">{s.val.toLocaleString()}</div>
                  <div className="text-[9px] font-black text-gray-900 uppercase tracking-widest">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER TIPS */}
      <footer className="mt-20 p-12 bg-white border border-gray-200 rounded-2xl text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-brand-pink/5 opacity-50" />
        <div className="relative z-10 space-y-6">
          <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center mx-auto text-brand-cyan shadow-xl"><Info className="w-8 h-8" /></div>
          <h4 className="text-xl font-black tracking-tighter uppercase">Protocolo de Extração Umbra</h4>
          <p className="text-gray-900 text-xs max-w-xl mx-auto leading-relaxed">Diferente das ferramentas comuns, o Umbra Extrair utiliza a API do Supadata para forçar a detecção de legendas mesmo quando o YouTube não as exibe nativamente. Perfeito para engenharia reversa de scripts virais.</p>
        </div>
      </footer>
    </div>
  );
};

export default UmbraExtrairTool;
