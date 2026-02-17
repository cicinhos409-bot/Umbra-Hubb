
import React, { useState } from 'react';
import { TOOLS } from '../constants';
import { ToolTier, ToolCategory, Tool } from '../types';
import UmbraScriptTool from './UmbraScriptTool';
import UmbraConnectTool from './UmbraConnectTool';
import UmbraControlTool from './UmbraControlTool';
import MeusCanaisTool from './MeusCanaisTool';
import ApiKeysTool from './ApiKeysTool';
import EditingToolsTool from './EditingToolsTool';
import DeepgramTtsTool from './DeepgramTtsTool';
import ScreenshotTool from './ScreenshotTool';
import TiktokDownloaderTool from './TiktokDownloaderTool';
import AutotubeTool from './AutotubeTool';
import BatchTranslatorTool from './BatchTranslatorTool';
import BgRemoverTool from './BgRemoverTool';
import DescriptionBuilderTool from './DescriptionBuilderTool';
import IdeaForgeTool from './IdeaForgeTool';
import PersonaTool from './PersonaTool';
import PromptVaultTool from './PromptVaultTool';
import UmbraSearchTool from './UmbraSearchTool';
import VoiceForgeTool from './VoiceForgeTool';
import TitleOptimizerTool from './TitleOptimizerTool';
import UmbraReverseTool from './UmbraReverseTool';
import UmbraExtrairTool from './UmbraExtrairTool';
import UmbraRevaiTool from './UmbraRevaiTool';
import UmbraTubeFinderTool from './UmbraTubeFinderTool';
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
  // Fix: Added missing Zap icon import
  Zap
} from 'lucide-react';

interface DashboardProps {
  userName: string;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userName, onLogout }) => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    [ToolCategory.MOTOR_SUPREMO]: true,
    [ToolCategory.TOOLS_2IN1]: true,
    [ToolCategory.WEB]: true,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const selectedTool = TOOLS.find(t => t.id === activeTab);

  const renderSidebarItem = (tool: Tool) => (
    <button 
      key={tool.id}
      onClick={() => {
        setActiveTab(tool.id);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all mb-1 group ${
        activeTab === tool.id 
        ? 'bg-brand-purple/20 text-brand-purple border-l-2 border-brand-purple shadow-lg shadow-brand-purple/5' 
        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
      }`}
    >
      <span className="text-lg grayscale group-hover:grayscale-0 transition-all">{tool.icon}</span>
      <span className="flex-1 text-left truncate font-bold">{tool.name}</span>
      {tool.tier === ToolTier.TURBO && <div className="w-1.5 h-1.5 rounded-full bg-brand-pink shrink-0 animate-pulse"></div>}
    </button>
  );

  const renderToolsList = (category: ToolCategory, title: string) => {
    const categoryTools = TOOLS.filter(t => t.category === category);
    const isExpanded = expandedCategories[category];

    return (
      <div className="mb-6">
        <button 
          onClick={() => toggleCategory(category)}
          className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] hover:text-gray-400 transition-colors"
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

  const renderProfile = () => (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-6 mb-12">
        <div className="w-24 h-24 bg-gradient-to-br from-brand-purple to-brand-pink rounded-[32px] flex items-center justify-center text-4xl font-bold border-4 border-white/5 shadow-2xl">
          {userName.charAt(0)}
        </div>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Meu Perfil</h1>
          <p className="text-gray-500 text-lg">Gerencie suas informações e plano ativo.</p>
        </div>
      </div>

      <div className="space-y-8">
        <section className="bg-background-mid border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="text-xl font-black flex items-center gap-3">
              <User className="w-6 h-6 text-brand-cyan" /> Informações Pessoais
            </h3>
            <button className="p-2 bg-white/5 rounded-xl hover:text-brand-cyan transition-colors"><Settings className="w-5 h-5" /></button>
          </div>
          <div className="p-10 grid md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">Nome de Exibição</label>
                <div className="text-2xl font-bold text-white">{userName}</div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">Identificador</label>
                <div className="text-brand-cyan font-space">umbra_user_9921</div>
              </div>
            </div>
            <div className="space-y-6 bg-background-deep/50 p-8 rounded-3xl border border-white/5 shadow-inner">
               <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Segurança da Conta</h4>
               <div className="space-y-5">
                 <div className="flex justify-between items-center"><span className="text-sm text-gray-500 font-medium">Membro desde</span><span className="text-sm font-bold">Maio 2024</span></div>
                 <div className="flex justify-between items-center"><span className="text-sm text-gray-500 font-medium">Verificação</span><span className="text-sm font-bold text-brand-green">✓ Verificado</span></div>
                 <div className="flex justify-between items-center"><span className="text-sm text-gray-500 font-medium">Localização</span><span className="text-sm font-bold">Brasil</span></div>
               </div>
            </div>
          </div>
        </section>

        <section className="bg-background-mid border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-white/5 flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-brand-purple" />
            <h3 className="text-xl font-black">Plano & Faturamento</h3>
          </div>
          <div className="p-10">
            <div className="p-8 bg-gradient-to-r from-brand-purple/10 to-brand-cyan/10 border border-brand-purple/20 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="text-center md:text-left">
                  <span className="text-[10px] font-black text-brand-purple uppercase tracking-[0.3em] block mb-2">Assinatura Ativa</span>
                  <p className="text-2xl font-black text-white">Status: <span className="text-brand-green uppercase">Ativo</span></p>
                  <p className="text-sm text-gray-500 font-medium mt-1">Próxima renovação: 12 de Junho, 2024</p>
               </div>
               <div className="flex gap-3">
                 <button className="px-8 py-4 bg-brand-purple text-white rounded-2xl font-black text-xs tracking-widest hover:bg-brand-purple/90 shadow-xl shadow-brand-purple/20 transition-all uppercase">Fazer Upgrade</button>
                 <button className="px-6 py-4 bg-white/5 text-gray-500 rounded-2xl font-black text-xs hover:text-red-400 transition-all uppercase">Cancelar</button>
               </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background-deep text-white overflow-hidden relative font-rajdhani">
      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] md:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed/Drawer on Mobile, Flex on Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] md:relative flex flex-col shrink-0
        bg-background-mid border-r border-white/5 transition-all duration-300 ease-in-out
        ${isSidebarOpen 
          ? 'w-[280px] translate-x-0' 
          : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden'}
      `}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between min-w-[280px]">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setActiveTab('home'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}>
            <div className="w-10 h-10 bg-brand-purple rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-brand-purple/20 group-hover:scale-105 transition-transform">U</div>
            <span className="font-black text-xl tracking-tighter">Umbra<span className="text-brand-cyan">Hub</span></span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="p-2.5 text-gray-600 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar Navigation & Tools */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-8 min-w-[280px]">
          <div className="mb-10 space-y-1">
            <button 
              onClick={() => { setActiveTab('home'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'home' ? 'bg-brand-purple text-white shadow-xl shadow-brand-purple/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </button>
            <button 
              onClick={() => { setActiveTab('profile'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === 'profile' ? 'bg-brand-purple text-white shadow-xl shadow-brand-purple/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <User className="w-5 h-5" /> Meu Perfil
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 font-bold text-sm transition-all">
              <BookOpen className="w-5 h-5" /> Umbra Academy
            </button>
          </div>

          <div className="space-y-4">
            {renderToolsList(ToolCategory.MOTOR_SUPREMO, 'Motor Supremo')}
            {renderToolsList(ToolCategory.TOOLS_2IN1, 'Automação 2 em 1')}
            {renderToolsList(ToolCategory.WEB, 'Arsenal Web')}
          </div>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-white/5 bg-black/20 min-w-[280px]">
          <div className="flex items-center justify-between gap-4 p-4 bg-white/5 rounded-[24px] border border-white/5">
             <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-11 h-11 bg-gradient-to-br from-brand-purple to-brand-pink rounded-2xl flex items-center justify-center font-black shadow-lg shrink-0">
                  {userName.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-bold text-white truncate">{userName}</div>
                  <div className="text-[9px] text-brand-cyan font-black uppercase tracking-widest flex items-center gap-1">
                    <Zap className="w-2 h-2 fill-current" /> Turbo Ativo
                  </div>
                </div>
             </div>
             <button onClick={onLogout} className="text-gray-600 hover:text-brand-pink transition-colors p-2" title="Sair">
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background-deep relative scroll-smooth transition-all duration-300">
        
        {/* Sticky Content Header */}
        <header className="h-20 shrink-0 border-b border-white/5 flex items-center justify-between px-6 md:px-10 bg-background-deep/50 backdrop-blur-2xl sticky top-0 z-40">
          <div className="flex items-center gap-4">
             {/* Hamburger Button - Only visible when sidebar is closed or on mobile */}
             <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all ${isSidebarOpen ? 'md:hidden' : 'flex'} shadow-lg`}
             >
               <Menu className="w-6 h-6" />
             </button>
             
             <div className="flex flex-col">
               <h2 className="text-base md:text-xl font-black text-white uppercase tracking-tighter truncate max-w-[180px] md:max-w-none">
                 {activeTab === 'home' ? 'Visão Geral' : activeTab === 'profile' ? 'Configurações' : selectedTool?.name}
               </h2>
               {activeTab !== 'home' && activeTab !== 'profile' && (
                 <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest hidden md:block">Ferramenta Ativa</span>
               )}
             </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden lg:flex items-center gap-3 bg-brand-cyan/10 px-4 py-2 rounded-2xl text-[10px] font-black text-brand-cyan uppercase tracking-widest border border-brand-cyan/20 shadow-lg shadow-brand-cyan/5">
              <CheckCircle2 className="w-4 h-4" /> Sessão Protegida
            </div>
            <div className="flex items-center gap-2">
              <button className="relative text-gray-500 hover:text-white p-3 bg-white/5 rounded-2xl transition-all border border-white/5">
                <Bell className="w-5 h-5" />
                <span className="absolute top-3 right-3 w-2 h-2 bg-brand-pink rounded-full border-2 border-background-deep"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content Viewport */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
          <div className="max-w-7xl mx-auto w-full">
            {activeTab === 'home' && (
              <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-12">
                 <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">Bem-vindo à <span className="text-brand-purple">Central Umbra</span>.</h1>
                    <p className="text-gray-500 text-lg md:text-xl font-medium">Seu arsenal definitivo de inteligência para YouTube está pronto.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-10 bg-background-mid border border-white/5 rounded-[48px] shadow-2xl hover:border-brand-cyan/20 transition-all relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cyan/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-brand-cyan/10 transition-all" />
                       <div className="w-14 h-14 bg-brand-cyan/10 rounded-2xl flex items-center justify-center text-brand-cyan mb-8 shadow-xl"><Youtube className="w-7 h-7" /></div>
                       <h3 className="text-2xl font-black mb-3">3 Canais Ativos</h3>
                       <p className="text-gray-500 font-medium leading-relaxed">Monitorando crescimento orgânico e automação de roteiros.</p>
                    </div>
                    <div className="p-10 bg-background-mid border border-white/5 rounded-[48px] shadow-2xl hover:border-brand-purple/20 transition-all relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-brand-purple/10 transition-all" />
                       <div className="w-14 h-14 bg-brand-purple/10 rounded-2xl flex items-center justify-center text-brand-purple mb-8 shadow-xl"><Sparkles className="w-7 h-7" /></div>
                       <h3 className="text-2xl font-black mb-3">Créditos Ilimitados</h3>
                       <p className="text-gray-500 font-medium leading-relaxed">Sua assinatura Turbo garante acesso prioritário a todos os motores.</p>
                    </div>
                    <div className="p-10 bg-gradient-to-br from-brand-purple to-brand-pink border border-white/10 rounded-[48px] text-white shadow-2xl shadow-brand-purple/20 hover:scale-[1.02] transition-all relative overflow-hidden group">
                       <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-8 shadow-inner"><TrendingUp className="w-7 h-7" /></div>
                       <h3 className="text-2xl font-black mb-3">Tendência: História</h3>
                       <p className="text-white/80 font-bold leading-relaxed italic">Documentários de IA estão em alta no BR e EUA esta semana.</p>
                    </div>
                 </div>
                 
                 <div className="space-y-8">
                   <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] flex items-center gap-4">
                     Arsenal Rápido <div className="h-px flex-1 bg-white/5" />
                   </h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                      {TOOLS.slice(0, 5).map(tool => (
                        <button 
                          key={tool.id} 
                          onClick={() => { setActiveTab(tool.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                          className="p-6 bg-background-light/50 border border-white/5 rounded-3xl text-center hover:border-brand-purple/40 hover:bg-background-light transition-all group shadow-xl"
                        >
                          <span className="text-3xl mb-4 block group-hover:scale-110 transition-transform">{tool.icon}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">{tool.name}</span>
                        </button>
                      ))}
                   </div>
                 </div>
              </div>
            )}

            {activeTab === 'profile' && renderProfile()}

            {/* Tools Rendering */}
            {activeTab === 'meus-canais' && <MeusCanaisTool />}
            {activeTab === 'api-keys' && <ApiKeysTool />}
            {activeTab === 'srt' && <EditingToolsTool />}
            {activeTab === 'deepgram' && <DeepgramTtsTool />}
            {activeTab === 'screenshot' && <ScreenshotTool />}
            {activeTab === 'tiktok' && <TiktokDownloaderTool />}
            {activeTab === 'autotube' && <AutotubeTool />}
            {activeTab === 'batch-trans' && <BatchTranslatorTool />}
            {activeTab === 'bg-remove' && <BgRemoverTool />}
            {activeTab === 'description-builder' && <DescriptionBuilderTool />}
            {activeTab === 'idea-forge' && <IdeaForgeTool />}
            {activeTab === 'persona' && <PersonaTool />}
            {activeTab === 'prompt-vault' && <PromptVaultTool />}
            {activeTab === 'umbra-search' && <UmbraSearchTool />}
            {activeTab === 'voice-forge' && <VoiceForgeTool />}
            {activeTab === 'title-opt' && <TitleOptimizerTool />}
            {activeTab === 'umbra-reverse' && <UmbraReverseTool />}
            {activeTab === 'umbra-script' && <UmbraScriptTool />}
            {activeTab === 'umbra-connect' && <UmbraConnectTool />}
            {activeTab === 'umbra-control' && <UmbraControlTool />}
            {activeTab === 'umbra-extrair' && <UmbraExtrairTool />}
            {activeTab === 'umbra-revai' && <UmbraRevaiTool />}
            {activeTab === 'tube-finder' && <UmbraTubeFinderTool />}

            {/* Tool Loader / Fallback */}
            {activeTab !== 'home' && activeTab !== 'profile' && !activeTab.includes('home') && selectedTool && (
              !['meus-canais', 'api-keys', 'srt', 'deepgram', 'screenshot', 'tiktok', 'autotube', 'batch-trans', 'bg-remove', 'description-builder', 'idea-forge', 'persona', 'prompt-vault', 'umbra-search', 'voice-forge', 'title-opt', 'umbra-reverse', 'umbra-script', 'umbra-connect', 'umbra-control', 'umbra-extrair', 'umbra-revai', 'tube-finder'].includes(activeTab) && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                   <div className="mb-8 p-12 bg-background-mid border border-white/5 rounded-[56px] shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-purple/5 to-transparent pointer-events-none" />
                      <div className="flex flex-col md:flex-row items-center gap-10 mb-12">
                        <div className="text-8xl shadow-2xl bg-background-deep p-8 rounded-[40px] border border-white/5">{selectedTool.icon}</div>
                        <div className="text-center md:text-left">
                           <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter">{selectedTool.name}</h1>
                           <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${
                             selectedTool.tier === ToolTier.TURBO ? 'bg-brand-pink text-white shadow-brand-pink/20' : 'bg-brand-purple text-white shadow-brand-purple/20'
                           }`}>
                             <Zap className="w-3 h-3 fill-current" /> Plano {selectedTool.tier}
                           </div>
                        </div>
                      </div>
                      <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-4xl mb-12 font-medium">
                        {selectedTool.description}
                      </p>
                      
                      <div className="bg-background-deep/50 border border-white/5 rounded-[40px] p-20 text-center border-dashed relative group">
                         <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl group-hover:scale-110 transition-transform">
                            <Settings className="w-10 h-10 text-gray-700 animate-spin-slow" />
                         </div>
                         <h4 className="text-2xl font-black text-white mb-3">Motor de IA em Inicialização</h4>
                         <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed mb-10 font-medium">Este módulo está pronto para ser injetado no seu fluxo de trabalho. Conecte sua chave de API para liberar o processamento total.</p>
                         <button className="bg-brand-purple text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand-purple/30 hover:scale-105 transition-all">
                            INICIAR CONEXÃO
                         </button>
                      </div>
                   </div>
                </div>
              )
            )}
          </div>
        </div>
      </main>

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
