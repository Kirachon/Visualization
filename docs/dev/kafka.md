# Local Kafka Development (Option B)

This document describes how to run a local Kafka stack for Real-time Streaming (Story 4.2 Option B) and how to configure the API to use it.

## Prerequisites
- Docker Desktop installed and running
- Sufficient resources: >= 2 CPUs, >= 4 GB RAM

## Docker Compose
We provide a compose file for local Kafka, Zookeeper, and an optional Kafka UI:

- File: apps/api/docker-compose.kafka.yml
- Services:
  - zookeeper (confluentinc/cp-zookeeper:7.5.0)
  - kafka (confluentinc/cp-kafka:7.5.0)
  - kafka-ui (provectuslabs/kafka-ui:latest)

Do NOT start these containers unless you intend to do local Option B testing.

### Start/Stop
From the repository root:

- Start (approved environments only):
  docker compose -f apps/api/docker-compose.kafka.yml up -d

- Stop:
  docker compose -f apps/api/docker-compose.kafka.yml down

Check health:
- Kafka UI: http://localhost:8080
- Kafka broker: localhost:9092

## Environment Variables (API)

- STREAMING_KAFKA_ENABLE=false
- STREAMING_KAFKA_BROKERS=localhost:9092
- STREAMING_KAFKA_CLIENT_ID=bi-platform-api

When STREAMING_KAFKA_ENABLE=false, the API uses Option A (mock) streaming service. When true, it attempts to use real Kafka via kafkajs.

## Integration Tests
We use Testcontainers (testcontainers@10.2.1) for Kafka integration tests.

- Tests are skipped unless both conditions hold:
  - Docker is available
  - RUN_INTEGRATION=1 (environment variable)

To run integration tests locally (optional):

  setx RUN_INTEGRATION 1
  npm -w apps/api test -- --selectProjects integration

To skip integration tests: unset RUN_INTEGRATION or ensure Docker is not available. All unit tests continue to run normally.

## Safety and Fallbacks
- If STREAMING_KAFKA_ENABLE=true but Kafka is unreachable, the API will respond with 503 for Kafka-backed endpoints, with descriptive errors. No crash.
- With the flag OFF (default), behavior is unchanged from Option A.

