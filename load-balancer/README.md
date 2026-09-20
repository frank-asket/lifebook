# Load Balancer

Reverse proxy and load balancer distributing incoming traffic across the system.

## Responsibilities
1. **Traffic Routing**: Splits traffic between static content (`/static/`), authentication (`/auth/`), and microservices via the API Gateway (`/api/`).
2. **SSL Termination**: Handles TLS handshakes and forwards plain HTTP internally.
3. **Health Checking**: Continuous active health probes to downstream services.
4. **WebSocket Proxying**: Upgrades HTTP connections to WebSockets for live features.
