import { Kafka, Admin, logLevel } from 'kafkajs';

export interface KafkaStreamingConfig {
  brokers: string[];
  clientId: string;
}

export class KafkaUnavailableError extends Error {
  public readonly code = 'KAFKA_UNAVAILABLE';
}

export class KafkaStreamingService {
  private kafka: Kafka | null = null;
  private admin: Admin | null = null;
  private connected = false;

  constructor(private readonly cfg: KafkaStreamingConfig) {}

  private isEnabled(): boolean {
    return (process.env.STREAMING_KAFKA_ENABLE || 'false').toLowerCase() === 'true';
  }

  async connect(): Promise<void> {
    if (!this.isEnabled()) return; // no-op when disabled
    if (this.connected) return;
    try {
      this.kafka = new Kafka({ clientId: this.cfg.clientId, brokers: this.cfg.brokers, logLevel: logLevel.NOTHING });
      this.admin = this.kafka.admin();
      await this.admin.connect();
      this.connected = true;
      try {
        const { kafkaConnectStatus } = await import('../utils/metrics.js');
        kafkaConnectStatus.set(1);
      } catch {}
    } catch (err) {
      try {
        const { kafkaConnectStatus } = await import('../utils/metrics.js');
        kafkaConnectStatus.set(0);
      } catch {}
      this.connected = false;
      throw new KafkaUnavailableError('Kafka connection failed');
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.admin) await this.admin.disconnect();
    } finally {
      this.connected = false;
      try {
        const { kafkaConnectStatus } = await import('../utils/metrics.js');
        kafkaConnectStatus.set(0);
      } catch {}
    }
  }

  // Option B implementation mirroring mock contract
  async listPipelines(): Promise<Array<{ id: string; name: string; topic: string; consumerGroup: string; status: 'running' | 'paused' | 'failed'; partitions: number; lagPerPartition: number[]; lastWatermarkIso: string }>> {
    if (!this.isEnabled()) return [];
    await this.connect();
    if (!this.admin) throw new KafkaUnavailableError('Kafka admin unavailable');

    const start = Date.now();
    try {
      const topics = await this.admin.listTopics();
      // For skeleton: map topics to simple pipelines (no consumer group introspection yet)
      const pipelines = topics.map((t, idx) => ({
        id: `k-${idx}`,
        name: `Topic ${t}`,
        topic: t,
        consumerGroup: 'unknown',
        status: 'running' as const,
        partitions: 1,
        lagPerPartition: [0],
        lastWatermarkIso: new Date().toISOString(),
      }));
      return pipelines;
    } catch (e) {
      throw new KafkaUnavailableError('Kafka list topics failed');
    } finally {
      try {
        const dur = Date.now() - start;
        const { kafkaAdminLatency } = await import('../utils/metrics.js');
        kafkaAdminLatency.labels('listPipelines').observe(dur);
      } catch {}
    }
  }

  async getMetrics(): Promise<{
    ts: string;
    pipelines: Array<{ id: string; topic: string; consumerGroup: string; lagTotal: number; throughputPerSec: number; errorRatePerMin: number; watermarkIso: string; checkpointDurationMs: number; quarantine?: { quarantinedPerMin: number; quarantinedTotal: number; recentReasons: string[] } }>; summary?: { totalLag: number; totalThroughputPerSec: number; avgErrorRatePerMin: number; minWatermarkIso: string } } > {
    if (!this.isEnabled()) return { ts: new Date().toISOString(), pipelines: [] };
    const pipelines = await this.listPipelines();
    // Skeleton metrics with placeholders; to be refined when consumer group lag is implemented
    const mapped = pipelines.map(p => ({
      id: p.id,
      topic: p.topic,
      consumerGroup: p.consumerGroup,
      lagTotal: p.lagPerPartition.reduce((a, b) => a + b, 0),
      throughputPerSec: 100,
      errorRatePerMin: 0,
      watermarkIso: p.lastWatermarkIso,
      checkpointDurationMs: 2500,
      quarantine: { quarantinedPerMin: 0, quarantinedTotal: 0, recentReasons: [] },
    }));
    const totals = mapped.reduce((acc, pm) => {
      acc.totalLag += pm.lagTotal; acc.totalThroughputPerSec += pm.throughputPerSec; acc.errorRates.push(pm.errorRatePerMin); acc.watermarks.push(Date.parse(pm.watermarkIso)); return acc;
    }, { totalLag: 0, totalThroughputPerSec: 0, errorRates: [] as number[], watermarks: [] as number[] });
    return {
      ts: new Date().toISOString(),
      pipelines: mapped,
      summary: {
        totalLag: totals.totalLag,
        totalThroughputPerSec: totals.totalThroughputPerSec,
        avgErrorRatePerMin: totals.errorRates.length ? totals.errorRates.reduce((a,b)=>a+b,0)/totals.errorRates.length : 0,
        minWatermarkIso: totals.watermarks.length ? new Date(Math.min(...totals.watermarks)).toISOString() : new Date().toISOString(),
      }
    };
  }

  async requestReplay(input: any): Promise<any> {
    if (!this.isEnabled()) throw new KafkaUnavailableError('Kafka disabled');
    await this.connect();
    if (!this.admin) throw new KafkaUnavailableError('Kafka admin unavailable');

    // Validate input shape similarly to mock
    if (!input || typeof input !== 'object') throw new Error('Invalid body');
    if (!input.topic) throw new Error('topic is required');

    // For skeleton: check topic exists
    const topics = await this.admin.listTopics();
    if (!topics.includes(input.topic)) {
      throw new Error('Unknown topic');
    }

    // Offset computation skeleton (to be implemented): return accepted replayId with placeholders
    const replayId = `kafka_rp_${Date.now()}`;
    return {
      replayId,
      accepted: true,
      details: {
        topic: input.topic,
        from: { offset: input.fromOffset, time: input.fromTime },
        to: input.toOffset !== undefined ? { offset: input.toOffset } : undefined,
        estimatedEvents: 100000,
      }
    };
  }
}

export function createKafkaStreamingService(): KafkaStreamingService {
  const brokers = (process.env.STREAMING_KAFKA_BROKERS || 'localhost:9092').split(',').map(s => s.trim()).filter(Boolean);
  const clientId = process.env.STREAMING_KAFKA_CLIENT_ID || 'bi-platform-api';
  return new KafkaStreamingService({ brokers, clientId });
}

