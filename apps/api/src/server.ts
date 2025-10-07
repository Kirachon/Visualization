import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { logger } from './logger/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import authRoutes from './routes/authRoutes.js';
import mfaRoutes from './routes/mfaRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import dataSourceRoutes from './routes/dataSourceRoutes.js';
import queryRoutes from './routes/queryRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dashboardSharingRoutes from './routes/dashboardSharingRoutes.js';
import perfRoutes from './routes/perfRoutes.js';
import optimizerRoutes from './routes/optimizerRoutes.js';
import mvRoutes from './routes/mvRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import idpConfigRoutes from './routes/idpConfigRoutes.js';
import providerAuthRoutes from './routes/providerAuthRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import versionRoutes from './routes/versionRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import presenceRoutes from './routes/presenceRoutes.js';
import metadataRoutes from './routes/metadataRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import pipelineRoutes from './routes/pipelineRoutes.js';
import streamingRoutes from './routes/streamingRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import dqRoutes from './routes/dqRoutes.js';
import connectorRoutes from './routes/connectorRoutes.js';
import filterRoutes from './routes/filterRoutes.js';





import maskingRoutes from './routes/maskingRoutes.js';
import rbacRoutes from './routes/rbacRoutes.js';
import { auditService } from './services/auditService.js';
import { query as dbQuery } from './database/connection.js';
import metricsRoutes from './routes/metricsRoutes.js';
import { websocketService } from './services/websocketService.js';
import { realtimeDataService } from './services/realtimeDataService.js';
import { startMvScheduler } from './services/mvSchedulerService.js';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// Rate limiting - disable in test environment
const isTestEnv = (process.env.NODE_ENV || '').toLowerCase() === 'test';
// General API rate limit
let authLimiter: any = null;
if (!isTestEnv) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', limiter);
  // Stricter rate limiting for authentication endpoints
  authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
    skipSuccessfulRequests: true, // Don't count successful requests
  });
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use(requestLogger);

// API routes
app.use('/api/v1', healthRoutes);
if (authLimiter) {
  app.use('/api/v1/auth', authLimiter, authRoutes);
} else {
  app.use('/api/v1/auth', authRoutes);
}
app.use('/api/v1/auth', mfaRoutes);
app.use('/api/v1', dataSourceRoutes);
app.use('/api/v1', connectorRoutes);
app.use('/api/v1', filterRoutes);
app.use('/api/v1', queryRoutes);
app.use('/api/v1', dashboardRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1', dashboardSharingRoutes);
app.use('/api/v1', perfRoutes);
  app.use('/api/v1', optimizerRoutes);
  app.use('/api/v1', mvRoutes);
app.use('/api/v1', sessionRoutes);
app.use('/api/v1', idpConfigRoutes);
app.use('/api/v1', providerAuthRoutes);
app.use('/api/v1', commentRoutes);
// CSRF double-submit when cookie sessions are enabled
if ((process.env.SESSIONS_COOKIE_MODE || 'false').toLowerCase() === 'true') {
  app.use((req, res, next) => {
    const method = req.method.toUpperCase();
    const needCheck = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
    // issue token if missing
    const token = req.cookies?.csrfToken || require('crypto').randomBytes(16).toString('hex');
    if (!req.cookies?.csrfToken) res.cookie('csrfToken', token, { httpOnly: false, secure: true, sameSite: 'strict' });
    if (!needCheck) return next();
    const header = req.get('x-csrf-token') || req.headers['x-csrf-token'];
    if (!header || header !== token) return res.status(403).json({ error: 'CSRF token mismatch' });
    next();
  });
  app.get('/csrf/refresh', (_req, res) => {
    const token = require('crypto').randomBytes(16).toString('hex');
    res.cookie('csrfToken', token, { httpOnly: false, secure: true, sameSite: 'strict' });
    res.json({ token });
  });
}

app.use('/api/v1', versionRoutes);
app.use('/api/v1', activityRoutes);
app.use('/api/v1', workspaceRoutes);
app.use('/api/v1', presenceRoutes);
app.use('/api/v1', metadataRoutes);
// Pipeline validation API (feature-flagged)
if ((process.env.PIPELINES_VALIDATE_API || 'false').toLowerCase() === 'true') {
  app.use('/api/v1', pipelineRoutes);
}

app.use('/api/v1', securityRoutes);
// Streaming APIs (feature-flagged)
if (((process.env.STREAMING_API_ENABLE || 'false').toLowerCase() === 'true') || ((process.env.STREAMING_REPLAY_ENABLE || 'false').toLowerCase() === 'true')) {
  app.use('/api/v1', streamingRoutes);
}
// Schedule APIs (feature-flagged)
if ((process.env.SCHEDULES_API_ENABLE || 'false').toLowerCase() === 'true') {
  app.use('/api/v1', scheduleRoutes);
}
// Alert APIs (feature-flagged)
if ((process.env.ALERTS_API_ENABLE || 'false').toLowerCase() === 'true') {
  app.use('/api/v1', alertRoutes);
}
// Data Quality APIs (feature-flagged)
if ((process.env.DQ_API_ENABLE || 'false').toLowerCase() === 'true') {
  app.use('/api/v1', dqRoutes);
}



app.use('/api/v1', maskingRoutes);
app.use('/api/v1', rbacRoutes);
if ((process.env.METRICS_ENABLED || 'false').toLowerCase() === 'true') {
  app.use('/', metricsRoutes);
}

// Scheduled audit verification (feature-flagged)
(function scheduleAuditVerify(){
  try {
    const enabled = (process.env.AUDIT_VERIFY_SCHEDULED || 'false').toLowerCase() === 'true';
    if (!enabled) return;
    const intervalMs = parseInt(process.env.AUDIT_VERIFY_INTERVAL_MS || '3600000', 10); // 1h default
    setInterval(async () => {
      try {
        const res = await dbQuery(`SELECT DISTINCT tenant_id FROM audit_logs ORDER BY created_at DESC LIMIT 20`);
        for (const row of res.rows) {
          const tenantId = row.tenant_id as string;
          const result = await auditService.verifyChain(tenantId, 1000);
          if (!result.valid) {
            // eslint-disable-next-line no-console
            console.error('[AUDIT] Tamper detected for tenant', tenantId, result.errors.slice(0,3));
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[AUDIT] verify job error', e);
      }
    }, intervalMs);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[AUDIT] schedule init error', e);
  }
})();

// Metadata search continuous indexing (feature-flagged)
(async function scheduleBackground(){
  try {
    const { getRedis } = await import('./utils/redis.js');
    if (getRedis()) {
      const { initScheduler } = await import('./jobs/scheduler.js');
      await initScheduler();
      return;
    }
    // Fallback: only search indexing via interval
    const enabled = (process.env.SEARCH_CONTINUOUS_INDEX || 'false').toLowerCase() === 'true';
    if (!enabled) return;
    const intervalMs = parseInt(process.env.SEARCH_INDEX_INTERVAL_MS || '300000', 10);
    const { searchService } = require('./services/searchService.js');
    setInterval(async () => {
      try {
        const res = await dbQuery(`SELECT id, name, tags, attrs FROM metadata_assets WHERE updated_at > NOW() - INTERVAL '10 minutes' LIMIT 200`);
        for (const row of res.rows) {
          const text = `${row.name} ${(row.tags||[]).join(' ')} ${JSON.stringify(row.attrs||{})}`;
          await searchService.indexAsset(row.id, text);
        }
      } catch (e) { console.error('[SEARCH] index job error', e); }
    }, intervalMs);
  } catch (e) { console.error('[BG] schedule init error', e); }
})();

app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    message: 'BI Platform API v1',
    version: '1.0.0',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
      path: req.path,
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server (provide a test-safe stub)
let server: any;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, async () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

    // Initialize realtime services
    try {
      await realtimeDataService.initialize();
      websocketService.initialize(server);
      logger.info('Realtime services initialized');
    } catch (error: any) {
      logger.error('Failed to initialize realtime services', { error: error.message });
    }
  });

  // Start MV scheduler if enabled
  try { startMvScheduler(); } catch (e) { /* noop */ }

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: closing HTTP server');

    // Shutdown realtime services
    try {
      websocketService.shutdown();
      await realtimeDataService.shutdown();
      logger.info('Realtime services shut down');
    } catch (error: any) {
      logger.error('Failed to shutdown realtime services', { error: error.message });
    }

    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
} else {
  server = { close: (cb?: Function) => { if (cb) cb(); } };
}

export { app, server };

