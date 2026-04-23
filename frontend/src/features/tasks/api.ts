import { api } from '../../lib/apiClient';
import type { Task, TaskStatus } from '../../types';
import type { CreateTaskInput, UpdateTaskInput } from 'shared';

export const tasksApi = {
  create: (listId: string, data: CreateTaskInput) =>
    api.post<Task>(`/lists/${listId}/tasks`, data).then((r) => r.data),
  update: (id: string, data: UpdateTaskInput) =>
    api.put<Task>(`/tasks/${id}`, data).then((r) => r.data),
  updateStatus: (id: string, status: TaskStatus) =>
    api.patch<Task>(`/tasks/${id}/status`, { status }).then((r) => r.data),
  remove: (id: string) => api.delete(`/tasks/${id}`).then(() => undefined),
};
