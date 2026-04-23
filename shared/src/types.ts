export type TaskStatus = 'TODO' | 'DOING' | 'DONE';

export interface Board {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface List {
  id: string;
  name: string;
  position: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  dueDate: string | null;
  listId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardWithLists extends Board {
  lists: (List & { tasks: Task[] })[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
