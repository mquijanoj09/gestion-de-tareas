import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';
import { useBoards, useCreateBoard, useDeleteBoard } from './hooks';
import { getErrorMessage } from '../../lib/apiClient';

export function BoardsPage() {
  const { data, isLoading, isError, error } = useBoards();
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createBoard.mutateAsync({ name: name.trim(), description: description.trim() || null });
    setName('');
    setDescription('');
    setOpen(false);
  };

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600">Tableros</h1>
        <Button data-testid="new-board-btn" onClick={() => setOpen(true)}>
          + Nuevo tablero
        </Button>
      </header>

      {isLoading && <Spinner />}
      {isError && (
        <p role="alert" className="text-red-700">
          {getErrorMessage(error)}
        </p>
      )}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((b) => (
          <li
            key={b.id}
            data-testid="board-card"
            className="rounded-lg bg-white p-4 shadow hover:shadow-md"
          >
            <Link to={`/boards/${b.id}`} className="block">
              <h2 className="font-semibold">{b.name}</h2>
              {b.description && <p className="mt-1 text-sm text-slate-600">{b.description}</p>}
            </Link>
            <Button
              variant="ghost"
              aria-label={`Eliminar ${b.name}`}
              className="mt-2 text-xs text-red-700"
              onClick={() => {
                if (confirm(`¿Eliminar tablero "${b.name}"?`)) deleteBoard.mutate(b.id);
              }}
            >
              Eliminar
            </Button>
          </li>
        ))}
      </ul>

      {data?.length === 0 && !isLoading && (
        <p className="mt-6 text-center text-slate-500">Aún no tienes tableros. ¡Crea el primero!</p>
      )}

      <Modal open={open} title="Nuevo tablero" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm">
            Nombre
            <input
              data-testid="board-name-input"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            Descripción
            <textarea
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" data-testid="submit-board" disabled={createBoard.isPending}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
