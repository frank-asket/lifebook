# PC Desktop Client

Client application targeting Windows, macOS, and Linux desktop environments (Electron / Tauri / Native).

## Architecture Integration
- **Entry Point**: Connects to the API Gateway through the Load Balancer.
- **Protocol**: HTTP/2 with local caching and IPC bridge.
- **Authentication**: System credential vault with deep-link OAuth2 callback handler.
- **Sync**: Persistent background sync daemon.

## Configuration
```json
{
  "apiGatewayUrl": "https://api.yourdomain.com",
  "auth": {
    "issuer": "https://auth.yourdomain.com",
    "clientId": "desktop-client-app",
    "redirectUri": "app://auth/callback"
  }
}
```
