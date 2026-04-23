import { api } from '../../lib/apiClient';
import type { Board, BoardWithLists } from '../../types';
import type { CreateBoardInput, UpdateBoardInput } from 'shared';

export const boardsApi = {
  list: () => api.get<Board[]>('/boards').then((r) => r.data),
  get: (id: string) => api.get<BoardWithLists>(`/boards/${id}`).then((r) => r.data),
  create: (data: CreateBoardInput) => api.post<Board>('/boards', data).then((r) => r.data),
  update: (id: string, data: UpdateBoardInput) =>
    api.put<Board>(`/boards/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/boards/${id}`).then(() => undefined),
};
