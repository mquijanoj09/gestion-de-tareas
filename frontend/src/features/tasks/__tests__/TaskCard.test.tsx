import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { TaskCard } from '../TaskCard';
import type { Task } from '../../../types';

const baseTask: Task = {
  id: 't1',
  title: 'Write tests',
  description: 'add coverage',
  status: 'TODO',
  position: 0,
  dueDate: '2026-05-01T00:00:00Z',
  listId: 'l1',
  createdAt: '',
  updatedAt: '',
};

function renderWithDnd(ui: React.ReactNode) {
  return render(
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="d" type="task">
        {(p) => (
          <div ref={p.innerRef} {...p.droppableProps}>
            {ui}
            {p.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>,
  );
}

describe('TaskCard', () => {
  it('renders title, description, and due date', () => {
    renderWithDnd(<TaskCard task={baseTask} index={0} />);
    expect(screen.getByText('Write tests')).toBeInTheDocument();
    expect(screen.getByText('add coverage')).toBeInTheDocument();
    expect(screen.getByTestId('task-card')).toHaveAttribute('data-task-id', 't1');
  });

  it('calls onEdit and onDelete', async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    renderWithDnd(<TaskCard task={baseTask} index={0} onEdit={onEdit} onDelete={onDelete} />);
    await userEvent.click(screen.getByLabelText('Editar Write tests'));
    await userEvent.click(screen.getByLabelText('Eliminar Write tests'));
    expect(onEdit).toHaveBeenCalledWith(baseTask);
    expect(onDelete).toHaveBeenCalledWith(baseTask);
  });

  it('renders without description or due date', () => {
    renderWithDnd(
      <TaskCard task={{ ...baseTask, description: null, dueDate: null }} index={0} />,
    );
    expect(screen.queryByText('add coverage')).not.toBeInTheDocument();
  });
});
