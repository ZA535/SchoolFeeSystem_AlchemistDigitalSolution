import { AppError } from './app-error.js';
import { DbMessage } from '../enums/messages.js';

export function assertSupabaseOk(error, fallback = DbMessage.DATABASE_ERROR) {
  if (!error) return;
  const err = new AppError(error.message || fallback, 500, error);
  throw err;
}

export function assertSupabaseRow(data, message = DbMessage.NOT_FOUND, status = 404) {
  if (!data) throw new AppError(message, status);
  return data;
}
