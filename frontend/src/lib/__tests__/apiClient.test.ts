import axios from 'axios';
import { getErrorMessage } from '../apiClient';

describe('getErrorMessage', () => {
  it('returns the API error message when provided', () => {
    const err = new axios.AxiosError(
      'HTTP 400',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: { headers: {} as never },
        data: { error: { code: 'VALIDATION_ERROR', message: 'name is required' } },
      } as never,
    );
    expect(getErrorMessage(err)).toBe('name is required');
  });

  it('falls back to Error.message for plain errors', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns a generic string for unknown values', () => {
    expect(getErrorMessage('weird')).toBe('Unknown error');
  });
});
