
import React, { useState, useEffect } from 'react';
import {
  User,
  Dna,
  Clapperboard,
  Save,
  Trash2,
  Copy,
  Plus,
  RefreshCw,
  Layout,
  Eye,
  Palette,
  Shirt,
  History,
  ExternalLink,
  Youtube,
  Heart,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Settings,
  Info,
  // Fix: Add missing Zap icon import
  Zap
} from 'lucide-react';

const STORAGE_KEY = 'umbra_persona_characters_v1';

interface SavedEnvironment {
  id: string;
  name: string;
  sceneData: SceneData;
}

interface SceneHistoryItem {
  id: string;
  prompt: string;
  timestamp: string;
  sceneData: SceneData;
}

interface CharacterDNA {
  name: string | null;
  base_description: string;
  hair: string | null;
  face: string | null;
  clothes: string | null;
  custom_details: string | null;
  visual_style: string;
  tags?: string[];
}

interface SceneData {
  action: string | null;
  dialogue: string | null;
  location: string | null;
  lighting: string | null;
  mood: string | null;
  camera?: string | null;
  time?: string | null;
  aspectRatio?: string | null; // e.g., "16:9", "1:1"
}

interface DNAObject {
  scene_id: number;
  character_dna: CharacterDNA;
  scene_data: SceneData;
  final_prompt_for_ai: string;
}

interface SavedCharacter {
  id: string;
  name: string;
  dna: DNAObject;
  environments: SavedEnvironment[];
  history: SceneHistoryItem[];
  tags: string[];
  createdAt: string;
}

const PersonaTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'character' | 'scene' | 'saved'>('character');
  const [savedCharacters, setSavedCharacters] = useState<SavedCharacter[]>([]);
  const [currentDNA, setCurrentDNA] = useState<DNAObject | null>(null);
  const [sceneCounter, setSceneCounter] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form States - Character
  const [charName, setCharName] = useState('');
  const [charDescription, setCharDescription] = useState('');
  const [charGender, setCharGender] = useState('');
  const [charAge, setCharAge] = useState('');
  const [charArtStyle, setCharArtStyle] = useState('photorealistic');
  const [charGenre, setCharGenre] = useState('');
  const [charEthnicity, setCharEthnicity] = useState('');
  const [charBody, setCharBody] = useState('');
  const [charHairColor, setCharHairColor] = useState('');
  const [charHairStyle, setCharHairStyle] = useState('');
  const [charEyeColor, setCharEyeColor] = useState('');
  const [charSkin, setCharSkin] = useState('');
  const [charFacialFeatures, setCharFacialFeatures] = useState('');
  const [charClothing, setCharClothing] = useState('');
  const [charAccessories, setCharAccessories] = useState('');

  // Form States - Scene
  const [sceneCharId, setSceneCharId] = useState('');
  const [sceneAction, setSceneAction] = useState('');
  const [sceneDialogue, setSceneDialogue] = useState('');
  const [sceneLocation, setSceneLocation] = useState('');
  const [sceneLocationCustom, setSceneLocationCustom] = useState('');
  const [sceneLighting, setSceneLighting] = useState('');
  const [sceneTime, setSceneTime] = useState('');
  const [sceneShot, setSceneShot] = useState('');
  const [sceneAngle, setSceneAngle] = useState('');
  const [sceneMood, setSceneMood] = useState('');
  const [sceneAspectRatio, setSceneAspectRatio] = useState('1:1');

  // Prompt Comparison & History
  const [previousPrompt, setPreviousPrompt] = useState<string | null>(null);
  const [showComparator, setShowComparator] = useState(false);

  // Environments
  const [selectedEnvId, setSelectedEnvId] = useState('');
  const [envName, setEnvName] = useState('');

  // Character Tags & Filters
  const [charTags, setCharTags] = useState('');
  const [filterTag, setFilterTag] = useState('');

  // Negative Prompt State
  const [negatives, setNegatives] = useState<string[]>(['blurry', 'bad anatomy', 'extra limbs', 'deformed']);
  const availableNegatives = [
    { id: 'blurry', label: 'Borrado' },
    { id: 'bad anatomy', label: 'Anatomia ruim' },
    { id: 'extra limbs', label: 'Membros extras' },
    { id: 'deformed', label: 'Deformado' },
    { id: 'watermark', label: "Marca d'água" },
    { id: 'text', label: 'Texto' },
    { id: 'low quality', label: 'Baixa qualidade' },
    { id: 'extra fingers', label: 'Dedos extras' },
  ];

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        let parsed = JSON.parse(saved);
        // Migration: ensure characters have environments, history, and tags
        const migrated = parsed.map((c: any) => ({
          ...c,
          environments: c.environments || [],
          history: c.history || [],
          tags: c.tags || []
        }));
        setSavedCharacters(migrated);
        if (JSON.stringify(migrated) !== saved) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        }
      } catch (e) {
        console.error("Erro ao carregar personagens", e);
      }
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const generateCharacterDNA = () => {
    if (!charGender && !charDescription) {
      showToast('Selecione pelo menos o gênero ou descreva o personagem', 'error');
      return;
    }

    let baseDesc = 'character:';
    if (charAge) baseDesc += ` ${charAge}`;
    if (charGender) baseDesc += ` ${charGender}`;
    if (charEthnicity) baseDesc += `, ${charEthnicity}`;
    if (charBody) baseDesc += `, ${charBody}`;
    baseDesc += '.';

    let hair = '';
    if (charHairColor) {
      hair = charHairColor;
      if (charHairStyle) hair += `, ${charHairStyle}`;
    } else if (charHairStyle) {
      hair = charHairStyle + ' hair';
    }

    let face = '';
    const faceParts = [];
    if (charEyeColor) faceParts.push(charEyeColor);
    if (charSkin) faceParts.push(charSkin);
    if (charFacialFeatures) faceParts.push(charFacialFeatures);
    face = faceParts.join(', ');

    let clothes = '';
    if (charClothing) {
      clothes = `dressed in ${charClothing}`;
      if (charAccessories) clothes += `, wearing ${charAccessories}`;
      clothes += '.';
    } else if (charAccessories) {
      clothes = `wearing ${charAccessories}.`;
    }

    let visualStyle = `Style: ${charArtStyle}`;
    if (charGenre) visualStyle += ` ${charGenre}`;
    visualStyle += ', highly detailed.';

    let customDetails = charDescription ? `Additional details: ${charDescription}` : null;

    const dna: DNAObject = {
      scene_id: sceneCounter,
      character_dna: {
        name: charName || null,
        base_description: baseDesc,
        hair: hair || null,
        face: face || null,
        clothes: clothes || null,
        custom_details: customDetails,
        visual_style: visualStyle
      },
      scene_data: {
        action: null,
        dialogue: null,
        location: null,
        lighting: null,
        mood: null
      },
      final_prompt_for_ai: ''
    };

    const promptParts = [];
    promptParts.push(dna.character_dna.base_description);
    if (dna.character_dna.hair) promptParts.push(dna.character_dna.hair);
    if (dna.character_dna.face) promptParts.push(dna.character_dna.face);
    if (dna.character_dna.clothes) promptParts.push(dna.character_dna.clothes);
    if (dna.character_dna.custom_details) promptParts.push(dna.character_dna.custom_details);
    promptParts.push(dna.character_dna.visual_style);

    dna.final_prompt_for_ai = promptParts.join(' ');

    // Save previous for comparator
    if (currentDNA) setPreviousPrompt(currentDNA.final_prompt_for_ai);

    setCurrentDNA(dna);
    showToast('🧬 DNA do personagem gerado!');
    document.getElementById('output-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateScenePrompt = () => {
    let charDNA = currentDNA;
    if (sceneCharId) {
      const saved = savedCharacters.find(c => c.id === sceneCharId);
      if (saved) charDNA = saved.dna;
    }

    if (!charDNA) {
      showToast('Gere ou selecione um personagem primeiro', 'error');
      return;
    }

    const newCounter = sceneCounter + 1;
    setSceneCounter(newCounter);

    const sceneData: SceneData = {
      action: sceneAction ? `-- ACTION: ${sceneAction}` : null,
      dialogue: sceneDialogue ? `-- DIALOGUE: "${sceneDialogue}"` : null,
      location: sceneLocation || sceneLocationCustom || null,
      lighting: sceneLighting || null,
      time: sceneTime || null,
      camera: [sceneShot, sceneAngle].filter(Boolean).join(', ') || null,
      mood: sceneMood || null
    };

    const promptParts = [];
    promptParts.push(charDNA.character_dna.base_description);
    if (charDNA.character_dna.hair) promptParts.push(charDNA.character_dna.hair);
    if (charDNA.character_dna.face) promptParts.push(charDNA.character_dna.face);
    if (charDNA.character_dna.clothes) promptParts.push(charDNA.character_dna.clothes);
    if (sceneData.location) promptParts.push(sceneData.location);
    if (sceneData.lighting) promptParts.push(sceneData.lighting);
    if (sceneData.time) promptParts.push(sceneData.time);
    if (sceneData.mood) promptParts.push(sceneData.mood);
    if (sceneData.camera) promptParts.push(sceneData.camera);
    promptParts.push(charDNA.character_dna.visual_style);
    if (sceneData.action) promptParts.push(sceneData.action);

    const finalPrompt = promptParts.join(' ');

    // Support for Aspect Ratio Grid logic
    const aspectTerms: Record<string, string> = {
      "1:1": "--ar 1:1",
      "16:9": "--ar 16:9",
      "9:16": "--ar 9:16",
      "4:3": "--ar 4:3",
      "3:4": "--ar 3:4",
      "21:9": "--ar 21:9"
    };

    let promptWithAR = finalPrompt;
    if (sceneData.aspectRatio && aspectTerms[sceneData.aspectRatio]) {
      promptWithAR += ` ${aspectTerms[sceneData.aspectRatio]}`;
    }

    const dnaWithScene: DNAObject = {
      ...charDNA,
      scene_id: newCounter,
      scene_data: sceneData,
      final_prompt_for_ai: promptWithAR
    };

    // Updated History logic
    if (currentDNA) setPreviousPrompt(currentDNA.final_prompt_for_ai);

    // Save to character history if a character is selected
    if (sceneCharId) {
      const historyItem: SceneHistoryItem = {
        id: Date.now().toString(),
        prompt: promptWithAR,
        timestamp: new Date().toISOString(),
        sceneData: sceneData
      };

      const updatedCharacters = savedCharacters.map(c => {
        if (c.id === sceneCharId) {
          return {
            ...c,
            history: [historyItem, ...(c.history || [])].slice(0, 10) // Keep last 10
          };
        }
        return c;
      });

      setSavedCharacters(updatedCharacters);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCharacters));
    }

    setCurrentDNA(dnaWithScene);
    showToast('🎬 Cena gerada com sucesso!');
    document.getElementById('output-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateVariation = () => {
    if (!currentDNA) return;

    const expressions = ['smiling', 'angry', 'surprised', 'calm', 'determined', 'laughing', 'crying', 'smirking'];
    const poses = ['standing', 'sitting', 'running', 'looking at camera', 'profile view', 'dynamic pose'];

    const randomExpression = expressions[Math.floor(Math.random() * expressions.length)];
    const randomPose = poses[Math.floor(Math.random() * poses.length)];

    setPreviousPrompt(currentDNA.final_prompt_for_ai);

    const variationPrompt = `${currentDNA.final_prompt_for_ai}, ${randomExpression}, ${randomPose}`;

    setCurrentDNA({
      ...currentDNA,
      final_prompt_for_ai: variationPrompt
    });

    showToast('✨ Variação gerada!');
  };

  const saveCharacter = () => {
    if (!currentDNA) return showToast('Gere um DNA primeiro', 'error');
    const name = currentDNA.character_dna.name || `Personagem ${savedCharacters.length + 1}`;

    // Add tags to DNA if present
    if (charTags) {
      currentDNA.character_dna.tags = charTags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const newChar: SavedCharacter = {
      id: Date.now().toString(),
      name: name,
      dna: currentDNA,
      environments: [],
      history: [],
      tags: currentDNA.character_dna.tags || [],
      createdAt: new Date().toISOString()
    };
    const updated = [...savedCharacters, newChar];
    setSavedCharacters(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    showToast(`💾 "${name}" salvo!`);
  };

  const saveEnvironment = () => {
    if (!sceneCharId) return showToast('Selecione um personagem para salvar o ambiente', 'error');
    if (!envName) return showToast('Dê um nome ao ambiente', 'error');

    const character = savedCharacters.find(c => c.id === sceneCharId);
    if (!character) return;

    const newEnv: SavedEnvironment = {
      id: Date.now().toString(),
      name: envName,
      sceneData: {
        action: sceneAction || null,
        dialogue: sceneDialogue || null,
        location: sceneLocation || sceneLocationCustom || null,
        lighting: sceneLighting || null,
        time: sceneTime || null,
        camera: [sceneShot, sceneAngle].filter(Boolean).join(', ') || null,
        mood: sceneMood || null,
        aspectRatio: sceneAspectRatio
      }
    };

    const updatedCharacters = savedCharacters.map(c => {
      if (c.id === sceneCharId) {
        return { ...c, environments: [...(c.environments || []), newEnv] };
      }
      return c;
    });

    setSavedCharacters(updatedCharacters);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCharacters));
    setEnvName('');
    showToast(`🌍 Ambiente "${newEnv.name}" salvo!`);
  };

  const loadEnvironment = (envId: string) => {
    const character = savedCharacters.find(c => c.id === sceneCharId);
    if (!character) return;

    const env = character.environments.find(e => e.id === envId);
    if (!env) return;

    const sd = env.sceneData;
    setSceneAction(sd.action || '');
    setSceneDialogue(sd.dialogue || '');
    setSceneLocation(sd.location || '');
    setSceneLocationCustom('');
    setSceneLighting(sd.lighting || '');
    setSceneTime(sd.time || '');
    const cameraParts = (sd.camera || '').split(', ');
    setSceneShot(cameraParts[0] || '');
    setSceneAngle(cameraParts[1] || '');
    setSceneMood(sd.mood || '');
    setSceneAspectRatio(sd.aspectRatio || '1:1');
    showToast(`🌍 Ambiente "${env.name}" carregado!`);
  };

  const deleteCharacter = (id: string) => {
    if (confirm('Deseja excluir este personagem?')) {
      const updated = savedCharacters.filter(c => c.id !== id);
      setSavedCharacters(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      showToast('🗑️ Personagem excluído');
    }
  };

  const clearCharacterForm = () => {
    setCharDescription(''); setCharName(''); setCharGender(''); setCharAge(''); setCharArtStyle('photorealistic');
    setCharGenre(''); setCharEthnicity(''); setCharBody(''); setCharHairColor(''); setCharHairStyle('');
    setCharEyeColor(''); setCharSkin(''); setCharFacialFeatures(''); setCharClothing(''); setCharAccessories('');
    setCurrentDNA(null);
    showToast('🗑️ Formulário limpo');
  };

  const toggleNegative = (neg: string) => {
    if (negatives.includes(neg)) setNegatives(negatives.filter(n => n !== neg));
    else setNegatives([...negatives, neg]);
  };

  return (
    <div className="font-rajdhani space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      <header className="text-center relative">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-cyan/10 rounded-[28px] mb-6 shadow-2xl shadow-brand-cyan/10 ring-1 ring-brand-cyan/20">
          <User className="w-10 h-10 text-brand-cyan" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink bg-clip-text text-transparent uppercase font-bebas">
          Umbra Persona
        </h1>
        <p className="text-gray-500 font-medium">Character Design Intelligence • Consistência Visual Superior</p>
      </header>

      {/* TABS */}
      <div className="flex justify-center bg-background-mid p-2 rounded-[24px] border border-white/5 w-fit mx-auto gap-2">
        <button onClick={() => setActiveTab('character')} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'character' ? 'bg-brand-cyan text-background-deep shadow-lg' : 'text-gray-500 hover:text-white'}`}>
          <Dna className="w-4 h-4" /> Criar DNA
        </button>
        <button onClick={() => setActiveTab('scene')} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'scene' ? 'bg-brand-cyan text-background-deep shadow-lg' : 'text-gray-500 hover:text-white'}`}>
          <Clapperboard className="w-4 h-4" /> Cena
        </button>
        <button onClick={() => setActiveTab('saved')} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'saved' ? 'bg-brand-cyan text-background-deep shadow-lg' : 'text-gray-500 hover:text-white'}`}>
          <Save className="w-4 h-4" /> Salvos
        </button>
      </div>

      <main className="space-y-8">
        {/* CHARACTER TAB */}
        {activeTab === 'character' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/5 blur-[80px] -z-10" />
              <div className="flex items-center gap-3 mb-2">
                <Dna className="w-6 h-6 text-brand-cyan" />
                <h3 className="font-orbitron text-xs font-black uppercase tracking-widest text-white">Definição Base do Personagem</h3>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Descrição Narrativa (Visão Geral)</label>
                <textarea value={charDescription} onChange={e => setCharDescription(e.target.value)} placeholder="Ex: Um guerreiro cyberpunk com armadura cromada e olhos incandescentes..." className="w-full h-32 bg-background-deep border border-white/10 rounded-3xl p-6 text-sm font-medium focus:border-brand-cyan outline-none resize-none" />
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quick Config */}
              <section className="bg-background-mid border border-white/5 rounded-[32px] p-8 shadow-xl space-y-6">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Zap className="w-4 h-4 text-brand-cyan" /> Configuração Rápida</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-600 uppercase">Nome</label>
                      <input type="text" value={charName} onChange={e => setCharName(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-xs font-bold text-white focus:border-brand-cyan outline-none" placeholder="Ex: Marcus" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-600 uppercase">Etiquetas (Tags)</label>
                      <input type="text" value={charTags} onChange={e => setCharTags(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-xs font-bold text-white focus:border-brand-cyan outline-none" placeholder="Ex: RPG, Sci-fi, Hero" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-600 uppercase">Gênero</label>
                      <select value={charGender} onChange={e => setCharGender(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold text-white outline-none">
                        <option value="">Selecione...</option>
                        <option value="man">Homem</option>
                        <option value="woman">Mulher</option>
                        <option value="androgynous person">Andrógino</option>
                        <option value="non-binary person">Não-binário</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-600 uppercase">Idade</label>
                      <select value={charAge} onChange={e => setCharAge(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold text-white outline-none">
                        <option value="">Selecione...</option>
                        <option value="child">Criança</option>
                        <option value="teenager">Adolescente</option>
                        <option value="young adult">Jovem Adulto</option>
                        <option value="adult">Adulto</option>
                        <option value="middle-aged">Meia-idade</option>
                        <option value="elderly">Idoso</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* Art Style */}
              <section className="bg-background-mid border border-white/5 rounded-[32px] p-8 shadow-xl space-y-6">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Palette className="w-4 h-4 text-brand-purple" /> Estilo & Gênero</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-600 uppercase">Estilo de Arte</label>
                    <select value={charArtStyle} onChange={e => setCharArtStyle(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold text-white outline-none">
                      <option value="photorealistic">📸 Fotorrealista (Vida real, alta fidelidade)</option>
                      <option value="digital art">🎨 Arte Digital (Pintura moderna, limpa)</option>
                      <option value="anime style">🌸 Anime/Mangá (Estilo japonês clássico)</option>
                      <option value="oil painting">🖼️ Pintura a Óleo (Textura clássica, artística)</option>
                      <option value="watercolor">💧 Aquarela (Fluido, tons pastéis)</option>
                      <option value="3D render, CGI">🎮 3D Render (Estilo Pixar/Disney, profundidade)</option>
                      <option value="comic book style">💥 Comic/HQ (Linhas fortes, hachuras)</option>
                      <option value="fantasy art">🐉 Arte Fantasia (Ilustração épica de RPG)</option>
                      <option value="pixel art">👾 Pixel Art (Retrô 8-bit/16-bit)</option>
                      <option value="noir style">🕵️ Noir (Preto e branco, alto contraste)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-600 uppercase">Ambiente/Gênero</label>
                    <select value={charGenre} onChange={e => setCharGenre(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold text-white outline-none">
                      <option value="">Selecione...</option>
                      <option value="cyberpunk">🌆 Cyberpunk</option>
                      <option value="fantasy">🏰 Fantasia Medieval</option>
                      <option value="sci-fi">🚀 Ficção Científica</option>
                      <option value="noir">🎩 Noir/Detetive</option>
                      <option value="horror">👻 Terror</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Physical Details */}
              <section className="bg-background-mid border border-white/5 rounded-[32px] p-8 shadow-xl space-y-6">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><User className="w-4 h-4 text-brand-pink" /> Detalhes Físicos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-600 uppercase">Etnia</label>
                    <select value={charEthnicity} onChange={e => setCharEthnicity(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none">
                      <option value="">Selecione...</option>
                      <option value="caucasian">Caucasiano</option>
                      <option value="african, dark skin">Africano</option>
                      <option value="east asian">Asiático</option>
                      <option value="latino">Latino</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-600 uppercase">Corpo</label>
                    <select value={charBody} onChange={e => setCharBody(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none">
                      <option value="">Selecione...</option>
                      <option value="slim">Magro</option>
                      <option value="athletic">Atlético</option>
                      <option value="muscular">Musculoso</option>
                      <option value="curvy">Curvilíneo</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-600 uppercase">Rosto / Características</label>
                  <input type="text" value={charFacialFeatures} onChange={e => setCharFacialFeatures(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none" placeholder="Ex: Cicatriz no olho" />
                </div>
              </section>

              {/* Hair */}
              <section className="bg-background-mid border border-white/5 rounded-[32px] p-8 shadow-xl space-y-6">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">💇 Cabelo</h4>
                <div className="grid grid-cols-2 gap-4">
                  <select value={charHairColor} onChange={e => setCharHairColor(e.target.value)} className="bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none">
                    <option value="">Cor...</option>
                    <option value="black hair">Preto</option>
                    <option value="blonde hair">Loiro</option>
                    <option value="red hair">Ruivo</option>
                    <option value="white hair">Branco</option>
                  </select>
                  <select value={charHairStyle} onChange={e => setCharHairStyle(e.target.value)} className="bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none">
                    <option value="">Estilo...</option>
                    <option value="short">Curto</option>
                    <option value="long">Longo</option>
                    <option value="messy">Bagunçado</option>
                    <option value="bald">Careca</option>
                  </select>
                </div>
              </section>

              {/* Eyes & Skin */}
              <section className="bg-background-mid border border-white/5 rounded-[32px] p-8 shadow-xl space-y-6">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">👁️ Rosto e Olhos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <select value={charEyeColor} onChange={e => setCharEyeColor(e.target.value)} className="bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none">
                    <option value="">Olhos...</option>
                    <option value="blue eyes">Azul</option>
                    <option value="brown eyes">Castanho</option>
                    <option value="green eyes">Verde</option>
                    <option value="red eyes">Vermelho</option>
                    <option value="bionic eye">Biônico</option>
                  </select>
                  <select value={charSkin} onChange={e => setCharSkin(e.target.value)} className="bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none">
                    <option value="">Pele...</option>
                    <option value="fair skin">Clara</option>
                    <option value="tan skin">Bronzeada</option>
                    <option value="dark skin">Escura</option>
                    <option value="pale skin">Pálida</option>
                  </select>
                </div>
              </section>

              {/* Clothing */}
              <section className="bg-background-mid border border-white/5 rounded-[32px] p-8 shadow-xl space-y-6">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Shirt className="w-4 h-4" /> Vestuário</h4>
                <div className="space-y-4">
                  <textarea value={charClothing} onChange={e => setCharClothing(e.target.value)} rows={2} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none resize-none" placeholder="Descrição da roupa..." />
                  <input type="text" value={charAccessories} onChange={e => setCharAccessories(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none" placeholder="Acessórios (Óculos, chapéu...)" />
                </div>
              </section>
            </div>

            <div className="flex gap-4 max-w-2xl mx-auto">
              <button onClick={clearCharacterForm} className="flex-1 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-pink transition-all">Limpar Tudo</button>
              <button onClick={generateCharacterDNA} className="flex-2 py-5 bg-gradient-to-r from-brand-cyan to-brand-purple text-background-deep font-orbitron font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl hover:shadow-[0_0_30px_rgba(0,245,255,0.3)] transition-all">Gerar DNA de Personagem</button>
            </div>
          </div>
        )}

        {/* SCENE TAB */}
        {activeTab === 'scene' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <section className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-8">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <div className="w-12 h-12 bg-brand-cyan/10 rounded-2xl flex items-center justify-center text-brand-cyan"><Clapperboard className="w-6 h-6" /></div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Criador de Cenas Consistentes</h3>
                  <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Use o DNA do personagem para gerar ambientes sincronizados</p>
                </div>
              </div>

              {sceneCharId && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-wrap items-center gap-4 animate-in slide-in-from-top-4">
                  <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest flex items-center gap-2"><Save className="w-4 h-4" /> Ambientes do Personagem</span>
                  <div className="flex gap-2 flex-1 min-w-[200px]">
                    <select
                      value={selectedEnvId}
                      onChange={(e) => { setSelectedEnvId(e.target.value); if (e.target.value) loadEnvironment(e.target.value); }}
                      className="bg-background-deep border border-white/10 rounded-xl p-3 text-[10px] font-bold text-white flex-1 outline-none"
                    >
                      <option value="">Carregar Ambiente...</option>
                      {savedCharacters.find(c => c.id === sceneCharId)?.environments?.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={envName}
                      onChange={e => setEnvName(e.target.value)}
                      placeholder="Nome do novo ambiente"
                      className="bg-background-deep border border-white/10 rounded-xl p-3 text-[10px] font-bold text-white flex-1 outline-none focus:border-brand-cyan"
                    />
                    <button onClick={saveEnvironment} className="p-3 bg-brand-cyan text-background-deep rounded-xl hover:scale-105 transition-all shadow-lg"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Personagem de Origem</label>
                    <select value={sceneCharId} onChange={e => setSceneCharId(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-bold appearance-none cursor-pointer outline-none">
                      <option value="">Nenhum (usar DNA atual)</option>
                      {savedCharacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">O que ele está fazendo?</label>
                      <textarea value={sceneAction} onChange={e => setSceneAction(e.target.value)} className="w-full h-32 bg-background-deep border border-white/10 rounded-[32px] p-6 text-sm font-medium outline-none" placeholder="Ex: Caminhando por uma rua deserta segurando uma lanterna..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Diálogo (Opcional)</label>
                      <input type="text" value={sceneDialogue} onChange={e => setSceneDialogue(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-2xl p-5 text-sm font-bold" placeholder='Ex: "Onde estão todos?"' />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-600 uppercase">Localização</label>
                    <select value={sceneLocation} onChange={e => setSceneLocation(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none">
                      <option value="">Selecione...</option>
                      <optgroup label="Interior" className="bg-background-mid">
                        <option value="in a cyberpunk city">Cidade Cyberpunk</option>
                        <option value="in an office">Escritório</option>
                        <option value="in a dark library">Biblioteca Escura</option>
                      </optgroup>
                      <optgroup label="Exterior" className="bg-background-mid">
                        <option value="on a rooftop">Terraço</option>
                        <option value="in a forest">Floresta</option>
                        <option value="on a beach">Praia</option>
                      </optgroup>
                    </select>
                    <input type="text" value={sceneLocationCustom} onChange={e => setSceneLocationCustom(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold mt-2" placeholder="Ou descreva o local..." />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-600 uppercase">Iluminação</label>
                    <select value={sceneLighting} onChange={e => setSceneLighting(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none">
                      <option value="">Luz...</option>
                      <option value="neon lights">Luzes Neon</option>
                      <option value="dramatic lighting">Dramática</option>
                      <option value="cinematic lighting">Cinematográfica</option>
                      <option value="golden hour">Hora Dourada</option>
                    </select>
                    <select value={sceneTime} onChange={e => setSceneTime(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold mt-2 outline-none">
                      <option value="">Hora...</option>
                      <option value="at night">Noite</option>
                      <option value="at sunset">Pôr do Sol</option>
                      <option value="at dawn">Amanhecer</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-600 uppercase">Câmera</label>
                    <select value={sceneShot} onChange={e => setSceneShot(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none">
                      <option value="">Shot...</option>
                      <option value="close-up">Close-up</option>
                      <option value="medium shot">Medium Shot</option>
                      <option value="wide shot">Wide Shot</option>
                    </select>
                    <select value={sceneAngle} onChange={e => setSceneAngle(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold mt-2 outline-none">
                      <option value="">Ângulo...</option>
                      <option value="low angle">De baixo</option>
                      <option value="high angle">De cima</option>
                      <option value="eye level">Nível do olho</option>
                    </select>
                  </div>

                  <div className="space-y-3 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">Proporção da Imagem (Grid)</label>
                    <div className="grid grid-cols-6 gap-2">
                      {["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"].map(ar => (
                        <button
                          key={ar}
                          onClick={() => setSceneAspectRatio(ar)}
                          className={`py-3 rounded-xl text-[9px] font-black border transition-all ${sceneAspectRatio === ar ? 'bg-brand-cyan text-background-deep border-brand-cyan shadow-lg shadow-brand-cyan/20 scale-105' : 'bg-background-deep border-white/5 text-gray-500 hover:border-white/10'}`}
                        >
                          {ar}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-600 uppercase">Atmosfera</label>
                    <select value={sceneMood} onChange={e => setSceneMood(e.target.value)} className="w-full bg-background-deep border border-white/10 rounded-xl p-4 text-[10px] font-bold outline-none h-[88px]">
                      <option value="">Clima da cena...</option>
                      <option value="mysterious atmosphere">Misterioso</option>
                      <option value="epic atmosphere">Épico</option>
                      <option value="tense atmosphere">Tenso</option>
                      <option value="peaceful atmosphere">Pacífico</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-8">
                <button onClick={() => { setSceneAction(''); setSceneLocation(''); }} className="flex-1 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-gray-600 hover:text-brand-pink transition-all uppercase tracking-widest">Limpar Cena</button>
                <button onClick={generateScenePrompt} className="flex-2 py-5 bg-brand-cyan text-background-deep font-black rounded-2xl uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand-cyan/20 hover:scale-[1.02] transition-all">Forjar Cena</button>
              </div>
            </section>
          </div>
        )}

        {/* SAVED TAB */}
        {activeTab === 'saved' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Tag Filter Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 py-4">
              <button
                onClick={() => setFilterTag('')}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${!filterTag ? 'bg-brand-cyan text-background-deep' : 'bg-white/5 text-gray-400 hover:text-white'}`}
              >
                Todos
              </button>
              {Array.from(new Set(savedCharacters.flatMap(c => c.tags || []))).map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterTag === tag ? 'bg-brand-cyan text-background-deep' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                >
                  #{tag}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(filterTag ? savedCharacters.filter(c => c.tags?.includes(filterTag)) : savedCharacters).length === 0 ? (
                <div className="col-span-full py-32 flex flex-col items-center opacity-20">
                  <History className="w-20 h-20 mb-8" />
                  <p className="font-orbitron text-xs font-black uppercase tracking-widest">Nenhum personagem encontrado</p>
                </div>
              ) : (
                (filterTag ? savedCharacters.filter(c => c.tags?.includes(filterTag)) : savedCharacters).map(char => (
                  <div key={char.id} className="group bg-background-mid border border-white/5 rounded-[40px] p-8 space-y-6 hover:border-brand-cyan/30 transition-all shadow-xl relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="text-2xl font-black tracking-tight text-white group-hover:text-brand-cyan transition-all">{char.name}</h5>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {char.tags?.map(t => <span key={t} className="text-[7px] font-black bg-white/5 px-2 py-0.5 rounded-full text-gray-500">#{t}</span>)}
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setCurrentDNA(char.dna); setActiveTab('character'); }} className="p-3 bg-white/5 rounded-xl hover:text-brand-cyan transition-all" title="Carregar"><RefreshCw className="w-4 h-4" /></button>
                        <button onClick={() => deleteCharacter(char.id)} className="p-3 bg-white/5 rounded-xl hover:text-brand-pink transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-4 leading-relaxed font-medium italic">{char.dna.final_prompt_for_ai}</p>

                    {char.history && char.history.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1"><History className="w-3 h-3" /> Histórico Recente</span>
                        <div className="flex flex-col gap-1">
                          {char.history.slice(0, 3).map(h => (
                            <div key={h.id} className="text-[9px] text-gray-500 bg-white/5 p-2 rounded-lg line-clamp-1 border border-white/5 flex justify-between items-center group/h">
                              <span>{h.prompt.substring(0, 40)}...</span>
                              <button onClick={() => { navigator.clipboard.writeText(h.prompt); showToast("Prompt do Histórico Copiado!"); }} className="opacity-0 group-hover/h:opacity-100"><Copy className="w-3 h-3" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-gray-700">
                      <span>{char.environments?.length || 0} Ambientes • {new Date(char.createdAt).toLocaleDateString()}</span>
                      <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(char.dna, null, 2)); showToast("JSON Copiado!"); }} className="text-brand-cyan hover:underline">Copiar DNA</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* DNA OUTPUT SECTION - ALWAYS VISIBLE IF PROMPT EXISTS */}
        {currentDNA && (
          <section id="output-section" className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 pt-12 border-t border-white/5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* DNA JSON */}
              <div className="bg-background-mid border border-white/5 rounded-[48px] overflow-hidden shadow-2xl flex flex-col h-full">
                <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest flex items-center gap-2">🧬 Personagem DNA v1.0</span>
                  <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(currentDNA, null, 2)); showToast("JSON Copiado!"); }} className="p-3 bg-background-deep rounded-xl hover:text-brand-cyan transition-all"><Copy className="w-4 h-4" /></button>
                </div>
                <pre className="p-8 font-mono text-[10px] text-brand-green leading-relaxed h-[400px] overflow-y-auto custom-scrollbar bg-background-deep/80 whitespace-pre-wrap">
                  {JSON.stringify(currentDNA, (k, v) => v === null ? undefined : v, 2)}
                </pre>
              </div>

              {/* FINAL PROMPT */}
              <div className="space-y-8">
                <div className="bg-background-mid border border-brand-cyan/20 rounded-[48px] p-10 shadow-2xl space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink" />
                  <div className="flex justify-between items-center px-2">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Prompt Final para IA</h4>
                    <div className="flex gap-2">
                      <button onClick={generateVariation} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-brand-cyan hover:bg-brand-cyan/10 transition-all shadow-xl" title="Variar Detalhes"><RefreshCw className="w-5 h-5" /></button>
                      {previousPrompt && (
                        <button onClick={() => setShowComparator(true)} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-brand-purple hover:bg-brand-purple/10 transition-all shadow-xl" title="Comparar Versões"><Layout className="w-5 h-5" /></button>
                      )}
                      <button onClick={() => { navigator.clipboard.writeText(currentDNA.final_prompt_for_ai); showToast("Prompt Copiado!"); }} className="p-4 bg-brand-cyan text-background-deep rounded-2xl hover:scale-105 transition-all shadow-xl shadow-brand-cyan/20"><Copy className="w-5 h-5" /></button>
                      <button onClick={saveCharacter} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:text-brand-purple hover:bg-white/10 transition-all shadow-xl" title="Salvar"><Save className="w-5 h-5" /></button>
                    </div>
                  </div>
                  <textarea readOnly value={currentDNA.final_prompt_for_ai} className="w-full h-48 bg-background-deep/80 border border-white/5 rounded-[32px] p-8 text-sm leading-loose text-gray-400 focus:outline-none resize-none shadow-inner" />
                  <div className="flex gap-6 text-[9px] font-black text-gray-700 uppercase tracking-widest px-4">
                    <span>{currentDNA.final_prompt_for_ai.split(' ').length} Palavras</span>
                    <span>{currentDNA.final_prompt_for_ai.length} Caracteres</span>
                  </div>
                </div>

                {/* NEGATIVE PROMPT */}
                <div className="bg-background-mid border border-white/5 rounded-[40px] p-8 shadow-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-brand-pink uppercase tracking-widest">🚫 Prompt Negativo</h4>
                    <button onClick={() => { navigator.clipboard.writeText(negatives.join(', ')); showToast("Negativo Copiado!"); }} className="text-[10px] font-black text-gray-600 hover:text-white uppercase">Copiar</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableNegatives.map(neg => (
                      <button key={neg.id} onClick={() => toggleNegative(neg.id)} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all ${negatives.includes(neg.id) ? 'bg-brand-pink/10 border-brand-pink/40 text-brand-pink' : 'bg-white/5 border-white/5 text-gray-700'}`}>
                        {neg.label}
                      </button>
                    ))}
                  </div>
                  <textarea readOnly value={negatives.join(', ')} className="w-full h-20 bg-background-deep/50 border border-white/5 rounded-2xl p-4 text-[10px] font-bold text-gray-500 outline-none resize-none" />
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <button onClick={() => { clearCharacterForm(); setActiveTab('character'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="px-12 py-5 bg-white/5 border border-white/10 rounded-[28px] font-black uppercase tracking-[0.2em] text-[10px] text-gray-500 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3">
                <Plus className="w-4 h-4" /> Criar Novo Personagem do Zero
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="mt-24 p-12 bg-background-mid border border-white/5 rounded-[56px] text-center max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 via-transparent to-brand-pink/5 opacity-50" />
        <div className="relative z-10 space-y-6">
          <div className="w-16 h-16 bg-white/5 rounded-[24px] flex items-center justify-center mx-auto text-brand-cyan shadow-xl"><Info className="w-8 h-8" /></div>
          <h4 className="text-2xl font-black tracking-tighter">Motor de Consistência Umbra</h4>
          <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">Nossa tecnologia de DNA de personagem garante que a IA entenda as bases físicas do seu protagonista, permitindo que você mude cenários e ações sem perder a identidade visual.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://www.youtube.com/channel/UC3ljRCyGc_Atq6ld8iTVYfw" target="_blank" className="px-6 py-3 bg-background-deep border border-white/5 rounded-xl text-[9px] font-black text-gray-400 hover:text-brand-purple transition-all flex items-center gap-2 uppercase tracking-widest"><Youtube className="w-4 h-4" /> Canal Oficial</a>
            <a href="https://wa.me/message/EF4DJTI6JTOTH1" target="_blank" className="px-6 py-3 bg-background-deep border border-white/5 rounded-xl text-[9px] font-black text-gray-400 hover:text-brand-cyan transition-all flex items-center gap-2 uppercase tracking-widest"><MessageCircle className="w-4 h-4" /> Suporte VIP</a>
          </div>
        </div>
      </footer>

      {/* PROMPT COMPARATOR OVERLAY */}
      {showComparator && previousPrompt && currentDNA && (
        <div className="fixed inset-0 z-[300] bg-background-deep/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-301">
          <div className="w-full max-w-6xl bg-background-mid border border-white/10 rounded-[48px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase tracking-widest text-white">Comparador de Prompts</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Veja o que mudou na última iteração</p>
              </div>
              <button onClick={() => setShowComparator(false)} className="p-4 bg-white/5 rounded-2xl hover:text-brand-pink transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-2">Versão Anterior</span>
                <div className="bg-background-deep/50 p-8 rounded-[32px] border border-white/5 text-sm loading-relaxed text-gray-500 italic">
                  {previousPrompt}
                </div>
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.2em] px-2">Versão Atual</span>
                <div className="bg-background-deep/50 p-8 rounded-[32px] border border-brand-cyan/30 text-sm loading-relaxed text-white">
                  {currentDNA.final_prompt_for_ai}
                </div>
              </div>
            </div>

            <div className="p-8 bg-white/5 border-t border-white/5 flex justify-center">
              <button onClick={() => setShowComparator(false)} className="px-12 py-4 bg-brand-cyan text-background-deep font-black rounded-2xl uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand-cyan/10">Voltar para Edição</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-[200] animate-in slide-in-from-right-4 duration-300">
          <div className={`px-8 py-5 rounded-[24px] shadow-2xl flex items-center gap-4 border ${toast.type === 'error' ? 'bg-brand-pink/20 border-brand-pink text-brand-pink' : 'bg-brand-green/20 border-brand-green text-brand-green'} backdrop-blur-xl ring-4 ring-black/50`}>
            {toast.type === 'error' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            <span className="font-black text-sm uppercase tracking-tighter">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaTool;
