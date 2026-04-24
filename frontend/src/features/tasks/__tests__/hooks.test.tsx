import { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../api', () => ({
  tasksApi: {
    create: jest.fn().mockResolvedValue({ id: 't1' }),
    update: jest.fn().mockResolvedValue({ id: 't1' }),
    updateStatus: jest.fn().mockResolvedValue({ id: 't1' }),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

import { tasksApi } from '../api';
import {
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
  useUpdateTaskStatus,
} from '../hooks';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const spy = jest.spyOn(client, 'invalidateQueries');
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, spy };
}

describe('tasks hooks', () => {
  it('useCreateTask posts to listId', async () => {
    const { Wrapper, spy } = makeWrapper();
    const { result } = renderHook(() => useCreateTask('b1', 'l1'), { wrapper: Wrapper });
    await result.current.mutateAsync({ title: 'do it' });
    expect(tasksApi.create).toHaveBeenCalledWith('l1', { title: 'do it' });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['board', 'b1'] });
  });

  it('useUpdateTask updates by id', async () => {
    const { Wrapper, spy } = makeWrapper();
    const { result } = renderHook(() => useUpdateTask('b1'), { wrapper: Wrapper });
    await result.current.mutateAsync({ id: 't1', data: { title: 'y' } });
    expect(tasksApi.update).toHaveBeenCalledWith('t1', { title: 'y' });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['board', 'b1'] });
  });

  it('useUpdateTaskStatus patches status', async () => {
    const { Wrapper, spy } = makeWrapper();
    const { result } = renderHook(() => useUpdateTaskStatus('b1'), { wrapper: Wrapper });
    await result.current.mutateAsync({ id: 't1', status: 'DONE' });
    expect(tasksApi.updateStatus).toHaveBeenCalledWith('t1', 'DONE');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['board', 'b1'] });
  });

  it('useDeleteTask removes by id', async () => {
    const { Wrapper, spy } = makeWrapper();
    const { result } = renderHook(() => useDeleteTask('b1'), { wrapper: Wrapper });
    await result.current.mutateAsync('t1');
    expect(tasksApi.remove).toHaveBeenCalledWith('t1');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['board', 'b1'] });
  });
});
