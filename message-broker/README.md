# Message Broker

Asynchronous event bus and message queue decoupling microservices via event-driven architecture (EDA).

## Backing Technologies
- **Apache Kafka**: High-throughput distributed commit log for event sourcing and telemetry.
- **RabbitMQ**: AMQP message broker for task queues and immediate push delivery.

## Event Topics & Queues
```json
{
  "topics": [
    {
      "name": "user.registered",
      "producers": ["domain-1/service-a"],
      "consumers": ["domain-2/service-a"]
    },
    {
      "name": "checkin.completed",
      "producers": ["domain-1/service-b"],
      "consumers": ["domain-1/service-a", "domain-2/service-a"]
    },
    {
      "name": "prayer.submitted",
      "producers": ["domain-1/service-c"],
      "consumers": ["domain-2/service-b"]
    },
    {
      "name": "notification.dispatch",
      "producers": ["domain-1/service-a", "domain-1/service-b", "domain-1/service-c"],
      "consumers": ["domain-2/service-a"]
    }
  ]
}
```
