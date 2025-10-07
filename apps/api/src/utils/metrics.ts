import { Histogram, Counter, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

const enabled = (process.env.METRICS_ENABLED || 'false').toLowerCase() === 'true';
export const registry = new Registry();
if (enabled) collectDefaultMetrics({ register: registry });

// RLS
export const rlsLatency = new Histogram({
  name: 'api_rls_apply_duration_ms',
  help: 'RLS apply duration in ms',
  labelNames: ['tenant','status'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
  registers: enabled ? [registry] : [],
});
export const rlsCacheHits = new Counter({
  name: 'api_rls_cache_hits_total',
  help: 'RLS cache hits',
  labelNames: ['tenant'],
  registers: enabled ? [registry] : [],
});
export const rlsCacheMisses = new Counter({
  name: 'api_rls_cache_misses_total',
  help: 'RLS cache misses',
  labelNames: ['tenant'],
  registers: enabled ? [registry] : [],
});

// Masking
export const maskingLatency = new Histogram({
  name: 'api_masking_apply_duration_ms',
  help: 'Masking apply duration in ms',
  labelNames: ['tenant','status'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
  registers: enabled ? [registry] : [],
});
export const maskingConfigErrors = new Counter({
  name: 'api_masking_config_validation_errors_total',
  help: 'Masking config validation errors',
  labelNames: ['tenant'],
  registers: enabled ? [registry] : [],
});

// Auth
export const authErrors = new Counter({
  name: 'api_auth_flow_errors_total',
  help: 'Authentication flow errors',
  labelNames: ['provider','tenant','reason'],
  registers: enabled ? [registry] : [],
});

// Jobs
export const jobDuration = new Histogram({
  name: 'api_job_duration_ms',
  help: 'Background job duration in ms',
  labelNames: ['job','tenant','status'],
  buckets: [5,10,25,50,100,250,500,1000,5000,10000],
  registers: enabled ? [registry] : [],
});
export const jobFailures = new Counter({
  name: 'api_job_failures_total',
  help: 'Background job failures',
  labelNames: ['job','tenant'],
  registers: enabled ? [registry] : [],
});
export const searchIndexLag = new Histogram({
  name: 'api_search_index_lag_ms',
  help: 'Search index lag in ms',
  labelNames: ['tenant'],
  buckets: [1000,5000,15000,60000,300000,900000],
  registers: enabled ? [registry] : [],
});

// Pipelines
export const pipelineValidationLatency = new Histogram({
  name: 'api_pipeline_validate_duration_ms',
  help: 'Pipeline DAG validation duration in ms',
  labelNames: ['status'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000],
  registers: enabled ? [registry] : [],
});
export const pipelineValidationErrors = new Counter({
  name: 'api_pipeline_validate_errors_total',
  help: 'Pipeline DAG validation errors',
  labelNames: ['type'],
  registers: enabled ? [registry] : [],
});

// Streaming API
export const streamingApiLatency = new Histogram({
  name: 'api_streaming_endpoint_duration_ms',
  help: 'Streaming API endpoint duration in ms',
  labelNames: ['endpoint','status'],
  buckets: [1,5,10,25,50,100,250,500,1000,2000],
  registers: enabled ? [registry] : [],
});
export const streamingApiErrors = new Counter({
  name: 'api_streaming_endpoint_errors_total',
  help: 'Streaming API endpoint errors',
  labelNames: ['endpoint','reason'],
  registers: enabled ? [registry] : [],
});

// Kafka integration metrics (Option B)
export const kafkaConnectStatus = new Gauge({
  name: 'kafka_connect_status',
  help: 'Kafka connect status (1=connected, 0=disconnected)',
  registers: enabled ? [registry] : [],
});
export const kafkaAdminLatency = new Histogram({
  name: 'kafka_admin_latency_ms',
  help: 'Kafka admin API latency (ms)',
  labelNames: ['operation'],
  buckets: [1,5,10,25,50,100,250,500,1000,2000],
  registers: enabled ? [registry] : [],
});
export const kafkaConsumerLagTotal = new Gauge({
  name: 'kafka_consumer_lag_total',
  help: 'Total consumer lag per consumer group',
  labelNames: ['group'],
  registers: enabled ? [registry] : [],
});

// Schedule API
export const scheduleApiLatency = new Histogram({
  name: 'api_schedule_endpoint_duration_ms',
  help: 'Schedule API endpoint duration in ms',
  labelNames: ['endpoint','status'],
  buckets: [1,5,10,25,50,100,250,500,1000],
  registers: enabled ? [registry] : [],
});
export const scheduleApiErrors = new Counter({
  name: 'api_schedule_endpoint_errors_total',
  help: 'Schedule API endpoint errors',
  labelNames: ['endpoint','reason'],
  registers: enabled ? [registry] : [],
});

// Alert API
export const alertApiLatency = new Histogram({
  name: 'api_alert_endpoint_duration_ms',
  help: 'Alert API endpoint duration in ms',
  labelNames: ['endpoint','status'],
  buckets: [1,5,10,25,50,100,250,500,1000],
  registers: enabled ? [registry] : [],
});
export const alertApiErrors = new Counter({
  name: 'api_alert_endpoint_errors_total',
  help: 'Alert API endpoint errors',
  labelNames: ['endpoint','reason'],
  registers: enabled ? [registry] : [],
});

// Data Quality API
export const dqApiLatency = new Histogram({
  name: 'api_dq_endpoint_duration_ms',
  help: 'Data Quality API endpoint duration in ms',
  labelNames: ['endpoint','status'],
  buckets: [1,5,10,25,50,100,250,500,1000],
  registers: enabled ? [registry] : [],
});
export const dqApiErrors = new Counter({
  name: 'api_dq_endpoint_errors_total',
  help: 'Data Quality API endpoint errors',
  labelNames: ['endpoint','reason'],
  registers: enabled ? [registry] : [],
});


export async function metricsText(): Promise<string> {
  if (!enabled) return '# metrics disabled';
  return registry.metrics();
}

