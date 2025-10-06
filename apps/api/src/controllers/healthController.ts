import { Request, Response } from 'express';
import { testConnection } from '../database/connection.js';
import { logger } from '../logger/logger.js';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: 'up' | 'down';
    redis?: 'up' | 'down';
  };
  memory: {
    used: string;
    total: string;
    percentage: string;
  };
  version: string;
}

export class HealthController {
  async check(_req: Request, res: Response): Promise<void> {
    try {
      // Check database connection
      const dbHealthy = await testConnection();

      // Get memory usage
      const memUsage = process.memoryUsage();
      const totalMem = memUsage.heapTotal;
      const usedMem = memUsage.heapUsed;
      const memPercentage = ((usedMem / totalMem) * 100).toFixed(2);

      const health: HealthStatus = {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: dbHealthy ? 'up' : 'down',
        },
        memory: {
          used: `${(usedMem / 1024 / 1024).toFixed(2)} MB`,
          total: `${(totalMem / 1024 / 1024).toFixed(2)} MB`,
          percentage: `${memPercentage}%`,
        },
        version: process.env.npm_package_version || '1.0.0',
      };

      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      logger.error('Health check failed', { error });
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      });
    }
  }

  async liveness(_req: Request, res: Response): Promise<void> {
    // Simple liveness check - is the server running?
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
    });
  }

  async readiness(_req: Request, res: Response): Promise<void> {
    // Readiness check - is the server ready to accept traffic?
    try {
      const dbHealthy = await testConnection();

      if (dbHealthy) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(503).json({
          status: 'not ready',
          timestamp: new Date().toISOString(),
          reason: 'Database connection failed',
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: 'Readiness check failed',
      });
    }
  }
}

export const healthController = new HealthController();

