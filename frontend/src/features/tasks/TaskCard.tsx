import { Draggable } from '@hello-pangea/dnd';
import type { Task } from '../../types';

interface Props {
  task: Task;
  index: number;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

export function TaskCard({ task, index, onEdit, onDelete }: Props) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <article
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          data-testid="task-card"
          data-task-id={task.id}
          className={`rounded bg-white p-2.5 shadow-sm ring-1 ring-slate-200 ${
            snapshot.isDragging ? 'opacity-80 shadow-lg' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="flex-1 text-left text-sm font-medium">{task.title}</span>
            {onEdit && (
              <button
                type="button"
                aria-label={`Editar ${task.title}`}
                onClick={() => onEdit(task)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                ✎
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                aria-label={`Eliminar ${task.title}`}
                onClick={() => onDelete(task)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            )}
          </div>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-600">{task.description}</p>
          )}
          {task.dueDate && (
            <p className="mt-1 text-[10px] uppercase text-slate-400">
              {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
        </article>
      )}
    </Draggable>
  );
}
