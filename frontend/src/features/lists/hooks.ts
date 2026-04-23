import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listsApi } from './api';
import type { CreateListInput, UpdateListInput } from 'shared';

export const useCreateList = (boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateListInput) => listsApi.create(boardId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
};

export const useUpdateList = (boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateListInput }) => listsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
};

export const useDeleteList = (boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
};
