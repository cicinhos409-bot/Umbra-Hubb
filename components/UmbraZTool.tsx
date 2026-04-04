
import React, {
  useState, useEffect, useRef, useCallback, useMemo, memo,
} from 'react';
import { ToolTier } from '../types';
import { supabase } from '../services/supabaseClient';
import {
  Hash, Volume2, Send, Smile, Paperclip, Mic, MicOff, Headphones,
  Search, ChevronDown, X, Plus, Users, Lock, Menu, Check, AlertCircle,
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
}

interface Member {
  id: string; name: string; rank: string; xp: number;
  avatar: string; status: 'online' | 'away' | 'offline'; plan: ToolTier;
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
}

/* ─── Static data ───────────────────────────────────────────────────────── */
const RANKS = [
  { name: 'Iniciante',  min: 0,     color: '#6b7280', icon: '🌱' },
  { name: 'Aprendiz',   min: 100,   color: '#3b82f6', icon: '📘' },
  { name: 'Criador',    min: 500,   color: '#8b5cf6', icon: '🎬' },
  { name: 'Pro',        min: 1500,  color: '#a855f7', icon: '⚡' },
  { name: 'Elite',      min: 4000,  color: '#ec4899', icon: '💎' },
  { name: 'Lenda',      min: 10000, color: '#f59e0b', icon: '👑' },
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
  };
}

/* ─── MessageBubble — extracted as React.memo to avoid full-list re-renders */
const MessageBubble = memo(({ msg, prevMsg, onReaction, onRetry, onOpenEmoji }: MsgBubbleProps) => {
  const grouped = prevMsg?.authorId===msg.authorId && !msg.isSystem
    && (msg.createdAt.getTime() - (prevMsg?.createdAt?.getTime()??0)) < 300000;
  const color = msg.isSystem ? '#06b6d4' : rankColor(msg.authorRank);

  return (
    <div
      className={`group flex gap-3 px-3 py-1.5 rounded-2xl transition-all ${!grouped?'mt-3':'mt-0.5'} ${msg.failed?'':'hover:bg-white/[.03]'}`}
      style={msg.failed?{background:'rgba(239,68,68,.05)',border:'1px solid rgba(239,68,68,.15)'}:{}}>
      {!grouped ? (
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg shrink-0 mt-0.5"
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
            <span className="text-sm font-black" style={{color}}>{msg.authorName}</span>
            {!msg.isSystem && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                style={{background:`${color}20`,color}}>
                {RANKS.find(r=>r.name===msg.authorRank)?.icon} {msg.authorRank}
              </span>
            )}
            <span className="text-[10px] text-gray-700">{fmtTime(msg.createdAt)}</span>
          </div>
        )}

        <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words font-medium
          ${msg.isSending?'text-gray-500':'text-gray-300'}`}>
          {msg.content}
        </div>

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
  const [activeRoom,   setActiveRoom]   = useState<Room>(ROOMS[0]);
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

  const userRank = getRank(userXP);
  const nextRank = getNextRank(userXP);
  const xpPct    = getXPPct(userXP);
  const userId   = useMemo(() => `user_${userName.replace(/\s+/g,'_').toLowerCase()}`, [userName]);

  /* ── Save XP to localStorage ── */
  useEffect(() => { localStorage.setItem(XP_KEY, String(userXP)); }, [userXP]);

  /* ── Memoised access check (fix: was recreated every render) ── */
  const canAccess = useCallback(
    (r: Room) => TIER_LEVELS[userTier] >= TIER_LEVELS[r.plan],
    [userTier],
  );

  /* ── Unlock achievement — also grants XP bonus ── */
  const unlockAch = useCallback((ach: AchievementDef) => {
    setUnlockedAchs(prev => {
      if (prev.has(ach.id)) return prev;
      const next = new Set(prev).add(ach.id);
      localStorage.setItem(ACH_KEY, JSON.stringify([...next]));
      setToastAch(ach);
      setTimeout(() => setToastAch(null), 4500);

      // Grant XP bonus directly (not via giveXP to avoid potential loops)
      if (ach.xp > 0) {
        setUserXP(p => p + ach.xp);
        supabase.rpc('increment_user_xp',{ p_user_id: userId, p_amount: ach.xp }).then(()=>{});
      }
      return next;
    });
  }, [userId]);

  /* ── Give XP + detect rank-up ── */
  const giveXP = useCallback((amount: number, firstMsg=false) => {
    setUserXP(prev => {
      const newXP = prev + amount;
      const oldR  = getRank(prev);
      const newR  = getRank(newXP);
      if (newR.name !== oldR.name) {
        const a = ACHIEVEMENTS.find(x => x.id===`rank-${newR.name.toLowerCase()}`);
        if (a) setTimeout(() => unlockAch(a), 0); // defer to avoid setState-in-setState
      }
      if (firstMsg) {
        const a = ACHIEVEMENTS.find(x => x.id==='first-message');
        if (a) setTimeout(() => unlockAch(a), 0);
      }
      supabase.rpc('increment_user_xp',{ p_user_id: userId, p_amount: amount }).then(()=>{});
      return newXP;
    });
  }, [unlockAch, userId]);

  /* ── Pro achievement ── */
  useEffect(() => {
    if (userTier !== ToolTier.FREE) {
      const a = ACHIEVEMENTS.find(x=>x.id==='pro-member'); if (a) unlockAch(a);
    }
  }, [userTier, unlockAch]);

  /* ── Smart scroll: only auto-scroll when already at bottom ── */
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
  }, []);

  useEffect(() => {
    if (isAtBottom) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAtBottom]);

  /* ── Load messages + Realtime ── */
  useEffect(() => {
    // Fix: clear immediately on room switch — no stale frame
    setMessages([]);
    setIsLoading(true);

    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current=null; }

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
          const incoming = mapRow(payload.new as Record<string,unknown>);
          setMessages(prev => {
            // Swap optimistic temp → confirmed
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
          const updated = mapRow(payload.new as Record<string,unknown>);
          setMessages(prev => prev.map(m => m.id===updated.id ? updated : m));
        })
      .subscribe();

    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); channelRef.current=null; };
  }, [activeRoom.id]);

  /* ── Send: optimistic → confirm/rollback ── */
  const sendMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    setIsSending(true);
    const isFirst = !unlockedAchs.has('first-message');
    const tempId  = `temp-${Date.now()}`;
    const content = inputValue.trim();

    const optimistic: Message = {
      id:tempId, content, roomId:activeRoom.id, authorId:userId,
      authorName:userName, authorRank:userRank.name, authorXP:userXP,
      authorAvatar:'🫵', reactions:{}, isSending:true, createdAt:new Date(),
    };
    setMessages(prev => [...prev, optimistic]);
    setInputValue('');

    const { data, error } = await supabase
      .from('umbra_z_messages')
      .insert({
        content, room_id:activeRoom.id, author_id:userId,
        author_name:userName, author_rank:userRank.name,
        author_xp:userXP, author_avatar:'🫵', reactions:{},
      })
      .select().single();

    if (!error && data) {
      setMessages(prev => prev.map(m => m.id===tempId ? mapRow(data) : m));
      giveXP(5, isFirst);
    } else {
      setMessages(prev => prev.map(m => m.id===tempId ? {...m, isSending:false, failed:true} : m));
    }
    setIsSending(false);
  };

  /* ── Retry failed message ── */
  const retryMessage = useCallback(async (msg: Message) => {
    setMessages(prev => prev.map(m => m.id===msg.id ? {...m,failed:false,isSending:true} : m));
    const { data, error } = await supabase
      .from('umbra_z_messages')
      .insert({
        content:msg.content, room_id:msg.roomId, author_id:msg.authorId,
        author_name:msg.authorName, author_rank:msg.authorRank,
        author_xp:msg.authorXP, author_avatar:msg.authorAvatar, reactions:{},
      }).select().single();
    if (!error && data) setMessages(prev => prev.map(m => m.id===msg.id ? mapRow(data) : m));
    else setMessages(prev => prev.map(m => m.id===msg.id ? {...m,isSending:false,failed:true} : m));
  }, []);

  /* ── Atomic reaction via RPC ── */
  const addReaction = useCallback(async (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id!==msgId) return m;
      return {...m, reactions:{...m.reactions,[emoji]:(m.reactions[emoji]??0)+1}};
    }));
    await supabase.rpc('add_reaction',{ p_msg_id: msgId, p_emoji: emoji });
  }, []);

  const openEmoji = useCallback(() => setShowEmoji(p=>!p), []);

  /* ── Filtered + grouped rooms ── */
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

  /* ── Sidebar (memoised — canAccess is now stable via useCallback) ── */
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
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-600 hover:text-gray-400 shrink-0 transition-colors">
              <X className="w-3 h-3"/></button>
          )}
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
                  onClick={() => {
                    if (!ok) return;
                    // Clear immediately before loading (fix: no stale frame)
                    setMessages([]);
                    setIsLoading(true);
                    setActiveRoom(room);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl transition-all mb-0.5 text-xs
                    ${active?'text-white':ok?'text-gray-500 hover:text-gray-300 hover:bg-white/5':'text-gray-700 cursor-not-allowed opacity-40'}`}
                  style={active?{background:'linear-gradient(135deg,rgba(124,58,237,.2),rgba(236,72,153,.1))',borderLeft:'2px solid #7c3aed'}:{}}>
                  <span>{room.emoji}</span>
                  {room.type==='voice'?<Volume2 className="w-3.5 h-3.5 shrink-0"/>:<Hash className="w-3.5 h-3.5 shrink-0"/>}
                  <span className="flex-1 text-left font-bold truncate">{room.name}</span>
                  {!ok && <Lock className="w-3 h-3 text-gray-700 shrink-0"/>}
                  {room.unread!=null && ok && (
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-black"
                      style={{background:'#7c3aed'}}>{room.unread}</span>)}
                  {room.online!=null && ok && (
                    <span className="text-[9px] font-black text-green-500 flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"/>{room.online}</span>)}
                </button>
              );
            })}
            {searchQuery && rooms.length===0 && (
              <p className="px-2 py-2 text-[10px] text-gray-600 font-medium">Nenhum resultado.</p>
            )}
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
            <div className="text-xs font-black text-white truncate">{userName}</div>
            <div className="text-[9px] font-black" style={{color:userRank.color}}>{userRank.icon} {userRank.name} · {userXP} XP</div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setIsMuted(p=>!p)}
              className={`p-1.5 rounded-lg transition-all ${isMuted?'text-red-500 bg-red-500/10':'text-gray-500 hover:text-white hover:bg-white/5'}`}>
              {isMuted?<MicOff className="w-3.5 h-3.5"/>:<Mic className="w-3.5 h-3.5"/>}
            </button>
            <button onClick={() => setIsDeafened(p=>!p)}
              className={`p-1.5 rounded-lg transition-all ${isDeafened?'text-red-500 bg-red-500/10':'text-gray-500 hover:text-white hover:bg-white/5'}`}>
              <Headphones className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest">XP</span>
            {nextRank && <span className="text-[8px] font-black" style={{color:nextRank.color}}>→ {nextRank.name} ({nextRank.min-userXP})</span>}
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,.05)'}}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{width:`${xpPct}%`,background:`linear-gradient(90deg,${userRank.color},${nextRank?.color||userRank.color})`}}/>
          </div>
        </div>
      </div>
    </aside>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [activeRoom.id, expandedCats, userXP, sidebarOpen, isMuted, isDeafened, searchQuery, groupedRooms, nextRank, userRank, xpPct, userName, canAccess]);

  /* ── Right panel (memoised) ── */
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
                  <div key={m.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer mb-1 group">
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center text-sm"
                        style={{background:`${rankColor(m.rank)}20`,border:`1px solid ${rankColor(m.rank)}30`}}>{m.avatar}</div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border"
                        style={{background:statusDot(m.status),borderColor:'#111118'}}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors truncate">{m.name}</div>
                      <div className="text-[9px] font-black" style={{color:rankColor(m.rank)}}>{RANKS.find(r=>r.name===m.rank)?.icon} {m.rank}</div>
                    </div>
                    {m.plan!==ToolTier.FREE && (
                      <span className="text-[8px] font-black px-1 py-0.5 rounded"
                        style={{background:m.plan===ToolTier.TURBO?'rgba(236,72,153,.15)':'rgba(124,58,237,.15)',
                          color:m.plan===ToolTier.TURBO?'#ec4899':'#a855f7'}}>{m.plan}</span>
                    )}
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
            {nextRank && <div className="text-[9px] text-gray-600 font-black">{nextRank.min-userXP} XP para {nextRank.icon} {nextRank.name}</div>}
          </div>

          <div className="text-[9px] font-black uppercase tracking-[.15em] text-gray-600 mb-2 px-1">Patentes</div>
          {RANKS.map(rank => {
            const earned = userXP>=rank.min;
            return (
              <div key={rank.name} className={`flex items-center gap-2 p-2 rounded-xl mb-1 ${!earned?'opacity-35':''}`}
                style={{background:earned?`${rank.color}12`:'rgba(255,255,255,.02)',border:`1px solid ${earned?rank.color+'25':'rgba(255,255,255,.03)'}`}}>
                <span className="text-lg">{rank.icon}</span>
                <div className="flex-1">
                  <div className="text-xs font-black" style={{color:earned?rank.color:'#4b5563'}}>{rank.name}</div>
                  <div className="text-[9px] text-gray-600 font-medium">{rank.min.toLocaleString()} XP</div>
                </div>
                {earned && <Check className="w-3.5 h-3.5" style={{color:rank.color}}/>}
              </div>
            );
          })}

          <div className="text-[9px] font-black uppercase tracking-[.15em] text-gray-600 mt-4 mb-2 px-1">Conquistas</div>
          {ACHIEVEMENTS.map(ach => {
            const earned = unlockedAchs.has(ach.id);
            return (
              <div key={ach.id} className={`flex items-center gap-2 p-2 rounded-xl mb-1 ${!earned?'opacity-35':''}`}
                style={{background:earned?'rgba(124,58,237,.08)':'rgba(255,255,255,.02)',border:`1px solid ${earned?'rgba(124,58,237,.2)':'rgba(255,255,255,.03)'}`}}>
                <span className="text-lg">{ach.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-black truncate ${earned?'text-white':'text-gray-600'}`}>{ach.name}</div>
                  <div className="text-[9px] text-gray-600 truncate">{ach.description}</div>
                </div>
                {ach.xp>0 && <span className="text-[9px] font-black shrink-0" style={{color:'#7c3aed'}}>+{ach.xp}</span>}
              </div>
            );
          })}
        </div>
      )}
    </aside>
  ), [showMembers, tab, userXP, userRank, nextRank, xpPct, unlockedAchs]);

  /* ─── Render ─────────────────────────────────────────────────────────── */
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

        {/* Channel header */}
        <div className="h-14 border-b flex items-center justify-between px-4 shrink-0"
          style={{borderColor:'rgba(255,255,255,.05)',background:'rgba(0,0,0,.25)',backdropFilter:'blur(20px)'}}>
          <div className="flex items-center gap-2">
            <button className="md:hidden p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all mr-1"
              onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5"/></button>
            <span className="text-lg">{activeRoom.emoji}</span>
            {activeRoom.type==='voice'?<Volume2 className="w-4 h-4 text-gray-400"/>:<Hash className="w-4 h-4 text-gray-400"/>}
            <span className="font-black text-white text-sm">{activeRoom.name}</span>
            {activeRoom.plan!==ToolTier.FREE && (
              <span className="hidden sm:inline text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{background:activeRoom.plan===ToolTier.TURBO?'rgba(236,72,153,.15)':'rgba(124,58,237,.15)',
                  color:activeRoom.plan===ToolTier.TURBO?'#ec4899':'#a855f7',
                  border:`1px solid ${activeRoom.plan===ToolTier.TURBO?'rgba(236,72,153,.3)':'rgba(124,58,237,.3)'}`}}>
                {activeRoom.plan}
              </span>
            )}
          </div>
          <button onClick={() => setShowMembers(p=>!p)}
            className={`hidden lg:flex p-2 rounded-xl transition-all ${showMembers?'text-white bg-white/10':'text-gray-500 hover:text-white hover:bg-white/5'}`}>
            <Users className="w-4 h-4"/>
          </button>
        </div>

        {activeRoom.type==='voice' ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="w-24 h-24 rounded-[32px] flex items-center justify-center text-4xl mx-auto mb-6"
                style={{background:'linear-gradient(135deg,rgba(124,58,237,.2),rgba(236,72,153,.1))',border:'1px solid rgba(124,58,237,.3)'}}>🎙️</div>
              <h3 className="text-2xl font-black text-white mb-2">Sala de Voz</h3>
              <p className="text-gray-500 text-sm font-medium mb-4">Plano <strong className="text-white">{activeRoom.plan}</strong> necessário.</p>
              {activeRoom.online!=null && <p className="text-green-500 text-xs font-black mb-6">● {activeRoom.online} online</p>}
              <button className="px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all hover:scale-105"
                style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)',boxShadow:'0 8px 32px rgba(124,58,237,.4)'}}>
                Entrar na Sala
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages — smart scroll via onScroll handler */}
            <div ref={scrollRef} onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-2" style={{background:'#0d0d14'}}>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3"/>
                    <p className="text-gray-600 text-xs font-bold">Carregando mensagens...</p>
                  </div>
                </div>
              ) : messages.length===0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-5xl mb-4">{activeRoom.emoji}</div>
                    <h3 className="text-white font-black text-xl mb-2">Início de #{activeRoom.name}</h3>
                    <p className="text-gray-600 text-sm font-medium">Seja o primeiro a escrever!</p>
                  </div>
                </div>
              ) : (
                messages.map((m,i) => (
                  <MessageBubble key={m.id}
                    msg={m} prevMsg={messages[i-1]}
                    onReaction={addReaction}
                    onRetry={retryMessage}
                    onOpenEmoji={openEmoji}
                  />
                ))
              )}
              <div ref={endRef}/>
            </div>

            {/* New messages indicator when not at bottom */}
            {!isAtBottom && (
              <button onClick={() => { endRef.current?.scrollIntoView({behavior:'smooth'}); setIsAtBottom(true); }}
                className="absolute bottom-24 right-6 px-3 py-1.5 rounded-full text-xs font-black text-white shadow-lg transition-all hover:scale-105"
                style={{background:'linear-gradient(135deg,#7c3aed,#ec4899)'}}>
                ↓ Novas mensagens
              </button>
            )}

            {/* Input */}
            <div className="p-4 shrink-0" style={{background:'rgba(0,0,0,.3)',borderTop:'1px solid rgba(255,255,255,.05)'}}>
              {showEmoji && (
                <div className="mb-3 p-3 rounded-2xl flex flex-wrap gap-2 shadow-xl"
                  style={{background:'#111118',border:'1px solid rgba(255,255,255,.07)'}}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => { setInputValue(p=>p+e); setShowEmoji(false); }}
                      className="text-xl hover:scale-125 transition-transform">{e}</button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)'}}>
                <button onClick={() => setShowEmoji(p=>!p)} className="text-gray-500 hover:text-yellow-400 transition-colors shrink-0">
                  <Smile className="w-5 h-5"/>
                </button>
                <input
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={`Mensagem em #${activeRoom.name}`}
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder-gray-600 font-medium"
                />
                <button className="text-gray-500 hover:text-white transition-colors hidden sm:block shrink-0">
                  <Paperclip className="w-4 h-4"/>
                </button>
                <button onClick={sendMessage} disabled={!inputValue.trim()||isSending}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                  style={{background:inputValue.trim()&&!isSending?'linear-gradient(135deg,#7c3aed,#ec4899)':'rgba(255,255,255,.05)'}}>
                  <Send className="w-4 h-4 text-white"/>
                </button>
              </div>
              <div className="flex items-center justify-between mt-1.5 px-1">
                <span className="text-[9px] text-gray-700 font-black">+5 XP por mensagem · Enter para enviar</span>
                <span className="text-[9px] font-black" style={{color:userRank.color}}>{userRank.icon} {userRank.name} · {userXP} XP</span>
              </div>
            </div>
          </>
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
    </div>
  );
}
