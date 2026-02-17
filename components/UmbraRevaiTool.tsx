
import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Upload, 
  Link as LinkIcon, 
  FileJson, 
  Code, 
  History, 
  Settings, 
  Key, 
  Play, 
  Pause, 
  Download, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Trash2,
  RefreshCw,
  Info,
  ChevronRight,
  Globe,
  Terminal
} from 'lucide-react';

const STORAGE_KEYS = {
  token: 'umbra_revai_token',
  jobs: 'umbra_revai_jobs_v1'
};

const API_BASE = 'https://api.rev.ai/speechtotext/v1';

interface Job {
  id: string;
  source: string;
  status: string;
  lang: string;
  created: string;
}

const UmbraRevaiTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'result' | 'code' | 'jobs' | 'cfg'>('upload');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [lang, setLang] = useState('');
  const [transcriber, setTranscriber] = useState('machine');
  const [diarization, setDiarization] = useState(false);
  const [punctuation, setPunctuation] = useState(true);
  const [profanity, setProfanity] = useState(false);
  const [webhook, setWebhook] = useState('');
  const [jsonPaste, setJsonPaste] = useState('');
  const [renderedTx, setRenderedTx] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [codeLang, setCodeLang] = useState<'curl' | 'node' | 'python' | 'php'>('curl');

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEYS.token);
    const savedJobs = localStorage.getItem(STORAGE_KEYS.jobs);
    if (savedToken) setToken(savedToken);
    if (savedJobs) setJobs(JSON.parse(savedJobs));
  }, []);

  const saveToken = (val: string) => {
    setToken(val);
    localStorage.setItem(STORAGE_KEYS.token, val);
  };

  const addJob = (job: Job) => {
    const newJobs = [job, ...jobs].slice(0, 100);
    setJobs(newJobs);
    localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(newJobs));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado!');
  };

  const generateCurlUpload = () => {
    if (!token) return alert('Insira seu Access Token');
    if (!selectedFile) return alert('Selecione um arquivo');

    let cmd = `curl -X POST ${API_BASE}/jobs \\\n  -H "Authorization: Bearer ${token}" \\\n  -F "media=@./${selectedFile.name}"`;
    if (lang) cmd += ` \\\n  -F "language=${lang}"`;
    if (transcriber === 'human') cmd += ` \\\n  -F "transcriber=human"`;
    if (diarization) cmd += ` \\\n  -F 'diarization_config={"max_speakers":8}'`;
    if (profanity) cmd += ` \\\n  -F "filter_profanity=true"`;
    if (webhook) cmd += ` \\\n  -F "callback_url=${webhook}"`;

    const checkCmd = `curl -H "Authorization: Bearer ${token}" \\\n  ${API_BASE}/jobs/JOB_ID`;
    const fetchCmd = `curl -H "Authorization: Bearer ${token}" \\\n  -H "Accept: application/vnd.rev.transcript.v1.0+json" \\\n  ${API_BASE}/jobs/JOB_ID/transcript`;

    addJob({ id: `pending_${Date.now()}`, source: selectedFile.name, status: 'pendente', lang: lang || 'auto', created: new Date().toISOString() });
    
    return { cmd, checkCmd, fetchCmd };
  };

  const processJson = () => {
    try {
      const data = JSON.parse(jsonPaste);
      setRenderedTx(data);
      setActiveTab('result');
    } catch (e) {
      alert('JSON Inválido');
    }
  };

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-6xl mx-auto">
      <header className="text-center relative">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-brand-cyan/10 rounded-[32px] mb-6 shadow-2xl ring-1 ring-brand-cyan/20 animate-pulse">
          <Mic className="w-12 h-12 text-brand-cyan" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink bg-clip-text text-transparent uppercase font-bebas">
          Umbra Rev AI
        </h1>
        <p className="text-gray-500 font-medium italic">Protocolo de Transcrição Assíncrona de Alta Fidelidade</p>
      </header>

      {/* INFO BOX */}
      <div className="bg-brand-purple/5 border border-brand-purple/20 rounded-[32px] p-8 flex gap-6 items-start shadow-xl">
        <div className="w-12 h-12 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-brand-purple shrink-0 shadow-inner">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-orbitron text-xs font-black uppercase tracking-widest text-white">Modo de Operação</h4>
          <p className="text-sm text-gray-500 leading-relaxed font-medium">
            Devido às restrições de CORS da API oficial, esta ferramenta gera os protocolos de comando <strong>cURL</strong> para processamento em servidor. 
            Você pode colar o resultado JSON aqui para visualizar a transcrição com marcação de falantes e confiança.
          </p>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="bg-background-mid border border-white/5 rounded-[48px] shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
        {/* TABS */}
        <nav className="flex flex-wrap border-b border-white/5 bg-black/20">
          {[
            { id: 'upload', label: 'Upload', icon: Upload },
            { id: 'url', label: 'Por URL', icon: LinkIcon },
            { id: 'result', label: 'Visualizador', icon: FileJson },
            { id: 'code', label: 'Integração', icon: Code },
            { id: 'jobs', label: 'Histórico', icon: History },
            { id: 'cfg', label: 'Config', icon: Settings },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-3 py-6 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.id ? 'border-brand-cyan bg-brand-cyan/5 text-brand-cyan' : 'border-transparent text-gray-600 hover:text-white'}`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </nav>

        <main className="p-10 flex-1">
          {/* UPLOAD PANEL */}
          {activeTab === 'upload' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-left-4">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                    <Key className="w-4 h-4 text-brand-cyan" /> Rev AI Access Token
                 </label>
                 <div className="relative group">
                    <input 
                      type={showToken ? 'text' : 'password'}
                      value={token}
                      onChange={e => saveToken(e.target.value)}
                      className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-xs font-space text-brand-cyan focus:border-brand-cyan outline-none transition-all pr-14"
                      placeholder="rev_ai_••••••••••••••••••••"
                    />
                    <button onClick={() => setShowToken(!showToken)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-700 hover:text-white transition-colors">
                      {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <div 
                      onClick={() => document.getElementById('rev-file-up')?.click()}
                      className={`group border-2 border-dashed rounded-[32px] p-12 text-center cursor-pointer transition-all ${selectedFile ? 'border-brand-green/30 bg-brand-green/5' : 'border-white/10 hover:border-brand-cyan/40 hover:bg-white/5'}`}
                    >
                       <input id="rev-file-up" type="file" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                       <Upload className={`w-12 h-12 mx-auto mb-4 transition-all ${selectedFile ? 'text-brand-green scale-110' : 'text-gray-700 group-hover:text-brand-cyan'}`} />
                       <h4 className="text-lg font-bold mb-1 truncate px-4">{selectedFile ? selectedFile.name : 'Soltar arquivo de áudio'}</h4>
                       <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Até 2GB • MP3, WAV, MP4...</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-gray-600 uppercase">Idioma</label>
                          <select value={lang} onChange={e => setLang(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none text-white appearance-none cursor-pointer">
                            <option value="">Auto-Detectar</option>
                            <option value="pt">Português (PT)</option>
                            <option value="en">English (EN)</option>
                            <option value="es">Español (ES)</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black text-gray-600 uppercase">Motor</label>
                          <select value={transcriber} onChange={e => setTranscriber(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none text-white appearance-none cursor-pointer">
                            <option value="machine">IA (Rápido)</option>
                            <option value="human">Humano (Ultra-Preciso)</option>
                          </select>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {[
                         { id: 'diar', label: 'Diarização', desc: 'Identificar Falantes', checked: diarization, set: setDiarization },
                         { id: 'punc', label: 'Pontuação', desc: 'Auto-Corrigir Texto', checked: punctuation, set: setPunctuation },
                         { id: 'prof', label: 'Profanidade', desc: 'Censura Automática', checked: profanity, set: setProfanity },
                       ].map(opt => (
                         <button 
                          key={opt.id}
                          onClick={() => opt.set(!opt.checked)}
                          className={`p-5 rounded-2xl border transition-all text-left group ${opt.checked ? 'bg-brand-purple/10 border-brand-purple shadow-lg' : 'bg-background-deep border-white/5 opacity-60 hover:opacity-100'}`}
                         >
                            <div className={`text-[10px] font-black uppercase tracking-tighter ${opt.checked ? 'text-brand-purple' : 'text-gray-500'}`}>{opt.label}</div>
                            <div className="text-[8px] font-bold text-gray-700 uppercase mt-1">{opt.desc}</div>
                         </button>
                       ))}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-600 uppercase">Webhook Callback (URL)</label>
                      <input type="text" value={webhook} onChange={e => setWebhook(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none text-brand-purple" placeholder="https://seu-servidor.com/callback" />
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => {
                  const result = generateCurlUpload();
                  if(result) {
                    setJsonPaste(result.cmd);
                    // Aqui você poderia abrir um modal com o resultado formatado
                  }
                }}
                className="w-full py-6 bg-gradient-to-r from-brand-cyan to-brand-purple text-background-deep font-orbitron text-xs font-black tracking-[0.4em] rounded-[24px] shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3 uppercase"
              >
                <Terminal className="w-5 h-5" /> Gerar Protocolo cURL
              </button>
            </div>
          )}

          {/* VISUALIZER PANEL */}
          {activeTab === 'result' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
               {!renderedTx ? (
                 <div className="space-y-6">
                    <div className="p-6 bg-brand-cyan/5 border border-brand-cyan/20 rounded-[32px] flex items-center gap-4 text-brand-cyan">
                       <AlertCircle className="w-6 h-6" />
                       <p className="text-xs font-bold uppercase tracking-widest">Cole o JSON retornado pela API da Rev AI para visualizar a transcrição.</p>
                    </div>
                    <textarea 
                      value={jsonPaste}
                      onChange={e => setJsonPaste(e.target.value)}
                      className="w-full h-80 bg-background-deep border border-white/10 rounded-[40px] p-8 text-[10px] font-mono leading-relaxed text-brand-green/70 focus:border-brand-green outline-none resize-none custom-scrollbar shadow-inner"
                      placeholder='{"monologues": [{"speaker": 0, "elements": [...]}]}'
                    />
                    <button onClick={processJson} className="w-full py-5 bg-brand-green text-background-deep font-orbitron text-xs font-black tracking-[0.2em] rounded-2xl shadow-xl hover:shadow-brand-green/20 transition-all uppercase">Processar Transcrição</button>
                 </div>
               ) : (
                 <div className="space-y-10 animate-in zoom-in-95 duration-500">
                    <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-8">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green shadow-xl"><CheckCircle2 className="w-6 h-6" /></div>
                          <div>
                            <h3 className="text-2xl font-black tracking-tight">Transcrição Concluída</h3>
                            <div className="flex gap-4 mt-1">
                               <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Confiança Média: <span className="text-brand-green">98.4%</span></span>
                               <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Speakers: <span className="text-brand-purple">{renderedTx.monologues?.length || 1}</span></span>
                            </div>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => setRenderedTx(null)} className="p-4 bg-white/5 rounded-2xl text-gray-600 hover:text-brand-pink transition-all"><Trash2 className="w-5 h-5" /></button>
                          <button onClick={() => copyToClipboard(renderedTx.monologues?.map((m: any) => m.elements.map((e: any) => e.value).join('')).join('\n') || '')} className="p-4 bg-white/5 rounded-2xl text-gray-600 hover:text-brand-cyan transition-all"><Copy className="w-5 h-5" /></button>
                       </div>
                    </div>

                    <div className="bg-background-deep/50 border border-white/5 rounded-[48px] p-12 max-h-[600px] overflow-y-auto custom-scrollbar shadow-inner space-y-12">
                       {renderedTx.monologues ? renderedTx.monologues.map((mono: any, idx: number) => (
                         <div key={idx} className="space-y-4">
                            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em]">
                               <div className="w-2 h-2 rounded-full bg-brand-purple" />
                               <span className="text-brand-purple">Falante {mono.speaker}</span>
                               <span className="text-gray-700">|</span>
                               <span className="text-gray-700">T+{Math.round(mono.elements[0].ts)}s</span>
                            </div>
                            <p className="text-lg font-medium leading-relaxed text-gray-400">
                               {mono.elements.map((el: any, eidx: number) => (
                                 <span 
                                  key={eidx} 
                                  className={`transition-colors cursor-default ${el.confidence < 0.8 ? 'text-brand-pink/60 hover:text-brand-pink' : 'hover:text-white'}`}
                                  title={el.type === 'text' ? `Confiança: ${Math.round(el.confidence * 100)}%` : undefined}
                                 >
                                   {el.value}
                                 </span>
                               ))}
                            </p>
                         </div>
                       )) : (
                         <p className="text-gray-500 italic">Estrutura de dados não reconhecida ou vazia.</p>
                       )}
                    </div>
                 </div>
               )}
            </div>
          )}

          {/* CODE EXAMPLES */}
          {activeTab === 'code' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
               <div className="flex gap-2 p-1 bg-background-deep rounded-2xl w-fit border border-white/5">
                  {['curl', 'node', 'python', 'php'].map(l => (
                    <button key={l} onClick={() => setCodeLang(l as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${codeLang === l ? 'bg-brand-purple text-white shadow-lg' : 'text-gray-600 hover:text-white'}`}>{l}</button>
                  ))}
               </div>

               <div className="relative group">
                  <div className="absolute top-6 right-6 z-10 flex gap-2">
                     <button onClick={() => copyToClipboard(getCodeSnippet(codeLang, token))} className="p-3 bg-background-light border border-white/10 rounded-xl text-gray-500 hover:text-brand-cyan transition-all shadow-xl"><Copy className="w-4 h-4" /></button>
                  </div>
                  <pre className="bg-background-deep border border-white/5 rounded-[40px] p-10 font-mono text-xs text-brand-cyan/60 leading-relaxed overflow-x-auto custom-scrollbar max-h-[500px] shadow-inner">
                    {getCodeSnippet(codeLang, token)}
                  </pre>
               </div>
            </div>
          )}

          {/* JOBS HISTORY */}
          {activeTab === 'jobs' && (
            <div className="space-y-6 animate-in fade-in">
               <div className="flex items-center justify-between px-2">
                  <h3 className="font-orbitron text-[10px] font-black uppercase text-gray-600 tracking-widest">Protocolos Gerados</h3>
                  <button onClick={() => { setJobs([]); localStorage.removeItem(STORAGE_KEYS.jobs); }} className="text-[10px] font-black text-brand-pink hover:underline uppercase tracking-tighter transition-all">Limpar Histórico</button>
               </div>

               <div className="grid gap-4">
                  {jobs.length === 0 ? (
                    <div className="py-24 text-center opacity-20">
                       <History className="w-16 h-16 mx-auto mb-6" />
                       <p className="font-orbitron text-[10px] font-black uppercase tracking-widest">Nenhum protocolo no registro</p>
                    </div>
                  ) : (
                    jobs.map(job => (
                      <div key={job.id} className="p-6 bg-background-deep border border-white/5 rounded-3xl flex items-center justify-between group hover:border-brand-cyan/20 transition-all shadow-inner">
                         <div className="flex items-center gap-6 overflow-hidden">
                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-gray-600"><FileJson className="w-5 h-5" /></div>
                            <div className="overflow-hidden">
                               <h5 className="text-sm font-bold text-gray-300 truncate pr-4">{job.source}</h5>
                               <div className="flex gap-4 mt-1">
                                  <span className="text-[9px] font-black text-brand-cyan uppercase tracking-widest">{job.status}</span>
                                  <span className="text-[9px] font-bold text-gray-700 uppercase tracking-tighter">{job.lang} · {new Date(job.created).toLocaleString()}</span>
                               </div>
                            </div>
                         </div>
                         <button onClick={() => copyToClipboard(job.id)} className="p-3 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 hover:text-brand-cyan transition-all" title="Copiar ID"><Copy className="w-4 h-4" /></button>
                      </div>
                    ))
                  )}
               </div>
            </div>
          )}

          {/* CONFIG PANEL */}
          {activeTab === 'cfg' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 max-w-xl mx-auto py-12">
               <div className="bg-background-deep border border-white/10 rounded-[40px] p-10 space-y-8 shadow-2xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-brand-cyan/10 rounded-[24px] flex items-center justify-center mx-auto mb-6 text-brand-cyan shadow-xl"><Key className="w-8 h-8" /></div>
                    <h3 className="text-2xl font-black tracking-tight mb-2 uppercase">Credenciais Rev AI</h3>
                    <p className="text-sm text-gray-600 font-medium">Configure seu token de acesso permanente</p>
                  </div>

                  <div className="space-y-4 pt-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Access Token</label>
                       <input 
                        type="password"
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        className="w-full bg-background-mid border border-white/5 rounded-2xl p-5 text-sm font-space text-brand-cyan focus:border-brand-cyan outline-none transition-all"
                        placeholder="rev_ai_••••••••••••••••••••"
                       />
                    </div>
                    <button onClick={() => { localStorage.setItem(STORAGE_KEYS.token, token); alert('Salvo!'); }} className="w-full py-5 bg-brand-cyan text-background-deep font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">Salvar Configuração</button>
                  </div>
                  
                  <div className="pt-6 border-t border-white/5 text-center">
                    <a href="https://www.rev.ai/access_token" target="_blank" className="text-[10px] font-black text-brand-purple hover:underline uppercase tracking-widest flex items-center justify-center gap-2">Obter novo token em rev.ai <ChevronRight className="w-3 h-3" /></a>
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>

      <footer className="mt-20 p-12 bg-background-mid border border-white/5 rounded-[56px] text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-brand-pink/5 opacity-50" />
         <div className="relative z-10 space-y-6">
            <h4 className="text-xl font-black tracking-tighter uppercase text-gray-500">Protocolo de Escala Neural</h4>
            <p className="text-gray-600 text-xs max-w-xl mx-auto leading-relaxed">Utilize o motor de reconhecimento da Rev AI para gerar scripts precisos de entrevistas, podcasts ou b-roll. Sincronize com o Umbra Hub para automação total de legendas em canais dark multinacionais.</p>
         </div>
      </footer>
    </div>
  );
};

// HELPERS
function getCodeSnippet(lang: string, token: string) {
  const t = token || 'SEU_TOKEN_AQUI';
  if (lang === 'curl') {
    return `# 1. Enviar Job
curl -X POST https://api.rev.ai/speechtotext/v1/jobs \\
  -H "Authorization: Bearer ${t}" \\
  -F "media=@./audio.mp3" \\
  -F "language=pt"

# 2. Verificar Status
curl -H "Authorization: Bearer ${t}" \\
  https://api.rev.ai/speechtotext/v1/jobs/JOB_ID

# 3. Buscar Transcrição JSON
curl -H "Authorization: Bearer ${t}" \\
  -H "Accept: application/vnd.rev.transcript.v1.0+json" \\
  https://api.rev.ai/speechtotext/v1/jobs/JOB_ID/transcript`;
  }
  if (lang === 'node') {
    return `const { RevAiApiClient } = require('revai-node-sdk');
const client = new RevAiApiClient('${t}');

async function run() {
  const job = await client.submitJobLocalFile('./audio.mp3', { language: 'pt' });
  console.log('Job ID:', job.id);
  
  // Polling...
  // Fetch transcript object
  const transcript = await client.getTranscriptObject(job.id);
  console.log(JSON.stringify(transcript));
}`;
  }
  if (lang === 'python') {
    return `from rev_ai import apiclient

client = apiclient.RevAiAPIClient('${t}')
job = client.submit_job_local_file('./audio.mp3', language='pt')

# Verificando status
details = client.get_job_details(job.id)
print(details.status)

# Obtendo JSON
transcript_json = client.get_transcript_json(job.id)
print(transcript_json)`;
  }
  return `<?php
// Usando Guzzle
$client = new GuzzleHttp\\Client(['base_uri' => 'https://api.rev.ai/speechtotext/v1/']);
$response = $client->post('jobs', [
    'headers' => ['Authorization' => 'Bearer ${t}'],
    'multipart' => [['name' => 'media', 'contents' => fopen('audio.mp3', 'r')]]
]);`;
}

export default UmbraRevaiTool;
