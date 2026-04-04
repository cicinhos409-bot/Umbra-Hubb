
import React, { useState, useEffect, useRef } from 'react';
import { ToolTier } from '../types';
import {
  Hash,
  Volume2,
  Send,
  Smile,
  Paperclip,
  Crown,
  Star,
  Zap,
  Trophy,
  Users,
  Lock,
  Mic,
  MicOff,
  Headphones,
  Settings,
  Search,
  Bell,
  Plus,
  ChevronDown,
  ChevronRight,
  Shield,
  Flame,
  BookOpen,
  TrendingUp,
  Video,
  Gift,
  MessageCircle,
  X,
  Pin,
  Heart,
  ThumbsUp,
  Sparkles,
  Check
} from 'lucide-react';

interface UmbraZToolProps {
  userTier: ToolTier;
  userName?: string;
}

// Ranks system
const RANKS = [
  { name: 'Iniciante', min: 0, color: '#6b7280', icon: '🌱', badge: 'rank-iniciante' },
  { name: 'Aprendiz', min: 100, color: '#3b82f6', icon: '📘', badge: 'rank-aprendiz' },
  { name: 'Criador', min: 500, color: '#8b5cf6', icon: '🎬', badge: 'rank-criador' },
  { name: 'Pro', min: 1500, color: '#a855f7', icon: '⚡', badge: 'rank-pro' },
  { name: 'Elite', min: 4000, color: '#ec4899', icon: '💎', badge: 'rank-elite' },
  { name: 'Lenda', min: 10000, color: '#f59e0b', icon: '👑', badge: 'rank-lenda' },
];

function getRank(xp: number) {
  return [...RANKS].reverse().find(r => xp >= r.min) || RANKS[0];
}

function getNextRank(xp: number) {
  return RANKS.find(r => xp < r.min) || null;
}

function getXPProgress(xp: number) {
  const current = getRank(xp);
  const next = getNextRank(xp);
  if (!next) return 100;
  const currentMin = current.min;
  const nextMin = next.min;
  return Math.round(((xp - currentMin) / (nextMin - currentMin)) * 100);
}

// Room structure
interface Room {
  id: string;
  name: string;
  emoji: string;
  category: string;
  plan: ToolTier;
  type: 'text' | 'voice';
  unread?: number;
  online?: number;
  pinned?: boolean;
}

interface Message {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRank: string;
  authorXP: number;
  authorAvatar: string;
  roomId: string;
  createdAt: Date;
  reactions?: Record<string, number>;
  isSystem?: boolean;
}

interface Member {
  id: string;
  name: string;
  rank: string;
  xp: number;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  plan: ToolTier;
}

const ROOMS: Room[] = [
  // Comunidade
  { id: 'boas-vindas', name: 'boas-vindas', emoji: '👋', category: 'Comunidade', plan: ToolTier.FREE, type: 'text', pinned: true },
  { id: 'geral', name: 'geral', emoji: '💬', category: 'Comunidade', plan: ToolTier.FREE, type: 'text', unread: 12 },
  { id: 'apresente-se', name: 'apresente-se', emoji: '🙋', category: 'Comunidade', plan: ToolTier.FREE, type: 'text' },
  { id: 'suporte', name: 'suporte', emoji: '🛠️', category: 'Comunidade', plan: ToolTier.FREE, type: 'text' },
  // Produção
  { id: 'algoritmo', name: 'algoritmo', emoji: '🔥', category: 'Produção', plan: ToolTier.PRO, type: 'text' },
  { id: 'monetizacao', name: 'monetizacao', emoji: '💰', category: 'Produção', plan: ToolTier.PRO, type: 'text', unread: 5 },
  { id: 'bastidores', name: 'bastidores', emoji: '🎬', category: 'Produção', plan: ToolTier.PRO, type: 'text' },
  { id: 'voz-criadores', name: 'Voz Criadores', emoji: '🎙️', category: 'Produção', plan: ToolTier.PRO, type: 'voice', online: 3 },
  // Crescimento
  { id: 'estrategias', name: 'estratégias', emoji: '📈', category: 'Crescimento', plan: ToolTier.TURBO, type: 'text' },
  { id: 'sala-vip', name: 'sala-vip', emoji: '💎', category: 'Crescimento', plan: ToolTier.TURBO, type: 'text' },
  { id: 'dotti-lab', name: 'umbra-lab', emoji: '⚗️', category: 'Crescimento', plan: ToolTier.TURBO, type: 'text' },
  { id: 'voice-elite', name: 'Voice Elite', emoji: '🏆', category: 'Crescimento', plan: ToolTier.TURBO, type: 'voice', online: 1 },
];

const SAMPLE_MESSAGES: Record<string, Message[]> = {
  'boas-vindas': [
    {
      id: '1', content: '👋 Bem-vindo à Umbra Z! A comunidade definitiva para criadores de canais Dark. Leia as regras e apresente-se no canal #apresente-se!', authorId: 'system', authorName: 'Umbra Bot', authorRank: 'SISTEMA', authorXP: 99999, authorAvatar: '🤖', roomId: 'boas-vindas', createdAt: new Date(Date.now() - 3600000), reactions: { '❤️': 24, '🔥': 18 }, isSystem: true
    },
    {
      id: '2', content: '📌 **Regras da Comunidade:**\n1. Respeite todos os membros\n2. Sem spam ou autopromoção excessiva\n3. Use os canais corretamente\n4. Compartilhe conhecimento!\n\nBoa jornada, Criador!', authorId: 'system', authorName: 'Umbra Bot', authorRank: 'SISTEMA', authorXP: 99999, authorAvatar: '🤖', roomId: 'boas-vindas', createdAt: new Date(Date.now() - 3500000), isSystem: true
    },
  ],
  'geral': [
    { id: '3', content: 'Galera, qual software vocês usam para edição de vídeos? Tô testando o CapCut mas não tô gostando muito...', authorId: 'u1', authorName: 'Rafael_Dark', authorRank: 'Criador', authorXP: 820, authorAvatar: '🎭', roomId: 'geral', createdAt: new Date(Date.now() - 7200000), reactions: { '👍': 8 } },
    { id: '4', content: 'DaVinci Resolve é o rei! Gratuito e profissional demais 🔥', authorId: 'u2', authorName: 'Luna_Conteúdo', authorRank: 'Pro', authorXP: 2100, authorAvatar: '🌙', roomId: 'geral', createdAt: new Date(Date.now() - 7000000), reactions: { '🔥': 15, '❤️': 6 } },
    { id: '5', content: 'Acabei de atingir 10k subs no meu segundo canal! 🎉 Obrigado a todos daqui!', authorId: 'u3', authorName: 'Marcos_Faceless', authorRank: 'Aprendiz', authorXP: 340, authorAvatar: '🎯', roomId: 'geral', createdAt: new Date(Date.now() - 5000000), reactions: { '🎉': 32, '❤️': 21, '🔥': 19 } },
    { id: '6', content: 'Parabéns!! Canal de qual nicho? Documentário ou crimes?', authorId: 'u4', authorName: 'Dark_Vítor', authorRank: 'Criador', authorXP: 950, authorAvatar: '🕵️', roomId: 'geral', createdAt: new Date(Date.now() - 4800000) },
    { id: '7', content: 'Crimes verdadeiros! Tô usando o Umbra Audios pra voz e ficou surreal demais a qualidade', authorId: 'u3', authorName: 'Marcos_Faceless', authorRank: 'Aprendiz', authorXP: 340, authorAvatar: '🎯', roomId: 'geral', createdAt: new Date(Date.now() - 4600000), reactions: { '💎': 9 } },
    { id: '8', content: 'Isso!! O Umbra Hub é o melhor investimento que fiz pra minha carreira no YouTube 🙌', authorId: 'u2', authorName: 'Luna_Conteúdo', authorRank: 'Pro', authorXP: 2100, authorAvatar: '🌙', roomId: 'geral', createdAt: new Date(Date.now() - 4000000), reactions: { '🔥': 11 } },
  ],
  'algoritmo': [
    { id: '9', content: '🔥 DICA PRO: Títulos com "Você Não Vai Acreditar" + número estão com CTR médio de 14% essa semana. Testei em 3 canais.', authorId: 'u2', authorName: 'Luna_Conteúdo', authorRank: 'Pro', authorXP: 2100, authorAvatar: '🌙', roomId: 'algoritmo', createdAt: new Date(Date.now() - 3000000), reactions: { '🔥': 28, '💎': 12 } },
    { id: '10', content: 'CTR de 14% é loucura. Qual thumbnail você tá usando? Rosto + texto ou só visual?', authorId: 'u5', authorName: 'Priya_Dark', authorRank: 'Elite', authorXP: 5200, authorAvatar: '⚡', roomId: 'algoritmo', createdAt: new Date(Date.now() - 2800000) },
    { id: '11', content: 'Rosto AI gerado + paleta vermelha/preta. O contraste é tudo.', authorId: 'u2', authorName: 'Luna_Conteúdo', authorRank: 'Pro', authorXP: 2100, authorAvatar: '🌙', roomId: 'algoritmo', createdAt: new Date(Date.now() - 2600000), reactions: { '👍': 18 } },
  ],
  'estrategias': [
    { id: '12', content: '💎 ESTRATÉGIA ELITE: Poste às 18h-20h horário de Brasília. Sua audiência está saindo do trabalho. Retenção aumenta 23%.', authorId: 'u5', authorName: 'Priya_Dark', authorRank: 'Elite', authorXP: 5200, authorAvatar: '⚡', roomId: 'estrategias', createdAt: new Date(Date.now() - 1800000), reactions: { '👑': 8, '🔥': 22 } },
  ],
};

const ONLINE_MEMBERS: Member[] = [
  { id: 'u5', name: 'Priya_Dark', rank: 'Elite', xp: 5200, avatar: '⚡', status: 'online', plan: ToolTier.TURBO },
  { id: 'u2', name: 'Luna_Conteúdo', rank: 'Pro', xp: 2100, avatar: '🌙', status: 'online', plan: ToolTier.PRO },
  { id: 'u1', name: 'Rafael_Dark', rank: 'Criador', xp: 820, avatar: '🎭', status: 'online', plan: ToolTier.PRO },
  { id: 'u4', name: 'Dark_Vítor', rank: 'Criador', xp: 950, avatar: '🕵️', status: 'away', plan: ToolTier.PRO },
  { id: 'u3', name: 'Marcos_Faceless', rank: 'Aprendiz', xp: 340, avatar: '🎯', status: 'online', plan: ToolTier.FREE },
  { id: 'u6', name: 'Ana_Script', rank: 'Criador', xp: 750, avatar: '📝', status: 'online', plan: ToolTier.PRO },
  { id: 'u7', name: 'Pedro_Viral', rank: 'Aprendiz', xp: 220, avatar: '🎪', status: 'offline', plan: ToolTier.FREE },
];

const ACHIEVEMENTS = [
  { id: 'first-message', name: 'Primeira Mensagem', description: 'Enviou sua primeira mensagem', icon: '💬', xp: 10 },
  { id: 'week-streak', name: 'Semana Ativa', description: '7 dias consecutivos', icon: '🔥', xp: 50 },
  { id: 'helpful', name: 'Membro Útil', description: 'Recebeu 10 reações positivas', icon: '⭐', xp: 100 },
  { id: 'pro-member', name: 'Membro Pro', description: 'Assinou o plano Pro', icon: '💎', xp: 200 },
  { id: 'creator', name: 'Criador Oficial', description: 'Tem 1000 XP', icon: '🎬', xp: 0 },
  { id: 'legend', name: 'Lenda da Comunidade', description: 'Alcançou o rank Lenda', icon: '👑', xp: 0 },
];

const TIER_LEVELS: Record<ToolTier, number> = {
  [ToolTier.FREE]: 0,
  [ToolTier.PRO]: 1,
  [ToolTier.TURBO]: 2,
};

export default function UmbraZTool({ userTier, userName = 'Criador' }: UmbraZToolProps) {
  const [activeRoom, setActiveRoom] = useState<Room>(ROOMS[0]);
  const [messages, setMessages] = useState<Message[]>(SAMPLE_MESSAGES['boas-vindas'] || []);
  const [inputValue, setInputValue] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Comunidade': true,
    'Produção': true,
    'Crescimento': true,
  });
  const [showMembers, setShowMembers] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [userXP, setUserXP] = useState(350);
  const [showAchievement, setShowAchievement] = useState<typeof ACHIEVEMENTS[0] | null>(null);
  const [tab, setTab] = useState<'chat' | 'members' | 'achievements'>('chat');
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userRank = getRank(userXP);
  const nextRank = getNextRank(userXP);
  const xpProgress = getXPProgress(userXP);

  const canAccessRoom = (room: Room) => {
    return TIER_LEVELS[userTier] >= TIER_LEVELS[room.plan];
  };

  const selectRoom = (room: Room) => {
    if (!canAccessRoom(room)) return;
    setActiveRoom(room);
    const msgs = SAMPLE_MESSAGES[room.id] || [];
    setMessages(msgs);
  };

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      authorId: 'me',
      authorName: userName,
      authorRank: userRank.name,
      authorXP: userXP,
      authorAvatar: '🫵',
      roomId: activeRoom.id,
      createdAt: new Date(),
      reactions: {},
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    // Award XP for sending a message
    setUserXP(prev => {
      const newXP = prev + 5;
      return newXP;
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  };

  const addReaction = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId) {
        const reactions = { ...msg.reactions };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...msg, reactions };
      }
      return msg;
    }));
  };

  const getRankColor = (rankName: string) => {
    const r = RANKS.find(rank => rank.name === rankName);
    return r?.color || '#6b7280';
  };

  const getStatusColor = (status: string) => {
    if (status === 'online') return '#22c55e';
    if (status === 'away') return '#f59e0b';
    return '#6b7280';
  };

  const emojis = ['😄', '😂', '🔥', '❤️', '👍', '💎', '⚡', '🎉', '😎', '🤩', '🙌', '💪'];

  const categoryIcons: Record<string, React.ReactNode> = {
    'Comunidade': <MessageCircle className="w-3.5 h-3.5" />,
    'Produção': <Video className="w-3.5 h-3.5" />,
    'Crescimento': <TrendingUp className="w-3.5 h-3.5" />,
  };

  const categoryColors: Record<string, string> = {
    'Comunidade': '#06b6d4',
    'Produção': '#a855f7',
    'Crescimento': '#ec4899',
  };

  const groupedRooms = ROOMS.reduce((acc, room) => {
    if (!acc[room.category]) acc[room.category] = [];
    acc[room.category].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

  return (
    <div className="flex h-full rounded-[32px] overflow-hidden border border-white/5 shadow-2xl" style={{ minHeight: '80vh', background: '#0d0d14' }}>

      {/* Left Sidebar – Room List */}
      <aside style={{ width: 240, background: '#111118', borderRight: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }} className="flex flex-col h-full">

        {/* Community Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-lg" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)' }}>
              Z
            </div>
            <div>
              <div className="text-white font-black text-sm tracking-tight">Umbra Z</div>
              <div className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#7c3aed' }}>Comunidade</div>
            </div>
          </div>
          <button className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <Search className="w-3.5 h-3.5 text-gray-600" />
            <input className="bg-transparent text-xs text-gray-400 outline-none w-full placeholder-gray-600 font-medium" placeholder="Buscar canais..." />
          </div>
        </div>

        {/* Room List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3">
          {Object.entries(groupedRooms).map(([category, rooms]) => (
            <div key={category} className="mb-4">
              <button
                onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors hover:bg-white/5 mb-1"
              >
                <span style={{ color: categoryColors[category] || '#6b7280' }}>{categoryIcons[category]}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-500 flex-1 text-left">{category}</span>
                <ChevronDown className={`w-3 h-3 text-gray-600 transition-transform ${expandedCategories[category] ? '' : '-rotate-90'}`} />
              </button>

              {expandedCategories[category] && rooms.map(room => {
                const accessible = canAccessRoom(room);
                const isActive = activeRoom.id === room.id;

                return (
                  <button
                    key={room.id}
                    onClick={() => selectRoom(room)}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl transition-all mb-0.5 group relative ${isActive ? 'text-white' : accessible ? 'text-gray-500 hover:text-gray-300 hover:bg-white/5' : 'text-gray-700 cursor-not-allowed opacity-50'}`}
                    style={isActive ? { background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(236,72,153,0.1) 100%)', borderLeft: '2px solid #7c3aed' } : {}}
                  >
                    <span className="text-xs">{room.emoji}</span>
                    {room.type === 'voice'
                      ? <Volume2 className="w-3.5 h-3.5 shrink-0" />
                      : <Hash className="w-3.5 h-3.5 shrink-0" />}
                    <span className="flex-1 text-left text-xs font-bold truncate">{room.name}</span>
                    {!accessible && <Lock className="w-3 h-3 text-gray-700 shrink-0" />}
                    {room.unread && accessible && <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ background: '#7c3aed' }}>{room.unread}</span>}
                    {room.online && accessible && <span className="text-[9px] font-black text-green-500 shrink-0 flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />{room.online}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Status Bar */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
          <div className="flex items-center gap-2">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
                🫵
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: '#22c55e', borderColor: '#111118' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-white truncate">{userName}</div>
              <div className="text-[9px] font-black" style={{ color: userRank.color }}>{userRank.icon} {userRank.name} · {userXP} XP</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setIsMuted(!isMuted)} className={`p-1.5 rounded-lg transition-all ${isMuted ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setIsDeafened(!isDeafened)} className={`p-1.5 rounded-lg transition-all ${isDeafened ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                <Headphones className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {/* XP Progress Bar */}
          <div className="mt-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">XP</span>
              {nextRank && <span className="text-[8px] font-black" style={{ color: nextRank.color }}>→ {nextRank.name}</span>}
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${xpProgress}%`, background: `linear-gradient(90deg, ${userRank.color}, ${nextRank?.color || userRank.color})` }} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Channel Header */}
        <div className="h-14 border-b flex items-center justify-between px-4 shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-3">
            <span className="text-lg">{activeRoom.emoji}</span>
            {activeRoom.type === 'voice' ? <Volume2 className="w-4 h-4 text-gray-400" /> : <Hash className="w-4 h-4 text-gray-400" />}
            <span className="font-black text-white text-sm">{activeRoom.name}</span>
            {activeRoom.plan !== ToolTier.FREE && (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: activeRoom.plan === ToolTier.TURBO ? 'rgba(236,72,153,0.15)' : 'rgba(124,58,237,0.15)', color: activeRoom.plan === ToolTier.TURBO ? '#ec4899' : '#a855f7', border: `1px solid ${activeRoom.plan === ToolTier.TURBO ? 'rgba(236,72,153,0.3)' : 'rgba(124,58,237,0.3)'}` }}>
                {activeRoom.plan}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMembers(!showMembers)} className={`p-2 rounded-xl transition-all ${showMembers ? 'text-white bg-white/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Voice Room State */}
        {activeRoom.type === 'voice' ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="w-24 h-24 rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.1))', border: '1px solid rgba(124,58,237,0.3)' }}>
                🎙️
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Sala de Voz</h3>
              <p className="text-gray-500 text-sm font-medium mb-6">Conecte com outros criadores em tempo real. Chat de voz ao vivo com outros membros do plano {activeRoom.plan}.</p>
              {activeRoom.online && <p className="text-green-500 text-xs font-black mb-6">{activeRoom.online} membro{activeRoom.online > 1 ? 's' : ''} conectado{activeRoom.online > 1 ? 's' : ''}</p>}
              <button className="px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
                Entrar na Sala
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1" style={{ background: '#0d0d14' }}>
              {messages.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">{activeRoom.emoji}</div>
                  <h3 className="text-white font-black text-xl mb-2">Início do canal #{activeRoom.name}</h3>
                  <p className="text-gray-500 text-sm font-medium">Seja o primeiro a enviar uma mensagem aqui!</p>
                </div>
              )}

              {messages.map((msg, idx) => {
                const prevMsg = messages[idx - 1];
                const isGrouped = prevMsg?.authorId === msg.authorId && !msg.isSystem &&
                  (msg.createdAt.getTime() - prevMsg.createdAt.getTime()) < 300000;

                return (
                  <div key={msg.id} className={`group flex gap-3 rounded-2xl px-3 py-1.5 transition-all hover:bg-white/3 ${!isGrouped ? 'mt-4' : ''}`}>
                    {!isGrouped ? (
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg shrink-0 mt-0.5 shadow-lg" style={{ background: msg.isSystem ? 'linear-gradient(135deg, #7c3aed, #06b6d4)' : `linear-gradient(135deg, ${getRankColor(msg.authorRank)}33, ${getRankColor(msg.authorRank)}11)`, border: `1px solid ${getRankColor(msg.authorRank)}33` }}>
                        {msg.authorAvatar}
                      </div>
                    ) : (
                      <div className="w-9 shrink-0 flex items-center justify-center">
                        <span className="text-[9px] text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">{formatTime(msg.createdAt)}</span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {!isGrouped && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-black" style={{ color: msg.isSystem ? '#06b6d4' : getRankColor(msg.authorRank) }}>{msg.authorName}</span>
                          {!msg.isSystem && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider" style={{ background: `${getRankColor(msg.authorRank)}20`, color: getRankColor(msg.authorRank) }}>
                              {RANKS.find(r => r.name === msg.authorRank)?.icon} {msg.authorRank}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-700">{formatTime(msg.createdAt)}</span>
                        </div>
                      )}

                      <div className="text-sm text-gray-300 font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</div>

                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(msg.reactions).map(([emoji, count]) => (
                            <button key={emoji} onClick={() => addReaction(msg.id, emoji)} className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-all hover:scale-110" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
                              <span>{emoji}</span><span>{count}</span>
                            </button>
                          ))}
                          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="flex items-center px-2 py-0.5 rounded-lg text-xs transition-all opacity-0 group-hover:opacity-100 hover:scale-110" style={{ background: 'rgba(255,255,255,0.05)', color: '#6b7280' }}>
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 shrink-0" style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {showEmojiPicker && (
                <div className="mb-3 p-3 rounded-2xl flex flex-wrap gap-2" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {emojis.map(e => (
                    <button key={e} onClick={() => { setInputValue(prev => prev + e); setShowEmojiPicker(false); }} className="text-xl hover:scale-125 transition-transform">
                      {e}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-gray-500 hover:text-yellow-400 transition-colors shrink-0">
                  <Smile className="w-5 h-5" />
                </button>
                <input
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={`Mensagem em #${activeRoom.name}`}
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-600 font-medium"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button className="text-gray-500 hover:text-white transition-colors">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!inputValue.trim()}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: inputValue.trim() ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'rgba(255,255,255,0.05)' }}
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[9px] text-gray-700 font-black">+5 XP por mensagem</span>
                <span className="text-[9px] font-black" style={{ color: userRank.color }}>{userRank.icon} {userRank.name} · {userXP} XP</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Sidebar – Members / Achievements */}
      {showMembers && (
        <aside style={{ width: 220, background: '#111118', borderLeft: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }} className="flex flex-col h-full">
          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {['members', 'achievements'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t as any)}
                className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-colors ${tab === t ? 'text-white border-b-2' : 'text-gray-600 hover:text-gray-400'}`}
                style={tab === t ? { borderColor: '#7c3aed' } : {}}
              >
                {t === 'members' ? '👥 Membros' : '🏆 XP'}
              </button>
            ))}
          </div>

          {tab === 'members' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
              {(['online', 'away', 'offline'] as const).map(status => {
                const membersOfStatus = ONLINE_MEMBERS.filter(m => m.status === status);
                if (membersOfStatus.length === 0) return null;
                return (
                  <div key={status} className="mb-4">
                    <div className="text-[9px] font-black uppercase tracking-[0.15em] mb-2 px-1" style={{ color: getStatusColor(status) }}>
                      {status === 'online' ? '🟢 Online' : status === 'away' ? '🟡 Ausente' : '⚫ Offline'} — {membersOfStatus.length}
                    </div>
                    {membersOfStatus.map(member => (
                      <div key={member.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-all group mb-1 cursor-pointer">
                        <div className="relative shrink-0">
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm" style={{ background: `${getRankColor(member.rank)}20`, border: `1px solid ${getRankColor(member.rank)}30` }}>
                            {member.avatar}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border" style={{ background: getStatusColor(member.status), borderColor: '#111118' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors truncate">{member.name}</div>
                          <div className="text-[9px] font-black" style={{ color: getRankColor(member.rank) }}>{RANKS.find(r => r.name === member.rank)?.icon} {member.rank}</div>
                        </div>
                        {member.plan !== ToolTier.FREE && (
                          <span className="text-[8px] font-black px-1 py-0.5 rounded" style={{ background: member.plan === ToolTier.TURBO ? 'rgba(236,72,153,0.15)' : 'rgba(124,58,237,0.15)', color: member.plan === ToolTier.TURBO ? '#ec4899' : '#a855f7' }}>
                            {member.plan}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'achievements' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
              {/* User XP card */}
              <div className="p-3 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(236,72,153,0.1))', border: '1px solid rgba(124,58,237,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{userRank.icon}</span>
                  <div>
                    <div className="text-sm font-black text-white">{userRank.name}</div>
                    <div className="text-[9px] font-black text-gray-500">{userXP} XP total</div>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full" style={{ width: `${xpProgress}%`, background: `linear-gradient(90deg, ${userRank.color}, ${nextRank?.color || userRank.color})` }} />
                </div>
                {nextRank && <div className="text-[9px] text-gray-600 font-black">{nextRank.min - userXP} XP para {nextRank.icon} {nextRank.name}</div>}
              </div>

              {/* Ranking */}
              <div className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-600 mb-2 px-1">Ranking</div>
              {RANKS.map((rank, idx) => {
                const unlocked = userXP >= rank.min;
                return (
                  <div key={rank.name} className={`flex items-center gap-2 p-2 rounded-xl mb-1 ${unlocked ? '' : 'opacity-40'}`} style={{ background: unlocked ? `${rank.color}10` : 'rgba(255,255,255,0.02)', border: `1px solid ${unlocked ? rank.color + '25' : 'rgba(255,255,255,0.03)'}` }}>
                    <span className="text-lg">{rank.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs font-black" style={{ color: unlocked ? rank.color : '#4b5563' }}>{rank.name}</div>
                      <div className="text-[9px] text-gray-600 font-medium">{rank.min.toLocaleString()} XP</div>
                    </div>
                    {unlocked && <Check className="w-3.5 h-3.5" style={{ color: rank.color }} />}
                  </div>
                );
              })}

              {/* Achievements */}
              <div className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-600 mt-4 mb-2 px-1">Conquistas</div>
              {ACHIEVEMENTS.map(ach => {
                const unlocked = ach.id === 'first-message' || (ach.id === 'pro-member' && userTier !== ToolTier.FREE);
                return (
                  <div key={ach.id} className={`flex items-center gap-2 p-2 rounded-xl mb-1 ${!unlocked ? 'opacity-40' : ''}`} style={{ background: unlocked ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${unlocked ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)'}` }}>
                    <span className="text-lg">{ach.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-black truncate ${unlocked ? 'text-white' : 'text-gray-600'}`}>{ach.name}</div>
                      <div className="text-[9px] text-gray-600 font-medium truncate">{ach.description}</div>
                    </div>
                    {ach.xp > 0 && <span className="text-[9px] font-black shrink-0" style={{ color: '#7c3aed' }}>+{ach.xp}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </aside>
      )}

      {/* Achievement Toast */}
      {showAchievement && (
        <div className="fixed bottom-6 right-6 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-500 z-50" style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{showAchievement.icon}</span>
            <div>
              <div className="text-xs font-black text-white uppercase tracking-widest">Conquista Desbloqueada!</div>
              <div className="text-sm font-bold text-white/80">{showAchievement.name}</div>
            </div>
            <button onClick={() => setShowAchievement(null)} className="text-white/60 hover:text-white ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
