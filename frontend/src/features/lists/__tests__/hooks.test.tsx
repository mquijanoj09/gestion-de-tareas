import { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../api', () => ({
  listsApi: {
    create: jest.fn().mockResolvedValue({ id: 'l1' }),
    update: jest.fn().mockResolvedValue({ id: 'l1' }),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

import { listsApi } from '../api';
import { useCreateList, useDeleteList, useUpdateList } from '../hooks';

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

describe('lists hooks', () => {
  it('useCreateList calls api and invalidates board', async () => {
    const { Wrapper, spy } = makeWrapper();
    const { result } = renderHook(() => useCreateList('b1'), { wrapper: Wrapper });
    await result.current.mutateAsync({ name: 'Todo' });
    expect(listsApi.create).toHaveBeenCalledWith('b1', { name: 'Todo' });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['board', 'b1'] });
  });

  it('useUpdateList calls api with id/data', async () => {
    const { Wrapper, spy } = makeWrapper();
    const { result } = renderHook(() => useUpdateList('b1'), { wrapper: Wrapper });
    await result.current.mutateAsync({ id: 'l1', data: { name: 'x' } });
    expect(listsApi.update).toHaveBeenCalledWith('l1', { name: 'x' });
    expect(spy).toHaveBeenCalledWith({ queryKey: ['board', 'b1'] });
  });

  it('useDeleteList calls api', async () => {
    const { Wrapper, spy } = makeWrapper();
    const { result } = renderHook(() => useDeleteList('b1'), { wrapper: Wrapper });
    await result.current.mutateAsync('l1');
    expect(listsApi.remove).toHaveBeenCalledWith('l1');
    expect(spy).toHaveBeenCalledWith({ queryKey: ['board', 'b1'] });
  });
});
