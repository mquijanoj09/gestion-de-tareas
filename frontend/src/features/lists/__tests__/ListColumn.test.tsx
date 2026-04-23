import { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';

jest.mock('../../tasks/api', () => ({
  tasksApi: {
    create: jest.fn().mockResolvedValue({ id: 't2' }),
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../api', () => ({
  listsApi: {
    remove: jest.fn().mockResolvedValue(undefined),
  },
}));

import { tasksApi } from '../../tasks/api';
import { listsApi } from '../api';
import { ListColumn } from '../ListColumn';
import type { List, Task } from '../../../types';

const list: List & { tasks: Task[] } = {
  id: 'l1',
  name: 'Todo',
  position: 0,
  boardId: 'b1',
  createdAt: '',
  updatedAt: '',
  tasks: [
    {
      id: 't1',
      title: 'T1',
      description: null,
      status: 'TODO',
      position: 0,
      dueDate: null,
      listId: 'l1',
      createdAt: '',
      updatedAt: '',
    },
  ],
};

function renderColumn() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <DragDropContext onDragEnd={() => {}}>
        <Droppable droppableId="board" type="list" direction="horizontal">
          {(p) => (
            <div ref={p.innerRef} {...p.droppableProps}>
              {children}
              {p.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </QueryClientProvider>
  );
  return render(<ListColumn boardId="b1" index={0} list={list} />, { wrapper: Wrapper });
}

describe('ListColumn', () => {
  it('renders name and existing tasks', () => {
    renderColumn();
    expect(screen.getByText('Todo')).toBeInTheDocument();
    expect(screen.getByText('T1')).toBeInTheDocument();
  });

  it('submits new task when form is filled', async () => {
    renderColumn();
    await userEvent.type(screen.getByLabelText('Nueva tarea en Todo'), 'New one');
    await userEvent.click(screen.getByTestId('submit-task-Todo'));
    expect(tasksApi.create).toHaveBeenCalledWith('l1', { title: 'New one' });
  });

  it('does not submit empty task (button disabled)', async () => {
    renderColumn();
    expect(screen.getByTestId('submit-task-Todo')).toBeDisabled();
  });

  it('deletes list when confirmed', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    renderColumn();
    await userEvent.click(screen.getByLabelText('Eliminar lista Todo'));
    expect(listsApi.remove).toHaveBeenCalledWith('l1');
    confirmSpy.mockRestore();
  });

  it('skips deleting list when cancelled', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    (listsApi.remove as jest.Mock).mockClear();
    renderColumn();
    await userEvent.click(screen.getByLabelText('Eliminar lista Todo'));
    expect(listsApi.remove).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
