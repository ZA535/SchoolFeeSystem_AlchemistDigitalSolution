import rateLimit from 'express-rate-limit';
import { ApiMessage } from '../enums/messages.js';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: ApiMessage.TOO_MANY_LOGIN_ATTEMPTS },
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_PER_MIN) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: ApiMessage.TOO_MANY_REQUESTS },
});
