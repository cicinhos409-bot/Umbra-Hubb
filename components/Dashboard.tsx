
import React, { useState, lazy, Suspense } from 'react';
import { TOOLS } from '../constants';
import { ToolTier, ToolCategory, Tool } from '../types';
import OnboardingGuide, { ONBOARDING_STORAGE_KEY } from './OnboardingGuide';
import { trackToolOpened, trackSearch } from '../services/analytics';

// React.lazy: cada ferramenta vira chunk separado — carregado só quando acessado.
// Reduz bundle inicial de ~927KB para ~280KB.
const UmbraTurboHub       = lazy(() => import('./UmbraTurboHub'));
const MeusCanaisTool      = lazy(() => import('./MeusCanaisTool'));
const EditingToolsTool    = lazy(() => import('./EditingToolsTool'));
const ScreenshotTool      = lazy(() => import('./ScreenshotTool'));
const PromptVaultTool     = lazy(() => import('./PromptVaultTool'));
const UmbraMediaHub       = lazy(() => import('./UmbraMediaHub'));
const UmbraYouTubeHub     = lazy(() => import('./UmbraYouTubeHub'));
const UmbraAudiosTool     = lazy(() => import('./UmbraAudiosTool'));
const AcademyTool         = lazy(() => import('./AcademyTool'));
const ExtensionsDownloadTool = lazy(() => import('./ExtensionsDownloadTool'));
const LicensesTool        = lazy(() => import('./LicensesTool'));
const BonusMaterialTool   = lazy(() => import('./BonusMaterialTool'));

// Fallback leve exibido enquanto o chunk carrega
const ToolFallback = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
  </div>
);

import {
  LayoutDashboard,
  Search,
  Bell,
  LogOut,
  User,
  Youtube,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Settings,
  BookOpen,
  CheckCircle2,
  Calendar,
  Phone,
  Mail,
  ArrowUpCircle,
  XCircle,
  ChevronDown,
  Sparkles,
  Menu,
  ChevronLeft,
  X,
  Zap,
  Lock,
  MessageCircle,
  Package,
  FileText,
  Key,
  BarChart3,
  Flame,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Sun,
  Moon
} from 'lucide-react';

interface DashboardProps {
  userName: string;
  userTier: ToolTier;
  userEmail: string;
  userCreatedAt?: string;
  onLogout: () => void;
  onUpgradeClick?: () => void;
}

const TIER_LEVELS = {
  [ToolTier.FREE]: 0,
  [ToolTier.PRO]: 1,
};

const Dashboard: React.FC<DashboardProps> = ({ userName, userTier, userEmail, userCreatedAt, onLogout, onUpgradeClick }) => {
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('umbra_active_tab') || 'home';
  });

  React.useEffect(() => {
    localStorage.setItem('umbra_active_tab', activeTab);
    // Rastreia abertura de ferramenta (ignora tabs de sistema)
    const tool = TOOLS.find(t => t.id === activeTab);
    if (tool) trackToolOpened(activeTab, tool.name, userTier);
  }, [activeTab]);

  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('umbra_theme') === 'dark';
  });

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('umbra_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('umbra_theme', 'light');
    }
  }, [isDark]);

  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Onboarding: exibe apenas para PRO que ainda não viram
  const [showOnboarding, setShowOnboarding] = React.useState<boolean>(() => {
    if (userTier === ToolTier.FREE) return false;
    return !localStorage.getItem(ONBOARDING_STORAGE_KEY);
  });

  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSearch, setShowSearch] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(v => !v);
      }
      if (e.key === 'Escape') { setShowSearch(false); setSearchQuery(''); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return TOOLS.filter(t => t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)).slice(0, 6);
  }, [searchQuery]);

  React.useEffect(() => {
    const handleToggle = () => setIsSidebarOpen(true);
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, []);

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    [ToolCategory.TOOLS_2IN1]: true,
    [ToolCategory.WEB]: true,
    [ToolCategory.CHATBOTS]: true,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const selectedTool = TOOLS.find(t => t.id === activeTab);

  const isToolLocked = (toolTier: ToolTier) => {
    return TIER_LEVELS[userTier] < TIER_LEVELS[toolTier];
  };

  const renderSidebarItem = (tool: Tool) => {
    const locked = isToolLocked(tool.tier);

    return (
      <button
        key={tool.id}
        onClick={() => {
          if (!locked) {
            setActiveTab(tool.id);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all mb-1 group relative ${activeTab === tool.id
          ? 'bg-primary/10 text-primary border-l-2 border-primary'
          : locked
            ? 'text-gray-400 cursor-not-allowed opacity-60 hover:bg-transparent'
            : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
      >
        <span className={`text-lg transition-all ${locked ? 'grayscale opacity-50' : 'grayscale group-hover:grayscale-0'}`}>
          {tool.icon}
        </span>
        <span className="flex-1 text-left truncate font-black flex items-center gap-2">
          {tool.name}
          {locked && <Lock className="w-3 h-3 text-gray-400" />}
        </span>
      </button>
    );
  };

  const renderToolsList = (category: ToolCategory, title: string) => {
    const categoryTools = TOOLS.filter(t => t.category === category);
    const isExpanded = expandedCategories[category];

    return (
      <div className="mb-6">
        <button
          onClick={() => toggleCategory(category)}
          className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {title}
          <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`} />
        </button>
        {isExpanded && (
          <div className="mt-2 space-y-0.5">
            {categoryTools.map(renderSidebarItem)}
          </div>
        )}
      </div>
    );
  };

  const getMemberSince = () => {
    if (!userCreatedAt) return "Membro fundador";
    const date = new Date(userCreatedAt);
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getNextBilling = () => {
    if (userTier === ToolTier.FREE) return "Plano Gratuito (Sem vencimento)";
    if (!userCreatedAt) return "--";
    const today = new Date();
    const creation = new Date(userCreatedAt);
    let nextBilling = new Date(today.getFullYear(), today.getMonth(), creation.getDate());
    if (today > nextBilling) {
      nextBilling = new Date(today.getFullYear(), today.getMonth() + 1, creation.getDate());
    }
    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${nextBilling.getDate()} de ${months[nextBilling.getMonth()]}, ${nextBilling.getFullYear()}`;
  };

  const renderProfile = () => (
    <div className="max-w-4xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
        <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center text-4xl font-black text-primary border border-primary/20 shrink-0">
          {userName.charAt(0)}
        </div>
        <div className="text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.2em]">Validated Profile</span>
            <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Verified Member</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Meu Perfil</h1>
          <p className="text-gray-600 font-black mt-1">Configurações de conta e gestão de assinatura Umbra.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Personal Info */}
        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">Informações Pessoais</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Seus dados de identificação</p>
              </div>
            </div>
            <button className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1 p-5 bg-gray-50 border border-gray-200 rounded-xl">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                <User className="w-3 h-3" /> Nome de Exibição
              </label>
              <div className="text-xl font-black text-gray-900 truncate">{userName}</div>
            </div>

            <div className="space-y-1 p-5 bg-gray-50 border border-gray-200 rounded-xl">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                <Mail className="w-3 h-3" /> E-mail de Acesso
              </label>
              <div className="text-base font-black text-gray-900 truncate">{userEmail}</div>
            </div>

            <div className="space-y-1 p-5 bg-gray-50 border border-gray-200 rounded-xl">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                <Flame className="w-3 h-3 text-orange-500" /> Identificador
              </label>
              <div className="text-primary font-mono text-xs font-black tracking-widest bg-primary/5 px-3 py-2 rounded-lg border border-primary/20 inline-block uppercase">
                umbra_user_{userEmail.split('@')[0].slice(-4)}
              </div>
            </div>

            <div className="space-y-1 p-5 bg-gray-50 border border-gray-200 rounded-xl">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                <Phone className="w-3 h-3" /> Suporte VIP
              </label>
              <div className="text-sm font-black text-primary flex items-center gap-2">
                Disponível via Telegram <ExternalLink className="w-3 h-3" />
              </div>
            </div>

            <div className="md:col-span-2 p-5 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-sm font-black text-gray-900">Membro desde {getMemberSince()}</div>
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Acesso verificado</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 border border-green-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Active & Verified</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Plan & Billing */}
        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-8 py-5 border-b border-gray-200 flex items-center gap-3 bg-gray-50">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">Plano & Faturamento</h3>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Gestão de pagamentos e benefícios</p>
            </div>
          </div>

          <div className="p-8">
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-[9px] font-black uppercase tracking-[0.2em] text-white">
                  <Sparkles className="w-3 h-3" /> Signature Valid
                </div>
                <div>
                  <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Status da Assinatura</p>
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <h4 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
                      {userTier} <span className="text-green-600">Ativo</span>
                    </h4>
                    <div className="px-3 py-1 rounded-xl bg-white border border-gray-200 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                      ID #UM-{userEmail.split('@')[0].slice(-3)}-2026
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 font-black flex items-center gap-2 justify-center md:justify-start">
                  <Calendar className="w-4 h-4" /> Próxima renovação: <span className="text-gray-900">{getNextBilling()}</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={onUpgradeClick}
                  className="flex-1 sm:flex-none px-8 py-3 bg-primary text-white rounded-xl font-black text-xs tracking-[0.2em] hover:bg-primary-dark transition-all uppercase"
                >
                  Mudar Plano
                </button>
                <button className="flex-1 sm:flex-none px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-black text-xs tracking-widest hover:border-red-300 hover:text-red-600 transition-all uppercase">
                  Gerenciar
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden relative">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[60] md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] md:relative flex flex-col shrink-0
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out
        ${isSidebarOpen
          ? 'w-[260px] translate-x-0'
          : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden'}
      `}>
        {/* Sidebar Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between min-w-[260px]">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => { setActiveTab('home'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
          >
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center font-black text-lg text-white shadow-sm">U</div>
            <span className="font-black text-lg tracking-tight text-gray-900">Umbra<span className="text-primary">Hub</span></span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-6 min-w-[260px]">
          <div className="mb-8 space-y-1">
            <button
              onClick={() => { setActiveTab('home'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-black text-sm ${activeTab === 'home' ? 'bg-primary text-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => { setActiveTab('profile'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-black text-sm ${activeTab === 'profile' ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <User className="w-4 h-4" /> Meu Perfil
            </button>
            <button
              onClick={() => {
                if (userTier !== ToolTier.FREE) {
                  setActiveTab('academy');
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-black text-sm ${activeTab === 'academy' ? 'bg-primary text-white' : userTier === ToolTier.FREE ? 'text-gray-400 cursor-not-allowed opacity-60' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4" /> Umbra Academy
              </div>
              {userTier === ToolTier.FREE && <Lock className="w-3 h-3" />}
            </button>
            <button
              onClick={() => { setActiveTab('extensions'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-black text-sm ${activeTab === 'extensions' ? 'bg-primary text-white' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <Package className="w-4 h-4" /> Downloads Extensões
            </button>
            <button
              onClick={() => {
                if (userTier !== ToolTier.FREE) {
                  setActiveTab('licenses');
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-black text-sm ${activeTab === 'licenses' ? 'bg-primary text-white' : userTier === ToolTier.FREE ? 'text-gray-400 cursor-not-allowed opacity-60' : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4" /> Minhas Licenças
              </div>
              {userTier === ToolTier.FREE && <Lock className="w-3 h-3" />}
            </button>
          </div>

          {renderToolsList(ToolCategory.WEB, 'Arsenal Web')}
          {renderToolsList(ToolCategory.TOOLS_2IN1, 'Automação 2 em 1')}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 min-w-[260px]">
          <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center font-black text-white shrink-0">
                {userName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-black text-gray-900 truncate">{userName}</div>
                <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${userTier === ToolTier.FREE ? 'text-gray-500' : 'text-primary'}`}>
                  <Zap className="w-2 h-2 fill-current" /> {userTier === ToolTier.FREE ? 'Plano Free' : `${userTier} Ativo`}
                </div>
              </div>
            </div>
            <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors p-1.5" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          {userTier !== ToolTier.FREE && (
            <button
              onClick={() => setShowOnboarding(true)}
              className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all border border-primary/20 hover:border-primary/40 min-w-[228px]"
            >
              <Sparkles className="w-3.5 h-3.5" /> Guia PRO
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-950">

        {/* Header */}
        <header className="h-16 shrink-0 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-white dark:bg-gray-900 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all ${isSidebarOpen ? 'md:hidden' : 'flex'}`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h2 className="text-base font-black text-gray-900 dark:text-white truncate max-w-[180px] md:max-w-none">
                {activeTab === 'home' ? 'Visão Geral' : activeTab === 'profile' ? 'Configurações' : activeTab === 'extensions' ? 'Downloads' : activeTab === 'licenses' ? 'Licenças' : activeTab === 'umbra-z' ? 'Umbra Z — Comunidade' : selectedTool?.name}
              </h2>
              {activeTab !== 'home' && activeTab !== 'profile' && (
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest hidden md:block">Ferramenta Ativa</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-xl text-[10px] font-black text-green-700 uppercase tracking-widest border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sessão Protegida
            </div>

            {/* Global Search */}
            <div className="relative">
              {showSearch ? (
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus-within:border-primary/40 transition-all">
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar ferramenta..."
                    className="bg-transparent outline-none text-sm font-black text-gray-900 dark:text-white w-44 placeholder:text-gray-400 placeholder:font-normal"
                  />
                  <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  title="Buscar ferramenta (Ctrl+K)"
                  className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:bg-primary/5 text-gray-500 dark:text-gray-400 hover:text-primary"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}

              {/* Search results dropdown */}
              {showSearch && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 right-0 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {searchResults.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        trackSearch(searchQuery.length, searchResults.length);
                        setActiveTab(tool.id);
                        setShowSearch(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-black text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <span className="text-xl shrink-0">{tool.icon}</span>
                      <div className="text-left">
                        <div className="text-sm font-black">{tool.name}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">{tool.tier}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {showSearch && searchQuery.trim() && searchResults.length === 0 && (
                <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 px-5 py-4 text-center">
                  <p className="text-xs font-black text-gray-500">Nenhuma ferramenta encontrada</p>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setIsDark(d => !d)}
              title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
              className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl transition-all border border-gray-200 dark:border-gray-700 hover:border-primary/40 hover:bg-primary/5 text-gray-500 dark:text-gray-400 hover:text-primary"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button className="relative text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 bg-gray-50 dark:bg-gray-800 rounded-xl transition-all border border-gray-200 dark:border-gray-700">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar dark:bg-gray-950 ${activeTab === 'umbra-edit' ? 'p-2 md:p-4' : 'p-6 md:p-8'}`}>
          <div className={`${activeTab === 'umbra-edit' ? 'max-w-none' : 'max-w-6xl'} mx-auto w-full h-full flex flex-col`}>
            {activeTab === 'home' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                {/* Welcome */}
                <div className="space-y-1">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
                    Bem-vindo, <span className="text-primary">{userName}</span>.
                  </h1>
                  <p className="text-gray-600 font-black text-base">Seu arsenal de inteligência para YouTube está pronto.</p>
                </div>

                {/* 3 Equal Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1 — Plano */}
                  <div className="p-6 bg-white border border-gray-200 rounded-2xl hover:border-primary/30 hover:shadow-sm transition-all">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${userTier === ToolTier.FREE ? 'bg-gray-100 text-gray-500' : 'bg-primary/10 text-primary'}`}>
                      <Zap className="w-5 h-5 fill-current" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-1">Plano {userTier}</h3>
                    <p className="text-gray-600 font-black text-sm leading-relaxed mb-4">
                      Você tem acesso total às ferramentas e automações premium.
                    </p>
                    {userTier === ToolTier.FREE && (
                      <button
                        onClick={() => setActiveTab('profile')}
                        className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-1"
                      >
                        Ver Detalhes <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Card 2 — Meus Canais */}
                  <div
                    onClick={() => setActiveTab('meus-canais')}
                    className="p-6 bg-white border border-gray-200 rounded-2xl hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-5">
                      <Youtube className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-1">Meus Canais</h3>
                    <p className="text-gray-600 font-black text-sm leading-relaxed">Gerencie seus canais Faceless e monitore o crescimento em tempo real.</p>
                  </div>

                  {/* Card 3 — Insight */}
                  <div className="p-6 bg-white border border-gray-200 rounded-2xl hover:border-primary/30 hover:shadow-sm transition-all">
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-5">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-1">Insight do Dia</h3>
                    <p className="text-gray-600 font-black text-sm leading-relaxed italic">"Documentários com vozes neurais profundas estão com 4x mais retenção."</p>
                  </div>
                </div>

                {/* Quick Arsenal */}
                <div className="space-y-5">
                  <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-3">
                    Arsenal Rápido <div className="h-px flex-1 bg-gray-200" />
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {TOOLS.slice(0, 5).map(tool => {
                      const locked = isToolLocked(tool.tier);
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            if (!locked) {
                              setActiveTab(tool.id);
                              if (window.innerWidth < 768) setIsSidebarOpen(false);
                            }
                          }}
                          className={`p-5 border rounded-2xl text-center transition-all group relative ${locked
                            ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                            : 'bg-white border-gray-200 hover:border-primary/40 hover:shadow-sm'
                            }`}
                        >
                          {locked && (
                            <div className="absolute top-2 right-2">
                              <Lock className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                          )}
                          <span className={`text-2xl mb-3 block transition-transform ${locked ? 'grayscale opacity-50' : 'group-hover:scale-110'}`}>
                            {tool.icon}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">
                            {tool.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && renderProfile()}

            <Suspense fallback={<ToolFallback />}>
              {activeTab === 'academy'        && <AcademyTool />}
              {activeTab === 'extensions'     && <ExtensionsDownloadTool userTier={userTier} />}
              {activeTab === 'licenses'       && <LicensesTool userTier={userTier} userEmail={userEmail} />}
              {activeTab === 'meus-canais'    && <MeusCanaisTool />}
              {activeTab === 'srt'            && <EditingToolsTool />}
              {activeTab === 'screenshot'     && <ScreenshotTool />}
              {activeTab === 'media-hub'      && <UmbraMediaHub />}
              {activeTab === 'youtube-hub'    && <UmbraYouTubeHub />}
              {activeTab === 'turbo-hub'      && <UmbraTurboHub />}
              {activeTab === 'umbra-audios'   && <UmbraAudiosTool userTier={userTier} />}
              {activeTab === 'prompt-vault'   && <PromptVaultTool />}
              {activeTab === 'material-bonus' && <BonusMaterialTool userTier={userTier} />}
            </Suspense>
          </div>
        </div>
      </main>

      {/* Onboarding Guide — aparece 1x para usuários PRO novos */}
      {showOnboarding && (
        <OnboardingGuide
          userName={userName}
          onClose={() => setShowOnboarding(false)}
          onNavigate={(tab) => setActiveTab(tab)}
        />
      )}

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Dashboard;
