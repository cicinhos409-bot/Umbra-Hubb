import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const CAKTO_SECRET = Deno.env.get('CAKTO_WEBHOOK_SECRET')

Deno.serve(async (req) => {
    // Solo permitir POST
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 })
    }

    try {
        const payload = await req.json()
        console.log('Received payload:', payload)

        // Verificar o segredo do webhook
        if (CAKTO_SECRET && payload.secret !== CAKTO_SECRET) {
            console.error('Invalid webhook secret')
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        }

        // Cakto webhook events typically include 'event' and 'data'
        // Specifically looking for "Compra aprovada" (Approved Purchase)
        // We expect the payload to have user email and product info

        // NOTE: Map your Cakto product IDs or names to ToolTier
        const { event, data } = payload

        if (event === 'purchase.approved' || event === 'approved') {
            const email = data.customer?.email || data.email
            const productName = data.product?.name || data.product_name

            let tier = 'FREE'
            if (productName?.toLowerCase().includes('pro')) {
                tier = 'PRO'
            } else if (productName?.toLowerCase().includes('turbo')) {
                tier = 'TURBO'
            }

            if (email && tier !== 'FREE') {
                const { error } = await supabase
                    .from('profiles')
                    .update({ tier, updated_at: new Date().toISOString() })
                    .eq('email', email)

                if (error) {
                    console.error('Error updating user tier:', error)
                    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
                }

                console.log(`Updated user ${email} to tier ${tier}`)
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Webhook error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 400 })
    }
})
