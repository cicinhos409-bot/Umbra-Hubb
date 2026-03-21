
import React, { useState } from 'react';
import {
    Play,
    ChevronDown,
    BookOpen,
    X,
    CheckCircle2,
    Zap,
    Layout,
    Clock,
    ExternalLink
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
                title: 'Aula 1 — Qual é a Melhor Maneira De Usar a Umbra Hub?',
                description: 'Aprenda a navegar pela plataforma e extrair o máximo das ferramentas.',
                duration: '19:12',
                videoId: '15mIryiVzgz-5QTMPQcpZQXr7BX69C2Kg'
            }
        ]
    },
    {
        id: 'mod2',
        number: '02',
        title: 'Modelagem De Conteúdos Virais',
        subtitle: 'A estratégia por trás do crescimento',
        lessons: [
            {
                id: 'l2-1',
                title: 'Aula 1 — Conheça Meu Treinamento Completo',
                description: 'Visão geral sobre o ecossistema de criação viral.',
                duration: '15:20',
                videoId: 'ID_VIDEO_2'
            }
        ]
    },
    {
        id: 'mod3',
        number: '03',
        title: 'Conheço o Império Dark Por Dentro',
        subtitle: 'Estruturação de canais sem aparecer',
        lessons: [
            {
                id: 'l3-1',
                title: 'Aula 1 — Conheço o Império Dark Por Dentro',
                description: 'Explorando as táticas dos grandes canais dark.',
                duration: '22:45',
                videoId: 'ID_VIDEO_3'
            }
        ]
    }
];

const AcademyTool: React.FC = () => {
    const [openModules, setOpenModules] = useState<Set<string>>(new Set(['mod1']));
    const [selectedVideo, setSelectedVideo] = useState<{ id: string; title: string } | null>(null);

    const toggleModule = (id: string) => {
        const next = new Set(openModules);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setOpenModules(next);
    };

    const openVideo = (videoId: string, title: string) => {
        setSelectedVideo({ id: videoId, title });
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden bg-background-mid border border-white/5 rounded-[40px] md:rounded-[56px] p-8 md:p-20 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-purple/5 -mr-32 -mt-32 rounded-full blur-3xl opacity-50" />
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
                    <div className="w-20 h-20 md:w-32 md:h-32 bg-gradient-to-br from-brand-purple to-brand-pink rounded-[32px] md:rounded-[40px] flex items-center justify-center text-3xl md:text-5xl shadow-2xl shadow-brand-purple/20 shrink-0">
                        🎓
                    </div>
                    <div className="text-center md:text-left flex-1 space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-purple/10 border border-brand-purple/20 rounded-full text-[10px] font-black text-brand-purple uppercase tracking-widest">
                            <Zap className="w-3 h-3 fill-current" /> Umbra Academy
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
                            Umbra <span className="bg-gradient-to-r from-brand-purple to-brand-pink bg-clip-text text-transparent">Academy</span>
                        </h2>
                        <p className="text-gray-500 text-sm md:text-xl font-medium max-w-2xl leading-relaxed">
                            O ponto de partida para quem quer aprender a criar conteúdo viral, dominar as principais plataformas digitais e estruturar processos inteligentes.
                        </p>

                        <div className="flex justify-center md:justify-start gap-8 pt-4">
                            <div className="text-center md:text-left">
                                <div className="text-2xl font-black text-white">03</div>
                                <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Módulos</div>
                            </div>
                            <div className="text-center md:text-left">
                                <div className="text-2xl font-black text-white">100%</div>
                                <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Focado em Viral</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CURRICULUM SECTION */}
            <section className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between px-4">
                    <div className="space-y-1">
                        <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-brand-purple" /> Grade Curricular
                        </h3>
                    </div>
                </div>

                <div className="space-y-4">
                    {ACADEMY_DATA.map((module, idx) => {
                        const isOpen = openModules.has(module.id);
                        const colorClass = idx % 3 === 0 ? 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20' :
                            idx % 3 === 1 ? 'text-brand-purple bg-brand-purple/10 border-brand-purple/20' :
                                'text-brand-pink bg-brand-pink/10 border-brand-pink/20';

                        return (
                            <div
                                key={module.id}
                                className={`group bg-background-mid border border-white/5 rounded-[32px] overflow-hidden transition-all duration-300 ${isOpen ? 'ring-1 ring-brand-purple/20 shadow-2xl' : 'hover:border-white/10'}`}
                            >
                                <div
                                    onClick={() => toggleModule(module.id)}
                                    className="p-6 md:p-8 flex items-center justify-between cursor-pointer select-none"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base border ${colorClass}`}>
                                            {module.number}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-white group-hover:text-brand-purple transition-colors">{module.title}</h4>
                                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{module.subtitle} • {module.lessons.length} Aula{module.lessons.length > 1 ? 's' : ''}</p>
                                        </div>
                                    </div>
                                    <ChevronDown className={`w-6 h-6 text-gray-700 transition-transform duration-500 ${isOpen ? 'rotate-180 text-brand-purple' : ''}`} />
                                </div>

                                {isOpen && (
                                    <div className="px-6 md:px-8 pb-8 space-y-3 animate-in slide-in-from-top-4 duration-300">
                                        {module.lessons.map(lesson => (
                                            <div
                                                key={lesson.id}
                                                onClick={() => openVideo(lesson.videoId, lesson.title)}
                                                className="flex items-start gap-4 p-5 bg-white/5 border border-white/5 rounded-2xl cursor-pointer hover:bg-brand-purple/10 hover:border-brand-purple/20 transition-all group/lesson"
                                            >
                                                <div className="w-10 h-10 bg-background-deep rounded-xl flex items-center justify-center text-brand-purple shrink-0 mt-1 group-hover/lesson:scale-110 transition-transform">
                                                    <Play className="w-4 h-4 fill-current" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className="text-sm font-bold text-white group-hover/lesson:text-brand-purple transition-colors">{lesson.title}</h5>
                                                        <span className="text-[10px] font-black text-gray-700 flex items-center gap-1.5 uppercase">
                                                            <Clock className="w-3 h-3" /> {lesson.duration}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">{lesson.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* VIDEO MODAL */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[300] bg-background-deep/98 backdrop-blur-3xl flex items-center justify-center p-2 sm:p-4 md:p-12 animate-in fade-in duration-300">
                    <div className="absolute inset-0" onClick={() => setSelectedVideo(null)} />

                    <div className="relative w-full max-w-5xl max-h-[95vh] overflow-y-auto bg-background-mid border border-brand-purple/20 rounded-2xl sm:rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-4 sm:p-6 md:p-8 flex items-center justify-between border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-purple/20 text-brand-purple rounded-xl flex items-center justify-center shrink-0">
                                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm sm:text-lg font-black text-white tracking-tight truncate">{selectedVideo.title}</h3>
                                    <p className="text-[9px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest">Umbra Hub Academy • Treinamento Oficial</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="p-2 sm:p-3 bg-white/5 rounded-xl sm:rounded-2xl text-gray-500 hover:text-white hover:bg-white/10 transition-all shrink-0 ml-2"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        {/* Video Player */}
                        <div className="aspect-video bg-black relative">
                            {selectedVideo.id.startsWith('ID_VIDEO') ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 sm:p-12 text-center space-y-4">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-pink/10 text-brand-pink rounded-2xl sm:rounded-[32px] flex items-center justify-center mb-4">
                                        <X className="w-8 h-8 sm:w-10 sm:h-10" />
                                    </div>
                                    <h4 className="text-xl sm:text-2xl font-black text-white">Aula em Manutenção</h4>
                                    <p className="text-gray-500 max-w-sm mx-auto font-medium text-sm">Esta aula está sendo atualizada com novos conteúdos virais e estará disponível em breve.</p>
                                </div>
                            ) : (
                                <iframe
                                    className="w-full h-full absolute inset-0"
                                    src={`https://drive.google.com/file/d/${selectedVideo.id}/preview`}
                                    title={selectedVideo.title}
                                    frameBorder="0"
                                    allow="autoplay; fullscreen; encrypted-media"
                                    allowFullScreen
                                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                                    style={{ border: 0 }}
                                />
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:p-6 md:p-8 bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-background-mid bg-background-deep overflow-hidden">
                                            <img src={`https://i.pravatar.cc/100?u=user${i}`} alt="User" />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[11px] sm:text-xs text-gray-500 font-bold">Mais de <span className="text-white">500 alunos</span> assistiram esta aula hoje</p>
                            </div>
                            <button
                                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-brand-purple text-white rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-purple/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Marcar como Concluída
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademyTool;
