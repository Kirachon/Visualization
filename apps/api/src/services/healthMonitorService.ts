/**
 * HealthMonitorService
 * 
 * Service for monitoring health of data source connections.
 * Performs scheduled health checks and updates data source status.
 */

import { query } from '../database/connection.js';
import { ConnectorFactory } from '../connectors/ConnectorFactory.js';
import type { ConnectionConfig, HealthCheckResult } from '../connectors/IConnector.js';

export interface DataSourceHealth {
  dataSourceId: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs?: number;
  message?: string;
  lastCheckedAt: Date;
}

export class HealthMonitorService {
  private checkInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  /**
   * Start health monitoring with specified interval
   * @param intervalMs Interval in milliseconds (default: 5 minutes)
   */
  start(intervalMs: number = 5 * 60 * 1000): void {
    if (this.isRunning) {
      console.log('Health monitor is already running');
      return;
    }

    console.log(`Starting health monitor with interval: ${intervalMs}ms`);
    this.isRunning = true;

    // Run initial check
    this.checkAllDataSources().catch((error) => {
      console.error('Error in initial health check:', error);
    });

    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.checkAllDataSources().catch((error) => {
        console.error('Error in scheduled health check:', error);
      });
    }, intervalMs);
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('Health monitor stopped');
  }

  /**
   * Check health of all active data sources
   */
  async checkAllDataSources(): Promise<DataSourceHealth[]> {
    try {
      // Get all active data sources
      const result = await query(
        `SELECT id, type, connection_config, tenant_id 
         FROM data_sources 
         WHERE status = 'active'`
      );

      const healthResults: DataSourceHealth[] = [];

      for (const dataSource of result.rows) {
        try {
          const health = await this.checkDataSource(
            dataSource.id,
            dataSource.type,
            dataSource.connection_config
          );
          healthResults.push(health);
        } catch (error: any) {
          console.error(`Error checking data source ${dataSource.id}:`, error);
          healthResults.push({
            dataSourceId: dataSource.id,
            status: 'down',
            message: error.message || String(error),
            lastCheckedAt: new Date(),
          });
        }
      }

      return healthResults;
    } catch (error: any) {
      console.error('Error in checkAllDataSources:', error);
      throw error;
    }
  }

  /**
   * Check health of a specific data source
   */
  async checkDataSource(
    dataSourceId: string,
    type: string,
    config: ConnectionConfig
  ): Promise<DataSourceHealth> {
    try {
      const connector = ConnectorFactory.getConnector(type);
      const healthResult: HealthCheckResult = await connector.health(config);

      // Update data source with health status
      await query(
        `UPDATE data_sources 
         SET last_tested_at = NOW(), 
             status = CASE 
               WHEN $2 = 'down' THEN 'inactive'
               ELSE 'active'
             END,
             updated_at = NOW()
         WHERE id = $1`,
        [dataSourceId, healthResult.status]
      );

      return {
        dataSourceId,
        status: healthResult.status,
        latencyMs: healthResult.latencyMs,
        message: healthResult.message,
        lastCheckedAt: new Date(),
      };
    } catch (error: any) {
      // Update data source as inactive on error
      await query(
        `UPDATE data_sources 
         SET last_tested_at = NOW(), 
             status = 'inactive',
             updated_at = NOW()
         WHERE id = $1`,
        [dataSourceId]
      );

      throw error;
    }
  }

  /**
   * Get health status for a specific data source
   */
  async getDataSourceHealth(dataSourceId: string, tenantId: string): Promise<DataSourceHealth | null> {
    try {
      const result = await query(
        `SELECT id, type, connection_config, status, last_tested_at 
         FROM data_sources 
         WHERE id = $1 AND tenant_id = $2`,
        [dataSourceId, tenantId]
      );

      if (result.rows.length === 0) return null;

      const dataSource = result.rows[0];

      // Perform fresh health check
      const health = await this.checkDataSource(
        dataSource.id,
        dataSource.type,
        dataSource.connection_config
      );

      return health;
    } catch (error: any) {
      return {
        dataSourceId,
        status: 'down',
        message: error.message || String(error),
        lastCheckedAt: new Date(),
      };
    }
  }

  /**
   * Get health summary for all data sources in a tenant
   */
  async getTenantHealthSummary(tenantId: string): Promise<{
    total: number;
    healthy: number;
    degraded: number;
    down: number;
    dataSources: DataSourceHealth[];
  }> {
    const result = await query(
      `SELECT id, type, connection_config 
       FROM data_sources 
       WHERE tenant_id = $1 AND status = 'active'`,
      [tenantId]
    );

    const healthResults: DataSourceHealth[] = [];
    let healthy = 0;
    let degraded = 0;
    let down = 0;

    for (const dataSource of result.rows) {
      try {
        const health = await this.checkDataSource(
          dataSource.id,
          dataSource.type,
          dataSource.connection_config
        );
        healthResults.push(health);

        if (health.status === 'healthy') healthy++;
        else if (health.status === 'degraded') degraded++;
        else down++;
      } catch (error: any) {
        const health: DataSourceHealth = {
          dataSourceId: dataSource.id,
          status: 'down',
          message: error.message || String(error),
          lastCheckedAt: new Date(),
        };
        healthResults.push(health);
        down++;
      }
    }

    return {
      total: result.rows.length,
      healthy,
      degraded,
      down,
      dataSources: healthResults,
    };
  }

  /**
   * Check if service is running
   */
  isMonitoring(): boolean {
    return this.isRunning;
  }
}

export const healthMonitorService = new HealthMonitorService();

