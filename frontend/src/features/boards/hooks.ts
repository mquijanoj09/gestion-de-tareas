import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { boardsApi } from './api';
import type { CreateBoardInput, UpdateBoardInput } from 'shared';

export const useBoards = () => useQuery({ queryKey: ['boards'], queryFn: boardsApi.list });

export const useBoard = (id: string) =>
  useQuery({ queryKey: ['board', id], queryFn: () => boardsApi.get(id), enabled: !!id });

export const useCreateBoard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBoardInput) => boardsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  });
};

export const useUpdateBoard = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateBoardInput) => boardsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boards'] });
      qc.invalidateQueries({ queryKey: ['board', id] });
    },
  });
};

export const useDeleteBoard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => boardsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  });
};
