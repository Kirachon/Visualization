/**
 * Connector Test Script
 * 
 * Tests PostgreSQL and MySQL connectors with the Docker containers.
 */

import { ConnectorFactory } from '../src/connectors/ConnectorFactory.js';
import { ConnectionConfig } from '../src/connectors/IConnector.js';

async function testPostgreSQL() {
  console.log('\n🔵 Testing PostgreSQL Connector...');

  const config: ConnectionConfig = {
    host: 'localhost',
    port: 5432,
    database: 'bi_platform',
    username: 'testuser',
    password: 'testpassword',
  };
  
  try {
    const connector = ConnectorFactory.getConnector('postgresql');
    
    // Test connection
    console.log('  📡 Testing connection...');
    const testResult = await connector.test(config);
    console.log(`  ${testResult.success ? '✅' : '❌'} Connection test: ${testResult.message}`);
    if (testResult.latencyMs) {
      console.log(`  ⏱️  Latency: ${testResult.latencyMs}ms`);
    }
    
    if (!testResult.success) {
      console.error(`  ❌ Error: ${testResult.error}`);
      return false;
    }
    
    // Introspect schema
    console.log('  🔍 Introspecting schema...');
    const schema = await connector.introspect(config);
    console.log(`  ✅ Found ${schema.schemas.length} schemas`);
    schema.schemas.forEach(s => {
      console.log(`    📁 Schema: ${s.name} (${s.tables.length} tables)`);
      s.tables.forEach(t => {
        console.log(`      📄 Table: ${t.name} (${t.columns.length} columns)`);
      });
    });
    
    // Health check
    console.log('  🏥 Checking health...');
    const health = await connector.health(config);
    console.log(`  ${health.status === 'healthy' ? '✅' : '❌'} Health: ${health.status}`);
    console.log(`  ⏱️  Latency: ${health.latencyMs}ms`);
    
    return true;
  } catch (error: any) {
    console.error(`  ❌ PostgreSQL test failed: ${error.message}`);
    return false;
  }
}

async function testMySQL() {
  console.log('\n🟠 Testing MySQL Connector...');
  
  const config: ConnectionConfig = {
    host: 'localhost',
    port: 3307, // Changed from 3306 to 3307
    database: 'test_db',
    username: 'testuser',
    password: 'testpassword',
  };
  
  try {
    const connector = ConnectorFactory.getConnector('mysql');
    
    // Test connection
    console.log('  📡 Testing connection...');
    const testResult = await connector.test(config);
    console.log(`  ${testResult.success ? '✅' : '❌'} Connection test: ${testResult.message}`);
    if (testResult.latencyMs) {
      console.log(`  ⏱️  Latency: ${testResult.latencyMs}ms`);
    }
    
    if (!testResult.success) {
      console.error(`  ❌ Error: ${testResult.error}`);
      return false;
    }
    
    // Introspect schema
    console.log('  🔍 Introspecting schema...');
    const schema = await connector.introspect(config);
    console.log(`  ✅ Found ${schema.schemas.length} schemas`);
    schema.schemas.forEach(s => {
      console.log(`    📁 Schema: ${s.name} (${s.tables.length} tables)`);
      s.tables.forEach(t => {
        console.log(`      📄 Table: ${t.name} (${t.columns.length} columns)`);
      });
    });
    
    // Health check
    console.log('  🏥 Checking health...');
    const health = await connector.health(config);
    console.log(`  ${health.status === 'healthy' ? '✅' : '❌'} Health: ${health.status}`);
    console.log(`  ⏱️  Latency: ${health.latencyMs}ms`);
    
    return true;
  } catch (error: any) {
    console.error(`  ❌ MySQL test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Connector Tests...\n');
  console.log('=' .repeat(60));
  
  const postgresResult = await testPostgreSQL();
  const mysqlResult = await testMySQL();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results:');
  console.log(`  PostgreSQL: ${postgresResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  MySQL:      ${mysqlResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (postgresResult && mysqlResult) {
    console.log('\n✨ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed!');
    process.exit(1);
  }
}

main();

