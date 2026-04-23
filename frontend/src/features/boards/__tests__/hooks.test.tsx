import { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../api', () => ({
  boardsApi: {
    list: jest.fn().mockResolvedValue([
      { id: 'b1', name: 'Demo', description: null, createdAt: '', updatedAt: '' },
    ]),
    get: jest.fn().mockResolvedValue({ id: 'b1', lists: [] }),
    create: jest.fn().mockResolvedValue({ id: 'b2' }),
    update: jest.fn().mockResolvedValue({ id: 'b1' }),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

import { boardsApi } from '../api';
import {
  useBoard,
  useBoards,
  useCreateBoard,
  useDeleteBoard,
  useUpdateBoard,
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

describe('boards hooks', () => {
  it('useBoards fetches list', async () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useBoards(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.name).toBe('Demo');
  });

  it('useBoard fetches when id is set', async () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useBoard('b1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(boardsApi.get).toHaveBeenCalledWith('b1');
  });

  it('useBoard is disabled when id is empty', () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useBoard(''), { wrapper: Wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useCreateBoard invalidates boards', async () => {
    const { Wrapper, spy } = makeWrapper();
    const { result } = renderHook(() => useCreateBoard(), { wrapper: Wrapper });
    await result.current.mutateAsync({ name: 'x', description: null });
    expect(boardsApi.create).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith({ queryKey: ['boards'] });
  });

  it('useUpdateBoard invalidates boards and single board', async () => {
    const { Wrapper, spy } = makeWrapper();
    const { result } = renderHook(() => useUpdateBoard('b1'), { wrapper: Wrapper });
    await result.current.mutateAsync({ name: 'y' });
    expect(boardsApi.update).toHaveBeenCalledWith('b1', { name: 'y' });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['boards'] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['board', 'b1'] });
  });

  it('useDeleteBoard invalidates boards', async () => {
    const { Wrapper, spy } = makeWrapper();
    const { result } = renderHook(() => useDeleteBoard(), { wrapper: Wrapper });
    await result.current.mutateAsync('b1');
    expect(boardsApi.remove).toHaveBeenCalledWith('b1');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['boards'] });
  });
});
