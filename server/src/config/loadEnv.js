import dns from 'node:dns';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Fixes many "fetch failed" errors on macOS when IPv6 is broken but IPv4 works.
dns.setDefaultResultOrder('ipv4first');

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

dotenv.config({ path: path.join(serverRoot, '.env') });
dotenv.config({ path: path.join(serverRoot, '..', '.env') });

function trimEnv(name) {
  const value = process.env[name];
  if (typeof value === 'string') {
    process.env[name] = value.trim().replace(/^['"]|['"]$/g, '');
  }
}

[
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEY',
  'JWT_SECRET',
].forEach(trimEnv);
