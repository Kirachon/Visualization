import { streamingService } from '../streamingService.js';

describe('streamingService', () => {
  describe('listPipelines', () => {
    it('returns deterministic list of pipelines with realistic shapes', () => {
      const result = streamingService.listPipelines();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      const p = result[0];
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('topic');
      expect(p).toHaveProperty('consumerGroup');
      expect(p).toHaveProperty('status');
      expect(p).toHaveProperty('partitions');
      expect(p).toHaveProperty('lagPerPartition');
      expect(p).toHaveProperty('lastWatermarkIso');
      expect(Array.isArray(p.lagPerPartition)).toBe(true);
    });
  });

  describe('getMetrics', () => {
    it('returns metrics snapshot with per-pipeline stats', () => {
      const m = streamingService.getMetrics();
      expect(m).toHaveProperty('ts');
      expect(m).toHaveProperty('pipelines');
      expect(Array.isArray(m.pipelines)).toBe(true);
      const pm = m.pipelines[0];
      expect(pm).toHaveProperty('id');
      expect(pm).toHaveProperty('topic');
      expect(pm).toHaveProperty('consumerGroup');
      expect(pm).toHaveProperty('lagTotal');
      expect(pm).toHaveProperty('throughputPerSec');
      expect(pm).toHaveProperty('errorRatePerMin');
      expect(pm).toHaveProperty('watermarkIso');
    });

    it('includes summary totals and min watermark', () => {
      const m = streamingService.getMetrics();
      expect(m).toHaveProperty('summary');
      expect(m.summary?.totalLag).toBeGreaterThanOrEqual(0);
      expect(m.summary?.totalThroughputPerSec).toBeGreaterThan(0);
      expect(typeof m.summary?.avgErrorRatePerMin).toBe('number');
      expect(typeof m.summary?.minWatermarkIso).toBe('string');
    });

    it('includes quarantine stats per pipeline', () => {
      const m = streamingService.getMetrics();
      const pm = m.pipelines[0];
      expect(pm).toHaveProperty('quarantine');
      expect(typeof pm.quarantine?.quarantinedPerMin).toBe('number');
      expect(typeof pm.quarantine?.quarantinedTotal).toBe('number');
      expect(Array.isArray(pm.quarantine?.recentReasons)).toBe(true);
    });

    it('includes checkpoint duration per pipeline', () => {
      const m = streamingService.getMetrics();
      const pm = m.pipelines[0];
      expect(pm).toHaveProperty('checkpointDurationMs');
      expect(typeof pm.checkpointDurationMs).toBe('number');
      expect(pm.checkpointDurationMs).toBeGreaterThan(0);
    });
  });

  describe('requestReplay', () => {
    it('accepts fromOffset with optional toOffset', () => {
      const res = streamingService.requestReplay({ topic: 'cdc.orders', fromOffset: 100, toOffset: 200 });
      expect(res.accepted).toBe(true);
      expect(res.details.topic).toBe('cdc.orders');
      expect(res.details.from.offset).toBe(100);
      expect(res.details.to?.offset).toBe(200);
    });

    it('accepts fromTime ISO string', () => {
      const iso = new Date(Date.now() - 60 * 1000).toISOString();
      const res = streamingService.requestReplay({ topic: 'cdc.users', fromTime: iso });
      expect(res.accepted).toBe(true);
      expect(res.details.from.time).toBe(iso);
    });

    it('rejects invalid topic', () => {
      expect(() => streamingService.requestReplay({ topic: 'INVALID TOPIC', fromOffset: 0 })).toThrow(/Invalid topic/);
    });

    it('rejects missing both fromOffset and fromTime', () => {
      expect(() => streamingService.requestReplay({ topic: 'cdc.orders' } as any)).toThrow(/Either fromOffset or fromTime/);
    });

    it('rejects providing both fromOffset and fromTime', () => {
      const iso = new Date().toISOString();
      expect(() => streamingService.requestReplay({ topic: 'cdc.orders', fromOffset: 0, fromTime: iso })).toThrow(/only one/);
    });

    it('rejects negative fromOffset', () => {
      expect(() => streamingService.requestReplay({ topic: 'cdc.orders', fromOffset: -1 })).toThrow(/non-negative/);
    });

    it('rejects toOffset <= fromOffset', () => {
      expect(() => streamingService.requestReplay({ topic: 'cdc.orders', fromOffset: 100, toOffset: 100 })).toThrow(/greater than/);
      expect(() => streamingService.requestReplay({ topic: 'cdc.orders', fromOffset: 100, toOffset: 50 })).toThrow(/greater than/);
    });

    it('rejects too large offset range', () => {
      expect(() => streamingService.requestReplay({ topic: 'cdc.orders', fromOffset: 0, toOffset: 12_000_000 })).toThrow(/too large/);
    });

    it('rejects unknown topics', () => {
      expect(() => streamingService.requestReplay({ topic: 'cdc.unknown', fromOffset: 0 })).toThrow(/Unknown topic/);
    });

    it('rejects invalid fromTime', () => {
      expect(() => streamingService.requestReplay({ topic: 'cdc.orders', fromTime: 'not-a-time' })).toThrow(/valid ISO/);
    });

    it('rejects future fromTime', () => {
      const future = new Date(Date.now() + 60 * 1000).toISOString();
      expect(() => streamingService.requestReplay({ topic: 'cdc.orders', fromTime: future })).toThrow(/future/);
    });

    it('rejects fromTime older than 7 days', () => {
      const old = new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString();
      expect(() => streamingService.requestReplay({ topic: 'cdc.orders', fromTime: old })).toThrow(/too far/);
    });
  });
});

