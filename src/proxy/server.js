const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

app.get('/scrape', async (req, res) => {
    try {
        const { url } = req.query;
        console.log('Scraping URL:', url);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Cache-Control': 'max-age=0'
            },
            timeout: 5000
        });

        res.send(response.data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(500).send({
            error: error.message,
            stack: error.stack
        });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
}); 