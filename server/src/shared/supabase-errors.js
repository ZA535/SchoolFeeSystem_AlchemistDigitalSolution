import { AppError } from './app-error.js';

export function assertSupabaseOk(error, fallback = 'Database error') {
  if (!error) return;
  const err = new AppError(error.message || fallback, 500, error);
  throw err;
}

export function assertSupabaseRow(data, message = 'Not found', status = 404) {
  if (!data) throw new AppError(message, status);
  return data;
}
