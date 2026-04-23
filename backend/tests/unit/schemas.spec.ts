import {
  createBoardSchema,
  createTaskSchema,
  updateTaskStatusSchema,
  taskStatusSchema,
} from 'shared';

describe('shared schemas', () => {
  it('accepts a valid board payload', () => {
    expect(createBoardSchema.parse({ name: 'Sprint 1' })).toEqual({ name: 'Sprint 1' });
  });

  it('rejects an empty board name', () => {
    expect(() => createBoardSchema.parse({ name: '' })).toThrow();
  });

  it('accepts a task with optional fields omitted', () => {
    expect(createTaskSchema.parse({ title: 'Do thing' })).toMatchObject({ title: 'Do thing' });
  });

  it('accepts all task statuses', () => {
    for (const s of ['TODO', 'DOING', 'DONE']) {
      expect(taskStatusSchema.parse(s)).toBe(s);
    }
  });

  it('rejects an unknown task status', () => {
    expect(() => updateTaskStatusSchema.parse({ status: 'LATER' })).toThrow();
  });
});
