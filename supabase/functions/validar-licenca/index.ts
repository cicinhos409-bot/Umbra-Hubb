import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const payload = await req.json()
        let { action, chave, device_id, token, slug, version } = payload || {}

        // --- LEGACY SUPPORT ---
        // Se a ação estiver vindo vazia, detectamos pelo conteúdo do payload
        if (!action) {
            if (token) action = 'verify'
            else if (chave) action = 'activate'
        }

        const actionClean = (action || '').trim().toLowerCase()
        const chaveClean = (chave || '').trim().toUpperCase()
        const deviceClean = (device_id || '').trim()

        console.log(`[SDK] Action: ${actionClean} (Auto: ${!payload.action}) | Chave: ${chaveClean} | Device: ${deviceClean}`)

        // 1. Kill Switch Check
        const { data: ext } = await supabase
            .from('extensoes')
            .select('status, name')
            .eq('slug', slug || 'umbrahub-all')
            .maybeSingle()

        if (ext?.status === 'inactive') {
            console.log(`[SDK] Extension blocked: ${slug}`)
            return new Response(JSON.stringify({
                blocked: true,
                motivo: 'Esta extensão foi desativada temporariamente para manutenção.'
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // --- AÇÃO: ACTIVATE ---
        if (actionClean === 'activate') {
            if (!chaveClean || !deviceClean) {
                return new Response(JSON.stringify({ valido: false, motivo: 'Chave e Device ID são obrigatórios.' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            const { data: lic, error: licErr } = await supabase
                .from('licencas')
                .select('*, data_expiracao')
                .eq('chave', chaveClean)
                .eq('status', 'ativa')
                .maybeSingle()

            if (licErr || !lic) {
                console.log(`[SDK] License not found or inactive: ${chaveClean}`)
                return new Response(JSON.stringify({ valido: false, motivo: 'Chave inválida ou expirada.' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            // 1.1 Verificação de Data de Expiração
            if (lic.data_expiracao && new Date(lic.data_expiracao) < new Date()) {
                console.log(`[SDK] License expired by date: ${lic.data_expiracao}`)
                return new Response(JSON.stringify({ valido: false, motivo: 'Sua licença expirou. Renove seu plano para continuar usando.' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            // Tenta obter IP e User-Agent da requisição de forma robusta
            const userIP = req.headers.get('cf-connecting-ip') || 
                           req.headers.get('x-real-ip') || 
                           req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                           '';
            const userAgent = req.headers.get('user-agent') || '';

            console.log(`[SDK] Detect: IP=${userIP} | UA=${userAgent} | Chave=${chaveClean}`)

            // Verifica quantos dispositivos JÁ estão registrados para esta chave
            const { count, error: countErr } = await supabase
                .from('dispositivos')
                .select('*', { count: 'exact', head: true })
                .eq('chave', chaveClean)

            if (countErr) {
                console.error(`[SDK] Error counting devices:`, countErr)
            }

            // --- LÓGICA DE DETECÇÃO INTELIGENTE ---
            // 1. Tenta pelo Device ID Exato
            let { data: devExist } = await supabase
                .from('dispositivos')
                .select('*')
                .eq('chave', chaveClean)
                .eq('device_id', deviceClean)
                .maybeSingle()

            // 2. Contingência: Se não achou pelo ID, tenta pelo IP + User Agent recentes (últimos 10 min)
            // Isso agrupa extensões diferentes no mesmo PC se o ID Global falhar
            if (!devExist && userIP) {
                const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
                const { data: devSmartMatch } = await supabase
                    .from('dispositivos')
                    .select('*')
                    .eq('chave', chaveClean)
                    .eq('ip_address', userIP)
                    .eq('user_agent', userAgent)
                    .gt('ultimo_acesso', tenMinsAgo)
                    .order('ultimo_acesso', { ascending: false })
                    .limit(1)
                    .maybeSingle()
                
                if (devSmartMatch) {
                    console.log(`[SDK] Smart Match found! Reuse Device: ${devSmartMatch.device_id}`);
                    devExist = devSmartMatch;
                }
            }

            console.log(`[SDK] Check Limit: Count=${count} | Max=${lic.max_dispositivos} | Already exists=${!!devExist}`)

            /* 
            // Bloqueio de limite removido por solicitação (Uso Ilimitado)
            if (!devExist && count !== null && count >= lic.max_dispositivos) {
                return new Response(JSON.stringify({ valido: false, motivo: `Limite de ${lic.max_dispositivos} dispositivos atingido.` }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            */

            // Gera e salva Session Token (30 dias)
            const newToken = crypto.randomUUID()
            const expiry = new Date()
            expiry.setHours(expiry.getHours() + 720) // 30 dias

            // Gerencia lista de extensões ativas
            let extensoesAtivas = devExist?.extensoes_ativas || [];
            if (!Array.isArray(extensoesAtivas)) extensoesAtivas = [];
            if (slug && !extensoesAtivas.includes(slug)) {
                extensoesAtivas.push(slug);
            }

            if (devExist) {
                await supabase.from('dispositivos').update({
                    token: newToken,
                    token_expiracao: expiry.toISOString(),
                    versao_app: version,
                    ultimo_acesso: new Date().toISOString(),
                    ip_address: userIP,
                    user_agent: userAgent,
                    extensoes_ativas: extensoesAtivas
                }).eq('id', devExist.id)
                console.log(`[SDK] Device updated: ${deviceClean} | Exts: ${extensoesAtivas.length}`)
            } else {
                await supabase.from('dispositivos').insert([{
                    chave: chaveClean,
                    device_id: deviceClean,
                    token: newToken,
                    token_expiracao: expiry.toISOString(),
                    nome: `Dispositivo ${(count || 0) + 1}`,
                    versao_app: version,
                    ip_address: userIP,
                    user_agent: userAgent,
                    extensoes_ativas: [slug].filter(Boolean)
                }])
                console.log(`[SDK] New device registered: ${deviceClean}`)
            }

            return new Response(JSON.stringify({
                valido: true,
                token: newToken,
                token_duration: 2592000, // 30 dias
                plano: lic.plano
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // --- AÇÃO: HEARTBEAT / VERIFY ---
        if (actionClean === 'heartbeat' || actionClean === 'verify') {
            if (!deviceClean || !token) {
                return new Response(JSON.stringify({ valido: false, motivo: 'Device ID e Token são obrigatórios.' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            const { data: dev, error: devErr } = await supabase
                .from('dispositivos')
                .select('*, licencas!inner(*)')
                .eq('device_id', deviceClean)
                .eq('token', token)
                .maybeSingle()

            if (devErr || !dev) {
                console.log(`[SDK] Session not found: Dev=${deviceClean} | Token=${token}`)
                return new Response(JSON.stringify({ valido: false, motivo: 'Sessão inválida. Reative a licença.' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            const now = new Date()
            const exp = new Date(dev.token_expiracao)
            if (exp < now) {
                console.log(`[SDK] Token expired: ${dev.token_expiracao}`)
                return new Response(JSON.stringify({ valido: false, motivo: 'Sessão expirada. Reative o app.' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            // Verifica se a licença vinculada ainda está ativa
            const licenca = Array.isArray(dev.licencas) ? dev.licencas[0] : dev.licencas;
            if (!licenca || licenca.status !== 'ativa') {
                return new Response(JSON.stringify({ valido: false, motivo: 'Licença revogada ou suspensa.' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            // NOVA: Verificação de Data de Expiração no Heartbeat
            if (licenca.data_expiracao && new Date(licenca.data_expiracao) < new Date()) {
                console.log(`[SDK] License expired by date in heartbeat: ${licenca.data_expiracao}`)
                return new Response(JSON.stringify({ valido: false, motivo: 'Sua licença expirou. Renove seu plano para continuar.' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            // Tenta obter IP e User-Agent para manter o rastro atualizado
            const userIP = req.headers.get('cf-connecting-ip') || 
                           req.headers.get('x-real-ip') || 
                           req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                           '';
            const userAgent = req.headers.get('user-agent') || '';

            // Atualiza heartbeat e rastro
            await supabase.from('dispositivos')
                .update({ 
                    ultimo_acesso: new Date().toISOString(),
                    ip_address: userIP,
                    user_agent: userAgent
                })
                .eq('id', dev.id)

            return new Response(JSON.stringify({
                valido: true,
                status: 'active',
                plano: licenca.plano
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        console.log(`[SDK] Invalid action: ${actionClean}`)
        return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400, headers: corsHeaders })

    } catch (e: any) {
        console.error('[SDK] Fatal Error:', e);
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
