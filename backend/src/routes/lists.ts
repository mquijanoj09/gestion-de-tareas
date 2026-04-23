import { Router } from 'express';
import { createListSchema, updateListSchema } from 'shared';
import { prisma } from '../db';
import { notFound } from '../errors';

export const listsRouter = Router();

listsRouter.get('/boards/:boardId/lists', async (req, res) => {
  const board = await prisma.board.findUnique({ where: { id: req.params.boardId } });
  if (!board) throw notFound('board');
  const lists = await prisma.list.findMany({
    where: { boardId: board.id },
    orderBy: { position: 'asc' },
    include: { tasks: { orderBy: { position: 'asc' } } },
  });
  res.json(lists);
});

listsRouter.post('/boards/:boardId/lists', async (req, res) => {
  const data = createListSchema.parse(req.body);
  const board = await prisma.board.findUnique({ where: { id: req.params.boardId } });
  if (!board) throw notFound('board');
  const count = await prisma.list.count({ where: { boardId: board.id } });
  const list = await prisma.list.create({
    data: { name: data.name, position: count, boardId: board.id },
  });
  res.status(201).json(list);
});

listsRouter.put('/lists/:id', async (req, res) => {
  const data = updateListSchema.parse(req.body);
  const list = await prisma.list.update({ where: { id: req.params.id }, data });
  res.json(list);
});

listsRouter.delete('/lists/:id', async (req, res) => {
  await prisma.list.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
