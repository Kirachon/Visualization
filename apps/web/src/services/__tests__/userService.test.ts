import userService from '../userService';
import { apiClient } from '../api';

jest.mock('../api', () => ({ apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() } }));

describe('userService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists users', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { items: [], total: 0 } });
    const res = await userService.list({ q: 'a', page: 1, pageSize: 10 });
    expect(apiClient.get).toHaveBeenCalledWith('/users', { params: { q: 'a', page: 1, pageSize: 10 } });
    expect(res).toEqual({ items: [], total: 0 });
  });

  it('creates user', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: '1' } });
    const res = await userService.create({ username: 'u', email: 'e', password: 'p', firstName: 'f', lastName: 'l', roleId: 'r' });
    expect(apiClient.post).toHaveBeenCalledWith('/users', { username: 'u', email: 'e', password: 'p', firstName: 'f', lastName: 'l', roleId: 'r' });
    expect(res).toEqual({ id: '1' });
  });
});

