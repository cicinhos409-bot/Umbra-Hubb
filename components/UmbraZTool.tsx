import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo,
} from 'react';
import { ToolTier } from '../types';
import { supabase } from '../services/supabaseClient';
import { getCurrentUser, onAuthStateChange, getUserProfile } from '../services/authService';
import {
  Hash, Volume2, Send, Smile, Paperclip, Mic, MicOff, Headphones,
  Search, ChevronDown, X, Plus, Users, Lock, Menu, Check, AlertCircle,
  Image as ImageIcon, Film, PhoneOff, Video, VideoOff, MonitorUp, Monitor,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────────── */
type TabType = 'members' | 'achievements';

interface Room {
  id: string; name: string; emoji: string; category: string;
  plan: ToolTier; type: 'text' | 'voice'; unread?: number; online?: number;
}

interface Message {
  id: string; content: string; authorId: string; authorName: string;
  authorRank: string; authorXP: number; authorAvatar: string;
  roomId: string; createdAt: Date;
  reactions: Record<string, number>;
  isSystem?: boolean;
  isSending?: boolean;
  failed?: boolean;
  mediaUrl?: string;        // base64 data URL or remote URL
  mediaType?: 'image' | 'video';
}

interface Member {
  id: string; name: string; rank: string; xp: number;
  avatar: string; status: 'online' | 'away' | 'offline'; plan: ToolTier;
  bio?: string;
  memberSince?: string;
  friendsCount?: number;
  totalMessages?: number;
  streak?: number;
  likesReceived?: number;
  weeklyXP?: number;
  maxStreak?: number;
}

interface AchievementDef {
  id: string; name: string; description: string; icon: string; xp: number;
}

interface MsgBubbleProps {
  msg: Message;
  prevMsg: Message | undefined;
  onReaction: (id: string, emoji: string) => void;
  onRetry: (msg: Message) => void;
  onOpenEmoji: () => void;
  onLightbox: (url: string) => void;
  onOpenProfile: (userId: string, name: string, avatar: string, rank: string, xp: number) => void;
}

/* ─── Static data ───────────────────────────────────────────────────────── */
const RANKS = [
  { name: 'Novato',      min: 0,     color: '#6b7280', icon: '🌱' },
  { name: 'Aprendiz',    min: 100,   color: '#3b82f6', icon: '📘' },
  { name: 'Criador',     min: 500,   color: '#a855f7', icon: '✏️' },
  { name: 'Estrategista', min: 1500,  color: '#ec4899', icon: '🎯' },
  { name: 'Produtor',    min: 3500,  color: '#06b6d4', icon: '🎬' },
  { name: 'Expert',      min: 7500,  color: '#f59e0b', icon: '💎' },
  { name: 'Mestre',      min: 15000, color: '#10b981', icon: '👑' },
  { name: 'Lenda',       min: 30000, color: '#ef4444', icon: '🔥' },
];

const ROOMS: Room[] = [
  { id:'boas-vindas',  name:'boas-vindas',   emoji:'👋', category:'Comunidade', plan:ToolTier.FREE,  type:'text' },
  { id:'geral',        name:'geral',         emoji:'💬', category:'Comunidade', plan:ToolTier.FREE,  type:'text', unread:12 },
  { id:'apresente-se', name:'apresente-se',  emoji:'🙋', category:'Comunidade', plan:ToolTier.FREE,  type:'text' },
  { id:'suporte',      name:'suporte',       emoji:'🛠️', category:'Comunidade', plan:ToolTier.FREE,  type:'text' },
  { id:'algoritmo',    name:'algoritmo',     emoji:'🔥', category:'Produção',   plan:ToolTier.PRO,   type:'text' },
  { id:'monetizacao',  name:'monetizacao',   emoji:'💰', category:'Produção',   plan:ToolTier.PRO,   type:'text', unread:5 },
  { id:'bastidores',   name:'bastidores',    emoji:'🎬', category:'Produção',   plan:ToolTier.PRO,   type:'text' },
  { id:'voz-criadores',name:'Voz Criadores', emoji:'🎙️', category:'Produção',   plan:ToolTier.PRO,   type:'voice', online:3 },
  { id:'estrategias',  name:'estratégias',   emoji:'📈', category:'Crescimento',plan:ToolTier.TURBO, type:'text' },
  { id:'sala-vip',     name:'sala-vip',      emoji:'💎', category:'Crescimento',plan:ToolTier.TURBO, type:'text' },
  { id:'umbra-lab',    name:'umbra-lab',     emoji:'⚗️', category:'Crescimento',plan:ToolTier.TURBO, type:'text' },
  { id:'voice-elite',  name:'Voice Elite',   emoji:'🏆', category:'Crescimento',plan:ToolTier.TURBO, type:'voice', online:1 },
];

const SEED: Record<string, Message[]> = {
  'boas-vindas': [
    { id:'sys-1', content:'👋 Bem-vindo à Umbra Z!\n\nA comunidade definitiva para criadores de canais Dark. Apresente-se no #apresente-se!', authorId:'system', authorName:'Umbra Bot', authorRank:'SISTEMA', authorXP:99999, authorAvatar:'🤖', roomId:'boas-vindas', createdAt:new Date(Date.now()-3600000), reactions:{'❤️':24,'🔥':18}, isSystem:true },
    { id:'sys-2', content:'📌 Regras:\n1. Respeite todos\n2. Sem spam\n3. Use os canais certos\n4. Compartilhe conhecimento!\n\nBoa jornada, Criador! 🚀', authorId:'system', authorName:'Umbra Bot', authorRank:'SISTEMA', authorXP:99999, authorAvatar:'🤖', roomId:'boas-vindas', createdAt:new Date(Date.now()-3500000), reactions:{}, isSystem:true },
  ],
  'geral': [
    { id:'g-1', content:'Galera, qual software vocês usam pra edição? Tô testando o CapCut mas não tô gostando...', authorId:'u1', authorName:'Rafael_Dark', authorRank:'Criador', authorXP:820, authorAvatar:'🎭', roomId:'geral', createdAt:new Date(Date.now()-7200000), reactions:{'👍':8} },
    { id:'g-2', content:'DaVinci Resolve é o rei! Gratuito e profissional 🔥', authorId:'u2', authorName:'Luna_Conteúdo', authorRank:'Pro', authorXP:2100, authorAvatar:'🌙', roomId:'geral', createdAt:new Date(Date.now()-7000000), reactions:{'🔥':15} },
    { id:'g-3', content:'Acabei de atingir 10k subs no meu segundo canal! 🎉 Obrigado a todos!', authorId:'u3', authorName:'Marcos_Faceless', authorRank:'Aprendiz', authorXP:340, authorAvatar:'🎯', roomId:'geral', createdAt:new Date(Date.now()-5000000), reactions:{'🎉':32,'❤️':21,'🔥':19} },
    { id:'g-4', content:'O Umbra Hub é o melhor investimento para minha carreira 🙌', authorId:'u2', authorName:'Luna_Conteúdo', authorRank:'Pro', authorXP:2100, authorAvatar:'🌙', roomId:'geral', createdAt:new Date(Date.now()-4000000), reactions:{'🔥':11} },
  ],
  'algoritmo': [
    { id:'a-1', content:'🔥 DICA PRO: Títulos com "Você Não Vai Acreditar" + número → CTR 14% essa semana. Testei em 3 canais.', authorId:'u2', authorName:'Luna_Conteúdo', authorRank:'Pro', authorXP:2100, authorAvatar:'🌙', roomId:'algoritmo', createdAt:new Date(Date.now()-3000000), reactions:{'🔥':28,'💎':12} },
    { id:'a-2', content:'Qual thumbnail? Rosto + texto ou só visual?', authorId:'u5', authorName:'Priya_Dark', authorRank:'Elite', authorXP:5200, authorAvatar:'⚡', roomId:'algoritmo', createdAt:new Date(Date.now()-2800000), reactions:{} },
    { id:'a-3', content:'Rosto AI gerado + paleta vermelha/preta. O contraste é tudo.', authorId:'u2', authorName:'Luna_Conteúdo', authorRank:'Pro', authorXP:2100, authorAvatar:'🌙', roomId:'algoritmo', createdAt:new Date(Date.now()-2600000), reactions:{'👍':18} },
  ],
  'estrategias': [
    { id:'e-1', content:'💎 ELITE: Poste às 18h-20h horário Brasília. Retenção aumenta 23%.', authorId:'u5', authorName:'Priya_Dark', authorRank:'Elite', authorXP:5200, authorAvatar:'⚡', roomId:'estrategias', createdAt:new Date(Date.now()-1800000), reactions:{'👑':8,'🔥':22} },
  ],
};

const ONLINE_MEMBERS: Member[] = [
  { id:'u5', name:'Priya_Dark',      rank:'Elite',    xp:5200, avatar:'⚡', status:'online',  plan:ToolTier.TURBO },
  { id:'u2', name:'Luna_Conteúdo',   rank:'Pro',      xp:2100, avatar:'🌙', status:'online',  plan:ToolTier.PRO },
  { id:'u1', name:'Rafael_Dark',     rank:'Criador',  xp:820,  avatar:'🎭', status:'online',  plan:ToolTier.PRO },
  { id:'u4', name:'Dark_Vítor',      rank:'Criador',  xp:950,  avatar:'🕵️', status:'away',    plan:ToolTier.PRO },
  { id:'u3', name:'Marcos_Faceless', rank:'Aprendiz', xp:340,  avatar:'🎯', status:'online',  plan:ToolTier.FREE },
  { id:'u6', name:'Ana_Script',      rank:'Criador',  xp:750,  avatar:'📝', status:'online',  plan:ToolTier.PRO },
  { id:'u7', name:'Pedro_Viral',     rank:'Aprendiz', xp:220,  avatar:'🎪', status:'offline', plan:ToolTier.FREE },
];

const ACHIEVEMENTS: AchievementDef[] = [
  { id:'first-message', name:'Primeira Mensagem', description:'Enviou sua primeira mensagem', icon:'💬', xp:10 },
  { id:'rank-aprendiz', name:'Rank Aprendiz',     description:'Alcançou 100 XP',             icon:'📘', xp:25 },
  { id:'rank-criador',  name:'Rank Criador',      description:'Alcançou 500 XP',             icon:'🎬', xp:50 },
  { id:'rank-pro',      name:'Rank Pro!',         description:'Alcançou 1500 XP',            icon:'⚡', xp:100 },
  { id:'rank-elite',    name:'Rank Elite!',       description:'Alcançou 4000 XP',            icon:'💎', xp:200 },
  { id:'rank-lenda',    name:'LENDA DA UMBRA!',   description:'Alcançou 10000 XP',           icon:'👑', xp:500 },
  { id:'pro-member',    name:'Membro Premium',    description:'Assinou um plano pago',       icon:'⭐', xp:0 },
];

const CAT_COLORS: Record<string,string> = {
  Comunidade:'#06b6d4', Produção:'#a855f7', Crescimento:'#ec4899',
};
const TIER_LEVELS: Record<ToolTier,number> = {
  [ToolTier.FREE]:0, [ToolTier.PRO]:1, [ToolTier.TURBO]:2,
};
const EMOJIS = ['😄','😂','🔥','❤️','👍','💎','⚡','🎉','😎','🤩','🙌','💪'];
const XP_KEY  = 'umbra_z_xp';
const ACH_KEY = 'umbra_z_achs';

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const getRank     = (xp:number) => [...RANKS].reverse().find(r=>xp>=r.min) ?? RANKS[0];
const getNextRank = (xp:number) => RANKS.find(r=>xp<r.min) ?? null;
const getXPPct    = (xp:number) => {
  const c=getRank(xp); const n=getNextRank(xp);
  return n ? Math.round(((xp-c.min)/(n.min-c.min))*100) : 100;
};
const rankColor = (name:string) => RANKS.find(r=>r.name===name)?.color ?? '#6b7280';
const statusDot = (s:string) => s==='online'?'#22c55e':s==='away'?'#f59e0b':'#4b5563';
const fmtTime   = (d:Date) => d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});

function mapRow(row: Record<string,unknown>): Message {
  return {
    id:           String(row.id),
    content:      String(row.content),
    roomId:       String(row.room_id),
    authorId:     String(row.author_id),
    authorName:   String(row.author_name),
    authorRank:   String(row.author_rank),
    authorXP:     Number(row.author_xp),
    authorAvatar: String(row.author_avatar),
    reactions:    (row.reactions as Record<string,number>) ?? {},
    isSystem:     Boolean(row.is_system),
    createdAt:    new Date(String(row.created_at)),
    mediaUrl:     row.media_url   ? String(row.media_url)   : undefined,
    mediaType:    row.media_type  ? String(row.media_type) as 'image'|'video' : undefined,
  };
}

const MAX_MEDIA_BYTES = 4 * 1024 * 1024; // 4 MB hard limit

/* ─── MessageBubble — extracted as React.memo to avoid full-list re-renders */
const MessageBubble = memo(({ msg, prevMsg, onReaction, onRetry, onOpenEmoji, onLightbox, onOpenProfile }: MsgBubbleProps) => {
  const grouped = prevMsg?.authorId===msg.authorId && !msg.isSystem
    && (msg.createdAt.getTime() - (prevMsg?.createdAt?.getTime()??0)) < 300000;
  const color = msg.isSystem ? '#06b6d4' : rankColor(msg.authorRank);

  return (
    <div
      className={`group flex gap-3 px-3 py-1.5 rounded-2xl transition-all ${!grouped?'mt-3':'mt-0.5'} ${msg.failed?'':'hover:bg-white/[.03]'}`}
      style={msg.failed?{background:'rgba(239,68,68,.05)',border:'1px solid rgba(239,68,68,.15)'}:{}}>
      {!grouped ? (
        <div onClick={() => !msg.isSystem && onOpenProfile(msg.authorId, msg.authorName, msg.authorAvatar, msg.authorRank, msg.authorXP)}
          className={`w-9 h-9 rounded-2xl flex items-center justify-center text-lg shrink-0 mt-0.5 cursor-pointer hover:scale-105 active:scale-95 transition-all`}
          style={{background:msg.isSystem?'linear-gradient(135deg,#7c3aed,#06b6d4)':`${color}22`,border:`1px solid ${color}28`}}>
          {msg.authorAvatar}
        </div>
      ) : (
        <div className="w-9 shrink-0 flex items-center justify-center">
          <span className="text-[9px] text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">{fmtTime(msg.createdAt)}</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        {!grouped && (
          <div className="flex items-center flex-wrap gap-2 mb-0.5">
            <span onClick={() => !msg.isSystem && onOpenProfile(msg.authorId, msg.authorName, msg.authorAvatar, msg.authorRank, msg.authorXP)}
              className="text-sm font-black cursor-pointer hover:underline" style={{color}}>{msg.authorName}</span>
            {!msg.isSystem && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                style={{background:`${color}20`,color}}>
                {RANKS.find(r=>r.name===msg.authorRank)?.icon || '🌱'} {msg.authorRank}
              </span>
            )}
            <span className="text-[10px] text-gray-700">{fmtTime(msg.createdAt)}</span>
          </div>
        )}

        {msg.content && (
          <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words font-medium
            ${msg.isSending?'text-gray-500':'text-gray-300'}`}>
            {msg.content}
          </div>
        )}

        {/* Media rendering */}
        {msg.mediaType==='image' && msg.mediaUrl && (
          <div className="mt-2">
            <img src={msg.mediaUrl} alt="imagem" loading="lazy"
              className={`rounded-2xl max-h-64 max-w-xs object-cover border border-white/10
                cursor-zoom-in transition-all hover:opacity-90 hover:scale-[1.02]
                ${msg.isSending?'opacity-50':''}`}
              onClick={() => !msg.isSending && onLightbox(msg.mediaUrl!)}
            />
          </div>
        )}
        {msg.mediaType==='video' && msg.mediaUrl && (
          <div className="mt-2 max-w-xs">
            <video src={msg.mediaUrl} controls
              className={`rounded-2xl max-h-64 w-full border border-white/10 ${msg.isSending?'opacity-50':''}`}
            />
          </div>
        )}

        {msg.isSending && !msg.failed && (
          <span className="text-[9px] text-gray-600 font-bold mt-0.5 block">Enviando...</span>
        )}

        {msg.failed && (
          <div className="flex items-center gap-2 mt-1">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0"/>
            <span className="text-[10px] text-red-400 font-bold">Falha ao enviar.</span>
            <button onClick={() => onRetry(msg)}
              className="text-[10px] font-black text-purple-400 hover:text-purple-300 hover:underline transition-colors">
              Tentar novamente
            </button>
          </div>
        )}

        {Object.keys(msg.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {Object.entries(msg.reactions).map(([emoji,count]) => (
              <button key={emoji} onClick={() => onReaction(msg.id,emoji)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-all hover:scale-110"
                style={{background:'rgba(124,58,237,.15)',border:'1px solid rgba(124,58,237,.3)',color:'#a78bfa'}}>
                <span>{emoji}</span><span>{count}</span>
              </button>
            ))}
            <button onClick={onOpenEmoji}
              className="flex items-center px-2 py-0.5 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              style={{background:'rgba(255,255,255,.05)',color:'#6b7280'}}>
              <Plus className="w-3 h-3"/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

/* ─── Main component ────────────────────────────────────────────────────── */
interface Props { userTier: ToolTier; userName?: string; }

export default function UmbraZTool({ userTier, userName = 'Criador' }: Props) {
  const [session,      setSession]      = useState<any>(null);
  const [profile,      setProfile]      = useState<any>(null);
  const [authLoading,  setAuthLoading]  = useState(true);

  const [activeRoom,   setActiveRoom]   = useState(ROOMS[0]);
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [inputValue,   setInputValue]   = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [expandedCats, setExpandedCats] = useState<Record<string,boolean>>({Comunidade:true,Produção:true,Crescimento:true});
  const [showMembers,  setShowMembers]  = useState(true);
  const [showEmoji,    setShowEmoji]    = useState(false);
  const [tab,          setTab]          = useState<TabType>('members');
  const [isMuted,      setIsMuted]      = useState(false);
  const [isDeafened,   setIsDeafened]   = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isSending,    setIsSending]    = useState(false);
  const [isAtBottom,   setIsAtBottom]   = useState(true);
  const [toastAch,     setToastAch]     = useState<AchievementDef|null>(null);
  const [imagePreview, setImagePreview] = useState<{url:string; type:'image'|'video'; file:File; path?:string}|null>(null);
  const [mediaError,   setMediaError]   = useState<string|null>(null);
  const [uploadedPath, setUploadedPath] = useState<string|null>(null);
  const [lastSentAt,   setLastSentAt]   = useState(0);
  const [lightboxUrl,  setLightboxUrl]  = useState<string|null>(null);
  const [viewingProfile, setViewingProfile] = useState<Member|null>(null);
  const [profileCache, setProfileCache] = useState<Record<string, {data:any, ts:number}>>({});
  const [isEditingBio,   setIsEditingBio]   = useState(false);
  const [editingBioText, setEditingBioText] = useState('');

  const [voiceJoined,  setVoiceJoined]  = useState(false);
  const [voiceMuted,   setVoiceMuted]   = useState(false);
  const [voiceVideo,   setVoiceVideo]   = useState(false);
  const [speaking,     setSpeaking]     = useState<string[]>(['u2']);

  const [userXP, setUserXP] = useState<number>(() => {
    const s = localStorage.getItem(XP_KEY); return s ? parseInt(s,10) : 0;
  });
  const [unlockedAchs, setUnlockedAchs] = useState<Set<string>>(() => {
    const s = localStorage.getItem(ACH_KEY);
    return s ? new Set<string>(JSON.parse(s)) : new Set<string>();
  });

  const endRef        = useRef<HTMLDivElement>(null);
  const scrollRef     = useRef<HTMLDivElement>(null);
  const channelRef    = useRef<ReturnType<typeof supabase.channel>|null>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initAuth = async () => {
      const user = await getCurrentUser();
      if (user) {
        setSession(user);
        const p = await getUserProfile(user.id);
        if (p) setProfile(p);
      }
      setAuthLoading(false);
    };
    initAuth();
    const { data: { subscription } } = onAuthStateChange((user) => {
      setSession(user);
      if (!user) { setProfile(null); setAuthLoading(false); }
      else initAuth();
    });
    return () => subscription.unsubscribe();
  }, []);

  const userId = session?.id || 'guest';
  const myName = profile?.name || userName;
  const myTier = profile?.tier || userTier;

  useEffect(() => {
    if (!lightboxUrl) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxUrl(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxUrl]);

  useEffect(() => {
    if (!voiceJoined) return;
    const members = ['u1','u2','u5'];
    const iv = setInterval(() => {
      const pick = Math.floor(Math.random() * members.length);
      setSpeaking([members[pick]]);
      setTimeout(() => setSpeaking([]), 1200);
    }, 2500);
    return () => clearInterval(iv);
  }, [voiceJoined]);

  const userRank = getRank(userXP);
  const nextRank = getNextRank(userXP);
  const xpPct    = getXPPct(userXP);

  useEffect(() => { localStorage.setItem(XP_KEY, String(userXP)); }, [userXP]);

  const canAccess = useCallback(
    (r: Room) => TIER_LEVELS[myTier] >= TIER_LEVELS[r.plan],
    [myTier],
  );

  const unlockAch = useCallback((ach: AchievementDef) => {
    setUnlockedAchs(prev => {
      if (prev.has(ach.id)) return prev;
      const next = new Set(prev).add(ach.id);
      localStorage.setItem(ACH_KEY, JSON.stringify([...next]));
      setToastAch(ach);
      setTimeout(() => setToastAch(null), 4500);
      if (ach.xp > 0) {
        setUserXP(p => p + ach.xp);
        supabase.rpc('increment_user_xp',{ p_amount: ach.xp }).then(()=>{});
      }
      return next;
    });
  }, []);

  const giveXP = useCallback((amount: number, firstMsg=false) => {
    setUserXP(prev => {
      const newXP = prev + amount;
      const oldR  = getRank(prev);
      const newR  = getRank(newXP);
      if (newR.name !== oldR.name) {
        const a = ACHIEVEMENTS.find(x => x.id===`rank-${newR.name.toLowerCase()}`);
        if (a) setTimeout(() => unlockAch(a), 0);
      }
      if (firstMsg) {
        const a = ACHIEVEMENTS.find(x => x.id==='first-message');
        if (a) setTimeout(() => unlockAch(a), 0);
      }
      supabase.rpc('increment_user_xp',{ p_amount: amount }).then(()=>{});
      return newXP;
    });
  }, [unlockAch]);

  useEffect(() => {
    if (myTier !== ToolTier.FREE) {
      const a = ACHIEVEMENTS.find(x=>x.id==='pro-member'); if (a) unlockAch(a);
    }
  }, [myTier, unlockAch]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  }, []);

  useEffect(() => {
    if (isAtBottom) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAtBottom]);

  useEffect(() => {
    setMessages([]);
    setIsLoading(true);
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current=null; }
    if (uploadedPath) {
      supabase.storage.from('umbra-z-media').remove([uploadedPath]).then(()=>{});
      setUploadedPath(null);
      setImagePreview(null);
    }
    const roomId = activeRoom.id;
    supabase
      .from('umbra_z_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at',{ascending:true})
      .limit(80)
      .then(({ data, error }) => {
        setMessages((!error && data && data.length>0)
          ? data.map(mapRow)
          : (SEED[roomId] ?? []));
        setIsLoading(false);
      });
    const ch = supabase.channel(`umbra-z:${roomId}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'umbra_z_messages',filter:`room_id=eq.${roomId}`},
        payload => {
          if (!payload.new) return;
          const incoming = mapRow(payload.new as any);
          setMessages(prev => {
            const tempIdx = prev.findIndex(m =>
              m.isSending && m.authorId===incoming.authorId && m.content===incoming.content);
            if (tempIdx !== -1) {
              const next = [...prev]; next[tempIdx] = incoming; return next;
            }
            if (prev.find(m => m.id===incoming.id)) return prev;
            return [...prev, incoming];
          });
        })
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'umbra_z_messages',filter:`room_id=eq.${roomId}`},
        payload => {
          if (!payload.new) return;
          const updated = mapRow(payload.new as any);
          setMessages(prev => prev.map(m => m.id===updated.id ? updated : m));
        })
      .subscribe();
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); channelRef.current=null; };
  }, [activeRoom.id]);

  const uploadMedia = async (file: File): Promise<{url:string, path:string}> => {
    const ext = file.name.split('.').pop() || 'png';
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('umbra-z-media').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('umbra-z-media').getPublicUrl(path);
    return { url: data.publicUrl, path };
  };

  const handleFile = useCallback(async (file: File) => {
    setMediaError(null);
    const isImg   = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImg && !isVideo) { setMediaError('Somente imagens e vídeos são suportados.'); return; }
    try {
      const localUrl = URL.createObjectURL(file);
      setImagePreview({ url: localUrl, type: isImg ? 'image' : 'video', file });
    } catch {
      setMediaError('Falha ao processar arquivo.');
    }
  }, []);

  const cancelMedia = useCallback(async () => {
    if (uploadedPath) {
      await supabase.storage.from('umbra-z-media').remove([uploadedPath]);
    }
    if (imagePreview?.url.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview.url);
    }
    setUploadedPath(null);
    setImagePreview(null);
    setMediaError(null);
  }, [uploadedPath, imagePreview]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items) as DataTransferItem[];
    const media = items.find(i => i.type.startsWith('image/') || i.type.startsWith('video/'));
    if (media) { const f = media.getAsFile(); if (f) handleFile(f); }
  }, [handleFile]);

  const sendMessage = async () => {
    if ((!inputValue.trim() && !imagePreview) || isSending || !session) return;
    const now = Date.now();
    if (now - lastSentAt < 1000) return;
    setLastSentAt(now);
    setIsSending(true);
    const isFirst  = !unlockedAchs.has('first-message');
    const tempId   = `temp-${now}`;
    const content  = inputValue.trim();
    let mediaUrl = '';
    let mediaType = imagePreview?.type || null;
    let newPath = '';
    if (imagePreview?.file) {
      try {
        const res = await uploadMedia(imagePreview.file);
        mediaUrl = res.url;
        newPath = res.path;
        setUploadedPath(newPath);
      } catch (e: any) {
        setMediaError('Falha no upload: ' + (e.message || 'Erro desconhecido'));
        setIsSending(false);
        return;
      }
    }
    const optimistic: Message = {
      id:tempId, content, roomId:activeRoom.id, authorId:userId,
      authorName:myName, authorRank:userRank.name, authorXP:userXP,
      authorAvatar:'🫵', reactions:{}, isSending:true, createdAt:new Date(),
      mediaUrl: mediaUrl || imagePreview?.url, mediaType,
    };
    setMessages(prev => [...prev, optimistic]);
    setInputValue('');
    setImagePreview(null);
    const { data, error } = await supabase
      .from('umbra_z_messages')
      .insert({
        content, room_id:activeRoom.id, author_id:userId,
        author_name:myName, author_rank:userRank.name,
        author_xp:userXP, author_avatar:'🫵', reactions:{},
        media_url: mediaUrl || null, media_type: mediaType,
      })
      .select().single();
    if (!error && data) {
      setMessages(prev => prev.map(m => m.id===tempId ? mapRow(data) : m));
      giveXP(5, isFirst);
      setUploadedPath(null);
    } else {
      if (newPath) supabase.storage.from('umbra-z-media').remove([newPath]).then(()=>{});
      setMessages(prev => prev.map(m => m.id===tempId ? {...m, isSending:false, failed:true} : m));
    }
    setIsSending(false);
  };

  const retryMessage = useCallback(async (msg: Message) => {
    setMessages(prev => prev.map(m => m.id===msg.id ? {...m,failed:false,isSending:true} : m));
    const { data, error } = await supabase
      .from('umbra_z_messages')
      .insert({
        content:msg.content, room_id:msg.roomId, author_id:msg.authorId,
        author_name:msg.authorName, author_rank:msg.authorRank,
        author_xp:msg.authorXP, author_avatar:msg.authorAvatar, reactions:{},
        media_url: msg.mediaUrl, media_type: msg.mediaType,
      }).select().single();
    if (!error && data) setMessages(prev => prev.map(m => m.id===msg.id ? mapRow(data) : m));
    else setMessages(prev => prev.map(m => m.id===msg.id ? {...m,isSending:false,failed:true} : m));
  }, []);

  const addReaction = useCallback(async (msgId: string, emoji: string) => {
    if (!session) return;
    setMessages(prev => prev.map(m => {
      if (m.id!==msgId) return m;
      const count = m.reactions[emoji] || 0;
      return {...m, reactions:{...m.reactions,[emoji]: count + 1}};
    }));
    await supabase.rpc('toggle_reaction',{ p_msg_id: msgId, p_emoji: emoji });
  }, [session]);

  const openEmoji = useCallback(() => setShowEmoji(p=>!p), []);
  const openLightbox = useCallback((url: string) => setLightboxUrl(url), []);

  const openProfile = useCallback(async (uid: string, name: string, avatar: string, rank: string, xp: number) => {
    const cached = profileCache[uid];
    if (cached && Date.now() - cached.ts < 60000) {
      setViewingProfile(cached.data);
      setIsEditingBio(false);
      return;
    }
    const { data } = await supabase.from('umbra_z_profiles').select('*').eq('user_id', uid).single();
    const prof: any = {
      id: uid, name, avatar, rank, xp,
      status: ONLINE_MEMBERS.find(m=>m.id===uid)?.status || 'offline',
      plan: ToolTier.PRO,
      bio: data?.bio || 'Um cara que é apaixonado por network e canais dark.',
      memberSince: data?.member_since || '2026-04-01',
      friendsCount: data?.friends_count || 12,
      totalMessages: data?.total_messages || 154,
      streak: data?.streak || 3,
      likesReceived: data?.likes_received || 28,
      weeklyXP: data?.weekly_xp || 450,
      maxStreak: data?.max_streak || 7,
    };
    setProfileCache(prev => ({ ...prev, [uid]: { data: prof, ts: Date.now() } }));
    setViewingProfile(prof);
    setIsEditingBio(false);
  }, [profileCache]);

  const updateBio = async () => {
    if (!viewingProfile || viewingProfile.id !== userId) return;
    const { error } = await supabase.from('umbra_z_profiles').upsert({
      user_id: userId,
      bio: editingBioText
    });
    if (!error) {
      const updated = {...viewingProfile, bio: editingBioText};
      setViewingProfile(updated);
      setProfileCache(prev => ({ ...prev, [userId]: { data: updated, ts: Date.now() } }));
      setIsEditingBio(false);
    }
  };

  const selectRoom = useCallback((room: Room) => {
    if (!canAccess(room)) return;
    setMessages([]);
    setIsLoading(true);
    setActiveRoom(room);
    setSidebarOpen(false);
  }, [canAccess]);

  const filteredRooms = useMemo(() =>
    searchQuery.trim()
      ? ROOMS.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : ROOMS,
  [searchQuery]);

  const groupedRooms = useMemo(() =>
    filteredRooms.reduce<Record<string,Room[]>>((acc,r) => {
      (acc[r.category]??=[]).push(r); return acc;
    }, {}),
  [filteredRooms]);

  const SidebarContent = useMemo(() => (
    <aside style={{width:240,background:'#111118',borderRight:'1px solid rgba(255,255,255,.05)',flexShrink:0}}
      className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between border-b" style={{borderColor:'rgba(255,255,255,.05)'}}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg"
            style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)'}}>Z</div>
          <div>
            <div className="text-white font-black text-sm">Umbra Z</div>
            <div className="text-[9px] font-black uppercase tracking-widest" style={{color:'#7c3aed'}}>Comunidade</div>
          </div>
        </div>
        <button className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
          onClick={() => setSidebarOpen(false)}><X className="w-4 h-4"/></button>
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{background:'rgba(255,255,255,.05)'}}>
          <Search className="w-3.5 h-3.5 text-gray-600 shrink-0"/>
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-gray-400 outline-none w-full placeholder-gray-600 font-medium"
            placeholder="Buscar canal..."/>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {Object.entries(groupedRooms).map(([cat,rooms]) => (
          <div key={cat} className="mb-3">
            <button onClick={() => setExpandedCats(p=>({...p,[cat]:!p[cat]}))}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-[.15em] flex-1 text-left"
                style={{color:CAT_COLORS[cat]||'#6b7280'}}>{cat}</span>
              <ChevronDown className={`w-3 h-3 text-gray-600 transition-transform ${expandedCats[cat]?'':'rotate-[-90deg]'}`}/>
            </button>
            {expandedCats[cat] && rooms.map(room => {
              const ok     = canAccess(room);
              const active = activeRoom.id===room.id;
              return (
                <button key={room.id}
                  onClick={() => selectRoom(room)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl transition-all mb-0.5 text-xs
                    ${active?'text-white':ok?'text-gray-500 hover:text-gray-300 hover:bg-white/5':'text-gray-700 cursor-not-allowed opacity-40'}`}
                  style={active?{background:'linear-gradient(135deg,rgba(124,58,237,.2),rgba(236,72,153,.1))',borderLeft:'2px solid #7c3aed'}:{}}>
                  <span>{room.emoji}</span>
                  {room.type==='voice'?<Volume2 className="w-3.5 h-3.5 shrink-0"/>:<Hash className="w-3.5 h-3.5 shrink-0"/>}
                  <span className="flex-1 text-left font-bold truncate">{room.name}</span>
                  {!ok && <Lock className="w-3 h-3 text-gray-700 shrink-0"/>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="p-3 border-t" style={{borderColor:'rgba(255,255,255,.05)',background:'rgba(0,0,0,.3)'}}>
        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
              style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)'}}>🫵</div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
              style={{background:'#22c55e',borderColor:'#111118'}}/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black text-white truncate">{myName}</div>
            <div className="text-[9px] font-black" style={{color:userRank.color}}>{userRank.icon} {userRank.name} · {userXP} XP</div>
          </div>
        </div>
      </div>
    </aside>
  ), [activeRoom.id, expandedCats, userXP, sidebarOpen, searchQuery, groupedRooms, myName, userRank, canAccess, selectRoom]);

  const RightPanel = useMemo(() => !showMembers ? null : (
    <aside style={{width:220,background:'#111118',borderLeft:'1px solid rgba(255,255,255,.05)',flexShrink:0}}
      className="hidden lg:flex flex-col h-full">
      <div className="flex border-b" style={{borderColor:'rgba(255,255,255,.05)'}}>
        {(['members','achievements'] as TabType[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-colors border-b-2
              ${tab===t?'text-white':'text-gray-600 border-transparent hover:text-gray-400'}`}
            style={tab===t?{borderColor:'#7c3aed'}:{}}>
            {t==='members'?'👥 Membros':'🏆 XP & Ranks'}
          </button>
        ))}
      </div>
      {tab==='members' && (
        <div className="flex-1 overflow-y-auto p-3">
          {(['online','away','offline'] as const).map(status => {
            const list = ONLINE_MEMBERS.filter(m=>m.status===status);
            if (!list.length) return null;
            return (
              <div key={status} className="mb-4">
                <div className="text-[9px] font-black uppercase tracking-[.15em] mb-2 px-1" style={{color:statusDot(status)}}>
                  {status==='online'?'🟢 Online':status==='away'?'🟡 Ausente':'⚫ Offline'} — {list.length}
                </div>
                {list.map(m => (
                  <div key={m.id} onClick={() => openProfile(m.id, m.name, m.avatar, m.rank, m.xp)}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer mb-1 group">
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm"
                        style={{background:`${rankColor(m.rank)}22`,border:`1px solid ${rankColor(m.rank)}30`}}>{m.avatar}</div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border"
                        style={{background:statusDot(m.status),borderColor:'#111118'}}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors truncate">{m.name}</div>
                      <div className="text-[9px] font-black" style={{color:rankColor(m.rank)}}>{RANKS.find(r=>r.name===m.rank)?.icon || '🌱'} {m.rank}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
      {tab==='achievements' && (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="p-3 rounded-2xl mb-4"
            style={{background:'linear-gradient(135deg,rgba(124,58,237,.15),rgba(236,72,153,.1))',border:'1px solid rgba(124,58,237,.2)'}}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{userRank.icon}</span>
              <div>
                <div className="text-sm font-black text-white">{userRank.name}</div>
                <div className="text-[9px] text-gray-500 font-black">{userXP} XP total</div>
              </div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{background:'rgba(255,255,255,.05)'}}>
              <div className="h-full rounded-full" style={{width:`${xpPct}%`,background:`linear-gradient(90deg,${userRank.color},${nextRank?.color||userRank.color})`}}/>
            </div>
          </div>
        </div>
      )}
    </aside>
  ), [showMembers, tab, userXP, userRank, nextRank, xpPct, openProfile]);

  return (
    <div className="flex h-full rounded-[32px] overflow-hidden border border-white/5 shadow-2xl relative"
      style={{minHeight:'80vh',background:'#0d0d14'}}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}/>
      )}
      <div className={`fixed inset-y-0 left-0 z-40 md:relative md:z-auto transition-transform duration-300
        ${sidebarOpen?'translate-x-0':'-translate-x-full md:translate-x-0'}`} style={{width:240}}>
        {SidebarContent}
      </div>
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <div className="h-14 border-b flex items-center justify-between px-4 shrink-0"
          style={{borderColor:'rgba(255,255,255,.05)',background:'rgba(0,0,0,.25)',backdropFilter:'blur(20px)'}}>
          <div className="flex items-center gap-2">
            <button className="md:hidden p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all mr-1"
              onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5"/></button>
            <span className="text-lg">{activeRoom.emoji}</span>
            <span className="font-black text-white text-sm">{activeRoom.name}</span>
          </div>
        </div>
        {activeRoom.type==='voice' ? (
          !voiceJoined ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="w-28 h-28 rounded-[32px] flex items-center justify-center text-5xl mx-auto mb-6"
                  style={{background:'linear-gradient(135deg,rgba(124,58,237,.25),rgba(236,72,153,.15))',border:'1px solid rgba(124,58,237,.4)'}}>🎙️</div>
                <h3 className="text-2xl font-black text-white mb-1">{activeRoom.name}</h3>
                <button onClick={() => setVoiceJoined(true)}
                  className="mt-6 px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95"
                  style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)'}}>🎙️ Entrar na Sala</button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col" style={{background:'#09090f'}}>
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg w-full">
                  <div className="flex flex-col items-center gap-2 p-4 rounded-3xl relative"
                    style={{background:'linear-gradient(135deg,rgba(124,58,237,.2),rgba(236,72,153,.1))',border:'2px solid rgba(124,58,237,.5)'}}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                      style={{background:'rgba(124,58,237,.3)'}}>🫵</div>
                    <span className="text-xs font-black text-white truncate max-w-full">{myName}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 mt-8 border-t border-white/5 pt-8 pb-6">
                <div className="flex items-center gap-3">
                  <button onClick={() => setVoiceMuted(!voiceMuted)}
                    className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all hover:scale-110 active:scale-95
                      ${voiceMuted ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                    {voiceMuted ? <MicOff className="w-5 h-5"/> : <Mic className="w-5 h-5"/>}
                  </button>
                  <button onClick={() => setVoiceVideo(!voiceVideo)}
                    className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all hover:scale-110 active:scale-95
                      ${voiceVideo ? 'bg-purple-600 shadow-xl shadow-purple-600/20 text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                    <Video className="w-5 h-5"/>
                  </button>
                  <button className="w-12 h-12 rounded-[1.25rem] bg-white/5 text-white flex items-center justify-center transition-all hover:bg-white/10 hover:scale-110 active:scale-95">
                    <Monitor className="w-5 h-5"/>
                  </button>
                  <button onClick={() => setVoiceJoined(false)}
                    className="w-12 h-12 rounded-[1.25rem] bg-red-500 shadow-xl shadow-red-500/20 text-white flex items-center justify-center transition-all hover:bg-red-600 hover:scale-110 active:scale-95">
                    <PhoneOff className="w-5 h-5"/>
                  </button>
                </div>
                <p className="text-[9px] text-yellow-500/70 font-black uppercase tracking-widest mt-3 flex items-center gap-1.5 bg-yellow-500/5 px-3 py-1 rounded-full border border-yellow-500/10">
                  <span className="w-1 h-1 rounded-full bg-yellow-500 animate-pulse"/>
                  Chamadas em beta — Áudio em breve
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col relative overflow-hidden">
            <div ref={scrollRef} onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar scroll-smooth space-y-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3"/>
                    <p className="text-gray-600 text-xs font-bold">Carregando mensagens...</p>
                  </div>
                </div>
              ) : messages.map((m,i) => (
                  <MessageBubble key={m.id}
                    msg={m} prevMsg={messages[i-1]}
                    onReaction={addReaction}
                    onRetry={retryMessage}
                    onOpenEmoji={openEmoji}
                    onLightbox={openLightbox}
                    onOpenProfile={openProfile}
                  />
                ))
              }
              <div ref={endRef}/>
            </div>

            {/* New messages indicator when not at bottom */}
            {!isAtBottom && (
              <button onClick={() => { endRef.current?.scrollIntoView({behavior:'smooth'}); setIsAtBottom(true); }}
                className="absolute bottom-[100px] left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[10px] font-black text-white shadow-2xl transition-all hover:scale-105 active:scale-95 z-10"
                style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)', border:'1px solid rgba(255,255,255,0.1)'}}>
                ↓ Novas mensagens
              </button>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden"
              onChange={e => { const f=e.target.files?.[0]; if(f) handleFile(f); e.target.value=''; }}/>
            <div className="p-4 shrink-0" style={{background:'rgba(0,0,0,.3)',borderTop:'1px solid rgba(255,255,255,.05)'}}>
              {imagePreview && (
                <div className="p-3 bg-black/40 border-b border-white/5 flex items-center gap-3 animate-in slide-in-from-bottom-2">
                  <div className="relative group/prev">
                    {imagePreview.type==='image' ? (
                      <img src={imagePreview.url} className="w-12 h-12 rounded-xl object-cover border border-white/10"/>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-purple-900/30 flex items-center justify-center border border-white/10">📹</div>
                    )}
                    <button onClick={cancelMedia} 
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/prev:opacity-100 transition-opacity">
                      <X className="w-3 h-3"/>
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preview de mídia</div>
                    <div className="text-[9px] text-gray-600 truncate">{imagePreview.file.name} ({(imagePreview.file.size/1024/1024).toFixed(1)}MB)</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{background:'rgba(255,255,255,.04)',border:`1px solid ${imagePreview?'rgba(124,58,237,.4)':'rgba(255,255,255,.07)'}`}}>
                <button onClick={() => setShowEmoji(p=>!p)} className="text-gray-500 hover:text-yellow-400 transition-colors shrink-0">
                  <Smile className="w-5 h-5"/>
                </button>
                <input
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  onPaste={handlePaste}
                  placeholder={imagePreview ? 'Adicione uma legenda (opcional)...' : `Mensagem em #${activeRoom.name}`}
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-600 font-medium"
                />
                <button onClick={() => fileInputRef.current?.click()}
                  className={`text-gray-500 hover:text-purple-400 transition-colors shrink-0 ${imagePreview?'text-purple-400':''}`}>
                  {imagePreview ? <ImageIcon className="w-4 h-4"/> : <Paperclip className="w-4 h-4"/>}
                </button>
                <button onClick={sendMessage}
                  disabled={(!inputValue.trim()&&!imagePreview)||isSending}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  style={{background:(inputValue.trim()||imagePreview)&&!isSending?'linear-gradient(135deg,#7c3aed,#ec4899)':'rgba(255,255,255,.05)'}}>
                  <Send className="w-4 h-4 text-white"/>
                </button>
              </div>
              <div className="flex items-center justify-between mt-1.5 px-1">
                <span className="text-[9px] text-gray-700 font-black">📎 Clique no clipe ou cole (Ctrl+V) para enviar mídia</span>
                <span className="text-[9px] font-black" style={{color:userRank.color}}>{userRank.icon} {userRank.name} · {userXP} XP</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {RightPanel}

      {/* Achievement toast */}
      {toastAch && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 p-4 rounded-2xl shadow-2xl"
            style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)',border:'1px solid rgba(255,255,255,.15)'}}>
            <span className="text-3xl">{toastAch.icon}</span>
            <div>
              <div className="text-[9px] font-black text-white/70 uppercase tracking-widest">Conquista Desbloqueada!</div>
              <div className="text-base font-black text-white">{toastAch.name}</div>
              <div className="text-xs text-white/70 font-medium">{toastAch.description}</div>
              {toastAch.xp>0 && <div className="text-xs font-black text-yellow-300 mt-0.5">+{toastAch.xp} XP bônus concedido!</div>}
            </div>
            <button onClick={() => setToastAch(null)} className="text-white/60 hover:text-white ml-1 transition-colors">
              <X className="w-4 h-4"/>
            </button>
          </div>
        </div>
      )}

      {/* ── Lightbox modal ── */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{background:'rgba(0,0,0,.92)',backdropFilter:'blur(20px)'}}
          onClick={() => setLightboxUrl(null)}
        >
          {/* Click inside image doesn't close */}
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={e => e.stopPropagation()}>

            <img src={lightboxUrl} alt="visualização"
              className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl object-contain"
              style={{border:'1px solid rgba(255,255,255,.1)'}}
            />

            {/* Close button */}
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full flex items-center justify-center
                text-white transition-all hover:scale-110 shadow-xl"
              style={{background:'rgba(0,0,0,.8)',border:'1px solid rgba(255,255,255,.15)'}}>
              <X className="w-5 h-5"/>
            </button>

            {/* Download button */}
            <a
              href={lightboxUrl} download="umbra-z-image"
              onClick={e => e.stopPropagation()}
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full
                text-xs font-black text-white transition-all hover:scale-105 shadow-xl"
              style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)',border:'1px solid rgba(255,255,255,.15)'}}>
              ⬇ Baixar imagem
            </a>
          </div>

          {/* Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-600 font-bold">
            Pressione Esc ou clique fora para fechar
          </div>
        </div>
      )}

      {/* ── Profile Modal ── */}
      {viewingProfile && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setViewingProfile(null)}>
          <div className="w-full max-w-lg rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border border-white/5 animate-in zoom-in-95 duration-200"
            style={{background:'#0d0d14'}} onClick={e=>e.stopPropagation()}>
            
            {/* Header / Banner */}
            <div className="h-28 shrink-0 relative" style={{background: rankColor(viewingProfile.rank)}}>
              <button onClick={() => setViewingProfile(null)} 
                className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors">
                <X className="w-4 h-4 text-white"/>
              </button>
            </div>

            <div className="px-6 pb-6 -mt-14 relative flex-1 overflow-y-auto custom-scrollbar">
              {/* Avatar large */}
              <div className="flex justify-between items-end mb-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-5xl border-[6px]"
                    style={{background: '#1a1a23', borderColor: '#0d0d14'}}>{viewingProfile.avatar}</div>
                  <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full border-4"
                    style={{background: statusDot(viewingProfile.status), borderColor: '#0d0d14'}}/>
                </div>
                <div className="flex gap-2 mb-2">
                  <button className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all hover:scale-105"
                    style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)'}}>💬 Enviar mensagem</button>
                  <button className="px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#7c3aed] border border-[#7c3aed]/30 bg-[#7c3aed]/10 transition-all hover:scale-105">
                    Adicionar Amigo
                  </button>
                </div>
              </div>

              {/* Identity */}
              <div className="p-4 rounded-3xl bg-white/[.03] border border-white/[.05] mb-4">
                <h2 className="text-xl font-black text-white">@{viewingProfile.name.toLowerCase()}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-black" style={{color: rankColor(viewingProfile.rank)}}>
                    {RANKS.find(r=>r.name===viewingProfile.rank)?.icon} {viewingProfile.rank}
                  </span>
                  <span className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">Membro desde {new Date(viewingProfile.memberSince!).toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="mt-4">
                  {isEditingBio ? (
                    <div className="flex flex-col gap-2">
                      <textarea value={editingBioText} onChange={e=>setEditingBioText(e.target.value)}
                        className="w-full bg-black/40 rounded-xl p-3 text-xs text-gray-300 outline-none border border-white/10" rows={3}/>
                      <div className="flex gap-2 justify-end">
                        <button onClick={()=>setIsEditingBio(false)} className="text-[10px] font-black text-gray-500">Cancelar</button>
                        <button onClick={updateBio} className="text-[10px] font-black text-purple-400">Salvar</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 leading-relaxed group relative">
                      {viewingProfile.bio}
                      {viewingProfile.id === userId && (
                        <button onClick={() => { setIsEditingBio(true); setEditingBioText(viewingProfile.bio!); }}
                          className="ml-2 text-[9px] text-purple-400 font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Editar</button>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: 'XP Conquistado', val: viewingProfile.xp },
                  { label: 'Mensagens', val: viewingProfile.totalMessages },
                  { label: 'Streak', val: `${viewingProfile.streak}d` },
                  { label: 'Curtidas', val: viewingProfile.likesReceived },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-2xl bg-white/[.02] border border-white/[.04] text-center">
                    <div className="text-[11px] font-black text-white">{s.val}</div>
                    <div className="text-[8px] font-black text-gray-600 uppercase mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div className="p-4 rounded-3xl bg-white/[.03] border border-white/[.05] mb-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📘</span>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Progresso de Patente</span>
                  </div>
                  <div className="text-[10px] font-black text-gray-500">{viewingProfile.xp} / {getNextRank(viewingProfile.xp)?.min || '---'} XP</div>
                </div>
                
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-[10px] font-black" style={{color: rankColor(viewingProfile.rank)}}>{viewingProfile.rank}</span>
                  {getNextRank(viewingProfile.xp) && (
                    <span className="text-[10px] font-black text-gray-700 tracking-wider">
                      (faltam {(getNextRank(viewingProfile.xp)?.min || 0) - viewingProfile.xp} XP)
                    </span>
                  )}
                  <span className="text-[10px] font-black text-gray-600">{getNextRank(viewingProfile.xp)?.name || 'Max.'}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-black/40">
                  <div className="h-full rounded-full transition-all duration-1000" 
                    style={{width:`${getXPPct(viewingProfile.xp)}%`, background: `linear-gradient(90deg, ${rankColor(viewingProfile.rank)}, ${getNextRank(viewingProfile.xp)?.color || rankColor(viewingProfile.rank)})`}}/>
                </div>
              </div>

              {/* Patents List */}
              <div className="p-4 rounded-3xl bg-white/[.03] border border-white/[.05] mb-4">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Patentes</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {RANKS.map(r => {
                    const ok = viewingProfile.xp >= r.min;
                    return (
                      <div key={r.name} className={`flex items-center gap-3 ${ok?'':'opacity-30'}`}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                          style={{background: ok ? `${r.color}22` : 'rgba(255,255,255,.05)', border: `1px solid ${ok?r.color+'30':'rgba(255,255,255,.05)'}`}}>
                          {r.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-[11px] font-black text-white">{r.name}</div>
                          <div className="text-[8px] text-gray-600 font-bold">XP Mínimo: {r.min}</div>
                        </div>
                        {ok && <Check className="w-3.5 h-3.5" style={{color:r.color}}/>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Achievements & Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-3xl bg-white/[.03] border border-white/[.05]">
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Conquistas ({unlockedAchs.size})</div>
                  <div className="py-2 space-y-1">
                    {unlockedAchs.size > 0 ? (
                      [...unlockedAchs].map(aid => {
                        const a = ACHIEVEMENTS.find(x=>x.id===aid);
                        if (!a) return null;
                        return (
                          <div key={aid} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 border border-white/5">
                            <span className="text-sm">{a.icon}</span>
                            <span className="text-[10px] font-bold text-gray-300">{a.name}</span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[10px] text-gray-700 font-bold italic text-center py-2">Nenhuma conquista ainda.</p>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-white/[.03] border border-white/[.05]">
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Estatísticas</div>
                  <div className="space-y-2">
                    {[
                      { l: 'XP Semanal', v: viewingProfile.weeklyXP },
                      { l: 'Total de Msgs', v: viewingProfile.totalMessages },
                      { l: 'Streak Atual', v: `${viewingProfile.streak} dias` },
                      { l: 'Maior Streak', v: `${viewingProfile.maxStreak} dias` },
                      { l: 'Amigos', v: viewingProfile.friendsCount },
                    ].map(st => (
                      <div key={st.l} className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-600 font-bold">{st.l}</span>
                        <span className="text-white font-black">{st.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Auth Loading Overlay ── */}
      {authLoading && (
        <div className="fixed inset-0 z-[200] bg-[#0d0d14] flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl border-4 border-purple-600 border-t-transparent animate-spin mb-4"/>
          <div className="text-white font-black text-xs uppercase tracking-[0.2em]">Autenticando Umbra Z...</div>
        </div>
      )}

      {/* ── No Session Overlay ── */}
      {!authLoading && !session && (
        <div className="fixed inset-0 z-[190] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-[#111118] border border-white/10 p-8 rounded-[2.5rem] shadow-2xl max-w-sm text-center">
            <div className="w-16 h-16 rounded-[2rem] bg-purple-600/20 text-purple-600 flex items-center justify-center text-3xl mx-auto mb-6">🔒</div>
            <h3 className="text-xl font-black text-white mb-2">Acesso Restrito</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">Você precisa estar logado no Umbra Hub para acessar a comunidade Umbra Z.</p>
            <button onClick={() => window.location.href='/login'} 
              className="w-full py-4 rounded-2xl bg-purple-600 text-white font-black uppercase text-xs tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20">
              Fazer Login agora
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
