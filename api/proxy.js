
export default async function handler(req, res) {
    const mediaUrl = req.query.url;

    if (!mediaUrl) {
        return res.status(400).send('URL missing');
    }

    try {
        const response = await fetch(decodeURIComponent(mediaUrl), {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const contentLength = response.headers.get('content-length');

        res.setHeader('Content-Type', contentType);
        if (contentLength) {
            res.setHeader('Content-Length', contentLength);
        }

        // Only use attachment disposition if not an image to allow rendering in <img> tags
        if (!contentType.startsWith('image/')) {
            res.setHeader('Content-Disposition', `attachment; filename="umbra_media_${Date.now()}"`);
        }

        const buffer = await response.arrayBuffer();
        return res.status(200).send(Buffer.from(buffer));
    } catch (error) {
        console.error('Proxy Error:', error);
        return res.status(500).send(`Error proxying media: ${error.message}`);
    }
}
