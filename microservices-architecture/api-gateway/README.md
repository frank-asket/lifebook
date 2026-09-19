# API Gateway

The single entry point for all client requests into the microservice mesh.

## Features
- **Routing & Reverse Proxy**: Inspects incoming HTTP path & headers and forwards to registered microservices.
- **Token Verification**: Validates JWTs issued by the Identity Provider before forwarding requests.
- **Service Discovery**: Resolves service IPs dynamically via the Service Registry (`service-registry/`).
- **Rate Limiting**: Protects downstream microservices with sliding-window rate limiters.
- **Circuit Breaker**: Prevents cascading failures when a microservice is down.

## Route Map
| Route Prefix | Target Service | Domain |
|---|---|---|
| `/api/users/*` | `domain-1/service-a` | Domain 1 (User / Profile) |
| `/api/content/*` | `domain-1/service-b` | Domain 1 (Content / Devotional) |
| `/api/community/*` | `domain-1/service-c` | Domain 1 (Community / Prayer) |
| `/api/notifications/*`| `domain-2/service-a` | Domain 2 (Notification) |
| `/api/ai/*` | `domain-2/service-b` | Domain 2 (AI Orchestration) |
