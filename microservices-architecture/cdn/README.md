# Content Delivery Network (CDN) Configuration

Configuration for edge caching, compression, geo-routing, and SSL termination at the edge.

## Edge Layers
- **Providers Supported**: Cloudflare, AWS CloudFront, Fastly, or local Varnish / Nginx edge cache.
- **Origins**:
  1. `static-origin` -> Points to `static-content:8080` (cached with long TTL).
  2. `api-origin` -> Points to `load-balancer:80` (bypasses cache for dynamic `/api/*` endpoints).

## Cache Rules
- **Static Assets (`/static/*`, `/assets/*`)**: Cache TTL 30 days (`Cache-Control: max-age=2592000, public`).
- **Dynamic API calls (`/api/*`)**: `Cache-Control: no-store, private` (Never cached at edge).
- **Compression**: Gzip + Brotli enabled for text, json, html, js, css.
