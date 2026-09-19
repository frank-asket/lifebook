# Service Coordination (Apache ZooKeeper)

Distributed configuration, leader election, and synchronization coordinator for the microservice cluster.

## Responsibilities
1. **Leader Election**: Coordinates master/worker failovers across stateful service clusters.
2. **Distributed Locking**: Provides distributed locks (`znode` ephemerals) to prevent race conditions across parallel microservice workers.
3. **Cluster Metadata**: Coordinates partition assignments and broker state for Kafka message brokers.
4. **Dynamic Configuration**: Distributes runtime flags and configurations across all listening microservice instances without requiring service restarts.

## Ports
- `2181`: Client port for microservice connections.
- `2888`: Peer communication port (cluster quorum).
- `3888`: Leader election port.
