/**
 * ConnectorFactory
 * 
 * Factory class for creating database connector instances based on type.
 * This implements the Factory pattern to provide a clean way to instantiate
 * the appropriate connector for each database type.
 */

import { IConnector, ConnectorType } from './IConnector.js';
import { PostgreSQLConnector } from './PostgreSQLConnector.js';
import { MySQLConnector } from './MySQLConnector.js';
// Import other connectors as they are implemented
// import { SQLServerConnector } from './SQLServerConnector.js';
// import { OracleConnector } from './OracleConnector.js';
// import { MongoDBConnector } from './MongoDBConnector.js';
// import { CassandraConnector } from './CassandraConnector.js';
// import { ClickHouseConnector } from './ClickHouseConnector.js';

export class ConnectorFactory {
  private static connectorInstances: Map<ConnectorType, IConnector> = new Map();

  /**
   * Get a connector instance for the specified type
   * @param type Database connector type
   * @returns Connector instance
   * @throws Error if connector type is not supported
   */
  static getConnector(type: string): IConnector {
    const connectorType = type.toLowerCase() as ConnectorType;

    // Return cached instance if available
    if (this.connectorInstances.has(connectorType)) {
      return this.connectorInstances.get(connectorType)!;
    }

    // Create new connector instance
    let connector: IConnector;

    switch (connectorType) {
      case ConnectorType.POSTGRESQL:
        connector = new PostgreSQLConnector();
        break;

      case ConnectorType.MYSQL:
        connector = new MySQLConnector();
        break;

      // case ConnectorType.SQLSERVER:
      //   connector = new SQLServerConnector();
      //   break;

      // case ConnectorType.ORACLE:
      //   connector = new OracleConnector();
      //   break;

      // case ConnectorType.MONGODB:
      //   connector = new MongoDBConnector();
      //   break;

      // case ConnectorType.CASSANDRA:
      //   connector = new CassandraConnector();
      //   break;

      // case ConnectorType.CLICKHOUSE:
      //   connector = new ClickHouseConnector();
      //   break;

      default:
        throw new Error(`Unsupported connector type: ${type}`);
    }

    // Cache the instance
    this.connectorInstances.set(connectorType, connector);

    return connector;
  }

  /**
   * Check if a connector type is supported
   * @param type Database connector type
   * @returns True if supported, false otherwise
   */
  static isSupported(type: string): boolean {
    const connectorType = type.toLowerCase();
    return Object.values(ConnectorType).includes(connectorType as ConnectorType);
  }

  /**
   * Get list of all supported connector types
   * @returns Array of supported connector types
   */
  static getSupportedTypes(): string[] {
    return Object.values(ConnectorType);
  }

  /**
   * Clear all cached connector instances
   * Useful for testing or when connectors need to be reinitialized
   */
  static clearCache(): void {
    this.connectorInstances.clear();
  }

  /**
   * Disconnect all cached connectors
   */
  static async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connectorInstances.values()).map((connector) =>
      connector.disconnect()
    );
    await Promise.all(disconnectPromises);
    this.clearCache();
  }
}

