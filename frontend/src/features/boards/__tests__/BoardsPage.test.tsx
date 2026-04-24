import { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../api', () => ({
  boardsApi: {
    list: jest.fn(),
    create: jest.fn().mockResolvedValue({ id: 'b2' }),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

import { boardsApi } from '../api';
import { BoardsPage } from '../BoardsPage';

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return render(<BoardsPage />, { wrapper: Wrapper });
}

describe('BoardsPage', () => {
  beforeEach(() => {
    (boardsApi.list as jest.Mock).mockReset();
    (boardsApi.create as jest.Mock).mockClear();
    (boardsApi.remove as jest.Mock).mockClear();
  });

  it('shows empty state when list is empty', async () => {
    (boardsApi.list as jest.Mock).mockResolvedValue([]);
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/Aún no tienes tableros/)).toBeInTheDocument(),
    );
  });

  it('renders boards and deletes on confirm', async () => {
    (boardsApi.list as jest.Mock).mockResolvedValue([
      { id: 'b1', name: 'Board 1', description: 'desc', createdAt: '', updatedAt: '' },
    ]);
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage();
    await waitFor(() => expect(screen.getByText('Board 1')).toBeInTheDocument());
    expect(screen.getByText('desc')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Eliminar Board 1'));
    expect(boardsApi.remove).toHaveBeenCalledWith('b1');
    confirmSpy.mockRestore();
  });

  it('shows error on failure', async () => {
    (boardsApi.list as jest.Mock).mockRejectedValue(new Error('oops'));
    renderPage();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('oops'));
  });

  it('creates a board from the modal', async () => {
    (boardsApi.list as jest.Mock).mockResolvedValue([]);
    renderPage();
    await userEvent.click(screen.getByTestId('new-board-btn'));
    await userEvent.type(screen.getByTestId('board-name-input'), 'New');
    await userEvent.click(screen.getByTestId('submit-board'));
    await waitFor(() =>
      expect(boardsApi.create).toHaveBeenCalledWith({ name: 'New', description: null }),
    );
  });
});
