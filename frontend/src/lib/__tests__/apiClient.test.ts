import axios from 'axios';
import { api, getErrorMessage } from '../apiClient';

describe('api instance', () => {
  it('has JSON headers and a baseURL', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
    expect(typeof api.defaults.baseURL).toBe('string');
  });

  it('falls back to VITE_API_URL from process.env when set', () => {
    const prev = process.env.VITE_API_URL;
    process.env.VITE_API_URL = 'https://example.test/api';
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('../apiClient') as typeof import('../apiClient');
    expect(mod.api.defaults.baseURL).toBe('https://example.test/api');
    if (prev === undefined) delete process.env.VITE_API_URL;
    else process.env.VITE_API_URL = prev;
  });
});

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
