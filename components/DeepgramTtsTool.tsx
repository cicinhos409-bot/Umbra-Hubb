
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Key, 
  Volume2, 
  Trash2, 
  Download, 
  Play, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Settings,
  Eye,
  EyeOff,
  AudioLines
} from 'lucide-react';

const STORAGE_KEY = 'umbra_deepgram_api_key';

const VOICES = [
  { 
    label: '🌟 Aura 2 - English (Premium)',
    options: [
      { value: 'aura-2-thalia-en', label: 'Thalia - Feminino Natural' },
      { value: 'aura-2-odysseus-en', label: 'Odysseus - Masculino Natural' },
      { value: 'aura-2-athena-en', label: 'Athena - Feminino Profissional' },
      { value: 'aura-2-ares-en', label: 'Ares - Masculino Forte' },
      { value: 'aura-2-hera-en', label: 'Hera - Feminino Caloroso' },
      { value: 'aura-2-zeus-en', label: 'Zeus - Masculino Autoritário' },
      { value: 'aura-2-orpheus-en', label: 'Orpheus - Masculino Calmo' },
      { value: 'aura-2-helios-en', label: 'Helios - Masculino Jovem' },
      { value: 'aura-2-persephone-en', label: 'Persephone - Feminino Suave' },
    ]
  },
  {
    label: '🌍 Aura - Multilíngue',
    options: [
      { value: 'aura-asteria-en', label: 'Asteria - English' },
      { value: 'aura-luna-en', label: 'Luna - English' },
      { value: 'aura-stella-en', label: 'Stella - English' },
      { value: 'aura-athena-es', label: 'Athena - Español' },
      { value: 'aura-orpheus-es', label: 'Orpheus - Español' },
      { value: 'aura-angus-en', label: 'Angus - English (Irish)' },
      { value: 'aura-arcas-en', label: 'Arcas - English (American)' },
    ]
  },
  {
    label: '🇧🇷 Português Brasil',
    options: [
      { value: 'aura-hera-pt-br', label: 'Hera - Português BR' },
    ]
  }
];

const DeepgramTtsTool: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [voiceModel, setVoiceModel] = useState('aura-hera-pt-br');
  const [textInput, setTextInput] = useState('Seu resultado laboratorial mostra níveis elevados de colesterol. Recomendo iniciar o tratamento imediatamente.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<{ type: 'loading' | 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleApiKeyBlur = () => {
    if (apiKey.trim()) {
      localStorage.setItem(STORAGE_KEY, apiKey.trim());
    }
  };

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setStatus({ type: 'error', message: '❌ Por favor, insira sua chave API' });
      return;
    }
    if (!textInput.trim()) {
      setStatus({ type: 'error', message: '❌ Por favor, digite algum texto' });
      return;
    }

    setIsGenerating(true);
    setStatus({ type: 'loading', message: 'Sintetizando voz neural...' });
    setAudioUrl(null);
    setAudioBlob(null);

    const cleanText = textInput.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    try {
      const response = await fetch(
        `https://api.deepgram.com/v1/speak?model=${voiceModel}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'text/plain'
          },
          body: cleanText
        }
      );

      if (!response.ok) {
        let msg = `Erro ${response.status}`;
        if (response.status === 401) msg = 'API Key inválida';
        else if (response.status === 400) msg = 'Texto inválido';
        else if (response.status === 403) msg = 'Acesso negado (limite de cota)';
        throw new Error(msg);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      setAudioBlob(blob);
      setAudioUrl(url);
      setStatus({ type: 'success', message: '✅ Áudio gerado com sucesso!' });
      
      setTimeout(() => audioRef.current?.play(), 300);
    } catch (err: any) {
      setStatus({ type: 'error', message: `❌ ${err.message}` });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAudio = () => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `umbra-deepgram-${voiceModel}-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-4xl mx-auto">
      <header className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-cyan/10 rounded-[28px] mb-6 shadow-2xl shadow-brand-cyan/10 ring-1 ring-brand-cyan/20">
          <Mic className="w-10 h-10 text-brand-cyan" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink bg-clip-text text-transparent uppercase">
          Deepgram Tts Dark
        </h1>
        <p className="text-gray-500 font-medium">Sintetizador Neural de Alta Performance</p>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-brand-cyan/30 to-transparent mx-auto mt-6" />
      </header>

      <div className="grid grid-cols-1 gap-8">
        {/* API KEY PANEL */}
        <div className="bg-background-mid border border-white/5 rounded-[32px] p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-5 h-5 text-brand-cyan" />
            <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Chave de Acesso</h3>
          </div>
          <div className="relative group">
            <input 
              type={showApiKey ? 'text' : 'password'} 
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              onBlur={handleApiKeyBlur}
              placeholder="Digite sua Deepgram API Key..."
              className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-space text-brand-cyan focus:border-brand-cyan/40 outline-none transition-all pr-14"
            />
            <button 
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-3 flex items-center gap-2 uppercase font-bold tracking-tighter">
            <Settings className="w-3 h-3" /> Sua chave é salva localmente no navegador
          </p>
        </div>

        {/* CONTROLS PANEL */}
        <div className="bg-background-mid border border-white/5 rounded-[32px] p-8 shadow-xl space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Volume2 className="w-3 h-3" /> Modelo de Voz
              </label>
              <select 
                value={voiceModel}
                onChange={e => setVoiceModel(e.target.value)}
                className="w-full bg-background-light border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:border-brand-purple/50 outline-none appearance-none cursor-pointer"
              >
                {VOICES.map((group, i) => (
                  <optgroup key={i} label={group.label} className="bg-background-mid text-gray-400">
                    {group.options.map(opt => (
                      <option key={opt.value} value={opt.value} className="text-white">{opt.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <AudioLines className="w-3 h-3" /> Info
              </label>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 h-[52px] flex items-center">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Latência estimada: ~250ms</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Volume2 className="w-3 h-3" /> Texto para Narração
              </label>
              <span className={`text-[9px] font-black uppercase tracking-widest ${textInput.length > 5000 ? 'text-brand-pink' : 'text-gray-700'}`}>
                {textInput.length} / 10000 chars
              </span>
            </div>
            <textarea 
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Cole o roteiro que deseja converter em voz ultra-realista..."
              className="w-full h-48 bg-background-deep/50 border border-white/10 rounded-[28px] p-6 text-sm leading-relaxed text-gray-300 focus:border-brand-cyan/40 outline-none resize-none custom-scrollbar"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !textInput.trim()}
              className="py-5 bg-gradient-to-r from-brand-cyan to-brand-purple text-background-deep font-orbitron text-xs font-black tracking-[0.3em] rounded-2xl hover:shadow-[0_0_30px_rgba(0,245,255,0.3)] transition-all disabled:opacity-30 uppercase flex items-center justify-center gap-3 active:scale-95"
            >
              {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              Gerar Áudio Neural
            </button>
            <button 
              onClick={() => { setTextInput(''); setAudioUrl(null); setStatus({type: null, message: ''}); }}
              className="py-5 bg-white/5 border border-white/10 text-gray-500 font-orbitron text-xs font-black tracking-[0.3em] rounded-2xl hover:text-brand-pink hover:bg-brand-pink/10 transition-all uppercase flex items-center justify-center gap-3"
            >
              <Trash2 className="w-5 h-5" /> Limpar
            </button>
          </div>
        </div>

        {/* STATUS BAR */}
        {status.type && (
          <div className={`p-5 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-2 duration-300 ${
            status.type === 'loading' ? 'bg-brand-cyan/5 border-brand-cyan/20 text-brand-cyan' :
            status.type === 'success' ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' :
            'bg-brand-pink/10 border-brand-pink/20 text-brand-pink'
          }`}>
            {status.type === 'loading' ? <RefreshCw className="w-5 h-5 animate-spin" /> : 
             status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-xs font-bold uppercase tracking-widest">{status.message}</span>
          </div>
        )}

        {/* PLAYER PANEL */}
        {audioUrl && (
          <div className="bg-background-mid border border-brand-cyan/30 rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden relative group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink opacity-50" />
            
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 w-full space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">Output Audio Player</span>
                  <span className="text-[9px] font-bold text-gray-600 uppercase">MPEG Layer 3 · 48khz</span>
                </div>
                <audio ref={audioRef} src={audioUrl} controls className="w-full h-12 filter invert hue-rotate-180 opacity-80 hover:opacity-100 transition-opacity" />
              </div>

              <button 
                onClick={downloadAudio}
                className="w-full md:w-auto px-10 py-5 bg-brand-green text-background-deep font-orbitron text-xs font-black tracking-[0.3em] rounded-2xl shadow-xl shadow-brand-green/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase"
              >
                <Download className="w-5 h-5" /> Download MP3
              </button>
            </div>
          </div>
        )}

        <div className="bg-brand-purple/5 border border-brand-purple/10 rounded-[32px] p-8 space-y-4">
          <div className="flex items-center gap-3">
             <AlertCircle className="w-5 h-5 text-brand-purple" />
             <h4 className="font-orbitron text-[10px] font-black uppercase text-white tracking-widest">Protocolo Deepgram</h4>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Esta ferramenta utiliza a API Neural de ultra-baixa latência da Deepgram. Para obter melhores resultados em canais dark, utilize os modelos 
            <span className="text-brand-cyan font-bold mx-1">Aura 2</span> para narradores em inglês ou 
            <span className="text-brand-purple font-bold mx-1">Aura Hera</span> para narradores brasileiros.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeepgramTtsTool;
