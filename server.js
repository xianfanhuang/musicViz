// server.js
const http = require('http');
const sniffHandler = require('./api/sniff.js');

const server = http.createServer((req, res) => {
    // We need to simulate the Vercel/req.query behavior for our handler
    const url = new URL(req.url, `http://${req.headers.host}`);
    req.query = Object.fromEntries(url.searchParams);

    // Call the handler
    sniffHandler(req, res);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
