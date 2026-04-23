import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { useBoard } from './hooks';
import { useCreateList, useUpdateList } from '../lists/hooks';
import { useUpdateTask } from '../tasks/hooks';
import { ListColumn } from '../lists/ListColumn';
import { Button } from '../../components/Button';
import { Spinner } from '../../components/Spinner';
import { getErrorMessage } from '../../lib/apiClient';

export function BoardPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: board, isLoading, isError, error } = useBoard(id);
  const createList = useCreateList(id);
  const updateList = useUpdateList(id);
  const updateTask = useUpdateTask(id);

  const [listName, setListName] = useState('');

  const addList = async (e: FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) return;
    await createList.mutateAsync({ name: listName.trim() });
    setListName('');
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId, type } = result;
    if (!destination || !board) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    if (type === 'list') {
      updateList.mutate({ id: draggableId, data: { position: destination.index } });
      return;
    }

    const targetListId = destination.droppableId;
    const nextStatus =
      targetListId !== source.droppableId ? inferStatusFromListName(board, targetListId) : undefined;

    updateTask.mutate({
      id: draggableId,
      data: {
        listId: targetListId,
        position: destination.index,
        ...(nextStatus ? { status: nextStatus } : {}),
      },
    });
  };

  if (isLoading) return <Spinner />;
  if (isError)
    return (
      <p role="alert" className="p-6 text-red-700">
        {getErrorMessage(error)}
      </p>
    );
  if (!board) return null;

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-white px-6 py-3">
        <div>
          <Link to="/" className="text-sm text-board hover:underline">
            ← Tableros
          </Link>
          <h1 className="text-xl font-bold">{board.name}</h1>
          {board.description && <p className="text-sm text-slate-600">{board.description}</p>}
        </div>
        <form onSubmit={addList} className="flex gap-2">
          <input
            data-testid="new-list-input"
            className="rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="Nueva lista"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            aria-label="Nombre de la nueva lista"
          />
          <Button type="submit" data-testid="submit-list" disabled={!listName.trim()}>
            Añadir lista
          </Button>
        </form>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" type="list" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-1 gap-4 overflow-x-auto p-4"
            >
              {board.lists.map((list, i) => (
                <ListColumn key={list.id} boardId={board.id} index={i} list={list} />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </main>
  );
}

function inferStatusFromListName(
  board: { lists: { id: string; name: string }[] },
  listId: string,
): 'TODO' | 'DOING' | 'DONE' | undefined {
  const list = board.lists.find((l) => l.id === listId);
  if (!list) return undefined;
  const n = list.name.toLowerCase();
  if (n.includes('done') || n.includes('hecho')) return 'DONE';
  if (n.includes('doing') || n.includes('progreso')) return 'DOING';
  if (n.includes('todo') || n.includes('hacer')) return 'TODO';
  return undefined;
}
