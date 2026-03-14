
import React, { useState, useEffect } from 'react';
import { Key, Copy, CheckCircle2, Shield, AlertCircle, Info, RefreshCw, Lock } from 'lucide-react';
import { ToolTier } from '../types';
import { supabase } from '../services/supabaseClient';

interface LicensesToolProps {
    userTier: ToolTier;
    userEmail: string;
}

interface DeviceData {
    id: number;
    device_id: string;
    nome: string;
    ultimo_acesso: string;
    criado_em: string;
}

interface LicenseData {
    chave: string;
    plano: string;
    status: string;
    max_dispositivos: number;
    dispositivosCount: number;
    dispositivosList?: (DeviceData & { extensoes_ativas?: string[], ip_address?: string })[];
}

const LicensesTool: React.FC<LicensesToolProps> = ({ userTier, userEmail }) => {
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [license, setLicense] = useState<LicenseData | null>(null);

    const fetchLicenseData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('licencas')
                .select(`
          chave, plano, status, max_dispositivos,
          dispositivos(count)
        `)
                .eq('email', userEmail)
                .eq('status', 'ativa')
                .maybeSingle();

            if (error) throw error;

            if (data) {
                // Buscar lista detalhada via Edge Function (seguro)
                const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('gerenciar-dispositivos', {
                    body: { action: 'listar', chave: data.chave }
                });

                setLicense({
                    chave: data.chave,
                    plano: data.plano,
                    status: data.status,
                    max_dispositivos: data.max_dispositivos,
                    dispositivosCount: data.dispositivos?.[0]?.count ?? 0,
                    dispositivosList: edgeData?.devices || []
                });
            } else {
                setLicense(null);
            }
        } catch (err) {
            console.error('Erro ao buscar licença:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveDevice = async (deviceId: string) => {
        if (!license || !window.confirm('Deseja realmente remover este dispositivo?')) return;

        try {
            const { error } = await supabase.functions.invoke('gerenciar-dispositivos', {
                body: { action: 'remover', chave: license.chave, device_id: deviceId }
            });

            if (error) throw error;
            fetchLicenseData(); // Atualiza a lista
        } catch (err) {
            alert('Erro ao remover dispositivo.');
        }
    };

    const handleResetAll = async () => {
        if (!license || !window.confirm('ATENÇÃO: Isso removerá TODOS os seus dispositivos. Você precisará reativar sua chave nas extensões. Continuar?')) return;

        try {
            const { error } = await supabase.functions.invoke('gerenciar-dispositivos', {
                body: { action: 'reset_total', chave: license.chave }
            });

            if (error) throw error;
            fetchLicenseData();
        } catch (err) {
            alert('Erro ao resetar dispositivos.');
        }
    };

    useEffect(() => {
        if (userEmail) {
            fetchLicenseData();
        }
    }, [userEmail]);

    const handleCopy = () => {
        if (license) {
            navigator.clipboard.writeText(license.chave);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <RefreshCw className="w-12 h-12 text-brand-cyan animate-spin mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Sincronizando com o servidor...</p>
            </div>
        );
    }

    return (
        <div className="font-rajdhani space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 max-w-4xl mx-auto">
            <header className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-cyan/10 rounded-[28px] mb-6 shadow-2xl shadow-brand-cyan/10 ring-1 ring-brand-cyan/20">
                    <Key className="w-10 h-10 text-brand-cyan" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-r from-brand-cyan to-brand-purple bg-clip-text text-transparent uppercase">
                    Central de Licenças
                </h1>
                <p className="text-gray-500 font-medium tracking-wide uppercase text-[10px]">Ative suas extensões e ferramentas externas</p>
                <div className="h-px w-32 bg-gradient-to-r from-transparent via-brand-cyan/30 to-transparent mx-auto mt-6" />
            </header>

            {license ? (
                <section className="bg-background-mid border border-white/5 rounded-[40px] overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/5 -mr-32 -mt-32 rounded-full blur-3xl pointer-events-none" />

                    <div className="p-10 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-brand-cyan" />
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Licença de Ativação Global</h2>
                                </div>
                                <p className="text-gray-500 font-medium text-sm">Esta chave libera o funcionamento de todas as extensões Umbra no seu navegador.</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${license.plano === 'turbo' ? 'bg-brand-pink/10 border-brand-pink/20 text-brand-pink' :
                                    'bg-brand-purple/10 border-brand-purple/20 text-brand-purple'
                                    }`}>
                                    Plano: {license.plano}
                                </div>
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                    Dispositivos: <span className="text-white">{license.dispositivosCount}/{license.max_dispositivos}</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative group">
                            <div className={`p-8 bg-black/40 border-2 rounded-[32px] font-mono text-xl md:text-2xl font-black tracking-widest text-center transition-all ${copied ? 'border-brand-green text-brand-green' : 'border-white/5 group-hover:border-brand-cyan/30 text-white'
                                }`}>
                                {license.chave}
                            </div>
                            <button
                                onClick={handleCopy}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group/btn"
                                title="Copiar Licença"
                            >
                                {copied ? <CheckCircle2 className="w-6 h-6 text-brand-green" /> : <Copy className="w-6 h-6 text-brand-cyan group-hover/btn:scale-110 transition-transform" />}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-white/5 border border-white/5 rounded-[28px] space-y-3">
                                <div className="flex items-center gap-3 text-brand-purple">
                                    <Info className="w-5 h-5" />
                                    <h4 className="text-sm font-black uppercase tracking-widest">Como usar?</h4>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                    1. Copie a chave acima.<br />
                                    2. Abra qualquer extensão da Umbra no Chrome.<br />
                                    3. Cole no campo "License Key" e clique em **Ativar**.
                                </p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/5 rounded-[28px] space-y-3">
                                <div className="flex items-center gap-3 text-brand-cyan">
                                    <RefreshCw className="w-5 h-5" />
                                    <h4 className="text-sm font-black uppercase tracking-widest">Gerenciar Slots</h4>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                        Libere espaço para novos computadores removendo dispositivos antigos.
                                    </p>
                                    <button
                                        onClick={handleResetAll}
                                        className="text-[10px] font-black uppercase tracking-widest text-brand-pink hover:text-brand-pink/80 transition-colors"
                                    >
                                        Limpar todos os slots
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Lista de Dispositivos */}
                        {license.dispositivosList && license.dispositivosList.length > 0 && (
                            <div className="space-y-4 pt-4 border-t border-white/5">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Dispositivos Conectados</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {license.dispositivosList.map((dev) => (
                                        <div key={dev.id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5 group/device">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                                                    <Shield className="w-5 h-5 text-gray-500 group-hover/device:text-brand-cyan transition-colors" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white uppercase">{dev.nome || 'Meu Computador'}</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {dev.extensoes_ativas && dev.extensoes_ativas.map((slug: string) => (
                                                            <span key={slug} className="text-[8px] bg-brand-cyan/10 text-brand-cyan px-1.5 py-0.5 rounded border border-brand-cyan/20">
                                                                {slug}
                                                            </span>
                                                        ))}
                                                        {!dev.extensoes_ativas?.length && <span className="text-[8px] text-gray-600">Nenhuma extensão ativa</span>}
                                                    </div>
                                                    <p className="text-[9px] text-gray-500 mt-1 font-mono">{dev.ip_address || 'IP Oculto'}</p>
                                                    <p className="text-[10px] text-gray-600 font-medium">Última atividade: {new Date(dev.ultimo_acesso).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveDevice(dev.device_id)}
                                                className="px-4 py-2 bg-brand-pink/5 hover:bg-brand-pink/20 text-brand-pink rounded-xl text-[10px] font-black uppercase tracking-widest transition-all opacity-0 group-hover/device:opacity-100"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            ) : (
                <div className="bg-background-mid border border-white/5 rounded-[40px] p-16 text-center space-y-8 shadow-2xl">
                    <div className="w-20 h-20 bg-gray-500/10 rounded-[28px] flex items-center justify-center mx-auto ring-1 ring-white/10">
                        <Lock className="w-10 h-10 text-gray-600" />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Nenhuma Licença Ativa</h3>
                        <p className="text-gray-500 font-medium max-w-sm mx-auto">
                            Chaves de licença são exclusivas para assinantes **PRO** e **TURBO**.
                            Sua conta atual não possui acesso às extensões externas.
                        </p>
                    </div>
                    <button
                        onClick={() => window.open('https://pay.cakto.com.br/36m5p68', '_blank')}
                        className="px-12 py-5 bg-gradient-to-r from-brand-purple to-brand-pink text-white font-black rounded-2xl hover:scale-105 transition-all uppercase text-xs tracking-[0.2em] shadow-2xl"
                    >
                        Assinar Plano e Liberar Agora
                    </button>
                </div>
            )}
        </div>
    );
};

export default LicensesTool;
