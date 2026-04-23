import axios from 'axios';

function readBaseUrl(): string {
  try {
    // Vite injects import.meta.env; guarded so Jest (CommonJS) won't crash.
    const env = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env;
    if (env?.VITE_API_URL) return env.VITE_API_URL;
  } catch {
    // ignore
  }
  const proc = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } })
    .process;
  return proc?.env?.VITE_API_URL ?? '/api';
}

export const api = axios.create({
  baseURL: readBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    return err.response?.data?.error?.message ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Unknown error';
}
