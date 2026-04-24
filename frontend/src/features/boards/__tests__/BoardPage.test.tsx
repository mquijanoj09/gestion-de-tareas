import { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

jest.mock('../api', () => ({
  boardsApi: {
    get: jest.fn(),
  },
}));
jest.mock('../../lists/api', () => ({
  listsApi: {
    create: jest.fn().mockResolvedValue({ id: 'l2' }),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('../../tasks/api', () => ({
  tasksApi: {
    create: jest.fn().mockResolvedValue({ id: 't2' }),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

import { boardsApi } from '../api';
import { listsApi } from '../../lists/api';
import { BoardPage } from '../BoardPage';

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/boards/b1']}>
        <Routes>
          <Route path="/boards/:id" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
  return render(<BoardPage />, { wrapper: Wrapper });
}

describe('BoardPage', () => {
  beforeEach(() => {
    (boardsApi.get as jest.Mock).mockReset();
    (listsApi.create as jest.Mock).mockClear();
  });

  it('renders board with lists', async () => {
    (boardsApi.get as jest.Mock).mockResolvedValue({
      id: 'b1',
      name: 'My Board',
      description: 'd',
      createdAt: '',
      updatedAt: '',
      lists: [
        {
          id: 'l1',
          name: 'Todo',
          position: 0,
          boardId: 'b1',
          createdAt: '',
          updatedAt: '',
          tasks: [],
        },
      ],
    });
    renderPage();
    await waitFor(() => expect(screen.getByText('My Board')).toBeInTheDocument());
    expect(screen.getByText('Todo')).toBeInTheDocument();
  });

  it('shows error on failure', async () => {
    (boardsApi.get as jest.Mock).mockRejectedValue(new Error('boom'));
    renderPage();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('boom'));
  });

  it('creates a list from the header form', async () => {
    (boardsApi.get as jest.Mock).mockResolvedValue({
      id: 'b1',
      name: 'B',
      description: null,
      createdAt: '',
      updatedAt: '',
      lists: [],
    });
    renderPage();
    await waitFor(() => expect(screen.getByTestId('new-list-input')).toBeInTheDocument());
    await userEvent.type(screen.getByTestId('new-list-input'), 'NewList');
    await userEvent.click(screen.getByTestId('submit-list'));
    await waitFor(() =>
      expect(listsApi.create).toHaveBeenCalledWith('b1', { name: 'NewList' }),
    );
  });
});
