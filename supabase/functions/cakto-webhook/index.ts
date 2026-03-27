import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const CAKTO_SECRET = Deno.env.get('CAKTO_WEBHOOK_SECRET')

Deno.serve(async (req: Request) => {
    // Solo permitir POST
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
    }

    try {
        const payload = await req.json()
        console.log('Received payload:', payload)

            // Verificar o segredo do webhook
            if (CAKTO_SECRET && payload.secret !== CAKTO_SECRET) {
                console.error(`Invalid webhook secret. Expected: ${CAKTO_SECRET.slice(0, 4)}... Received: ${payload.secret?.slice(0, 4)}...`)
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
            }

            // Cakto webhook events typically include 'event' and 'data'
            // Specifically looking for "Compra aprovada" (Approved Purchase)
            // We expect the payload to have user email and product info

            // NOTE: Map your Cakto product IDs or names to ToolTier
            const { event, data } = payload

            if (event === 'purchase.approved' || event === 'approved' || event === 'order.approved') {
                const email = data.customer?.email || data.email
                const productName = (data.product?.name || data.product_name || '').toLowerCase()
                const customerName = data.customer?.name || data.name || 'Cliente Umbra'

                let tier = 'FREE'
                let maxDevices = 2
                
                // Mapeamento Flexível de Produtos
                if (productName.includes('pro') || productName.includes('umbra hub')) {
                    tier = 'PRO'
                    maxDevices = 2
                } else if (productName.includes('turbo')) {
                    tier = 'TURBO'
                    maxDevices = 3
                }

                if (email && tier !== 'FREE') {
                // 1. Atualizar o Tier no perfil do usuário
                await supabase.from('profiles').update({ tier, updated_at: new Date().toISOString() }).eq('email', email)

                // 2. Gerar Licença com expiração de 30 dias
                const chave = 'UMBRA-' + Math.random().toString(36).toUpperCase().slice(2, 10)
                const dataExpiracao = new Date()
                dataExpiracao.setDate(dataExpiracao.getDate() + 30) // 30 dias de acesso

                const { error: licError } = await supabase
                    .from('licencas')
                    .insert([{
                        chave,
                        usuario: customerName,
                        email,
                        status: 'ativa',
                        plano: tier.toLowerCase(),
                        max_dispositivos: maxDevices,
                        data_expiracao: dataExpiracao.toISOString(),
                        extensao_slug: 'umbrahub-all'
                    }])

                if (!licError) console.log(`License generated: ${chave} for ${email} expiring at ${dataExpiracao.toISOString()}`)
            }
        }

        // NOVO: Tratar cancelamento ou estorno
        if (event === 'subscription.canceled' || event === 'refunded' || event === 'chargeback') {
            const email = data.customer?.email || data.email
            if (email) {
                // Bloqueia todas as licenças ativas deste e-mail
                await supabase.from('licencas').update({ status: 'expirada' }).eq('email', email).eq('status', 'ativa')
                // Remove o tier PRO/TURBO do perfil
                await supabase.from('profiles').update({ tier: 'FREE' }).eq('email', email)
                console.log(`Access revoked for ${email} due to ${event}`)
            }
        }

        return new Response(JSON.stringify({ message: 'Webhook received' }), { status: 200 })
    } catch (error: any) {
        console.error('Webhook error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 400 })
    }
})
