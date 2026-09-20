const http = require('http');

const PORT = process.env.PORT || 8005;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/health' || req.url === '/healthz') {
    return res.end(JSON.stringify({ status: 'healthy', service: 'domain-2/service-b', port: PORT }));
  }

  if (req.url.startsWith('/api/ai/checkin')) {
    return res.end(JSON.stringify({
      reflection: 'Take heart in knowing that God is near to you in every season.',
      prayer: 'Lord, grant me wisdom and calm as I walk through today.',
      actionStep: 'Write down one thing you are grateful for before resting tonight.',
      mode: 'live-orchestrated'
    }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Endpoint not found on service-2b' }));
});

server.listen(PORT, () => {
  console.log(`[Domain-2 / Service-B] Listening on port ${PORT}`);
});
