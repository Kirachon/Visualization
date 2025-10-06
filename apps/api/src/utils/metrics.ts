import { Histogram, Counter, Registry, collectDefaultMetrics } from 'prom-client';

const enabled = (process.env.METRICS_ENABLED || 'false').toLowerCase() === 'true';
export const registry = new Registry();
if (enabled) collectDefaultMetrics({ register: registry });

export const rlsLatency = new Histogram({
  name: 'rls_apply_duration_ms',
  help: 'RLS apply duration in ms',
  labelNames: ['tenant','status'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
  registers: enabled ? [registry] : [],
});

export const maskingLatency = new Histogram({
  name: 'masking_apply_duration_ms',
  help: 'Masking apply duration in ms',
  labelNames: ['tenant','status'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
  registers: enabled ? [registry] : [],
});

export const authErrors = new Counter({
  name: 'auth_flow_errors_total',
  help: 'Authentication flow errors',
  labelNames: ['provider','tenant','reason'],
  registers: enabled ? [registry] : [],
});

export async function metricsText(): Promise<string> {
  if (!enabled) return '# metrics disabled';
  return registry.metrics();
}

