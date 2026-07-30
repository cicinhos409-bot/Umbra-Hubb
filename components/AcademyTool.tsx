import React, { useState } from 'react';
import {
    Play,
    ChevronDown,
    X,
    CheckCircle2,
    Layout,
    Clock,
    Sparkles,
    PlayCircle,
    ShieldCheck,
    ArrowRight
} from 'lucide-react';

interface Lesson {
    id: string;
    title: string;
    description: string;
    duration: string;
    videoId: string;
}

interface Module {
    id: string;
    number: string;
    title: string;
    subtitle: string;
    lessons: Lesson[];
}

const ACADEMY_DATA: Module[] = [
    {
        id: 'mod1',
        number: '01',
        title: 'Inicio | Conheça a Umbra Hub',
        subtitle: 'Introdução e boas-vindas',
        lessons: [
            {
                id: 'l1-1',
                title: 'Qual é a Melhor Maneira De Usar a Umbra Hub?',
                description: 'Aprenda a navegar pela plataforma e extrair o máximo das ferramentas para sua escala.',
                duration: '19:12',
                videoId: '15mIryiVzgz-5QTMPQcpZQXr7BX69C2Kg'
            }
        ]
    },
    {
        id: 'mod2',
        number: '02',
        title: 'Modelagem De Conteúdos Virais',
        subtitle: 'A estratégia por trás do crescimento exponencial',
        lessons: [
            {
                id: 'l2-1',
                title: 'Conheça Meu Treinamento Completo',
                description: 'Visão detalhada sobre o ecossistema de criação viral e o método Umbra.',
                duration: '15:20',
                videoId: 'ID_VIDEO_2'
            }
        ]
    },
    {
        id: 'mod3',
        number: '03',
        title: 'Império Dark Por Dentro',
        subtitle: 'Estruturação avançada de canais sem aparecer',
        lessons: [
            {
                id: 'l3-1',
                title: 'Bastidores do Império Dark',
                description: 'Explorando as táticas, nichos e processos dos maiores players de canais dark.',
                duration: '22:45',
                videoId: 'ID_VIDEO_3'
            }
        ]
    }
];

const AcademyTool: React.FC = () => {
    const [openModules, setOpenModules] = useState<Set<string>>(new Set(['mod1']));
    const [selectedVideo, setSelectedVideo] = useState<{ id: string; title: string; moduleTitle?: string } | null>(null);

    const toggleModule = (id: string) => {
        const next = new Set(openModules);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setOpenModules(next);
    };

    const openVideo = (videoId: string, title: string, moduleTitle: string) => {
        setSelectedVideo({ id: videoId, title, moduleTitle });
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 pb-32 overflow-x-hidden">

            <div className="max-w-5xl mx-auto px-6 pt-10">

                {/* HERO */}
                <section className="bg-black text-white rounded-2xl p-10 md:p-16 mb-14 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 border border-white/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 border border-white/5 rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-10">
                        <div className="w-20 h-20 md:w-28 md:h-28 bg-white text-black rounded-2xl flex items-center justify-center text-4xl md:text-5xl shrink-0 font-black">
                            🎓
                        </div>

                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-[0.3em] mb-5">
                                <PlayCircle className="w-3.5 h-3.5" /> Training Center
                            </div>

                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase leading-none mb-4">
                                Umbra Academy
                            </h1>

                            <p className="text-white/70 text-base md:text-lg font-black max-w-2xl leading-relaxed mb-8">
                                Domine as estratégias, ferramentas e processos que separam canais de nicho de impérios digitais virais. Conteúdo exclusivo para membros PRO.
                            </p>

                            <div className="flex flex-wrap gap-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
                                        <Layout className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-black text-white">{ACADEMY_DATA.length}</div>
                                        <div className="text-[9px] font-black text-white/50 uppercase tracking-widest">Módulos Ativos</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center">
                                        <ShieldCheck className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-xl font-black text-white">100%</div>
                                        <div className="text-[9px] font-black text-white/50 uppercase tracking-widest">Acesso Vitalício</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CURRICULUM */}
                <section className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 whitespace-nowrap">
                            Cronograma de Treinamento
                        </h2>
                        <div className="h-px flex-grow bg-gray-200" />
                    </div>

                    <div className="space-y-3">
                        {ACADEMY_DATA.map((module) => {
                            const isOpen = openModules.has(module.id);

                            return (
                                <div
                                    key={module.id}
                                    className={`border rounded-xl overflow-hidden transition-all duration-300 ${
                                        isOpen
                                            ? 'border-black shadow-md'
                                            : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    <div
                                        onClick={() => toggleModule(module.id)}
                                        className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors ${
                                            isOpen ? 'bg-black text-white' : 'bg-white text-gray-900 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm border shrink-0 ${
                                                isOpen
                                                    ? 'bg-white text-black border-white'
                                                    : 'bg-black text-white border-black'
                                            }`}>
                                                {module.number}
                                            </div>
                                            <div>
                                                <h4 className={`text-sm font-black uppercase tracking-tight ${isOpen ? 'text-white' : 'text-gray-900'}`}>
                                                    {module.title}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isOpen ? 'text-white/50' : 'text-gray-400'}`}>
                                                        {module.subtitle}
                                                    </span>
                                                    <div className={`w-1 h-1 rounded-full ${isOpen ? 'bg-white/30' : 'bg-gray-300'}`} />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1 ${isOpen ? 'text-white/50' : 'text-gray-400'}`}>
                                                        <Play className="w-2 h-2 fill-current" />
                                                        {module.lessons.length} Aula{module.lessons.length > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-300 shrink-0 ${
                                            isOpen
                                                ? 'rotate-180 bg-white/10 border-white/20 text-white'
                                                : 'bg-gray-50 border-gray-200 text-gray-600'
                                        }`}>
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>

                                    {isOpen && (
                                        <div className="bg-white px-5 pb-5 pt-3 space-y-2">
                                            {module.lessons.map(lesson => (
                                                <div
                                                    key={lesson.id}
                                                    onClick={() => openVideo(lesson.videoId, lesson.title, module.title)}
                                                    className="group/lesson flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-black hover:border-black hover:text-white transition-all duration-200"
                                                >
                                                    <div className="w-9 h-9 bg-black text-white border border-black rounded-lg flex items-center justify-center shrink-0 group-hover/lesson:bg-white group-hover/lesson:text-black transition-colors">
                                                        <Play className="w-4 h-4 fill-current" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                                                            <h5 className="text-xs font-black text-gray-900 group-hover/lesson:text-white transition-colors truncate">
                                                                {lesson.title}
                                                            </h5>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[8px] font-black text-gray-500 uppercase tracking-widest inline-flex items-center gap-1 group-hover/lesson:bg-white/10 group-hover/lesson:border-white/20 group-hover/lesson:text-white transition-colors">
                                                                    <Clock className="w-2.5 h-2.5" /> {lesson.duration}
                                                                </span>
                                                                <div className="w-5 h-5 bg-gray-100 border border-gray-200 rounded flex items-center justify-center group-hover/lesson:bg-white/10 group-hover/lesson:border-white/20 transition-colors">
                                                                    <CheckCircle2 className="w-3 h-3 text-gray-400 group-hover/lesson:text-white" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 font-black leading-relaxed line-clamp-1 group-hover/lesson:text-white/50 transition-colors">
                                                            {lesson.description}
                                                        </p>
                                                    </div>

                                                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover/lesson:opacity-100 group-hover/lesson:text-white group-hover/lesson:translate-x-1 transition-all shrink-0" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* FOOTER STATS */}
                <section className="mt-24 pt-10 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <div className="text-sm font-black text-gray-900 italic uppercase tracking-tighter">Umbra HQ</div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Sede Oficial de Treinamento</p>
                    </div>
                    {[
                        { label: 'Canais Ativos', value: '1.2k+' },
                        { label: 'Suporte Global', value: '24/7' },
                        { label: 'Média de Retenção', value: '78%' }
                    ].map(stat => (
                        <div key={stat.label}>
                            <div className="text-lg font-black text-gray-900 tracking-widest">{stat.value}</div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</p>
                        </div>
                    ))}
                </section>
            </div>

            {/* VIDEO MODAL */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center p-4 sm:p-8 md:p-12 animate-in fade-in duration-300">
                    <button
                        onClick={() => setSelectedVideo(null)}
                        className="absolute top-6 right-6 z-[1010] p-3 bg-white/10 border border-white/20 rounded-full text-white hover:bg-white hover:text-black transition-all group"
                    >
                        <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
                    </button>

                    <div className="relative w-full max-w-6xl z-10 flex flex-col h-full max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-white text-black rounded-xl flex items-center justify-center shrink-0">
                                    <PlayCircle className="w-6 h-6 fill-current" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase italic leading-none truncate">
                                        {selectedVideo.title}
                                    </h3>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-1">
                                        {selectedVideo.moduleTitle}
                                    </p>
                                </div>
                            </div>
                            <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2.5 rounded-xl">
                                <Sparkles className="w-4 h-4 text-white/50" />
                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Qualidade 4K Masterclass</span>
                            </div>
                        </div>

                        {/* Video Player */}
                        <div className="flex-grow bg-gray-950 border border-white/10 rounded-2xl overflow-hidden relative">
                            {selectedVideo.id.startsWith('ID_VIDEO') ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                                    <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6">
                                        <ShieldCheck className="w-10 h-10 text-white/30" />
                                    </div>
                                    <h4 className="text-2xl font-black text-white mb-3 uppercase tracking-tighter">Treinamento em Manutenção</h4>
                                    <p className="text-white/40 max-w-sm mx-auto font-black text-base leading-relaxed">
                                        Esta aula está sendo revisada e otimizada. Volte em breve.
                                    </p>
                                </div>
                            ) : (
                                <div className="absolute inset-0">
                                    <iframe
                                        className="w-full h-full"
                                        src={`https://drive.google.com/file/d/${selectedVideo.id}/preview`}
                                        title={selectedVideo.title}
                                        frameBorder="0"
                                        allow="autoplay; fullscreen; encrypted-media"
                                        allowFullScreen
                                    />
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                                Mais de <span className="text-white/60">1,450 alunos</span> interagiram com esta aula
                            </p>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <a
                                    href={`https://drive.google.com/file/d/${selectedVideo.id}/view`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 sm:flex-none px-8 py-4 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl font-black text-xs uppercase tracking-widest transition-all text-center"
                                >
                                    Ver no Drive
                                </a>
                                <button
                                    onClick={() => setSelectedVideo(null)}
                                    className="flex-1 sm:flex-none px-10 py-4 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Concluir Aula
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademyTool;
