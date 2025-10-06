import { queryService } from '../queryService.js';
import { Pool } from 'pg';

jest.mock('pg');
const MockPool = Pool as jest.MockedClass<typeof Pool>;

describe('QueryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 1).toString('base64');
  });

  it('executes a query and returns results', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [{ x: 1 }], rowCount: 1 }),
      release: jest.fn(),
    };
    const mockPoolInstance = {
      connect: jest.fn().mockResolvedValue(mockClient),
      end: jest.fn().mockResolvedValue(undefined),
    };
    MockPool.mockImplementation(() => mockPoolInstance as any);

    const result = await queryService.execute({
      connectionConfig: { host: 'localhost', port: 5432, database: 'db', username: 'user', password: 'pass' },
      sql: 'SELECT 1 as x',
      limit: 10,
    });

    expect(result.rows).toEqual([{ x: 1 }]);
    expect(result.rowCount).toBe(1);
    expect(mockClient.release).toHaveBeenCalled();
    expect(mockPoolInstance.end).toHaveBeenCalled();
  });
});

