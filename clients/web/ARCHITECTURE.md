# Web Client

Client application targeting web browsers (React / Next.js SPA/SSR).

## Architecture Integration
- **Entry Point**: Routes traffic through the CDN and Load Balancer to the API Gateway.
- **Protocol**: HTTPS / WSS (WebSockets for real-time notifications).
- **Authentication**: Bearer JWT tokens issued by the Identity Provider (OIDC/OAuth2).
- **Static Assets**: Cached via CDN and served from `static-content/`.

## Configuration
```json
{
  "apiGatewayUrl": "https://api.yourdomain.com",
  "cdnUrl": "https://cdn.yourdomain.com",
  "auth": {
    "issuer": "https://auth.yourdomain.com",
    "clientId": "web-client-app"
  }
}
```
