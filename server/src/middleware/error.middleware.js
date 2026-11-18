import { z } from 'zod';
import { AppError } from '../shared/app-error.js';
import { ApiMessage } from '../enums/messages.js';

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: ApiMessage.NOT_FOUND });
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: err.flatten(), requestId: req.requestId });
  }
  const status = err instanceof AppError ? err.status : err.status || 500;
  if (status >= 500) {
    console.error(err);
  }
  const body = {
    error: err.message || ApiMessage.INTERNAL_SERVER_ERROR,
    requestId: req.requestId,
  };
  if (process.env.NODE_ENV !== 'production' && err.details) {
    body.details = err.details;
  }
  res.status(status).json(body);
}
