export interface StreamingPipeline {
  id: string;
  name: string;
  topic: string;
  consumerGroup: string;
  status: 'running' | 'paused' | 'failed';
  partitions: number;
  lagPerPartition: number[]; // mock lag per partition
  lastWatermarkIso: string;  // ISO timestamp
}

export interface StreamingMetrics {
  ts: string; // ISO time of metrics snapshot
  pipelines: Array<{
    id: string;
    topic: string;
    consumerGroup: string;
    lagTotal: number;
    throughputPerSec: number;
    errorRatePerMin: number;
    watermarkIso: string;
    checkpointDurationMs: number;
    quarantine?: {
      quarantinedPerMin: number;
      quarantinedTotal: number;
      recentReasons: string[];
    };
  }>;
  summary?: {
    totalLag: number;
    totalThroughputPerSec: number;
    avgErrorRatePerMin: number;
    minWatermarkIso: string;
  };
}

export interface ReplayRequest {
  topic: string;
  fromOffset?: number;
  fromTime?: string; // ISO
  toOffset?: number;
}

export interface ReplayResponse {
  replayId: string;
  accepted: boolean;
  details: {
    topic: string;
    from: { offset?: number; time?: string };
    to?: { offset?: number };
    estimatedEvents?: number;
  };
}

function isoNow(): string {
  return new Date().toISOString();
}

function assertTopicValid(topic: string) {
  // Keep conservative pattern (Kafka-like): lowercase letters, digits, dot, dash, underscore
  if (!/^[a-z0-9._-]{3,200}$/.test(topic)) {
    throw new Error('Invalid topic format');
  }
}

export class StreamingService {
  // Deterministic mock pipelines for Option A (no infra)
  private pipelines: StreamingPipeline[] = [
    {
      id: 'orders-cdc',
      name: 'Orders CDC -> Enrichment -> Warehouse',
      topic: 'cdc.orders',
      consumerGroup: 'bi-platform.orders',
      status: 'running',
      partitions: 3,
      lagPerPartition: [12, 3, 0],
      lastWatermarkIso: isoNow(),
    },
    {
      id: 'users-cdc',
      name: 'Users CDC -> Cleanse -> Profile',
      topic: 'cdc.users',
      consumerGroup: 'bi-platform.users',
      status: 'running',
      partitions: 2,
      lagPerPartition: [0, 0],
      lastWatermarkIso: isoNow(),
    },
    {
      id: 'payments-dlq',
      name: 'Payments DLQ Monitor',
      topic: 'dlq.payments',
      consumerGroup: 'bi-platform.payments.dlq',
      status: 'paused',
      partitions: 1,
      lagPerPartition: [250],
      lastWatermarkIso: isoNow(),
    },
  ];

  listPipelines(): StreamingPipeline[] {
    // Deep copy to avoid accidental mutation in tests
    return JSON.parse(JSON.stringify(this.pipelines));
  }

  getMetrics(): StreamingMetrics {
    const snapshotTs = isoNow();
    const pipelines = this.pipelines.map(p => {
      const lagTotal = p.lagPerPartition.reduce((a, b) => a + b, 0);
      // Simple deterministic throughput/error mocks derived from lag
      const throughputPerSec = Math.max(10, 200 - lagTotal);
      const errorRatePerMin = p.topic.startsWith('dlq.') ? 5 : 0.5;
      // Checkpoint duration: paused pipelines have stale checkpoints (higher duration)
      const checkpointDurationMs = p.status === 'paused' ? 15000 : (p.status === 'failed' ? 30000 : 2500);
      // Quarantine stats: DLQ topics have higher quarantine rates
      const isDlq = p.topic.startsWith('dlq.');
      const quarantine = {
        quarantinedPerMin: isDlq ? 10 : 0.2,
        quarantinedTotal: isDlq ? 1500 : 5,
        recentReasons: isDlq
          ? ['schema_mismatch', 'null_required_field', 'invalid_timestamp']
          : ['schema_mismatch'],
      };
      return {
        id: p.id,
        topic: p.topic,
        consumerGroup: p.consumerGroup,
        lagTotal,
        throughputPerSec,
        errorRatePerMin,
        watermarkIso: p.lastWatermarkIso,
        checkpointDurationMs,
        quarantine,
      };
    });
    const totals = pipelines.reduce((acc, pm) => {
      acc.totalLag += pm.lagTotal;
      acc.totalThroughputPerSec += pm.throughputPerSec;
      acc.errorRates.push(pm.errorRatePerMin);
      acc.watermarks.push(Date.parse(pm.watermarkIso));
      return acc;
    }, { totalLag: 0, totalThroughputPerSec: 0, errorRates: [] as number[], watermarks: [] as number[] });
    const summary = {
      totalLag: totals.totalLag,
      totalThroughputPerSec: totals.totalThroughputPerSec,
      avgErrorRatePerMin: totals.errorRates.length ? totals.errorRates.reduce((a,b)=>a+b,0)/totals.errorRates.length : 0,
      minWatermarkIso: totals.watermarks.length ? new Date(Math.min(...totals.watermarks)).toISOString() : snapshotTs,
    };
    return { ts: snapshotTs, pipelines, summary };
  }

  requestReplay(input: ReplayRequest): ReplayResponse {
    if (!input || typeof input !== 'object') throw new Error('Invalid body');
    if (!input.topic) throw new Error('topic is required');
    assertTopicValid(input.topic);
    // Ensure topic is known to system (Option A: based on in-memory pipelines)
    const knownTopics = new Set(this.pipelines.map(p => p.topic));
    if (!knownTopics.has(input.topic)) throw new Error('Unknown topic');

    const hasFromOffset = typeof input.fromOffset === 'number';
    const hasFromTime = typeof input.fromTime === 'string';

    if (!hasFromOffset && !hasFromTime) throw new Error('Either fromOffset or fromTime is required');
    if (hasFromOffset && hasFromTime) throw new Error('Provide only one of fromOffset or fromTime');

    if (hasFromOffset) {
      if (!Number.isInteger(input.fromOffset!) || input.fromOffset! < 0) throw new Error('fromOffset must be a non-negative integer');
      if (input.toOffset !== undefined) {
        if (!Number.isInteger(input.toOffset) || input.toOffset! <= input.fromOffset!) throw new Error('toOffset must be an integer greater than fromOffset');
        if (input.toOffset! - input.fromOffset! > 10_000_000) throw new Error('Requested offset range too large');
      }
    }

    if (hasFromTime) {
      const t = Date.parse(input.fromTime!);
      if (Number.isNaN(t)) throw new Error('fromTime must be a valid ISO timestamp');
      const now = Date.now();
      if (t > now) throw new Error('fromTime cannot be in the future');
      // Limit to last 7 days for replay
      const sevenDays = 7 * 24 * 3600 * 1000;
      if (now - t > sevenDays) throw new Error('fromTime too far in the past');
    }

    // Estimate based on lag and range when offsets specified
    const estimatedEvents = hasFromOffset
      ? Math.min(1_000_000, (input.toOffset ?? (input.fromOffset! + 100_000)) - input.fromOffset!)
      : 100_000;

    const replayId = `rp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const details: ReplayResponse['details'] = {
      topic: input.topic,
      from: { offset: input.fromOffset, time: input.fromTime },
      to: input.toOffset !== undefined ? { offset: input.toOffset } : undefined,
      estimatedEvents,
    };

    return { replayId, accepted: true, details };
  }
}

export const streamingService = new StreamingService();

