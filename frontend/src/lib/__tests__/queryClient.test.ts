import { queryClient } from '../queryClient';

describe('queryClient', () => {
  it('uses configured defaults', () => {
    const defs = queryClient.getDefaultOptions();
    expect(defs.queries?.staleTime).toBe(1000 * 30);
    expect(defs.queries?.retry).toBe(1);
    expect(defs.mutations?.retry).toBe(0);
  });
});
