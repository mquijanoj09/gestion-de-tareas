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

describe('Additional coverage', () => {
  let boardId: string;
  let listId: string;
  let taskId: string;

  beforeAll(async () => {
    const board = await request(app).post('/api/boards').send({ name: 'Coverage Board' });
    boardId = board.body.id;
    const list = await request(app)
      .post(`/api/boards/${boardId}/lists`)
      .send({ name: 'Coverage List' });
    listId = list.body.id;
    const task = await request(app)
      .post(`/api/lists/${listId}/tasks`)
      .send({
        title: 'Coverage task',
        description: 'desc',
        dueDate: '2026-12-31T00:00:00.000Z',
        status: 'TODO',
      });
    taskId = task.body.id;
  });

  afterAll(async () => {
    await request(app).delete(`/api/boards/${boardId}`);
  });

  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/boards/:id returns board with lists', async () => {
    const res = await request(app).get(`/api/boards/${boardId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(boardId);
  });

  it('GET /api/boards/:boardId/lists returns lists', async () => {
    const res = await request(app).get(`/api/boards/${boardId}/lists`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/boards/:boardId/lists 404 for unknown board', async () => {
    const res = await request(app).get('/api/boards/00000000-0000-0000-0000-000000000000/lists');
    expect(res.status).toBe(404);
  });

  it('POST /api/boards/:boardId/lists 404 for unknown board', async () => {
    const res = await request(app)
      .post('/api/boards/00000000-0000-0000-0000-000000000000/lists')
      .send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('PUT /api/boards/:id updates name', async () => {
    const res = await request(app).put(`/api/boards/${boardId}`).send({ name: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed');
  });

  it('PUT /api/lists/:id updates list', async () => {
    const res = await request(app)
      .put(`/api/lists/${listId}`)
      .send({ name: 'Renamed List', position: 1 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed List');
  });

  it('GET /api/lists/:listId/tasks returns tasks', async () => {
    const res = await request(app).get(`/api/lists/${listId}/tasks`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/lists/:listId/tasks 404 for unknown list', async () => {
    const res = await request(app).get('/api/lists/00000000-0000-0000-0000-000000000000/tasks');
    expect(res.status).toBe(404);
  });

  it('POST /api/lists/:listId/tasks 404 for unknown list', async () => {
    const res = await request(app)
      .post('/api/lists/00000000-0000-0000-0000-000000000000/tasks')
      .send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  it('PUT /api/tasks/:id updates many fields', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({
        title: 'Updated',
        description: 'new desc',
        status: 'DOING',
        dueDate: '2027-01-01T00:00:00.000Z',
        position: 2,
      });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
  });

  it('PUT /api/tasks/:id clears dueDate when null', async () => {
    const res = await request(app).put(`/api/tasks/${taskId}`).send({ dueDate: null });
    expect(res.status).toBe(200);
    expect(res.body.dueDate).toBeNull();
  });

  it('PUT /api/tasks/:id returns 404 for unknown task (Prisma P2025)', async () => {
    const res = await request(app)
      .put('/api/tasks/00000000-0000-0000-0000-000000000000')
      .send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/lists/:id removes list', async () => {
    const tmpList = await request(app)
      .post(`/api/boards/${boardId}/lists`)
      .send({ name: 'Tmp' });
    const res = await request(app).delete(`/api/lists/${tmpList.body.id}`);
    expect(res.status).toBe(204);
  });

  it('unknown route returns 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('validation error returns 400 with details', async () => {
    const res = await request(app).post(`/api/lists/${listId}/tasks`).send({ title: 123 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeDefined();
  });
});
