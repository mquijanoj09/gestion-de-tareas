import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/db';

/**
 * Requires a real Postgres reachable via DATABASE_URL and `prisma migrate deploy` run.
 * The included docker-compose stack provides this; for local runs use docker-compose.test.yml.
 */

const app = createApp();

beforeAll(async () => {
  await prisma.task.deleteMany();
  await prisma.list.deleteMany();
  await prisma.board.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Boards API', () => {
  let boardId: string;
  let listId: string;
  let taskId: string;

  it('POST /api/boards creates a board', async () => {
    const res = await request(app).post('/api/boards').send({ name: 'My Board' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'My Board' });
    boardId = res.body.id;
  });

  it('POST /api/boards rejects empty body', async () => {
    const res = await request(app).post('/api/boards').send({ name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/boards lists boards', async () => {
    const res = await request(app).get('/api/boards');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/boards/:id returns 404 for unknown', async () => {
    const res = await request(app).get('/api/boards/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  it('POST /api/boards/:boardId/lists creates a list', async () => {
    const res = await request(app).post(`/api/boards/${boardId}/lists`).send({ name: 'To Do' });
    expect(res.status).toBe(201);
    expect(res.body.position).toBe(0);
    listId = res.body.id;
  });

  it('POST /api/lists/:listId/tasks creates a task', async () => {
    const res = await request(app)
      .post(`/api/lists/${listId}/tasks`)
      .send({ title: 'First task' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('TODO');
    taskId = res.body.id;
  });

  it('PATCH /api/tasks/:id/status changes the status', async () => {
    const res = await request(app).patch(`/api/tasks/${taskId}/status`).send({ status: 'DOING' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('DOING');
  });

  it('DELETE /api/tasks/:id removes the task', async () => {
    const res = await request(app).delete(`/api/tasks/${taskId}`);
    expect(res.status).toBe(204);
  });

  it('DELETE /api/boards/:id cascades', async () => {
    const res = await request(app).delete(`/api/boards/${boardId}`);
    expect(res.status).toBe(204);
  });
});
