import React, { useState, useRef } from 'react';
import { LogEntry } from '../types';
import { transcribeAudioStream } from '../services/geminiService';
import { Upload, Copy, Download, Zap, Terminal, Send, ChevronDown, Check } from 'lucide-react';
import { trackTranscriptionCompleted } from '../services/analytics';

const CANAIS_KEY = 'umbra_hub_meus_canais_v5';

interface Channel { id: string; name: string; color: string; scripts: ScriptItem[]; }
interface ScriptItem { id: string; name: string; size: string; content: string; createdAt: number; }

const UmbraConnectTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([
    { message: 'Umbra Connect pronto para uso', type: 'info', timestamp: new Date() }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState('');
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const [sentToChannel, setSentToChannel] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const audio = new Audio();
      const reader = new FileReader();
      reader.onload = (event) => {
        audio.src = event.target?.result as string;
        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
          setFile(selected);
          addLog(`Arquivo: ${selected.name}`, 'success');
        };
      };
      reader.readAsDataURL(selected);
    }
  };

  const handleSync = async () => {
    if (!file) return;
    setIsProcessing(true);
    setResult('');
    setSentToChannel(null);
    setProgress(5);
    addLog('Conectando com Umbra IA Cloud...');
    try {
      const stream = transcribeAudioStream(file, duration);
      let fullText = '';
      for await (const chunk of stream) {
        if (progress < 95) setProgress(p => p + 2);
        fullText += chunk;
        setResult(fullText);
      }
      setProgress(100);
      trackTranscriptionCompleted(parseFloat((file.size / 1024 / 1024).toFixed(2)));
      addLog('Transcrição concluída!', 'success');
    } catch (error) {
      addLog('Erro: ' + (error instanceof Error ? error.message : 'Falha na rede'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    addLog('Copiado para a área de transferência!', 'success');
  };

  const downloadTxt = () => {
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.split('.')[0]}_umbra_connect.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Lê canais do localStorage e salva transcrição como script
  const getChannels = (): Channel[] => {
    try {
      const raw = localStorage.getItem(CANAIS_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return (data.channels ?? []) as Channel[];
    } catch { return []; }
  };

  const sendToChannel = (channel: Channel) => {
    try {
      const raw = localStorage.getItem(CANAIS_KEY);
      const data = raw ? JSON.parse(raw) : { folders: [], channels: [] };
      const newScript: ScriptItem = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        name: `Transcrição — ${file?.name ?? 'audio'} — ${new Date().toLocaleDateString('pt-BR')}`,
        size: `${(new TextEncoder().encode(result).length / 1024).toFixed(1)} KB`,
        content: result,
        createdAt: Date.now(),
      };
      data.channels = (data.channels as Channel[]).map((ch: Channel) =>
        ch.id === channel.id
          ? { ...ch, scripts: [...(ch.scripts ?? []), newScript], updatedAt: Date.now() }
          : ch
      );
      localStorage.setItem(CANAIS_KEY, JSON.stringify(data));
      setSentToChannel(channel.name);
      setShowChannelPicker(false);
      addLog(`Roteiro salvo em "${channel.name}"!`, 'success');
    } catch {
      addLog('Erro ao salvar em Meus Canais.', 'error');
    }
  };

  const channels = getChannels();

  return (
    <div className="space-y-4 animate-in fade-in duration-300">

      {/* ── UPLOAD + LOG ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* File Upload Card */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <Upload className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Arquivo de Áudio</h3>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">MP3, WAV, M4A</p>
            </div>
          </div>
          <div className="p-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                file ? 'border-primary/40 bg-primary/5' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50'
              }`}
            >
              <Upload className={`w-8 h-8 mx-auto mb-3 ${file ? 'text-primary' : 'text-gray-400'}`} />
              <p className="text-sm font-black text-gray-900">
                {file ? file.name : 'Clique para selecionar'}
              </p>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Formatos de áudio suportados'}
              </p>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
          </div>
        </div>

        {/* Log Terminal Card */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <Terminal className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Relatório Umbra</h3>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Log de operações</p>
            </div>
          </div>
          <div className="p-4">
            <div className="bg-gray-900 rounded-xl p-3 h-[130px] overflow-y-auto font-mono text-[10px] leading-relaxed">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`mb-1 flex items-start gap-2 ${
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'error'   ? 'text-red-400'   :
                    'text-gray-400'
                  }`}
                >
                  <span className="text-gray-600 shrink-0">[{log.timestamp.toLocaleTimeString()}]</span>
                  <span>{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ACTION BUTTON ── */}
      <button
        disabled={!file || isProcessing}
        onClick={handleSync}
        className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" /> Iniciar Transcrição
          </>
        )}
      </button>

      {/* ── PROGRESS + RESULT ── */}
      {(isProcessing || result) && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900">Resultado da Transcrição</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Umbra IA Cloud</p>
              </div>
            </div>
            <span className={`text-sm font-black ${progress === 100 ? 'text-green-600' : 'text-primary'}`}>
              {progress === 100 ? 'Finalizado!' : `${progress}%`}
            </span>
          </div>

          <div className="p-6 space-y-4">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="bg-gray-900 rounded-xl p-5 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-[13px] text-gray-300 leading-relaxed font-mono">
                {result || 'Estabelecendo conexão...'}
              </pre>
            </div>

            {result && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 min-w-[120px] py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" /> Copiar Texto
                </button>
                <button
                  onClick={downloadTxt}
                  className="flex-1 min-w-[120px] py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Baixar TXT
                </button>

                {/* ── ENVIAR PARA MEUS CANAIS ── */}
                <div className="relative flex-1 min-w-[160px]">
                  {sentToChannel ? (
                    <div className="w-full py-3 bg-green-50 border border-green-200 rounded-xl text-xs font-black uppercase tracking-widest text-green-700 flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" /> Salvo em "{sentToChannel}"
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowChannelPicker(v => !v)}
                      className="w-full py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Enviar para Canais
                      <ChevronDown className={`w-3 h-3 transition-transform ${showChannelPicker ? 'rotate-180' : ''}`} />
                    </button>
                  )}

                  {showChannelPicker && !sentToChannel && (
                    <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                      {channels.length === 0 ? (
                        <div className="px-4 py-4 text-xs font-black text-gray-500 text-center">
                          Nenhum canal em Meus Canais.<br />Crie um canal primeiro.
                        </div>
                      ) : (
                        channels.filter(ch => !(ch as unknown as { archived: boolean }).archived).map(ch => (
                          <button
                            key={ch.id}
                            onClick={() => sendToChannel(ch)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-black text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            <div className="w-6 h-6 rounded-lg shrink-0" style={{ background: ch.color }} />
                            {ch.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UmbraConnectTool;
