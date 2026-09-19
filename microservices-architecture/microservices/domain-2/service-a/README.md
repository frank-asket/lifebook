# Domain 2 - Service A: Notification & Push Service

Manages device push tokens, scheduled reminders, and event-driven notifications (APNs / FCM / Web Push).

## Port
- `8004`

## API Endpoints
- `POST /api/notifications/register-token` — Register Expo/FCM push token.
- `POST /api/notifications/send` — Send notification to specific user or segment.
- `GET /health` — Service health check.

## Message Broker Events
- Consumes: `notification.dispatch`, `user.registered`, `checkin.completed` from `message-broker/`.
