# Microservices Architecture Blueprint

A production-grade, distributed microservice architecture blueprint featuring clear domain segregation, decoupled event-driven communication, centralized discovery, distributed coordination, and ingress load-balancing.

```
lifebook-app/
├── clients/
│   ├── web/                     # Web Browser Client (React / Next.js)
│   ├── mobile/                  # Native Mobile Client (iOS / Android)
│   └── pc/                      # Desktop Client (Electron / Native)
├── static-content/              # Origin for static assets & media files
├── cdn/                         # Edge cache, GeoDNS, SSL termination & CDN rules
├── load-balancer/               # Reverse proxy (Nginx) distributing ingress traffic
├── api-gateway/                 # Central API Gateway (routing, rate limiting, circuit breaker)
├── identity-provider/           # OAuth2 / OIDC JWT Identity & Auth service
├── service-registry/            # Service registration & health discovery catalog (Consul)
├── service-coordination/        # Distributed state & leader election (Apache ZooKeeper)
├── message-broker/              # Asynchronous event bus (RabbitMQ / Kafka)
├── databases/
│   ├── database-a/              # Primary Relational Datastore (PostgreSQL)
│   └── database-b/              # Document / Analytics & Fast Cache (MongoDB / Redis)
└── microservices/
    ├── domain-1/
    │   ├── service-a/           # User & Profile Service (:8001)
    │   ├── service-b/           # Content & Devotional Service (:8002)
    │   └── service-c/           # Community & Prayer Fellowship Service (:8003)
    └── domain-2/
        ├── service-a/           # Notification & Push Alert Service (:8004)
        └── service-b/           # AI & Analytics Orchestration Service (:8005)
```

---

## Component Topology & Request Flow

```
+-------------------------------------------------------------+
|               Clients (Web / Mobile / PC)                   |
+------------------------------+------------------------------+
                               |
                   HTTPS Edge / CDN Cache
                               |
                               v
               +---------------+---------------+
               |         Load Balancer         |
               |       (Nginx on Port 80)      |
               +-------+---------------+-------+
                       |               |
         +-------------+               +--------------+
         | (Static content / CDN)                     | (/auth/*)
         v                                            v
+------------------+                        +-------------------+
|  static-content  |                        | identity-provider |
|    (Port 8080)   |                        |    (Port 8081)    |
+------------------+                        +---------+---------+
         ^                                            |
         | (/api/*)                                   | Validates JWT
         v                                            v
+---------------------------------------------------------------+
|                          API Gateway                          |
|                       (Port 8000 Router)                      |
+-------+------------------+------------------+-----------------+
        |                  |                  |
        v                  v                  v
+---------------+  +---------------+  +---------------+
| Domain-1 /    |  | Domain-1 /    |  | Domain-1 /    |
| Service-A     |  | Service-B     |  | Service-C     |
| (User :8001)  |  | (Cont. :8002) |  | (Comm. :8003) |
+-------+-------+  +-------+-------+  +-------+-------+
        |                  |                  |
        +------------------+------------------+
                           |
            +--------------+--------------+
            |                             |
            v                             v
+-----------------------+     +-----------------------+
| Domain-2 / Service-A  |     | Domain-2 / Service-B  |
| (Notification :8004)  |     | (AI Orchestr. :8005)  |
+-----------+-----------+     +-----------+-----------+
            |                             |
            +--------------+--------------+
                           |
             Events / Locks / Transactions
                           |
+--------------------------+--------------------------+
|  service-coordination (ZooKeeper :2181)            |
|  service-registry (Consul :8500)                    |
|  message-broker (RabbitMQ :5672)                    |
|  database-a (PostgreSQL :5432)                      |
|  database-b (Redis / Mongo :6379)                   |
+-----------------------------------------------------+
```

---

## Quickstart

Run the complete cluster locally using Docker Compose:

```bash
cd lifebook-app
docker compose up -d
```

Check the health status of all cluster services:
```bash
curl http://localhost/healthz
curl http://localhost/api/health
```
