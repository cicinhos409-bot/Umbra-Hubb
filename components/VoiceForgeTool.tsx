
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Settings, 
  Play, 
  Download, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  AudioLines, 
  Layers, 
  Zap, 
  History, 
  Volume2, 
  User, 
  Key,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';

const STORAGE_KEYS = {
  elevenlabs: 'umbra_voice_elevenlabs_key',
  playht_key: 'umbra_voice_playht_key',
  playht_user: 'umbra_voice_playht_user',
  stats: 'umbra_voice_stats_v1',
  history: 'umbra_voice_history_v1'
};

const ELEVENLABS_VOICES = [
  { value: 'JBFqnCBsd6RMkjVDRZzb', label: 'George (Masculina) - Narrativa' },
  { value: '21m00Tcm4TlvDq8ikWAM', label: 'Rachel (Feminina) - Natural' },
  { value: 'AZnzlk1XvdvUeBnXmlld', label: 'Domi (Feminina) - Jovem' },
  { value: 'EXAVITQu4vr4xnSDxMaL', label: 'Bella (Feminina) - Suave' },
  { value: 'ErXwobaYiN019PkySvjV', label: 'Antoni (Masculina) - Profunda' },
  { value: 'MF3mGyEYCl7XYWbV9V6O', label: 'Elli (Feminina) - Doce' },
  { value: 'TxGEqnHWrfWFTfGW9XjX', label: 'Josh (Masculina) - Jovem' },
  { value: 'VR6AewLTigWG4xSOukaG', label: 'Arnold (Masculina) - Forte' },
  { value: 'pNInz6obpgDQGcFmaJgB', label: 'Adam (Masculina) - Narrativa' },
  { value: 'yoZ06aMxZJJ28mfd3POQ', label: 'Sam (Masculina) - Dinâmica' },
];

const PLAYHT_VOICES = [
  { value: 's3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json', label: 'Charlotte (Feminina)' },
  { value: 's3://voice-cloning-zero-shot/775ae416-49bb-4fb6-bd45-740f205d20a1/jennifersaad/manifest.json', label: 'Jennifer (Feminina)' },
  { value: 's3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json', label: 'Matthew (Masculina)' },
  { value: 's3://voice-cloning-zero-shot/e040bd1b-f190-4bdb-83f0-75ef85b18f84/original/manifest.json', label: 'Will (Masculina)' },
];

interface HistoryItem {
  id: string;
  text: string;
  timestamp: string;
  characters: number;
  provider: string;
  audioUrl: string;
}

const VoiceForgeTool: React.FC = () => {
  const [provider, setProvider] = useState<'elevenlabs' | 'playht'>('elevenlabs');
  const [elevenKey, setElevenKey] = useState('');
  const [playhtKey, setPlayhtKey] = useState('');
  const [playhtUser, setPlayhtUser] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(ELEVENLABS_VOICES[0].value);
  const [modelId, setModelId] = useState('eleven_turbo_v2_5');
  const [textInput, setTextInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<{ type: 'loading' | 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState({ generations: 0, characters: 0, lastCost: 0 });
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Voice Settings
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [style, setStyle] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const ek = localStorage.getItem(STORAGE_KEYS.elevenlabs);
    const pk = localStorage.getItem(STORAGE_KEYS.playht_key);
    const pu = localStorage.getItem(STORAGE_KEYS.playht_user);
    const s = localStorage.getItem(STORAGE_KEYS.stats);
    const h = localStorage.getItem(STORAGE_KEYS.history);

    if (ek) setElevenKey(ek);
    if (pk) setPlayhtKey(pk);
    if (pu) setPlayhtUser(pu);
    if (s) setStats(JSON.parse(s));
    if (h) setHistory(JSON.parse(h));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  }, [history]);

  const showStatus = (message: string, type: 'loading' | 'success' | 'error' | null = 'success') => {
    setStatus({ message, type });
    if (type !== 'loading') setTimeout(() => setStatus({ type: null, message: '' }), 5000);
  };

  const handleGenerate = async () => {
    if (!textInput.trim()) return showStatus('Digite o texto para converter', 'error');

    if (provider === 'elevenlabs') {
      if (!elevenKey) return showStatus('Configure sua ElevenLabs API Key', 'error');
      await generateElevenLabs();
    } else {
      if (!playhtKey || !playhtUser) return showStatus('Configure suas credenciais Play.ht', 'error');
      await generatePlayHT();
    }
  };

  const generateElevenLabs = async () => {
    setIsGenerating(true);
    showStatus('🎙️ Forjando voz ElevenLabs...', 'loading');
    
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenKey
        },
        body: JSON.stringify({
          text: textInput,
          model_id: modelId,
          voice_settings: { stability, similarity_boost: similarity, style }
        })
      });

      if (!response.ok) throw new Error('Falha na API ElevenLabs');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const charCount = parseInt(response.headers.get('x-character-count') || String(textInput.length));

      setAudioUrl(url);
      setStats(prev => ({ 
        generations: prev.generations + 1, 
        characters: prev.characters + charCount,
        lastCost: charCount
      }));

      addToHistory(textInput, url, charCount, 'ElevenLabs');
      showStatus('✅ Áudio forjado com sucesso!');
      setTimeout(() => audioRef.current?.play(), 300);
    } catch (err: any) {
      showStatus(`❌ Erro: ${err.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePlayHT = async () => {
    setIsGenerating(true);
    showStatus('🎙️ Forjando voz Play.ht...', 'loading');
    
    try {
      const res = await fetch('https://api.play.ht/api/v2/tts', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'AUTHORIZATION': playhtKey,
          'X-USER-ID': playhtUser
        },
        body: JSON.stringify({
          text: textInput,
          voice: selectedVoice,
          quality: 'premium',
          output_format: 'mp3'
        })
      });

      if (!res.ok) throw new Error('Erro ao iniciar job no Play.ht');
      const data = await res.json();
      const jobId = data.id;

      // Polling
      let audioBlob: Blob | null = null;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 1500));
        const statusRes = await fetch(`https://api.play.ht/api/v2/tts/${jobId}`, {
          headers: { 'AUTHORIZATION': playhtKey, 'X-USER-ID': playhtUser }
        });
        const statusData = await statusRes.json();
        if (statusData.output?.url) {
          const audioRes = await fetch(statusData.output.url);
          audioBlob = await audioRes.blob();
          break;
        }
      }

      if (!audioBlob) throw new Error('Timeout ao gerar áudio');

      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setStats(prev => ({ 
        generations: prev.generations + 1, 
        characters: prev.characters + textInput.length,
        lastCost: textInput.length
      }));
      addToHistory(textInput, url, textInput.length, 'Play.ht');
      showStatus('✅ Áudio forjado com sucesso!');
      setTimeout(() => audioRef.current?.play(), 300);
    } catch (err: any) {
      showStatus(`❌ Erro: ${err.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const addToHistory = (text: string, url: string, chars: number, prov: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      text: text.substring(0, 80) + (text.length > 80 ? '...' : ''),
      timestamp: new Date().toLocaleTimeString(),
      characters: chars,
      provider: prov,
      audioUrl: url
    };
    setHistory(prev => [newItem, ...prev.slice(0, 9)]);
  };

  const saveApiKey = (key: string, val: string) => {
    localStorage.setItem(key, val);
    showStatus('✅ Chave salva!');
  };

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      <header className="text-center relative">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-brand-cyan/10 rounded-[32px] mb-6 shadow-2xl ring-1 ring-brand-cyan/20 animate-pulse">
          <Mic className="w-12 h-12 text-brand-cyan" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink bg-clip-text text-transparent uppercase font-bebas">
          Umbra Voice Forge
        </h1>
        <p className="text-gray-500 font-medium">Text-to-Speech Intelligent Hub • ElevenLabs & Play.ht</p>
      </header>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Gerações Totais', val: stats.generations, icon: Zap, color: 'text-brand-purple' },
          { label: 'Caracteres Processados', val: stats.characters.toLocaleString(), icon: AudioLines, color: 'text-brand-cyan' },
          { label: 'Último Custo (chars)', val: stats.lastCost, icon: Layers, color: 'text-brand-pink' },
        ].map((s, i) => (
          <div key={i} className="bg-background-mid border border-white/5 rounded-[32px] p-8 text-center shadow-xl hover:border-white/10 transition-all flex flex-col items-center">
            <s.icon className={`w-6 h-6 mb-4 ${s.color}`} />
            <div className={`text-4xl font-bebas tracking-widest mb-1 ${s.color}`}>{s.val}</div>
            <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: CONFIG */}
        <div className="space-y-8">
          <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-8 relative overflow-hidden backdrop-blur-xl">
             <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/5 blur-[100px] -z-10" />
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-brand-purple" />
                  <h3 className="font-orbitron text-xs font-black uppercase tracking-widest text-white">Configuração do Motor</h3>
                </div>
                <div className="flex gap-1 bg-background-deep p-1 rounded-xl">
                  <button onClick={() => { setProvider('elevenlabs'); setSelectedVoice(ELEVENLABS_VOICES[0].value); }} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${provider === 'elevenlabs' ? 'bg-brand-purple text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>ElevenLabs</button>
                  <button onClick={() => { setProvider('playht'); setSelectedVoice(PLAYHT_VOICES[0].value); }} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${provider === 'playht' ? 'bg-brand-pink text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Play.ht</button>
                </div>
             </div>

             {provider === 'elevenlabs' ? (
               <div className="space-y-6 animate-in fade-in">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">ElevenLabs API Key</label>
                    <input type="password" value={elevenKey} onChange={e => setElevenKey(e.target.value)} onBlur={e => saveApiKey(STORAGE_KEYS.elevenlabs, e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-xs font-space text-brand-cyan focus:border-brand-cyan outline-none" placeholder="sk_..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">Modelo de IA</label>
                    <div className="grid grid-cols-2 gap-3">
                       {[
                         { id: 'eleven_turbo_v2_5', name: 'Turbo v2.5', desc: 'Speed + Quality' },
                         { id: 'eleven_flash_v2_5', name: 'Flash v2.5', desc: 'Ultra Fast' },
                         { id: 'eleven_multilingual_v2', name: 'Multi v2', desc: 'Most Stable' },
                         { id: 'eleven_turbo_v2', name: 'Turbo v2', desc: 'Legacy Fast' },
                       ].map(m => (
                         <button key={m.id} onClick={() => setModelId(m.id)} className={`p-4 rounded-2xl border text-left transition-all ${modelId === m.id ? 'bg-brand-purple/10 border-brand-purple shadow-lg' : 'bg-background-deep border-white/5'}`}>
                            <div className={`text-xs font-black uppercase ${modelId === m.id ? 'text-brand-purple' : 'text-gray-500'}`}>{m.name}</div>
                            <div className="text-[8px] font-bold text-gray-600 uppercase mt-1">{m.desc}</div>
                         </button>
                       ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">Vozes Disponíveis</label>
                    <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-bold appearance-none outline-none cursor-pointer text-white">
                      {ELEVENLABS_VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                    </select>
                  </div>
               </div>
             ) : (
               <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">Play.ht API Key</label>
                      <input type="password" value={playhtKey} onChange={e => setPlayhtKey(e.target.value)} onBlur={e => saveApiKey(STORAGE_KEYS.playht_key, e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-xs font-space text-brand-pink focus:border-brand-pink outline-none" placeholder="Key..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">User ID</label>
                      <input type="text" value={playhtUser} onChange={e => setPlayhtUser(e.target.value)} onBlur={e => saveApiKey(STORAGE_KEYS.playht_user, e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-xs font-space text-brand-pink focus:border-brand-pink outline-none" placeholder="UID..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">Vozes Play.ht</label>
                    <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-bold appearance-none outline-none cursor-pointer text-white">
                      {PLAYHT_VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                    </select>
                  </div>
               </div>
             )}

             <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-all flex items-center justify-center gap-3">
               {showAdvanced ? 'Ocultar Avançado' : 'Configurações Avançadas de Voz'}
             </button>

             {showAdvanced && (
               <div className="space-y-6 pt-4 border-t border-white/5 animate-in slide-in-from-top-2">
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-gray-500">Estabilidade</span>
                      <span className="text-brand-purple">{Math.round(stability * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={stability} onChange={e => setStability(parseFloat(e.target.value))} className="w-full h-1 bg-background-deep rounded-full appearance-none accent-brand-purple" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-gray-500">Claridade / Boost</span>
                      <span className="text-brand-cyan">{Math.round(similarity * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={similarity} onChange={e => setSimilarity(parseFloat(e.target.value))} className="w-full h-1 bg-background-deep rounded-full appearance-none accent-brand-cyan" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-gray-500">Estilo Narrativo</span>
                      <span className="text-brand-pink">{Math.round(style * 100)}%</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={style} onChange={e => setStyle(parseFloat(e.target.value))} className="w-full h-1 bg-background-deep rounded-full appearance-none accent-brand-pink" />
                  </div>
               </div>
             )}
          </section>
        </div>

        {/* RIGHT: INPUT & OUTPUT */}
        <div className="space-y-8">
          <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-8">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-brand-pink" />
                <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Texto para Narração</h3>
              </div>
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{textInput.length} Caracteres</span>
            </div>
            <textarea 
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              className="w-full h-64 bg-background-deep border border-white/10 rounded-[32px] p-8 text-sm font-medium leading-relaxed text-gray-400 focus:border-brand-cyan outline-none resize-none custom-scrollbar shadow-inner" 
              placeholder="Cole o roteiro que deseja converter em voz ultra-realista..." 
            />
            
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-6 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink text-white font-orbitron text-xs font-black tracking-[0.4em] rounded-[24px] shadow-2xl hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-4 disabled:opacity-30 uppercase active:scale-[0.98]"
            >
              {isGenerating ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
              Disparar Forja de Voz
            </button>

            {status.type && (
              <div className={`p-4 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-2 ${status.type === 'loading' ? 'bg-brand-cyan/5 border-brand-cyan/20 text-brand-cyan' : status.type === 'success' ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' : 'bg-brand-pink/10 border-brand-pink/20 text-brand-pink'}`}>
                {status.type === 'loading' ? <RefreshCw className="w-4 h-4 animate-spin" /> : status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span className="text-xs font-bold uppercase tracking-widest">{status.message}</span>
              </div>
            )}
          </section>

          {audioUrl && (
            <div className="bg-background-mid border border-brand-cyan/30 rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden relative group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink opacity-50" />
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <div className="flex-1 w-full space-y-4">
                  <audio ref={audioRef} src={audioUrl} controls className="w-full h-12 filter invert hue-rotate-180 opacity-80 hover:opacity-100 transition-opacity" />
                </div>
                <button 
                  onClick={() => { const a = document.createElement('a'); a.href = audioUrl; a.download = `umbra_voice_${Date.now()}.mp3`; a.click(); }}
                  className="w-full sm:w-auto px-10 py-5 bg-brand-green text-background-deep font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest"
                >
                  <Download className="w-5 h-5" /> Baixar MP3
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HISTORY */}
      <section className="bg-background-mid border border-white/5 rounded-[48px] p-10 shadow-2xl">
         <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
            <div className="flex items-center gap-4">
               <History className="w-8 h-8 text-brand-purple" />
               <h3 className="text-2xl font-black tracking-tight uppercase">Histórico Recente</h3>
            </div>
            <button onClick={() => setHistory([])} className="text-[10px] font-black text-gray-600 hover:text-brand-pink uppercase tracking-widest transition-all">Limpar Tudo</button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {history.length === 0 ? (
              <div className="col-span-full py-20 text-center opacity-20 flex flex-col items-center">
                 <AudioLines className="w-16 h-16 mb-4" />
                 <p className="font-orbitron text-[10px] font-black uppercase tracking-widest">Nenhuma forja recente</p>
              </div>
            ) : (
              history.map(item => (
                <div key={item.id} className="p-6 bg-background-deep border border-white/5 rounded-3xl flex items-center justify-between group hover:border-brand-cyan/20 transition-all shadow-inner">
                   <div className="flex items-center gap-6 overflow-hidden">
                      <button onClick={() => { setAudioUrl(item.audioUrl); setTimeout(() => audioRef.current?.play(), 300); }} className="w-12 h-12 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan group-hover:scale-110 transition-transform"><Play className="w-5 h-5" /></button>
                      <div className="overflow-hidden">
                         <h5 className="text-sm font-bold text-gray-300 truncate pr-4">{item.text}</h5>
                         <div className="flex gap-4 mt-1">
                            <span className="text-[9px] font-black text-brand-purple uppercase">{item.provider}</span>
                            <span className="text-[9px] font-bold text-gray-700 uppercase tracking-tighter">{item.characters} Chars · {item.timestamp}</span>
                         </div>
                      </div>
                   </div>
                   <button onClick={() => setHistory(history.filter(h => h.id !== item.id))} className="p-3 text-gray-800 hover:text-brand-pink transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))
            )}
         </div>
      </section>

      <footer className="mt-20 p-12 bg-background-mid border border-white/5 rounded-[56px] text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-brand-pink/5 opacity-50" />
         <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-white/5 rounded-[24px] flex items-center justify-center mx-auto text-brand-cyan shadow-xl"><ShieldCheck className="w-8 h-8" /></div>
            <h4 className="text-xl font-black tracking-tighter uppercase">Protocolo Voice Forge Pro</h4>
            <p className="text-gray-500 text-xs max-w-xl mx-auto leading-relaxed">Centralizamos o acesso às APIs mais poderosas do mundo para que você crie narrações cinematográficas em segundos. Sem necessidade de plugins pesados — tudo via Cloud Neural Engine.</p>
            <div className="flex justify-center gap-4 flex-wrap">
               <a href="https://elevenlabs.io" target="_blank" className="px-6 py-2 bg-background-deep border border-white/5 rounded-xl text-[10px] font-black text-gray-600 hover:text-brand-purple transition-all uppercase tracking-widest">ElevenLabs Docs</a>
               <a href="https://play.ht" target="_blank" className="px-6 py-2 bg-background-deep border border-white/5 rounded-xl text-[10px] font-black text-gray-600 hover:text-brand-pink transition-all uppercase tracking-widest">Play.ht Studio</a>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default VoiceForgeTool;
