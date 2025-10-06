import { dataSourceService } from '../dataSourceService.js';
import { query } from '../../database/connection.js';

jest.mock('../../database/connection.js');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('DataSourceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 1).toString('base64');
  });

  describe('create', () => {
    it('creates a data source with encrypted password', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'ds-1',
          name: 'Test DS',
          type: 'postgresql',
          connection_config: { host: 'localhost', port: 5432, database: 'db', username: 'user', password: { iv: 'x', authTag: 'y', ct: 'z' } },
          tenant_id: 't1',
          owner_id: 'u1',
          schema_info: null,
          status: 'active',
          last_tested_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        }],
        rowCount: 1,
      } as any);

      const ds = await dataSourceService.create('t1', 'u1', {
        name: 'Test DS',
        type: 'postgresql',
        connectionConfig: { host: 'localhost', port: 5432, database: 'db', username: 'user', password: 'secret' },
      });

      expect(ds.id).toBe('ds-1');
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining(['Test DS', 'postgresql']));
    });
  });

  describe('list', () => {
    it('lists data sources for tenant', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'ds-1', name: 'DS1', type: 'postgresql', connection_config: {}, tenant_id: 't1', owner_id: 'u1', schema_info: null, status: 'active', last_tested_at: null, created_at: new Date(), updated_at: new Date() },
        ],
        rowCount: 1,
      } as any);

      const list = await dataSourceService.list('t1');
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('DS1');
    });
  });

  describe('getById', () => {
    it('returns null if not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      const ds = await dataSourceService.getById('ds-x', 't1');
      expect(ds).toBeNull();
    });
  });

  describe('update', () => {
    it('updates a data source', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'ds-1', name: 'Old', type: 'postgresql', connection_config: { host: 'localhost', port: 5432, database: 'db', username: 'user', password: { iv: 'x', authTag: 'y', ct: 'z' } }, tenant_id: 't1', owner_id: 'u1', schema_info: null, status: 'active', last_tested_at: null, created_at: new Date(), updated_at: new Date() }],
        rowCount: 1,
      } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'ds-1', name: 'New', type: 'postgresql', connection_config: { host: 'localhost', port: 5432, database: 'db', username: 'user', password: { iv: 'x', authTag: 'y', ct: 'z' } }, tenant_id: 't1', owner_id: 'u1', schema_info: null, status: 'active', last_tested_at: null, created_at: new Date(), updated_at: new Date() }],
        rowCount: 1,
      } as any);

      const ds = await dataSourceService.update('ds-1', 't1', { name: 'New' });
      expect(ds?.name).toBe('New');
    });
  });

  describe('remove', () => {
    it('deletes a data source', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);
      const ok = await dataSourceService.remove('ds-1', 't1');
      expect(ok).toBe(true);
    });
  });
});

