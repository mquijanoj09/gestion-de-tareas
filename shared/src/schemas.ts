import { z } from 'zod';

export const taskStatusSchema = z.enum(['TODO', 'DOING', 'DONE']);

export const createBoardSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().nullable(),
});

export const updateBoardSchema = createBoardSchema.partial();

export const createListSchema = z.object({
  name: z.string().min(1).max(120),
});

export const updateListSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  position: z.number().int().min(0).optional(),
});

const isoDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/))
  .optional()
  .nullable();

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  dueDate: isoDate,
  status: taskStatusSchema.optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  status: taskStatusSchema.optional(),
  dueDate: isoDate,
  listId: z.string().uuid().optional(),
  position: z.number().int().min(0).optional(),
});

export const updateTaskStatusSchema = z.object({
  status: taskStatusSchema,
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type CreateListInput = z.infer<typeof createListSchema>;
export type UpdateListInput = z.infer<typeof updateListSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
