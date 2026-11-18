import '../config/loadEnv.js';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

let url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env');
}

url = url.replace(/\/+$/, '');

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
  console.warn(
    '[supabase] SUPABASE_URL should look like https://YOUR_REF.supabase.co — copy from Supabase Dashboard → Settings → General → Project URL'
  );
}

async function supabaseFetch(input, init) {
  try {
    return await fetch(input, init);
  } catch (err) {
    const code = err.cause?.code || err.code;
    const hint =
      code === 'ENOTFOUND'
        ? 'Host not found. Open Supabase → Settings → General and copy Project URL exactly into server/.env.'
        : code === 'ECONNREFUSED' || code === 'ETIMEDOUT'
          ? 'Connection blocked or offline. Check internet, VPN, or firewall.'
          : 'Check SUPABASE_URL, internet connection, and VPN.';
    const wrapped = new Error(
      `Supabase request failed (${code || 'network'}): ${hint}`
    );
    wrapped.cause = err;
    throw wrapped;
  }
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: { fetch: supabaseFetch },
  realtime: { transport: ws },
});

export async function verifySupabaseConnection() {
  const res = await supabaseFetch(`${url}/rest/v1/`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!res.ok && res.status !== 401) {
    console.warn(`[supabase] REST ping returned HTTP ${res.status}`);
  }
  return true;
}
