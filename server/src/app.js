import './config/loadEnv.js';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import authRoutes from './modules/auth/auth.routes.js';
import studentsRoutes from './modules/students/students.routes.js';
import vouchersRoutes from './modules/vouchers/vouchers.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import { requireAuth } from './middleware/auth.middleware.js';
import { loginRateLimiter, apiRateLimiter } from './middleware/security.middleware.js';
import {
  requestIdMiddleware,
  requestTimeoutMiddleware,
} from './middleware/request.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

export function createApp() {
  const app = express();
  const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const isProd = process.env.NODE_ENV === 'production';

  app.use(helmet());
  app.use(requestIdMiddleware);
  app.use(requestTimeoutMiddleware);
  app.use(
    cors({
      origin,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    })
  );
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) =>
    res.json({ ok: true, timestamp: new Date().toISOString() })
  );

  app.use('/api/auth/login', loginRateLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api', apiRateLimiter);
  app.use('/api', requireAuth);

  app.use('/api/students', studentsRoutes);
  app.use('/api/vouchers', vouchersRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/reports', reportsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  if (isProd && !process.env.JWT_SECRET) {
    console.error('[security] JWT_SECRET is required in production');
  }

  return app;
}
