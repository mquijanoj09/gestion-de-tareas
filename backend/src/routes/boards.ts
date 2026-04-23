import { Router } from 'express';
import { createBoardSchema, updateBoardSchema } from 'shared';
import { prisma } from '../db';
import { notFound } from '../errors';

export const boardsRouter = Router();

boardsRouter.get('/boards', async (_req, res) => {
  const boards = await prisma.board.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(boards);
});

boardsRouter.post('/boards', async (req, res) => {
  const data = createBoardSchema.parse(req.body);
  const board = await prisma.board.create({ data });
  res.status(201).json(board);
});

boardsRouter.get('/boards/:id', async (req, res) => {
  const board = await prisma.board.findUnique({
    where: { id: req.params.id },
    include: {
      lists: {
        orderBy: { position: 'asc' },
        include: { tasks: { orderBy: { position: 'asc' } } },
      },
    },
  });
  if (!board) throw notFound('board');
  res.json(board);
});

boardsRouter.put('/boards/:id', async (req, res) => {
  const data = updateBoardSchema.parse(req.body);
  const board = await prisma.board.update({ where: { id: req.params.id }, data });
  res.json(board);
});

boardsRouter.delete('/boards/:id', async (req, res) => {
  await prisma.board.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
