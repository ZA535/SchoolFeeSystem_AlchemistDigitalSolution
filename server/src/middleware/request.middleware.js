import crypto from 'node:crypto';
import { AppError } from '../shared/app-error.js';
import { ApiMessage } from '../enums/messages.js';

const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 30000;

export function requestIdMiddleware(req, res, next) {
  const incoming = req.headers['x-request-id'];
  const id =
    typeof incoming === 'string' && incoming.length < 64
      ? incoming
      : crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}

export function requestTimeoutMiddleware(req, res, next) {
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      next(new AppError(ApiMessage.REQUEST_TIMEOUT, 504));
    }
  }, REQUEST_TIMEOUT_MS);

  res.on('finish', () => clearTimeout(timer));
  res.on('close', () => clearTimeout(timer));
  next();
}
