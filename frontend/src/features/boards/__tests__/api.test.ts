jest.mock('../../../lib/apiClient', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import { api } from '../../../lib/apiClient';
import { boardsApi } from '../api';

const mocked = api as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
};

beforeEach(() => {
  mocked.get.mockReset();
  mocked.post.mockReset();
  mocked.put.mockReset();
  mocked.delete.mockReset();
});

describe('boardsApi', () => {
  it('list → GET /boards', async () => {
    mocked.get.mockResolvedValue({ data: [{ id: 'b1' }] });
    await expect(boardsApi.list()).resolves.toEqual([{ id: 'b1' }]);
    expect(mocked.get).toHaveBeenCalledWith('/boards');
  });

  it('get → GET /boards/:id', async () => {
    mocked.get.mockResolvedValue({ data: { id: 'b1', lists: [] } });
    await expect(boardsApi.get('b1')).resolves.toEqual({ id: 'b1', lists: [] });
    expect(mocked.get).toHaveBeenCalledWith('/boards/b1');
  });

  it('create → POST /boards', async () => {
    mocked.post.mockResolvedValue({ data: { id: 'b1' } });
    await boardsApi.create({ name: 'x', description: null });
    expect(mocked.post).toHaveBeenCalledWith('/boards', { name: 'x', description: null });
  });

  it('update → PUT /boards/:id', async () => {
    mocked.put.mockResolvedValue({ data: { id: 'b1' } });
    await boardsApi.update('b1', { name: 'x' });
    expect(mocked.put).toHaveBeenCalledWith('/boards/b1', { name: 'x' });
  });

  it('remove → DELETE /boards/:id', async () => {
    mocked.delete.mockResolvedValue({ data: null });
    await expect(boardsApi.remove('b1')).resolves.toBeUndefined();
    expect(mocked.delete).toHaveBeenCalledWith('/boards/b1');
  });
});
