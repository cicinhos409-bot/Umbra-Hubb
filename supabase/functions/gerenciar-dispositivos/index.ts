
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
        const { action, chave, device_id } = await req.json()
        const actionClean = (action || '').trim().toLowerCase()
        const chaveClean = (chave || '').trim().toUpperCase()

        if (!chaveClean) {
            return new Response(JSON.stringify({ error: 'Chave é obrigatória' }), { status: 400, headers: corsHeaders })
        }

        if (actionClean === 'listar') {
            const { data, error } = await supabase
                .from('dispositivos')
                .select('*')
                .eq('chave', chaveClean)
                .order('ultimo_acesso', { ascending: false })

            if (error) throw error
            return new Response(JSON.stringify({ devices: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (actionClean === 'remover') {
            if (!device_id) return new Response(JSON.stringify({ error: 'Device ID é obrigatório' }), { status: 400, headers: corsHeaders })
            
            const { error } = await supabase
                .from('dispositivos')
                .delete()
                .eq('chave', chaveClean)
                .eq('device_id', device_id)

            if (error) throw error
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (actionClean === 'reset_total') {
            const { error } = await supabase
                .from('dispositivos')
                .delete()
                .eq('chave', chaveClean)

            if (error) throw error
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400, headers: corsHeaders })

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
