const http = require('http');

const PORT = process.env.PORT || 8002;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/health' || req.url === '/healthz') {
    return res.end(JSON.stringify({ status: 'healthy', service: 'domain-1/service-b', port: PORT }));
  }

  if (req.url.startsWith('/api/content/verses')) {
    return res.end(JSON.stringify({
      reference: 'Philippians 4:6-7',
      text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.',
      translation: 'NIV'
    }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Endpoint not found on service-b' }));
});

server.listen(PORT, () => {
  console.log(`[Domain-1 / Service-B] Listening on port ${PORT}`);
});
