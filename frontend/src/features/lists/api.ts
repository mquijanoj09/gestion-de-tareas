import { api } from '../../lib/apiClient';
import type { List } from '../../types';
import type { CreateListInput, UpdateListInput } from 'shared';

export const listsApi = {
  create: (boardId: string, data: CreateListInput) =>
    api.post<List>(`/boards/${boardId}/lists`, data).then((r) => r.data),
  update: (id: string, data: UpdateListInput) =>
    api.put<List>(`/lists/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/lists/${id}`).then(() => undefined),
};
