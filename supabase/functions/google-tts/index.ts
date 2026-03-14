
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        let body;
        try {
            body = await req.json()
        } catch (e) {
            console.error('Error parsing JSON body:', e)
            return new Response(JSON.stringify({ error: 'Invalid JSON body', details: e.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        const { action, text, ssml, voice, languageCode, pitch, speakingRate, volumeGainDb } = body

        const GOOGLE_API_KEY = Deno.env.get('GOOGLE_CLOUD_API_KEY')
        if (!GOOGLE_API_KEY) {
            return new Response(JSON.stringify({ error: 'Google Cloud API Key not configured' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        // Handle listVoices action
        if (action === 'listVoices') {
            const response = await fetch(
                `https://texttospeech.googleapis.com/v1/voices?key=${GOOGLE_API_KEY}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                return new Response(JSON.stringify({ error: 'Google API listVoices failed', details: errorData }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: response.status,
                })
            }

            const data = await response.json()
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        if (!text && !ssml) {
            return new Response(JSON.stringify({ error: 'Missing text or ssml in request body' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        const fetchSynthesize = async (currentPitch: number) => {
            const requestBody = {
                input: ssml ? { ssml } : { text },
                voice: {
                    languageCode: languageCode || 'pt-BR',
                    name: voice || 'pt-BR-Neural2-A'
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    pitch: typeof currentPitch === 'number' ? currentPitch : 0,
                    speakingRate: typeof speakingRate === 'number' ? speakingRate : 1,
                    volumeGainDb: typeof volumeGainDb === 'number' ? volumeGainDb : 0
                },
            }

            const response = await fetch(
                `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                }
            )
            return { response, requestBody }
        }

        let { response, requestBody } = await fetchSynthesize(pitch)
        let errorData = null

        if (!response.ok) {
            errorData = await response.json()
            
            // Check if error is related to pitch not being supported
            const errorMessage = errorData.error?.message || ''
            if (response.status === 400 && (errorMessage.includes('pitch') || errorMessage.includes('supported'))) {
                console.warn(`Pitch not supported for voice ${voice}, retrying with pitch=0...`)
                const retry = await fetchSynthesize(0)
                response = retry.response
                requestBody = retry.requestBody
                if (!response.ok) {
                    errorData = await response.json()
                }
            }
        }

        if (!response.ok) {
            console.error('Google Synthesize Error:', errorData)
            return new Response(JSON.stringify({ 
                error: 'Google API synthesis failed', 
                status: response.status,
                details: errorData,
                sentBody: requestBody
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: response.status,
            })
        }

        const result = await response.json()
        return new Response(JSON.stringify({ audioContent: result.audioContent }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Top-level function error:', error)
        return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
