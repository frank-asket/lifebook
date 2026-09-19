const http = require('http');

const PORT = process.env.PORT || 8004;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/health' || req.url === '/healthz') {
    return res.end(JSON.stringify({ status: 'healthy', service: 'domain-2/service-a', port: PORT }));
  }

  if (req.url.startsWith('/api/notifications')) {
    return res.end(JSON.stringify({
      status: 'success',
      channel: 'push-notifications',
      delivered: true
    }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Endpoint not found on service-2a' }));
});

server.listen(PORT, () => {
  console.log(`[Domain-2 / Service-A] Listening on port ${PORT}`);
});
