import { Router } from 'express';
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema } from 'shared';
import { prisma } from '../db';
import { notFound } from '../errors';

export const tasksRouter = Router();

tasksRouter.get('/lists/:listId/tasks', async (req, res) => {
  const list = await prisma.list.findUnique({ where: { id: req.params.listId } });
  if (!list) throw notFound('list');
  const tasks = await prisma.task.findMany({
    where: { listId: list.id },
    orderBy: { position: 'asc' },
  });
  res.json(tasks);
});

tasksRouter.post('/lists/:listId/tasks', async (req, res) => {
  const data = createTaskSchema.parse(req.body);
  const list = await prisma.list.findUnique({ where: { id: req.params.listId } });
  if (!list) throw notFound('list');
  const count = await prisma.task.count({ where: { listId: list.id } });
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: data.status ?? 'TODO',
      position: count,
      listId: list.id,
    },
  });
  res.status(201).json(task);
});

tasksRouter.put('/tasks/:id', async (req, res) => {
  const data = updateTaskSchema.parse(req.body);
  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.dueDate !== undefined && {
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      }),
      ...(data.listId !== undefined && { listId: data.listId }),
      ...(data.position !== undefined && { position: data.position }),
    },
  });
  res.json(task);
});

tasksRouter.patch('/tasks/:id/status', async (req, res) => {
  const { status } = updateTaskStatusSchema.parse(req.body);
  const task = await prisma.task.update({ where: { id: req.params.id }, data: { status } });
  res.json(task);
});

tasksRouter.delete('/tasks/:id', async (req, res) => {
  await prisma.task.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
