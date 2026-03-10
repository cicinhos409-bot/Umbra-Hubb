export default async function handler(req, res) {
    if (req.method === 'GET' && req.query.proxy) {
        return handleProxy(req, res);
    }

    if (req.method !== 'POST') return res.status(405).end();

    const { url, cookies, bearerToken } = req.body;

    if (!url?.includes('sora.chatgpt.com/p/') && !url?.includes('sora.chatgpt.com/share/')) {
        return res.status(400).json({ status: 'error', msg: 'URL inválida.' });
    }

    const videoId = url.includes('/p/')
        ? url.split('/p/')[1]?.split('?')[0]
        : url.split('/share/')[1]?.split('?')[0];

    if (!videoId) {
        return res.status(400).json({ status: 'error', msg: 'ID do vídeo não encontrado.' });
    }

    let formattedCookies = cookies || '';
    if (formattedCookies.startsWith('eyJ') && !formattedCookies.includes('=')) {
        formattedCookies = `__Secure-next-auth.session-token=${formattedCookies}`;
    }

    const commonHeaders = {
        'Cookie': formattedCookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://sora.chatgpt.com/',
        'Origin': 'https://sora.chatgpt.com',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
    };

    if (bearerToken) {
        commonHeaders['Authorization'] = bearerToken.startsWith('Bearer ') ? bearerToken : `Bearer ${bearerToken}`;
    }

    try {
        // --- Estratégia 1: Tentar a API Interna (JSON) ---
        const apiEndpoints = [
            `https://sora.chatgpt.com/backend-api/video_generations/${videoId}`,
            `https://sora.chatgpt.com/backend-api/generations/${videoId}`,
            `https://sora.chatgpt.com/backend-api/videos/${videoId}`
        ];

        for (const apiUrl of apiEndpoints) {
            try {
                let response = await fetch(apiUrl, {
                    headers: {
                        ...commonHeaders,
                        'Accept': 'application/json',
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const videoUrl = data.video?.url || data.generations?.[0]?.video?.url || data.url;

                    if (videoUrl) {
                        return res.status(200).json({
                            status: 'success',
                            title: data.title || data.prompt?.slice(0, 60) || 'Sora AI Video',
                            prompt: data.prompt || '',
                            pic: data.thumbnail_url || '',
                            videoUrl: videoUrl,
                            download_videoUrl: videoUrl,
                            method: `v2.9-API-${apiUrl.split('/').slice(-2, -1)}`
                        });
                    }
                }
            } catch (e) {
                console.error(`Error fetching from ${apiUrl}:`, e);
            }
        }

        // --- Estratégia 2: Fallback para Scraping de HTML ---
        const htmlResponse = await fetch(url, {
            headers: {
                ...commonHeaders,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
            }
        });
        if (!htmlResponse.ok) {
            const msg = htmlResponse.status === 403
                ? 'Acesso negado (403). Atualize seus Cookies do sora.chatgpt.com nas configurações.'
                : `Sora retornou erro ${htmlResponse.status}.`;
            return res.status(htmlResponse.status).json({ status: 'error', msg });
        }

        if (htmlResponse.ok) {
            const html = await htmlResponse.text();

            const ogVideoMatch = html.match(/<meta[^>]+property=["']og:video["'][^>]+content=["']([^"']+)["']/i) ||
                html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:video["']/i);

            const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
            const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);

            let videoUrlScraped = ogVideoMatch ? ogVideoMatch[1] : null;

            if (!videoUrlScraped) {
                const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
                if (nextDataMatch) {
                    try {
                        const data = JSON.parse(nextDataMatch[1]);
                        const post = data.props?.pageProps?.post || data.props?.pageProps?.video || {};
                        videoUrlScraped = post.video_url || post.url || post.fallback_url;
                    } catch (e) { }
                }
            }

            if (videoUrlScraped) {
                const finalUrl = videoUrlScraped.replace(/\\u0026/g, '&');
                return res.status(200).json({
                    status: 'success',
                    title: (ogTitleMatch ? ogTitleMatch[1] : null) || 'Sora AI Video',
                    prompt: (ogTitleMatch ? ogTitleMatch[1] : null) || '',
                    pic: (ogImageMatch ? ogImageMatch[1] : null) || '',
                    videoUrl: finalUrl,
                    download_videoUrl: finalUrl,
                    method: 'v2.9-Scrape'
                });
            }
        }

        return res.status(404).json({
            status: 'error',
            msg: 'Não foi possível localizar o vídeo. Verifique se o link está correto ou atualize seus Cookies.'
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            msg: `Erro de conexão: ${error.message}.`
        });
    }
}

async function handleProxy(req, res) {
    const videoUrl = decodeURIComponent(req.query.proxy);
    if (!videoUrl) return res.status(400).send('URL missing');

    try {
        const videoRes = await fetch(videoUrl, {
            headers: {
                'Referer': 'https://sora.chatgpt.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            }
        });

        if (!videoRes.ok) throw new Error(`CDN returned ${videoRes.status}`);

        const contentType = videoRes.headers.get('content-type') || 'video/mp4';
        const contentLength = videoRes.headers.get('content-length');

        res.setHeader('Content-Type', contentType);
        if (contentLength) res.setHeader('Content-Length', contentLength);
        res.setHeader('Content-Disposition', `attachment; filename="sora_video_${Date.now()}.mp4"`);

        // Using ArrayBuffer for better compatibility across Node.js versions on Vercel
        const buffer = await videoRes.arrayBuffer();
        return res.status(200).send(Buffer.from(buffer));
    } catch (error) {
        console.error('Proxy Error:', error);
        return res.status(500).send('Error proxying video');
    }
}
