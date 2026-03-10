
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { text, voice, languageCode } = await req.json()

        if (!text) {
            return new Response(JSON.stringify({ error: 'Text is required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        const GOOGLE_API_KEY = Deno.env.get('GOOGLE_CLOUD_API_KEY')
        if (!GOOGLE_API_KEY) {
            return new Response(JSON.stringify({ error: 'Google Cloud API Key not configured' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        const response = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: { text },
                    voice: {
                        languageCode: languageCode || 'pt-BR',
                        name: voice || 'pt-BR-Neural2-A'
                    },
                    audioConfig: {
                        audioEncoding: 'MP3',
                        pitch: 0,
                        speakingRate: 1
                    },
                }),
            }
        )

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Google TTS Error:', errorData)
            return new Response(JSON.stringify({ error: 'Failed to synthesize speech', details: errorData }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: response.status,
            })
        }

        const result = await response.json()
        // Google returns base64 encoded audioContent
        return new Response(JSON.stringify({ audioContent: result.audioContent }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Function error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
