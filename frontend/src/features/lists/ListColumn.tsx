import { FormEvent, useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import { Button } from '../../components/Button';
import { TaskCard } from '../tasks/TaskCard';
import { useCreateTask, useDeleteTask } from '../tasks/hooks';
import { useDeleteList } from './hooks';
import type { List, Task } from '../../types';

interface Props {
  boardId: string;
  index: number;
  list: List & { tasks: Task[] };
}

export function ListColumn({ boardId, index, list }: Props) {
  const createTask = useCreateTask(boardId, list.id);
  const deleteTask = useDeleteTask(boardId);
  const deleteList = useDeleteList(boardId);
  const [title, setTitle] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createTask.mutateAsync({ title: title.trim() });
    setTitle('');
  };

  return (
    <Draggable draggableId={list.id} index={index}>
      {(provided) => (
        <section
          ref={provided.innerRef}
          {...provided.draggableProps}
          data-testid="list-column"
          data-list-id={list.id}
          className="flex w-72 shrink-0 flex-col rounded-lg bg-slate-200/70 p-3"
        >
          <header className="mb-2 flex items-center justify-between">
            <h3
              {...provided.dragHandleProps}
              className="cursor-grab text-sm font-semibold text-slate-800"
            >
              {list.name}
            </h3>
            <button
              type="button"
              aria-label={`Eliminar lista ${list.name}`}
              onClick={() => {
                if (confirm(`¿Eliminar lista "${list.name}"?`)) deleteList.mutate(list.id);
              }}
              className="text-xs text-slate-500 hover:text-red-700"
            >
              ✕
            </button>
          </header>

          <Droppable droppableId={list.id} type="task">
            {(dropProvided, dropSnapshot) => (
              <div
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className={`flex min-h-[40px] flex-1 flex-col gap-2 rounded ${
                  dropSnapshot.isDraggingOver ? 'bg-slate-300/50' : ''
                }`}
              >
                {list.tasks.map((t, i) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    index={i}
                    onDelete={(task) => deleteTask.mutate(task.id)}
                  />
                ))}
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>

          <form onSubmit={submit} className="mt-2 flex gap-1">
            <input
              data-testid={`new-task-input-${list.name}`}
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder="+ Nueva tarea"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label={`Nueva tarea en ${list.name}`}
            />
            <Button type="submit" data-testid={`submit-task-${list.name}`} disabled={!title.trim()}>
              Agregar
            </Button>
          </form>
        </section>
      )}
    </Draggable>
  );
}
