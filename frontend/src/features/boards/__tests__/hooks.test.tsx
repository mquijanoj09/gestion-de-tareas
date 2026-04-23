import { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBoards } from '../hooks';

jest.mock('../api', () => ({
  boardsApi: {
    list: jest.fn().mockResolvedValue([
      { id: 'b1', name: 'Demo', description: null, createdAt: '', updatedAt: '' },
    ]),
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('useBoards', () => {
  it('fetches the list from the API', async () => {
    const { result } = renderHook(() => useBoards(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.name).toBe('Demo');
  });
});
