import { apiClient } from '../../services/api';

test('apiClient has correct baseURL and withCredentials', () => {
  const expected = process.env.VITE_API_URL || '/api/v1';
  expect(apiClient.defaults.baseURL).toBe(expected);
  expect(apiClient.defaults.withCredentials).toBe(true);
});
