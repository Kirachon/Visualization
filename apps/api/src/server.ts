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
import sessionRoutes from './routes/sessionRoutes.js';
import idpConfigRoutes from './routes/idpConfigRoutes.js';
import providerAuthRoutes from './routes/providerAuthRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import versionRoutes from './routes/versionRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import metadataRoutes from './routes/metadataRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import { auditService } from './services/auditService.js';
import { query as dbQuery } from './database/connection.js';
import metricsRoutes from './routes/metricsRoutes.js';

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

// Rate limiting - general API rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use(requestLogger);

// API routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/auth', mfaRoutes);
app.use('/api/v1', dataSourceRoutes);
app.use('/api/v1', queryRoutes);
app.use('/api/v1', dashboardRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1', dashboardSharingRoutes);
app.use('/api/v1', perfRoutes);
app.use('/api/v1', sessionRoutes);
app.use('/api/v1', idpConfigRoutes);
app.use('/api/v1', providerAuthRoutes);
app.use('/api/v1', commentRoutes);
app.use('/api/v1', versionRoutes);
app.use('/api/v1', activityRoutes);
app.use('/api/v1', workspaceRoutes);
app.use('/api/v1', metadataRoutes);
app.use('/api/v1', securityRoutes);
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
(function scheduleSearchIndexing(){
  try {
    const enabled = (process.env.SEARCH_CONTINUOUS_INDEX || 'false').toLowerCase() === 'true';
    if (!enabled) return;
    const intervalMs = parseInt(process.env.SEARCH_INDEX_INTERVAL_MS || '300000', 10); // 5m default
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
  } catch (e) { console.error('[SEARCH] schedule init error', e); }
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

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
}

export { app };

