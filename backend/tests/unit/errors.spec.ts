import { AppError, notFound } from '../../src/errors';

describe('errors', () => {
  it('AppError carries status, code, message, details', () => {
    const err = new AppError(409, 'CONFLICT', 'dup', { field: 'name' });
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(409);
    expect(err.code).toBe('CONFLICT');
    expect(err.message).toBe('dup');
    expect(err.details).toEqual({ field: 'name' });
  });

  it('notFound builds a 404 AppError with code derived from entity', () => {
    const err = notFound('board');
    expect(err.status).toBe(404);
    expect(err.code).toBe('BOARD_NOT_FOUND');
    expect(err.message).toBe('board not found');
  });
});
