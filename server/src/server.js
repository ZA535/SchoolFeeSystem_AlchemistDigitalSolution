import { createApp } from './app.js';
import { verifySupabaseConnection } from './infrastructure/supabase.client.js';

const port = Number(process.env.PORT) || 4000;
const app = createApp();

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error(
      '[auth] Set JWT_SECRET (min 32 characters) in server/.env and run: npm run seed:admin'
    );
  }
  verifySupabaseConnection().catch((err) => {
    console.error('[supabase] Cannot reach your project:', err.message);
  });
});
