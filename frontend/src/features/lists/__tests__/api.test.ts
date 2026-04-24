jest.mock('../../../lib/apiClient', () => ({
  api: { post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

import { api } from '../../../lib/apiClient';
import { listsApi } from '../api';

const mocked = api as unknown as { post: jest.Mock; put: jest.Mock; delete: jest.Mock };

beforeEach(() => {
  mocked.post.mockReset();
  mocked.put.mockReset();
  mocked.delete.mockReset();
});

describe('listsApi', () => {
  it('create → POST /boards/:boardId/lists', async () => {
    mocked.post.mockResolvedValue({ data: { id: 'l1' } });
    await listsApi.create('b1', { name: 'Todo' });
    expect(mocked.post).toHaveBeenCalledWith('/boards/b1/lists', { name: 'Todo' });
  });

  it('update → PUT /lists/:id', async () => {
    mocked.put.mockResolvedValue({ data: { id: 'l1' } });
    await listsApi.update('l1', { name: 'x' });
    expect(mocked.put).toHaveBeenCalledWith('/lists/l1', { name: 'x' });
  });

  it('remove → DELETE /lists/:id', async () => {
    mocked.delete.mockResolvedValue({ data: null });
    await expect(listsApi.remove('l1')).resolves.toBeUndefined();
    expect(mocked.delete).toHaveBeenCalledWith('/lists/l1');
  });
});
