import '../src/loadEnv.js';

const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

console.log('SUPABASE_URL:', url || '(missing)');
console.log('Key set:', key ? `yes (${key.slice(0, 12)}…)` : 'no');

if (!url || !key) {
  console.error('\nFill server/.env then run again.');
  process.exit(1);
}

try {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  console.log('\nHTTP status:', res.status, res.statusText);
  if (res.status === 401) {
    console.log('Reachable, but key rejected — use Secret key or legacy service_role (eyJ…) in server/.env');
  } else if (res.ok || res.status === 404) {
    console.log('Supabase REST API is reachable.');
  }
} catch (err) {
  console.error('\nFailed:', err.cause?.code || err.message);
  console.error(
    '\nTips:\n' +
      '• Copy Project URL from Supabase → Settings → General\n' +
      '• Turn VPN off or try another network\n' +
      '• On Mac, restart terminal after fixing .env'
  );
  process.exit(1);
}