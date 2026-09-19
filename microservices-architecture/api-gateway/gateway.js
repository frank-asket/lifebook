const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 8000;

// Dynamic route table resolved via service registry / environment
const ROUTES = {
  '/api/users': process.env.SERVICE_1A_URL || 'http://service-1a:8001',
  '/api/content': process.env.SERVICE_1B_URL || 'http://service-1b:8002',
  '/api/community': process.env.SERVICE_1C_URL || 'http://service-1c:8003',
  '/api/notifications': process.env.SERVICE_2A_URL || 'http://service-2a:8004',
  '/api/ai': process.env.SERVICE_2B_URL || 'http://service-2b:8005',
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;

  // Healthcheck
  if (pathname === '/healthz' || pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', service: 'api-gateway', timestamp: new Date() }));
  }

  // Find upstream microservice match
  const prefix = Object.keys(ROUTES).find(route => pathname.startsWith(route));

  if (!prefix) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Route not registered in API Gateway', pathname }));
  }

  const targetBase = ROUTES[prefix];
  const targetUrl = new URL(pathname + (parsedUrl.search || ''), targetBase);

  // Forward request
  const proxyReq = http.request(targetUrl, {
    method: req.method,
    headers: {
      ...req.headers,
      'x-forwarded-gateway': 'api-gateway',
      'x-request-id': req.headers['x-request-id'] || `req-${Date.now()}`
    }
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bad Gateway - downstream microservice unavailable', detail: err.message }));
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`[API Gateway] Listening on http://0.0.0.0:${PORT}`);
});
