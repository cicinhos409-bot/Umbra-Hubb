import React, { useState, useEffect } from 'react';
import {
    Key, Copy, CheckCircle2, RefreshCw, Lock, Smartphone,
    Activity, Monitor, Clock, Zap, Shield, X, Terminal,
    AlertTriangle, ChevronRight
} from 'lucide-react';
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
    extensoes_ativas?: string[];
    ip_address?: string;
}

interface LicenseData {
    chave: string;
    plano: string;
    status: string;
    max_dispositivos: number;
    dispositivosCount: number;
    dispositivosList?: DeviceData[];
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
                .select(`chave, plano, status, max_dispositivos, dispositivos(count)`)
                .eq('email', userEmail)
                .eq('status', 'ativa')
                .maybeSingle();

            if (error) throw error;

            if (data) {
                const { data: edgeData } = await supabase.functions.invoke('gerenciar-dispositivos', {
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
        if (!license || !window.confirm('Tem certeza que deseja desconectar este dispositivo?')) return;
        try {
            await supabase.functions.invoke('gerenciar-dispositivos', {
                body: { action: 'remover', chave: license.chave, device_id: deviceId }
            });
            fetchLicenseData();
        } catch {
            alert('Erro ao remover dispositivo.');
        }
    };

    const handleResetAll = async () => {
        if (!license || !window.confirm('Isso removerá TODOS os dispositivos conectados. Continuar?')) return;
        try {
            await supabase.functions.invoke('gerenciar-dispositivos', {
                body: { action: 'reset_total', chave: license.chave }
            });
            fetchLicenseData();
        } catch {
            alert('Erro ao resetar dispositivos.');
        }
    };

    useEffect(() => {
        if (userEmail) fetchLicenseData();
    }, [userEmail]);

    const handleCopy = () => {
        if (license) {
            navigator.clipboard.writeText(license.chave);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const slotsUsed = license?.dispositivosCount ?? 0;
    const slotsMax  = license?.max_dispositivos ?? 0;
    const slotsPercent = slotsMax > 0 ? Math.round((slotsUsed / slotsMax) * 100) : 0;

    // ── LOADING ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <RefreshCw className="w-7 h-7 text-gray-300 animate-spin" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Carregando licença...</p>
            </div>
        );
    }

    // ── SEM LICENÇA (FREE / não encontrada) ──────────────────────────────────
    if (!license) {
        return (
            <div className="max-w-4xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Page header */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
                    <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
                        <Key className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                            <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.2em]">Central de Licenças</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Minhas Licenças</h1>
                        <p className="text-gray-600 font-black mt-1">Gerencie sua chave de ativação e dispositivos conectados.</p>
                    </div>
                </div>

                {/* Locked card */}
                <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="px-8 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                            <Lock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-900">Nenhuma Licença Ativa</h3>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Recurso exclusivo PRO</p>
                        </div>
                    </div>
                    <div className="p-8 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Lock className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">Assine o plano PRO</h3>
                            <p className="text-gray-500 font-black text-sm leading-relaxed mb-8">
                                Chaves de licença e gestão multi-dispositivo são recursos exclusivos do plano PRO.
                                Ative agora e use as extensões Umbra em até {slotsMax || 3} dispositivos simultaneamente.
                            </p>
                            <button
                                onClick={() => window.open('https://pay.cakto.com.br/3dko6xr_769683', '_blank')}
                                className="px-10 py-4 bg-primary text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary/90 active:scale-95 transition-all inline-flex items-center gap-2"
                            >
                                <Zap className="w-4 h-4" /> Assinar PRO agora
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    // ── COM LICENÇA ATIVA ────────────────────────────────────────────────────
    return (
        <div className="max-w-4xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6">

            {/* ── PAGE HEADER ── */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-4">
                <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
                    <Key className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.2em]">Central de Licenças</span>
                        <span className="px-3 py-1 rounded-full bg-green-50 border border-green-200 text-[10px] font-black text-green-700 uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" /> Licença Ativa
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Minhas Licenças</h1>
                    <p className="text-gray-600 font-black mt-1">Gerencie sua chave de ativação e dispositivos conectados.</p>
                </div>
            </div>

            {/* ── LICENSE KEY CARD ── */}
            <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                            <Key className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-900">Chave de Ativação</h3>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Plano {license.plano}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 border border-green-200">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Ativa</span>
                    </div>
                </div>

                <div className="p-8">
                    <div className={`bg-gray-50 border-2 rounded-2xl p-6 flex flex-col items-center gap-5 transition-all duration-300 ${copied ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">License Key</span>
                        <div className={`font-mono text-lg md:text-2xl font-black tracking-[0.15em] text-center break-all select-all transition-colors ${copied ? 'text-primary' : 'text-gray-900'}`}>
                            {license.chave}
                        </div>
                        <button
                            onClick={handleCopy}
                            className={`px-8 py-3 rounded-xl flex items-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${
                                copied
                                    ? 'bg-primary text-white'
                                    : 'bg-white border border-gray-200 text-gray-900 hover:bg-gray-900 hover:text-white hover:border-gray-900'
                            }`}
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copiado!' : 'Copiar Chave'}
                        </button>
                    </div>
                </div>
            </section>

            {/* ── STATUS CARDS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Slots de dispositivos */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                            <Monitor className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-gray-900">Slots de Dispositivos</h4>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Uso atual</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-end justify-between mb-3">
                            <span className="text-4xl font-black text-gray-900">{slotsUsed}</span>
                            <span className="text-sm font-black text-gray-400 mb-1.5">de {slotsMax} slots</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${slotsPercent >= 100 ? 'bg-red-500' : slotsPercent >= 75 ? 'bg-amber-400' : 'bg-primary'}`}
                                style={{ width: `${Math.min(slotsPercent, 100)}%` }}
                            />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">
                            {slotsMax - slotsUsed} slot{slotsMax - slotsUsed !== 1 ? 's' : ''} disponível{slotsMax - slotsUsed !== 1 ? 'is' : ''}
                        </p>
                    </div>
                </div>

                {/* Protocolo + Reset */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                            <Terminal className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-gray-900">Como Ativar</h4>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Protocolo de ativação</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-5">
                        <p className="text-sm text-gray-600 font-black leading-relaxed">
                            Cole a chave no campo <span className="text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">License Key</span> dentro das extensões Umbra. O slot vincula automaticamente ao seu hardware.
                        </p>
                        <div className="h-px bg-gray-100" />
                        <button
                            onClick={handleResetAll}
                            className="w-full flex items-center justify-between px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs font-black text-red-700 uppercase tracking-widest hover:bg-red-100 hover:border-red-200 transition-all group"
                        >
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Resetar todos os dispositivos
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── DEVICES LIST ── */}
            <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                            <Activity className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-900">Dispositivos Conectados</h3>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                {slotsUsed} dispositivo{slotsUsed !== 1 ? 's' : ''} ativo{slotsUsed !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchLicenseData}
                        className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all"
                        title="Atualizar"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                <div className="divide-y divide-gray-100">
                    {license.dispositivosList && license.dispositivosList.length > 0 ? (
                        license.dispositivosList.map((dev) => (
                            <div key={dev.id} className="group flex items-center justify-between px-8 py-5 hover:bg-gray-50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center group-hover:bg-gray-900 group-hover:border-gray-900 transition-all shrink-0">
                                        <Smartphone className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-0.5">
                                            <h4 className="text-sm font-black text-gray-900">{dev.nome || 'Dispositivo'}</h4>
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 border border-green-200 rounded-full text-[8px] font-black text-green-700 uppercase tracking-widest">
                                                <span className="w-1 h-1 rounded-full bg-green-500 inline-block" /> Online
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(dev.ultimo_acesso).toLocaleDateString('pt-BR')}</span>
                                            {dev.ip_address && <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {dev.ip_address}</span>}
                                            <span>ID: {dev.device_id.slice(0, 8)}…</span>
                                        </div>
                                        {dev.extensoes_ativas && dev.extensoes_ativas.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {dev.extensoes_ativas.map(slug => (
                                                    <span key={slug} className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[8px] font-black uppercase tracking-widest text-primary">
                                                        {slug}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveDevice(dev.device_id)}
                                    className="opacity-0 group-hover:opacity-100 p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shrink-0"
                                    title="Desconectar"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="px-8 py-12 text-center">
                            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Smartphone className="w-7 h-7 text-gray-400" />
                            </div>
                            <h4 className="text-base font-black text-gray-900 mb-1">Nenhum dispositivo conectado</h4>
                            <p className="text-sm font-black text-gray-500 leading-relaxed">
                                Ative a extensão Umbra em qualquer dispositivo usando a chave acima.
                            </p>
                        </div>
                    )}
                </div>
            </section>

        </div>
    );
};

export default LicensesTool;
