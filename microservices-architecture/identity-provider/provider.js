const http = require('http');

const PORT = process.env.PORT || 8081;

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/health' || req.url === '/healthz') {
    return res.end(JSON.stringify({ status: 'ok', service: 'identity-provider' }));
  }

  if (req.url === '/auth/login' && req.method === 'POST') {
    return res.end(JSON.stringify({
      token_type: 'Bearer',
      access_token: 'mock-jwt-token-sample',
      expires_in: 3600,
      user_id: 'user-001'
    }));
  }

  if (req.url === '/.well-known/jwks.json') {
    return res.end(JSON.stringify({
      keys: [{ kty: 'RSA', use: 'sig', alg: 'RS256', kid: 'lifebook-key-1' }]
    }));
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Endpoint not found on Identity Provider' }));
});

server.listen(PORT, () => {
  console.log(`[Identity Provider] Listening on port ${PORT}`);
});
