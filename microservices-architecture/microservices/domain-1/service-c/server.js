const http = require('http');

const PORT = process.env.PORT || 8003;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/health' || req.url === '/healthz') {
    return res.end(JSON.stringify({ status: 'healthy', service: 'domain-1/service-c', port: PORT }));
  }

  if (req.url.startsWith('/api/community/groups')) {
    return res.end(JSON.stringify({
      groups: [
        { id: 'grp-1', name: 'Morning Prayer Fellowship', members: 42 },
        { id: 'grp-2', name: 'Youth Bible Study', members: 19 }
      ]
    }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Endpoint not found on service-c' }));
});

server.listen(PORT, () => {
  console.log(`[Domain-1 / Service-C] Listening on port ${PORT}`);
});
