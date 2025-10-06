import { Histogram, Counter, Registry, collectDefaultMetrics } from 'prom-client';

const enabled = (process.env.METRICS_ENABLED || 'false').toLowerCase() === 'true';
export const registry = new Registry();
if (enabled) collectDefaultMetrics({ register: registry });

// RLS
export const rlsLatency = new Histogram({
  name: 'api.rls_apply_duration_ms',
  help: 'RLS apply duration in ms',
  labelNames: ['tenant','status'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
  registers: enabled ? [registry] : [],
});
export const rlsCacheHits = new Counter({
  name: 'api.rls_cache_hits_total',
  help: 'RLS cache hits',
  labelNames: ['tenant'],
  registers: enabled ? [registry] : [],
});
export const rlsCacheMisses = new Counter({
  name: 'api.rls_cache_misses_total',
  help: 'RLS cache misses',
  labelNames: ['tenant'],
  registers: enabled ? [registry] : [],
});

// Masking
export const maskingLatency = new Histogram({
  name: 'api.masking_apply_duration_ms',
  help: 'Masking apply duration in ms',
  labelNames: ['tenant','status'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
  registers: enabled ? [registry] : [],
});
export const maskingConfigErrors = new Counter({
  name: 'api.masking_config_validation_errors_total',
  help: 'Masking config validation errors',
  labelNames: ['tenant'],
  registers: enabled ? [registry] : [],
});

// Auth
export const authErrors = new Counter({
  name: 'api.auth_flow_errors_total',
  help: 'Authentication flow errors',
  labelNames: ['provider','tenant','reason'],
  registers: enabled ? [registry] : [],
});

export async function metricsText(): Promise<string> {
  if (!enabled) return '# metrics disabled';
  return registry.metrics();
}

