import { query, testConnection } from '../connection.js';

describe('Database Connection', () => {
  it('should test database connection successfully', async () => {
    const result = await testConnection();
    expect(result).toBe(true);
  });

  it('should execute a simple query', async () => {
    const result = await query('SELECT 1 as number');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].number).toBe(1);
  });

  it('should execute a parameterized query', async () => {
    const result = await query('SELECT $1::text as value', ['test']);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].value).toBe('test');
  });
});

