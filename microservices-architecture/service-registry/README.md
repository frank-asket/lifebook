# Service Registry

Central discovery catalog maintaining real-time IP, port, and health status for all microservice instances.

## Architecture
- **Backing Engines**: HashiCorp Consul, Netflix Eureka, or etcd.
- **Heartbeats**: Microservices register on startup and send periodic TTL heartbeats.
- **Discovery Mechanism**: The API Gateway and inter-service HTTP clients query the registry to load balance requests across healthy replicas.

## Registered Services Catalog
```json
[
  { "id": "service-1a-1", "name": "user-service", "address": "domain-1-service-a", "port": 8001 },
  { "id": "service-1b-1", "name": "content-service", "address": "domain-1-service-b", "port": 8002 },
  { "id": "service-1c-1", "name": "community-service", "address": "domain-1-service-c", "port": 8003 },
  { "id": "service-2a-1", "name": "notification-service", "address": "domain-2-service-a", "port": 8004 },
  { "id": "service-2b-1", "name": "ai-service", "address": "domain-2-service-b", "port": 8005 }
]
```
