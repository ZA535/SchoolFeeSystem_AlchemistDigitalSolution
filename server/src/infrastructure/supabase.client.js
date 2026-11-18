import '../config/loadEnv.js';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { InfraMessage, supabaseRequestFailed } from '../enums/messages.js';

let url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  throw new Error(InfraMessage.MISSING_SUPABASE_ENV);
}

url = url.replace(/\/+$/, '');

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
  console.warn(InfraMessage.SUPABASE_URL_FORMAT_HINT);
}

async function supabaseFetch(input, init) {
  try {
    return await fetch(input, init);
  } catch (err) {
    const code = err.cause?.code || err.code;
    const hint =
      code === 'ENOTFOUND'
        ? InfraMessage.HOST_NOT_FOUND
        : code === 'ECONNREFUSED' || code === 'ETIMEDOUT'
          ? InfraMessage.CONNECTION_BLOCKED
          : InfraMessage.SUPABASE_GENERIC_HINT;
    const wrapped = new Error(supabaseRequestFailed(code, hint));
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
