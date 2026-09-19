# Mobile Client

Client application targeting iOS and Android platforms (React Native / Expo / Flutter).

## Architecture Integration
- **Entry Point**: Communicates directly with the API Gateway via the Load Balancer.
- **Protocol**: HTTP/2 with TLS 1.3 for mobile network efficiency.
- **Authentication**: Secure storage (Keychain / Keystore) holding Refresh and Access JWTs.
- **Offline Sync**: Optimistic local database with background synchronization to `domain-1/service-a`.
- **Push Notifications**: Connects to `domain-2/service-a` (Notification Service) via APNs/FCM tokens.

## Configuration
```json
{
  "apiGatewayUrl": "https://api.yourdomain.com",
  "auth": {
    "issuer": "https://auth.yourdomain.com",
    "clientId": "mobile-client-app"
  },
  "pushService": {
    "fcmSenderId": "your-fcm-id"
  }
}
```
