
import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Dices, 
  History as HistoryIcon, 
  Settings as SettingsIcon, 
  Palette, 
  Plus, 
  RotateCcw, 
  Copy, 
  Save, 
  MapPin, 
  User, 
  Edit3, 
  Target, 
  Activity,
  Trash2,
  ExternalLink,
  Heart,
  MessageCircle,
  Youtube,
  Zap,
  ChevronRight,
  Maximize2
} from 'lucide-react';

// ========== DATA ==========
const themes = [
  "Arte digital futurista", "Pintura a óleo clássica", "Ilustração minimalista", "Arte surreal", "Arte abstrata",
  "Estilo cyberpunk", "Estilo steampunk", "Arte barroca", "Arte renascentista", "Arte gótica",
  "Arte vaporwave", "Arte glitch", "Arte neon", "Arte low poly", "Arte pixel art",
  "Arte em aquarela", "Sketch a lápis", "Carvão artístico", "Arte pop art", "Arte expressionista",
  "Arte impressionista", "Arte brutalista", "Arte medieval", "Arte tribal", "Arte japonesa tradicional",
  "Arte chinesa tradicional", "Arte africana", "Arte indígena", "Arte islâmica", "Arte art déco",
  "Arte art nouveau", "Arte maximalista", "Arte monocromática", "Arte psicodélica", "Arte retro anos 80",
  "Arte retro anos 90", "Arte futurismo sci-fi", "Arte distópica", "Arte utópica", "Arte conceitual",
  "Hiper-realismo", "Fotorrealismo", "Arte cinematográfica", "Arte noir", "Arte fantasia épica"
];

const locations = [
  "Favela", "Centro urbano", "Periferia", "Bairro nobre", "Zona portuária",
  "Praia", "Montanha", "Floresta", "Deserto", "Campo aberto",
  "Metrô", "Estação de trem", "Aeroporto", "Rodoviária", "Terminal de ônibus",
  "Shopping center", "Mercado municipal", "Feira livre", "Supermercado abandonado", "Loja de conveniência",
  "Estrada de terra", "Rodovia", "Avenida movimentada", "Rua deserta", "Beco escuro",
  "Arranha-céu", "Prédio abandonado", "Casa antiga", "Mansão decadente", "Barraco precário",
  "Ponte", "Viaduto", "Túnel", "Passarela", "Escadaria urbana",
  "Parque", "Praça pública", "Cemitério", "Igreja", "Hospital",
  "Escola abandonada", "Fábrica desativada", "Galpão industrial", "Oficina mecânica", "Posto de gasolina",
  "Bar decadente", "Boate underground", "Restaurante vazio", "Café da esquina", "Lanchonete 24h",
  "Porto", "Cais", "Marina", "Rio poluído", "Lago urbano",
  "Lixão", "Aterro sanitário", "Terreno baldio", "Obra abandonada", "Ruínas urbanas",
  "Estacionamento vazio", "Garagem subterrânea", "Heliponto", "Telhado de prédio", "Cobertura de luxo",
  "Dentro da casa", "Sala de estar", "Cozinha", "Quarto", "Banheiro", "Porão", "Sótão",
  "Apartamento pequeno", "Apartamento luxuoso", "Corredor estreito", "Escritório", "Biblioteca"
];

const protagonists = [
  "Idoso solitário", "Idoso abandonado pela família", "Idoso com segredo do passado", "Idoso ex-militar", "Idoso arrependido",
  "Idosa solitária", "Idosa abandonada pelos filhos", "Idosa guardiã de segredo", "Idosa com passado sombrio", "Idosa religiosa",
  "Homem comum", "Homem trabalhador", "Homem solitário", "Homem viúvo", "Homem com dupla vida",
  "Pai ausente", "Pai solteiro", "Pai superprotetor", "Pai arrependido", "Pai tentando salvar a família",
  "Jovem rebelde", "Jovem idealista", "Jovem perdido", "Jovem revolucionário", "Jovem artista",
  "Criança prodígio", "Criança abandonada", "Criança corajosa", "Criança com segredo", "Criança observadora"
];

const moods = [
  "Melancólico", "Esperançoso", "Sombrio", "Energético", "Nostálgico",
  "Tenso", "Sereno", "Caótico", "Místico", "Dramático",
  "Épico", "Íntimo", "Opressivo", "Libertador", "Misterioso",
  "Violento", "Pacífico", "Inquietante", "Inspirador", "Desesperador"
];

const visualStyles = [
  "Cinematográfico", "Documental", "Música visual", "Surreal onírico", "Realismo cru",
  "Fantasia épica", "Horror atmosférico", "Ficção científica", "Western moderno", "Noir urbano",
  "Anime estilizado", "Stop motion", "Animação 3D", "Estética lo-fi", "Alta moda editorial",
  "Graffiti urbano", "Retro-futurismo", "Biopunk", "Solarpunk", "Dieselpunk"
];

const allStyles = [...new Set([...themes, ...visualStyles])];

interface HistoryItem {
  date: string;
  prompt: string;
  theme: string;
  protagonist: string;
}

const IdeaForgeTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState('generator');
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedProtagonist, setSelectedProtagonist] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  
  const [customTheme, setCustomTheme] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [customProtagonist, setCustomProtagonist] = useState('');
  const [characterDesc, setCharacterDesc] = useState('');
  const [characterShout, setCharacterShout] = useState('');
  
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [promptHistory, setPromptHistory] = useState<HistoryItem[]>([]);
  const [suggestionResult, setSuggestionResult] = useState<string | null>(null);
  
  const [style1, setStyle1] = useState('');
  const [style2, setStyle2] = useState('');
  const [mixedStyle, setMixedStyle] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    characterAge: 70,
    nationality: 'Brazilian',
    sceneLocation: 'favela',
    vehicleType: 'old, noisy motorcycle',
    cameraStyle: 'Front tracking shot, low angle, slightly shaky, realistic movement, no slow motion, no camera cuts. The camera should remain in front of the motorcycle throughout the scene, following it closely as it moves.',
    audioEnvironment: 'Loud motorcycle, favela environment, a brief police siren, voice and laughter. No music.'
  });

  // Load from storage
  useEffect(() => {
    const savedSettings = localStorage.getItem('umbraSettings');
    const savedHistory = localStorage.getItem('umbraHistory');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedHistory) setPromptHistory(JSON.parse(savedHistory));
  }, []);

  const saveToHistory = () => {
    if (!currentPrompt) return;
    const newItem: HistoryItem = {
      date: new Date().toLocaleString('pt-BR'),
      prompt: currentPrompt,
      theme: customTheme || selectedTheme,
      protagonist: customProtagonist || selectedProtagonist
    };
    const newHistory = [newItem, ...promptHistory.slice(0, 49)];
    setPromptHistory(newHistory);
    localStorage.setItem('umbraHistory', JSON.stringify(newHistory));
    alert('💾 Prompt salvo no histórico!');
  };

  const clearAll = () => {
    if (!confirm('🔄 Limpar todos os campos?')) return;
    setSelectedTheme('');
    setSelectedLocation('');
    setSelectedProtagonist('');
    setSelectedMood('');
    setSelectedStyle('');
    setCustomTheme('');
    setCustomLocation('');
    setCustomProtagonist('');
    setCharacterDesc('');
    setCharacterShout('');
    setCurrentPrompt('');
    setSuggestionResult(null);
    setMixedStyle(null);
  };

  const generatePrompt = () => {
    const finalTheme = customTheme || selectedTheme;
    const finalLocation = customLocation || selectedLocation || settings.sceneLocation;
    const finalProtagonist = customProtagonist || selectedProtagonist;

    if (!finalTheme || !finalLocation || !finalProtagonist || !characterDesc || !characterShout) {
      alert('⚠️ Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    const indoorKeywords = ['dentro', 'casa', 'sala', 'cozinha', 'quarto', 'banheiro', 'porão', 'sótão', 'apartamento', 'mansão', 'barraco', 'corredor', 'escritório', 'biblioteca', 'hospital', 'escola', 'igreja', 'bar', 'boate', 'restaurante', 'café', 'lanchonete', 'loja', 'supermercado', 'shopping', 'mercado', 'galpão', 'fábrica', 'oficina', 'garagem'];
    const vehicleKeywords = ['rua', 'avenida', 'estrada', 'rodovia', 'beco', 'favela', 'periferia', 'centro', 'ponte', 'viaduto', 'túnel', 'asfalto'];
    
    const locationLower = finalLocation.toLowerCase();
    const isIndoor = indoorKeywords.some(kw => locationLower.includes(kw));
    const needsVehicle = vehicleKeywords.some(kw => locationLower.includes(kw));

    let cam = settings.cameraStyle;
    let scene = "";
    let setting = "";
    let audio = "";

    if (isIndoor) {
      cam = `Handheld camera, medium shot to close-up, following the character naturally through the interior space. Smooth camera movement tracking the subject's actions and emotions. Natural indoor lighting with realistic shadows.`;
      scene = `A ${settings.characterAge}-year-old ${settings.nationality} person, characterized as "${finalProtagonist}", with ${characterDesc}, moves through the interior of ${finalLocation}. At a dramatic peak, they turn directly toward the camera with intense emotion and shout in ${settings.nationality} Portuguese: "${characterShout}", their voice echoing in the space, followed by an expressive reaction.`;
      setting = `Realistic interior of ${finalLocation}. Authentic details, lived-in atmosphere, natural indoor lighting. Real furniture, objects, and environmental elements that create a believable space.`;
      audio = `Ambient indoor sounds: footsteps, movement of objects, natural room acoustics, breathing, voice echoing in the interior space. The character's voice: "${characterShout}". Natural indoor atmosphere. No background music.`;
    } else if (needsVehicle) {
      cam = `Front tracking shot, low angle, slightly shaky, realistic movement, no slow motion, no camera cuts. The camera remains in front of the ${settings.vehicleType} throughout the scene, following it closely as it moves.`;
      scene = `A ${settings.characterAge}-year-old ${settings.nationality} person, characterized as "${finalProtagonist}", with ${characterDesc}, rides an ${settings.vehicleType} at high speed through ${finalLocation}. They awkwardly wheelie the motorcycle at high speed, showing both excitement and struggle with control. After regaining balance, they look ahead with intense emotion and shout in ${settings.nationality} Portuguese: "${characterShout}", followed by a loud, expressive laugh as they accelerate forward.`;
      setting = `Realistic ${finalLocation} setting with authentic environmental details. Urban atmosphere with real textures, natural lighting, and believable surroundings.`;
      audio = `Loud ${settings.vehicleType} engine sound, urban environment noise, ambient sounds of ${finalLocation}, voice shouting: "${characterShout}", expressive laughter. Realistic outdoor acoustics. No background music.`;
    } else {
      cam = `Tracking shot following the character, dynamic camera movement, handheld style with natural motion. Medium to full shots capturing both the character and environment. Realistic outdoor lighting.`;
      scene = `A ${settings.characterAge}-year-old ${settings.nationality} person, characterized as "${finalProtagonist}", with ${characterDesc}, moves energetically through ${finalLocation}. At an emotional climax, they stop and face the camera directly, shouting in ${settings.nationality} Portuguese: "${characterShout}", their voice carrying through the outdoor space, followed by an intense emotional reaction.`;
      setting = `Realistic ${finalLocation} with natural environmental details, authentic atmosphere, and real-world textures. The setting feels lived-in and genuine.`;
      audio = `Natural ambient sounds of ${finalLocation}, footsteps, breathing, environmental noise. The character's voice clearly shouting: "${characterShout}". Natural outdoor acoustics. No background music.`;
    }

    const prompt = `Camera Style: ${cam}\n\nSCENE DESCRIPTION (ENGLISH):\n\n${scene}\n\nMANDATORY RULES:\n\nSetting: ${setting}\nAudio: ${audio}\nThe video MUST NOT contain any on-screen text, logos, subtitles, or watermarks.\n\nTheme & Style: ${finalTheme}`;
    setCurrentPrompt(prompt);
  };

  const randomInspiration = () => {
    setSelectedTheme(themes[Math.floor(Math.random() * themes.length)]);
    setSelectedLocation(locations[Math.floor(Math.random() * locations.length)]);
    setSelectedProtagonist(protagonists[Math.floor(Math.random() * protagonists.length)]);
    setSelectedMood(moods[Math.floor(Math.random() * moods.length)]);
    setActiveTab('generator');
  };

  const applyMix = () => {
    if (style1 && style2) {
      setCustomTheme(`${style1} + ${style2}`);
      setActiveTab('generator');
      alert('✅ Estilos aplicados ao gerador!');
    }
  };

  const generateSuggestion = () => {
    if (!selectedMood || !selectedStyle) return alert('Selecione mood e estilo!');
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const p = protagonists[Math.floor(Math.random() * protagonists.length)];
    setSuggestionResult(`🎨 Mood: ${selectedMood} | Estilo: ${selectedStyle}\nTema Sugerido: ${theme}\nPersonagem Sugerido: ${p}`);
  };

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-6xl mx-auto">
      <header className="text-center bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-purple/10 via-transparent to-brand-cyan/10 pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-purple/10 rounded-[28px] mb-6 shadow-2xl shadow-brand-purple/10 ring-1 ring-brand-purple/20">
            <Lightbulb className="w-10 h-10 text-brand-purple" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter mb-4 bg-gradient-to-r from-brand-purple via-brand-pink to-brand-cyan bg-clip-text text-transparent uppercase font-bebas">
            Umbra Idea Forge
          </h1>
          <p className="text-gray-500 font-medium">Motor de Forja Narrativa • Ideias em Prompts Poderosos</p>
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {['Idea to Prompt', 'Creative Suggestions', 'Style Mixing', 'Random Inspiration'].map(tag => (
              <span key={tag} className="px-4 py-1.5 bg-background-deep border border-white/10 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">{tag}</span>
            ))}
          </div>
        </div>
      </header>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={randomInspiration} className="p-8 bg-background-mid border border-white/5 rounded-[32px] hover:border-brand-purple/40 transition-all group flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-brand-purple group-hover:scale-110 transition-transform shadow-xl"><Dices className="w-6 h-6" /></div>
          <span className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Inspiração Aleatória</span>
        </button>
        <button onClick={() => setActiveTab('mixer')} className="p-8 bg-background-mid border border-white/5 rounded-[32px] hover:border-brand-pink/40 transition-all group flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-brand-pink/10 rounded-2xl flex items-center justify-center text-brand-pink group-hover:scale-110 transition-transform shadow-xl"><Palette className="w-6 h-6" /></div>
          <span className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Misturar Estilos</span>
        </button>
        <button onClick={() => setActiveTab('suggestions')} className="p-8 bg-background-mid border border-white/5 rounded-[32px] hover:border-brand-cyan/40 transition-all group flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-brand-cyan/10 rounded-2xl flex items-center justify-center text-brand-cyan group-hover:scale-110 transition-transform shadow-xl"><Lightbulb className="w-6 h-6" /></div>
          <span className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Sugestões Criativas</span>
        </button>
        <button onClick={clearAll} className="p-8 bg-background-mid border border-white/5 rounded-[32px] hover:border-white/20 transition-all group flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 group-hover:scale-110 transition-transform shadow-xl"><RotateCcw className="w-6 h-6" /></div>
          <span className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Limpar Tudo</span>
        </button>
      </div>

      {/* TABS */}
      <div className="bg-background-mid border border-white/5 rounded-[24px] p-2 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'generator', label: '🎬 Gerador', icon: Zap },
          { id: 'suggestions', label: '💡 Sugestões', icon: Target },
          { id: 'mixer', label: '🎭 Mixer', icon: Activity },
          { id: 'history', label: '📚 Histórico', icon: HistoryIcon },
          { id: 'settings', label: '⚙️ Settings', icon: SettingsIcon },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-brand-purple text-white shadow-xl shadow-brand-purple/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <main className="min-h-[500px]">
        {activeTab === 'generator' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <section className="bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-xl space-y-8">
               <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-brand-purple" />
                  <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Tema / Conceito</h3>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-4 bg-background-deep/50 rounded-3xl border border-white/5">
                 {themes.map(t => (
                   <button key={t} onClick={() => setSelectedTheme(t)} className={`p-3 rounded-xl border text-[10px] font-bold text-left transition-all ${selectedTheme === t ? 'bg-brand-purple/20 border-brand-purple text-brand-purple' : 'bg-background-light border-white/5 text-gray-500 hover:border-white/20'}`}>{t}</button>
                 ))}
               </div>
               <input type="text" value={customTheme} onChange={e => setCustomTheme(e.target.value)} placeholder="Ou digite seu próprio tema..." className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-bold text-brand-cyan focus:border-brand-cyan outline-none" />
            </section>

            <section className="bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-xl space-y-8">
               <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-brand-pink" />
                  <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Localização</h3>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-4 bg-background-deep/50 rounded-3xl border border-white/5">
                 {locations.map(l => (
                   <button key={l} onClick={() => setSelectedLocation(l)} className={`p-3 rounded-xl border text-[10px] font-bold text-left transition-all ${selectedLocation === l ? 'bg-brand-pink/20 border-brand-pink text-brand-pink' : 'bg-background-light border-white/5 text-gray-500 hover:border-white/20'}`}>{l}</button>
                 ))}
               </div>
               <input type="text" value={customLocation} onChange={e => setCustomLocation(e.target.value)} placeholder="Local customizado..." className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-bold text-brand-cyan focus:border-brand-cyan outline-none" />
            </section>

            <section className="bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-xl space-y-8">
               <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-brand-cyan" />
                  <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Personagem</h3>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-4 bg-background-deep/50 rounded-3xl border border-white/5">
                 {protagonists.map(p => (
                   <button key={p} onClick={() => setSelectedProtagonist(p)} className={`p-3 rounded-xl border text-[10px] font-bold text-left transition-all ${selectedProtagonist === p ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan' : 'bg-background-light border-white/5 text-gray-500 hover:border-white/20'}`}>{p}</button>
                 ))}
               </div>
               <div className="space-y-4 pt-4 border-t border-white/5">
                 <input type="text" value={customProtagonist} onChange={e => setCustomProtagonist(e.target.value)} placeholder="Tipo de personagem customizado..." className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-bold text-brand-cyan focus:border-brand-cyan outline-none mb-4" />
                 <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">Detalhes Físicos / Vestimentas</label>
                 <textarea value={characterDesc} onChange={e => setCharacterDesc(e.target.value)} placeholder="Cabelo grisalho, jaqueta gasta, cicatriz..." className="w-full h-32 bg-background-deep border border-white/10 rounded-3xl p-6 text-sm font-medium focus:border-brand-purple outline-none resize-none" />
                 <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">O que ele(a) grita para a câmera?</label>
                 <input type="text" value={characterShout} onChange={e => setCharacterShout(e.target.value)} placeholder="Ex: 'Eles estão vindo!'" className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-bold text-brand-pink focus:border-brand-pink outline-none" />
               </div>
               <button onClick={generatePrompt} className="w-full py-6 bg-gradient-to-r from-brand-purple to-brand-pink text-white font-orbitron text-xs font-black tracking-[0.4em] rounded-[28px] shadow-2xl hover:shadow-[0_0_40px_rgba(168,85,247,0.3)] transition-all uppercase active:scale-95">✨ Forjar Prompt Cinematográfico</button>
            </section>

            {currentPrompt && (
              <div className="bg-background-mid border border-brand-purple/20 rounded-[48px] p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-purple to-brand-pink" />
                <div className="flex items-center justify-between px-2">
                   <h4 className="font-orbitron text-[10px] font-black text-brand-purple uppercase tracking-widest">Seu Prompt Final</h4>
                   <div className="flex gap-2">
                      <button onClick={() => { navigator.clipboard.writeText(currentPrompt); alert("Copiado!"); }} className="p-3 bg-white/5 rounded-xl hover:text-brand-cyan transition-all" title="Copiar"><Copy className="w-5 h-5" /></button>
                      <button onClick={saveToHistory} className="p-3 bg-white/5 rounded-xl hover:text-brand-green transition-all" title="Salvar"><Save className="w-5 h-5" /></button>
                   </div>
                </div>
                <div className="bg-background-deep/80 border border-white/5 rounded-[32px] p-10 font-space text-[12px] leading-loose text-gray-400 whitespace-pre-wrap shadow-inner max-h-[600px] overflow-y-auto custom-scrollbar">
                  {currentPrompt}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
             <section className="bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-xl space-y-8">
               <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-brand-cyan" />
                  <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Sugestões Criativas</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block px-2">Mood / Atmosfera</label>
                    <div className="grid grid-cols-2 gap-2 h-60 overflow-y-auto custom-scrollbar p-2 bg-background-deep/30 rounded-2xl border border-white/5">
                      {moods.map(m => (
                        <button key={m} onClick={() => setSelectedMood(m)} className={`p-3 rounded-xl border text-[10px] font-bold text-left transition-all ${selectedMood === m ? 'bg-brand-cyan/20 border-brand-cyan text-brand-cyan' : 'bg-background-light border-white/5 text-gray-500 hover:border-white/20'}`}>{m}</button>
                      ))}
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block px-2">Estilo Visual</label>
                    <div className="grid grid-cols-2 gap-2 h-60 overflow-y-auto custom-scrollbar p-2 bg-background-deep/30 rounded-2xl border border-white/5">
                      {visualStyles.map(s => (
                        <button key={s} onClick={() => setSelectedStyle(s)} className={`p-3 rounded-xl border text-[10px] font-bold text-left transition-all ${selectedStyle === s ? 'bg-brand-purple/20 border-brand-purple text-brand-purple' : 'bg-background-light border-white/5 text-gray-500 hover:border-white/20'}`}>{s}</button>
                      ))}
                    </div>
                 </div>
               </div>
               <button onClick={generateSuggestion} className="w-full py-6 bg-brand-cyan text-background-deep font-orbitron text-xs font-black tracking-[0.4em] rounded-[28px] shadow-2xl hover:shadow-[0_0_40px_rgba(0,245,255,0.3)] transition-all uppercase active:scale-95">Gerar Sugestão Híbrida</button>
               
               {suggestionResult && (
                 <div className="p-8 bg-background-deep border border-brand-cyan/30 rounded-[32px] animate-in zoom-in-95 duration-500">
                    <h4 className="text-sm font-black text-brand-cyan mb-4 uppercase tracking-widest">Combinação Única Gerada:</h4>
                    <p className="text-lg text-gray-400 font-medium leading-relaxed whitespace-pre-wrap">{suggestionResult}</p>
                 </div>
               )}
             </section>
          </div>
        )}

        {activeTab === 'mixer' && (
          <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
             <section className="bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-xl space-y-12">
                <div className="flex items-center gap-3">
                   <Activity className="w-5 h-5 text-brand-pink" />
                   <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Misturador de Estilos</h3>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  <div className="flex-1 w-full space-y-4">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block text-center">Estilo Base A</label>
                    <select value={style1} onChange={e => setStyle1(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-bold appearance-none cursor-pointer text-center outline-none focus:border-brand-purple transition-all">
                      <option value="">Selecione...</option>
                      {allStyles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="text-4xl text-brand-pink font-black">+</div>
                  <div className="flex-1 w-full space-y-4">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block text-center">Estilo Base B</label>
                    <select value={style2} onChange={e => setStyle2(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-bold appearance-none cursor-pointer text-center outline-none focus:border-brand-cyan transition-all">
                      <option value="">Selecione...</option>
                      {allStyles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-4">
                   <button onClick={applyMix} className="flex-2 py-6 bg-brand-pink text-white font-orbitron text-xs font-black tracking-[0.4em] rounded-[28px] uppercase hover:scale-[1.02] transition-all">Aplicar ao Gerador</button>
                   <button onClick={() => { setStyle1(allStyles[Math.floor(Math.random()*allStyles.length)]); setStyle2(allStyles[Math.floor(Math.random()*allStyles.length)]); }} className="flex-1 py-6 bg-white/5 border border-white/5 text-gray-500 font-bold rounded-[28px] uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"><Dices className="w-5 h-5" /> Aleatório</button>
                </div>
             </section>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-8 animate-in fade-in duration-700">
             <div className="flex items-center justify-between px-4">
                <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-gray-500">Histórico de Forjas</h3>
                <button onClick={() => { setPromptHistory([]); localStorage.removeItem('umbraHistory'); }} className="text-[10px] font-black text-brand-pink uppercase tracking-widest hover:underline transition-all">Limpar Tudo</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {promptHistory.length === 0 ? (
                  <div className="md:col-span-2 py-32 text-center opacity-20">
                     <HistoryIcon className="w-16 h-16 mx-auto mb-6" />
                     <p className="font-orbitron text-[10px] font-black uppercase tracking-widest">Nenhum prompt salvo ainda</p>
                  </div>
                ) : (
                  promptHistory.map((item, i) => (
                    <div key={i} className="group bg-background-mid border border-white/5 rounded-[40px] p-8 space-y-6 hover:border-brand-purple/30 transition-all shadow-xl relative overflow-hidden">
                       <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[9px] font-black text-brand-purple uppercase tracking-[0.2em] mb-1">{item.date}</p>
                            <h5 className="text-xl font-black tracking-tight text-white group-hover:text-brand-cyan transition-colors">{item.theme}</h5>
                          </div>
                          <button onClick={() => { navigator.clipboard.writeText(item.prompt); alert("Copiado!"); }} className="p-3 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 hover:text-brand-cyan transition-all"><Copy className="w-4 h-4" /></button>
                       </div>
                       <div className="flex gap-2">
                          <span className="px-3 py-1 bg-background-deep border border-white/10 rounded-lg text-[9px] font-black text-gray-600 uppercase tracking-widest">{item.protagonist}</span>
                       </div>
                       <p className="text-xs text-gray-500 line-clamp-3 font-medium leading-relaxed italic">{item.prompt}</p>
                    </div>
                  ))
                )}
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
             <section className="bg-background-mid border border-white/5 rounded-[40px] p-10 shadow-xl space-y-8">
                <div className="flex items-center gap-3">
                   <SettingsIcon className="w-5 h-5 text-brand-cyan" />
                   <h3 className="font-orbitron text-[10px] font-black uppercase tracking-widest text-white">Configurações Base do Motor</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block px-2">Idade Padrão</label>
                    <input type="number" value={settings.characterAge} onChange={e => setSettings({...settings, characterAge: parseInt(e.target.value)})} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 font-bold outline-none" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block px-2">Nacionalidade</label>
                    <input type="text" value={settings.nationality} onChange={e => setSettings({...settings, nationality: e.target.value})} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 font-bold outline-none" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block px-2">Tipo de Veículo (Rua)</label>
                    <input type="text" value={settings.vehicleType} onChange={e => setSettings({...settings, vehicleType: e.target.value})} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 font-bold outline-none" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block px-2">Áudio Ambiente</label>
                    <input type="text" value={settings.audioEnvironment} onChange={e => setSettings({...settings, audioEnvironment: e.target.value})} className="w-full bg-background-deep border border-white/10 rounded-2xl p-4 font-bold outline-none" />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest block px-2">Estética de Câmera Global</label>
                  <textarea value={settings.cameraStyle} onChange={e => setSettings({...settings, cameraStyle: e.target.value})} className="w-full h-32 bg-background-deep border border-white/10 rounded-3xl p-6 text-xs font-medium focus:border-brand-cyan outline-none resize-none" />
                </div>
                <div className="flex gap-4">
                   <button onClick={() => { localStorage.setItem('umbraSettings', JSON.stringify(settings)); alert("Salvo!"); }} className="flex-2 py-5 bg-brand-cyan text-background-deep font-black rounded-[24px] uppercase text-xs tracking-widest shadow-xl shadow-brand-cyan/20">Salvar Settings</button>
                   <button onClick={() => setSettings({characterAge: 70, nationality: 'Brazilian', sceneLocation: 'favela', vehicleType: 'old, noisy motorcycle', cameraStyle: 'Front tracking shot, low angle, slightly shaky, realistic movement, no slow motion, no camera cuts. The camera should remain in front of the motorcycle throughout the scene, following it closely as it moves.', audioEnvironment: 'Loud motorcycle, favela environment, a brief police siren, voice and laughter. No music.'})} className="flex-1 py-5 bg-white/5 text-gray-500 rounded-[24px] uppercase text-[10px] font-black tracking-widest hover:bg-white/10">Reset Padrão</button>
                </div>
             </section>

             <section className="bg-gradient-to-br from-brand-purple/20 to-brand-pink/20 border border-white/10 rounded-[48px] p-12 text-center shadow-2xl space-y-8">
                <h3 className="text-2xl font-black tracking-tighter">🔗 Ecossistema Umbra</h3>
                <div className="flex flex-wrap justify-center gap-4">
                   <a href="https://www.youtube.com/channel/UC3ljRCyGc_Atq6ld8iTVYfw" target="_blank" className="px-8 py-4 bg-background-deep border border-white/5 rounded-2xl text-xs font-bold hover:text-brand-purple transition-all flex items-center gap-3"><Youtube className="w-5 h-5" /> Canal Oficial</a>
                   <a href="https://wa.me/message/EF4DJTI6JTOTH1" target="_blank" className="px-8 py-4 bg-background-deep border border-white/5 rounded-2xl text-xs font-bold hover:text-brand-cyan transition-all flex items-center gap-3"><MessageCircle className="w-5 h-5" /> Suporte VIP</a>
                   <a href="https://livepix.gg/cicerosantos" target="_blank" className="px-8 py-4 bg-background-deep border border-white/5 rounded-2xl text-xs font-bold hover:text-brand-pink transition-all flex items-center gap-3"><Heart className="w-5 h-5" /> Apoiar Projeto</a>
                </div>
             </section>
          </div>
        )}
      </main>

      <footer className="py-20 text-center border-t border-white/5 opacity-40">
         <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-500">Desenvolvido com ⚡ por Umbra Hub AI Engine</p>
      </footer>
    </div>
  );
};

export default IdeaForgeTool;
