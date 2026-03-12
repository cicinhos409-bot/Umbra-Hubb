
import React, { useState, useEffect } from 'react';
import { Download, Link2, Loader2, AlertCircle, CheckCircle2, Copy, Facebook } from 'lucide-react';

interface MediaItem {
    label: string;
    url: string;
    width: number;
    height: number;
    duration?: number;
    format?: string;
}

interface FacebookData {
    type: 'video' | 'unknown';
    thumbnail: string;
    title: string;
    pinId: string;
    videos: MediaItem[];
    images: MediaItem[];
}

const API_BASE_URL = 'https://umbra-hubb-production.up.railway.app'; 

const FacebookDownloaderTool: React.FC = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<FacebookData | null>(null);

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text.includes('facebook.com') || text.includes('fb.watch')) {
                setUrl(text);
            } else {
                setError('O conteúdo copiado não é um link do Facebook.');
                setTimeout(() => setError(null), 3000);
            }
        } catch (err) {
            setError('Não foi possível acessar a área de transferência.');
            setTimeout(() => setError(null), 3000);
        }
    };

    const fetchVideo = async () => {
        if (!url.trim()) return;

        setLoading(true);
        setError(null);
        setData(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/facebook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim() }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao buscar dados do Facebook.');
            }

            setData(result);
        } catch (err: any) {
            setError(err.message || 'Erro de conexão.');
        } finally {
            setLoading(false);
        }
    };

    const getDownloadUrl = (item: MediaItem) => {
        const ext = 'mp4';
        return `${API_BASE_URL}/api/download?url=${encodeURIComponent(url)}&filename=facebook_${item.label}_${data?.pinId}.${ext}&height=${item.height}`;
    };

    return (
        <div className="space-y-6">
            <div className="bg-background-mid border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -z-10 group-hover:bg-blue-600/20 transition-all duration-700" />
                
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3.5 bg-blue-600/10 rounded-2xl border border-blue-600/20">
                        <Facebook className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-wider">Facebook Downloader</h2>
                        <p className="text-gray-400 text-sm">Baixe vídeos do Facebook em alta qualidade</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="relative group/input">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Link2 className="h-5 h-5 text-gray-500 group-focus-within/input:text-blue-600 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Cole o link do Facebook aqui..."
                            className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-32 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50 transition-all shadow-inner"
                            onKeyDown={(e) => e.key === 'Enter' && fetchVideo()}
                        />
                        <button
                            onClick={handlePaste}
                            className="absolute right-2 top-2 bottom-2 px-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-white/5"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            COLAR
                        </button>
                    </div>

                    <button
                        onClick={fetchVideo}
                        disabled={loading || !url.trim()}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-3 ${
                            loading || !url.trim()
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-[1.01] active:scale-[0.99]'
                        }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                BUSCANDO...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                BUSCAR VÍDEO
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mt-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm animate-in fade-in slide-in-from-top-4">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}
            </div>

            {data && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                    <div className="bg-background-mid border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 flex flex-col md:flex-row gap-6">
                            {/* Thumbnail */}
                            <div className="w-full md:w-48 aspect-square rounded-2xl overflow-hidden bg-background-dark border border-white/5 flex-shrink-0 relative group">
                                {data.thumbnail ? (
                                    <img
                                        src={data.thumbnail}
                                        alt="Thumbnail"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                                        <Facebook className="w-12 h-12 text-white/10" />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                                        VÍDEO
                                    </span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 flex flex-col justify-center py-2">
                                <h3 className="text-xl font-black text-white leading-tight mb-2 line-clamp-2">
                                    {data.title}
                                </h3>
                                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                                    <span className="font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                        ID: {data.pinId}
                                    </span>
                                </div>

                                <div className="mt-auto">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Opções de Download</h4>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {data.videos.map((item, index) => (
                                            <a
                                                key={index}
                                                href={getDownloadUrl(item)}
                                                download
                                                className="flex items-center justify-between p-4 bg-background-dark/50 hover:bg-white/5 border border-white/5 rounded-2xl group/btn transition-all"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white group-hover/btn:text-blue-500 transition-colors">
                                                        {item.label}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-mono">
                                                        {item.width}x{item.height} {item.format || ''}
                                                    </span>
                                                </div>
                                                <div className="p-2 bg-white/5 rounded-xl text-gray-400 group-hover/btn:bg-blue-600 group-hover/btn:text-white transition-all">
                                                    <Download className="w-4 h-4" />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Tips/Info */}
                        <div className="px-8 py-4 bg-white/5 border-t border-white/5">
                            <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest font-bold">
                                Apenas para uso pessoal • Respeite os direitos autorais
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacebookDownloaderTool;
