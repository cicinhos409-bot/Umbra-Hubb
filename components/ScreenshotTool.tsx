
import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Camera,
  Video,
  Clock,
  Scissors,
  Pointer,
  Trash2,
  Download,
  CheckCircle2,
  Layout,
  Zap,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Film,
  ImageIcon,
} from 'lucide-react';

interface Shot {
  id: string;
  time: number;
  blob: Blob;
  url: string;
  name: string;
}

const ScreenshotTool: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<'scene' | 'interval' | 'manual'>('scene');
  const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png');
  const [quality, setQuality] = useState(95);

  const [sensitivity, setSensitivity] = useState(0.16);
  const [step, setStep] = useState(0.35);
  const [minGap, setMinGap] = useState(0.90);
  const [interval, setIntervalVal] = useState(2);

  const [shots, setShots] = useState<Shot[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Pronto para começar');
  const [scenesCount, setScenesCount] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capturesCount = shots.length;
  const durationText = videoRef.current ? formatTime(videoRef.current.duration || 0) : '0:00';

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const handleFile = (file: File) => {
    if (!file.type.startsWith('video/')) { alert('Selecione um arquivo de vídeo'); return; }
    setShots([]); setSelectedIds(new Set()); setScenesCount(0);
    setProgress(0); setProgressLabel('Vídeo carregado');
    setVideoFile(file);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
  };

  const seekTo = (t: number): Promise<void> => new Promise((resolve) => {
    if (!videoRef.current) return resolve();
    const video = videoRef.current;
    const onSeeked = () => { video.removeEventListener('seeked', onSeeked); resolve(); };
    video.addEventListener('seeked', onSeeked);
    video.currentTime = Math.min(Math.max(t, 0), video.duration || t);
  });

  const captureFrameAt = async (t: number) => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    await seekTo(t);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const mimeType = format === 'png' ? 'image/png' : format === 'jpg' ? 'image/jpeg' : 'image/webp';
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), mimeType, quality / 100));
    const id = Math.random().toString(36).substr(2, 9);
    const name = `capture_${t.toFixed(2).replace('.', '_')}s.${format}`;
    setShots(prev => [...prev, { id, time: t, blob, url: URL.createObjectURL(blob), name }]);
  };

  const frameDiff = (a: Uint8ClampedArray, b: Uint8ClampedArray) => {
    const len = Math.min(a.length, b.length);
    let sum = 0, count = 0;
    for (let i = 0; i < len; i += 16) {
      sum += (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])) / (3 * 255);
      count++;
    }
    return count ? sum / count : 0;
  };

  const runSceneDetection = async () => {
    if (!videoRef.current || isRunning) return;
    setIsRunning(true); setShots([]); setScenesCount(0);
    const video = videoRef.current;
    const duration = video.duration;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const targetW = Math.min(640, video.videoWidth);
    canvas.width = targetW; canvas.height = Math.floor(video.videoHeight * (targetW / video.videoWidth));
    let lastCutTime = -Infinity, prevData: Uint8ClampedArray | null = null, scenes = 0;
    await seekTo(0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    prevData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    await captureFrameAt(0); scenes++; setScenesCount(scenes);
    for (let t = step; t < duration; t += step) {
      setProgress((t / duration) * 100);
      await seekTo(t);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const currData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const diff = frameDiff(prevData!, currData);
      setProgressLabel(`Analisando ${formatTime(t)} / ${formatTime(duration)} — diff: ${diff.toFixed(3)}`);
      if ((t - lastCutTime) >= minGap && diff >= sensitivity) {
        await captureFrameAt(t); lastCutTime = t; scenes++; setScenesCount(scenes);
        await seekTo(t); ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        prevData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      } else { prevData = currData; }
    }
    setProgress(100); setProgressLabel(`Concluído — ${scenes} cenas detectadas`);
    setIsRunning(false);
  };

  const runIntervalCapture = async () => {
    if (!videoRef.current || isRunning) return;
    setIsRunning(true); setShots([]);
    const video = videoRef.current;
    const duration = video.duration;
    let count = 0;
    for (let t = 0; t < duration; t += interval) {
      setProgress((t / duration) * 100);
      setProgressLabel(`Capturando ${formatTime(t)} / ${formatTime(duration)}`);
      await captureFrameAt(t); count++;
    }
    setProgress(100); setProgressLabel(`Finalizado — ${count} capturas`);
    setIsRunning(false);
  };

  const handleStart = () => { if (mode === 'scene') runSceneDetection(); else if (mode === 'interval') runIntervalCapture(); };
  const handleManualCapture = () => { if (videoRef.current) captureFrameAt(videoRef.current.currentTime); };

  const downloadZip = async () => {
    const zip = new JSZip();
    const targets = selectedIds.size > 0 ? shots.filter(s => selectedIds.has(s.id)) : shots;
    if (targets.length === 0) return;
    targets.forEach((shot, i) => zip.file(shot.name || `screenshot_${i}.${format}`, shot.blob));
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content); a.download = `umbra_screenshots_${Date.now()}.zip`; a.click();
  };

  const deleteShot = (id: string) => {
    setShots(prev => prev.filter(s => s.id !== id));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' && mode === 'manual' && videoUrl) { e.preventDefault(); handleManualCapture(); }
      if (e.key === 'k' || e.key === 'K') { if (videoRef.current?.paused) videoRef.current.play(); else videoRef.current?.pause(); }
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft' && lightboxIndex !== null) setLightboxIndex(p => p! > 0 ? p! - 1 : shots.length - 1);
      if (e.key === 'ArrowRight' && lightboxIndex !== null) setLightboxIndex(p => p! < shots.length - 1 ? p! + 1 : 0);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode, videoUrl, lightboxIndex, shots.length]);

  // ── shared style tokens ──
  const card = 'bg-white border border-gray-200 rounded-2xl overflow-hidden';
  const cardHeader = 'px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-3';
  const btnPrimary = 'flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-black py-3 px-6 rounded-xl text-xs uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed';
  const btnSecondary = 'flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 font-black py-3 px-5 rounded-xl text-xs uppercase tracking-widest transition-all';

  const MODES = [
    { id: 'scene' as const, label: 'Cenas', icon: Scissors, desc: 'Detecta cortes automaticamente' },
    { id: 'interval' as const, label: 'Intervalo', icon: Clock, desc: 'Captura a cada X segundos' },
    { id: 'manual' as const, label: 'Manual', icon: Pointer, desc: 'Você controla cada frame' },
  ];

  return (
    <div className="font-rajdhani animate-in fade-in duration-500 pb-10 space-y-6">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
            <Camera className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">Tirador de Screenshots</h1>
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Extração inteligente de frames para canais Dark e edição</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 shrink-0">
          {[
            { label: 'Capturas', val: capturesCount, highlight: capturesCount > 0 },
            { label: 'Cenas', val: scenesCount, highlight: false },
            { label: 'Duração', val: durationText, highlight: false },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center min-w-[64px]">
              <div className={`text-xl font-black leading-none mb-1 ${s.highlight ? 'text-primary' : 'text-gray-900'}`}>{s.val}</div>
              <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ══ LEFT PANEL ══════════════════════════════════════════ */}
        <div className="lg:col-span-4 space-y-5">

          {/* Upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            className={`group cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              videoFile
                ? 'border-primary/40 bg-primary/5'
                : 'border-gray-200 hover:border-primary/40 hover:bg-primary/5'
            }`}
          >
            <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all ${videoFile ? 'bg-primary/10 border border-primary/20' : 'bg-gray-100 group-hover:bg-primary/10 group-hover:border group-hover:border-primary/20'}`}>
              <Video className={`w-7 h-7 ${videoFile ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
            </div>
            <h4 className={`text-sm font-black mb-1 truncate px-2 ${videoFile ? 'text-primary' : 'text-gray-700'}`}>
              {videoFile ? videoFile.name : 'Selecionar Vídeo'}
            </h4>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {videoFile ? 'Clique para trocar o arquivo' : 'Arraste ou clique aqui'}
            </p>
          </div>

          {/* Mode selector */}
          <div className={card}>
            <div className={cardHeader}>
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                <Film className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Modo de Captura</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Escolha a estratégia de extração</p>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    mode === m.id
                      ? 'bg-primary/5 border-primary ring-2 ring-primary/10'
                      : 'bg-white border-gray-200 hover:border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${mode === m.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <m.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs font-black uppercase tracking-widest ${mode === m.id ? 'text-primary' : 'text-gray-900'}`}>{m.label}</div>
                    <div className="text-[10px] font-black text-gray-400 mt-0.5">{m.desc}</div>
                  </div>
                  {mode === m.id && <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className={card}>
            <div className={cardHeader}>
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                <Settings className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Configurações</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Parâmetros de extração</p>
              </div>
            </div>
            <div className="p-5 space-y-5">
              {mode === 'scene' && (
                <>
                  {[
                    { label: 'Sensibilidade', val: sensitivity.toFixed(2), min: 0.06, max: 0.40, step: 0.01, onChange: setSensitivity },
                    { label: 'Passo de Análise', val: `${step.toFixed(2)}s`, min: 0.10, max: 1.50, step: 0.05, onChange: setStep },
                    { label: 'Gap Mínimo', val: `${minGap.toFixed(2)}s`, min: 0.30, max: 3.00, step: 0.10, onChange: setMinGap },
                  ].map(item => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{item.label}</span>
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">{item.val}</span>
                      </div>
                      <input type="range" min={item.min} max={item.max} step={item.step}
                        value={item.label === 'Sensibilidade' ? sensitivity : item.label === 'Passo de Análise' ? step : minGap}
                        onChange={e => item.onChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary" />
                    </div>
                  ))}
                </>
              )}

              {mode === 'interval' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Intervalo de Tempo</span>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">{interval.toFixed(1)}s</span>
                  </div>
                  <input type="range" min="0.5" max="10" step="0.5" value={interval}
                    onChange={e => setIntervalVal(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary" />
                </div>
              )}

              {mode === 'manual' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-2">
                  <p className="text-xs font-black text-gray-600 leading-relaxed">
                    Capture frames manualmente clicando no botão ou pressionando
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <kbd className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-[10px] font-black text-gray-700 shadow-sm">Espaço</kbd>
                    <span className="text-[10px] font-black text-gray-400">para capturar</span>
                    <kbd className="bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-[10px] font-black text-gray-700 shadow-sm">K</kbd>
                    <span className="text-[10px] font-black text-gray-400">play/pause</span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Formato de Saída</span>
                  <div className="flex gap-2 mt-2">
                    {(['png', 'jpg', 'webp'] as const).map(f => (
                      <button key={f}
                        onClick={() => setFormat(f)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                          format === f ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Qualidade</span>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">{quality}%</span>
                  </div>
                  <input type="range" min="50" max="100" step="5" value={quality}
                    onChange={e => setQuality(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══════════════════════════════════════════ */}
        <div className="lg:col-span-8 space-y-5">

          {/* Video player */}
          <div className={card}>
            <div className={cardHeader}>
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                <Video className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-gray-900">Player de Vídeo</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  {videoFile ? videoFile.name : 'Nenhum vídeo carregado'}
                </p>
              </div>
              {videoFile && (
                <button
                  onClick={() => { setVideoFile(null); setVideoUrl(null); setShots([]); setScenesCount(0); }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Remover vídeo"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-5 space-y-4">
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                {videoUrl ? (
                  <video ref={videoRef} src={videoUrl} controls className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center space-y-3 opacity-25">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                      <Video className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-xs font-black text-white uppercase tracking-widest">Carregue um vídeo para começar</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                {mode !== 'manual' ? (
                  <button onClick={handleStart} disabled={!videoUrl || isRunning} className={`${btnPrimary} flex-1 py-4`}>
                    <Zap className="w-4 h-4" />
                    {isRunning ? 'Processando...' : 'Iniciar Processamento'}
                  </button>
                ) : (
                  <button onClick={handleManualCapture} disabled={!videoUrl} className={`${btnPrimary} flex-1 py-4`}>
                    <Camera className="w-4 h-4" /> Capturar Frame Atual
                  </button>
                )}
                {shots.length > 0 && (
                  <button
                    onClick={() => { setShots([]); setScenesCount(0); setSelectedIds(new Set()); }}
                    className="p-4 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl text-gray-400 hover:text-red-500 transition-all"
                    title="Limpar capturas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Progress */}
              {isRunning && (
                <div className="space-y-2 animate-in fade-in duration-300 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse truncate max-w-[80%]">{progressLabel}</span>
                    <span className="text-[10px] font-black text-gray-900 shrink-0">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {/* Done state */}
              {!isRunning && progress === 100 && shots.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl animate-in fade-in duration-300">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-xs font-black text-green-700">{progressLabel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Gallery */}
          <div className={card}>
            <div className={`${cardHeader} justify-between flex-wrap gap-3`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                  <ImageIcon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Capturas Realizadas</h3>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {shots.length > 0 ? `${shots.length} frame${shots.length > 1 ? 's' : ''} capturado${shots.length > 1 ? 's' : ''}` : 'Aguardando processamento'}
                  </p>
                </div>
              </div>

              {shots.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedIds(selectedIds.size === shots.length ? new Set() : new Set(shots.map(s => s.id)))}
                    className={btnSecondary}
                  >
                    {selectedIds.size === shots.length ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
                  </button>
                  <button onClick={downloadZip} className={btnPrimary}>
                    <Download className="w-4 h-4" />
                    {selectedIds.size > 0 ? `Baixar (${selectedIds.size})` : 'Baixar ZIP'}
                  </button>
                </div>
              )}
            </div>

            <div className="p-5">
              {shots.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-200">
                    <Layout className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Nenhuma captura disponível</p>
                  <p className="text-[10px] font-black text-gray-300 mt-1">Carregue um vídeo e inicie o processamento</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {shots.map((shot, idx) => (
                    <div
                      key={shot.id}
                      className={`group relative bg-white border rounded-xl overflow-hidden transition-all hover:shadow-md ${
                        selectedIds.has(shot.id)
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-gray-200 hover:border-primary/40'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div
                        onClick={(e) => e.shiftKey ? toggleSelect(shot.id) : setLightboxIndex(idx)}
                        className="aspect-video relative cursor-pointer overflow-hidden bg-black"
                      >
                        <img src={shot.url} alt={shot.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="w-5 h-5 text-white drop-shadow" />
                        </div>
                        {selectedIds.has(shot.id) && (
                          <div className="absolute top-2 left-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Card footer */}
                      <div className="p-2.5 flex items-center justify-between gap-2">
                        <span className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[9px] font-black text-gray-600 uppercase tracking-widest shrink-0">
                          {formatTime(shot.time)}
                        </span>
                        <div className="flex gap-1 ml-auto">
                          <button
                            onClick={() => toggleSelect(shot.id)}
                            title="Selecionar"
                            className={`p-1.5 rounded-lg transition-all ${selectedIds.has(shot.id) ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/10'}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteShot(shot.id)}
                            title="Excluir"
                            className="p-1.5 bg-gray-50 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── LIGHTBOX ── */}
      {lightboxIndex !== null && shots[lightboxIndex] && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/90" onClick={() => setLightboxIndex(null)} />

          <div className="relative w-full max-w-6xl flex flex-col items-center gap-4">
            {/* Close */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-2 right-0 z-10 p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Image */}
            <div className="relative w-full flex items-center justify-center">
              <button
                onClick={() => setLightboxIndex(p => p! > 0 ? p! - 1 : shots.length - 1)}
                className="absolute left-0 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <img
                src={shots[lightboxIndex].url}
                className="max-h-[75vh] max-w-full rounded-xl shadow-2xl"
                alt={shots[lightboxIndex].name}
              />

              <button
                onClick={() => setLightboxIndex(p => p! < shots.length - 1 ? p! + 1 : 0)}
                className="absolute right-0 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Info bar */}
            <div className="flex items-center gap-5 px-6 py-3 bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm">
              <span className="text-sm font-black text-white">
                Frame em {formatTime(shots[lightboxIndex].time)}
              </span>
              <span className="w-px h-4 bg-white/30" />
              <span className="text-xs font-black text-white/60 uppercase tracking-widest">
                {lightboxIndex + 1} / {shots.length}
              </span>
              <span className="w-px h-4 bg-white/30" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest hidden sm:block">
                ← → navegar · Esc fechar
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenshotTool;
