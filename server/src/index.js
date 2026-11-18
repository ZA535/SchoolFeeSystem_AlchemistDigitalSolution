import './loadEnv.js';
import cors from 'cors';
import express from 'express';
import studentsRouter from './routes/students.js';
import vouchersRouter from './routes/vouchers.js';
import dashboardRouter from './routes/dashboard.js';
import { verifySupabaseConnection } from './supabase.js';

const app = express();
const port = Number(process.env.PORT) || 4000;
const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/students', studentsRouter);
app.use('/api/vouchers', vouchersRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  const body = { error: err.message || 'Internal server error' };
  if (err.details && process.env.NODE_ENV !== 'production') {
    body.details = err.details;
  }
  res.status(500).json(body);
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  verifySupabaseConnection().catch((err) => {
    console.error('[supabase] Cannot reach your project:', err.message);
    console.error(
      'Fix server/.env SUPABASE_URL (Settings → General → Project URL) and restart.'
    );
  });
});