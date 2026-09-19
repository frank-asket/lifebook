const http = require('http');

const PORT = process.env.PORT || 8001;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/health' || req.url === '/healthz') {
    return res.end(JSON.stringify({ status: 'healthy', service: 'domain-1/service-a', port: PORT }));
  }

  if (req.url.startsWith('/api/users/profile')) {
    return res.end(JSON.stringify({
      userId: 'user-001',
      name: 'Sample User',
      currentStreak: 5,
      longestStreak: 12,
      translationPreference: 'KJV'
    }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Endpoint not found on service-a' }));
});

server.listen(PORT, () => {
  console.log(`[Domain-1 / Service-A] Listening on port ${PORT}`);
});
