import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from './api';
import type { CreateTaskInput, UpdateTaskInput } from 'shared';
import type { TaskStatus } from '../../types';

export const useCreateTask = (boardId: string, listId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskInput) => tasksApi.create(listId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
};

export const useUpdateTask = (boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) => tasksApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
};

export const useUpdateTaskStatus = (boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
};

export const useDeleteTask = (boardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board', boardId] }),
  });
};
