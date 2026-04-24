jest.mock('../../../lib/apiClient', () => ({
  api: { post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

import { api } from '../../../lib/apiClient';
import { tasksApi } from '../api';

const mocked = api as unknown as {
  post: jest.Mock;
  put: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};

beforeEach(() => {
  mocked.post.mockReset();
  mocked.put.mockReset();
  mocked.patch.mockReset();
  mocked.delete.mockReset();
});

describe('tasksApi', () => {
  it('create → POST /lists/:listId/tasks', async () => {
    mocked.post.mockResolvedValue({ data: { id: 't1' } });
    await tasksApi.create('l1', { title: 'x' });
    expect(mocked.post).toHaveBeenCalledWith('/lists/l1/tasks', { title: 'x' });
  });

  it('update → PUT /tasks/:id', async () => {
    mocked.put.mockResolvedValue({ data: { id: 't1' } });
    await tasksApi.update('t1', { title: 'y' });
    expect(mocked.put).toHaveBeenCalledWith('/tasks/t1', { title: 'y' });
  });

  it('updateStatus → PATCH /tasks/:id/status', async () => {
    mocked.patch.mockResolvedValue({ data: { id: 't1' } });
    await tasksApi.updateStatus('t1', 'DONE');
    expect(mocked.patch).toHaveBeenCalledWith('/tasks/t1/status', { status: 'DONE' });
  });

  it('remove → DELETE /tasks/:id', async () => {
    mocked.delete.mockResolvedValue({ data: null });
    await expect(tasksApi.remove('t1')).resolves.toBeUndefined();
    expect(mocked.delete).toHaveBeenCalledWith('/tasks/t1');
  });
});
