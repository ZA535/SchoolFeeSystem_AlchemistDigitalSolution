import '../src/config/loadEnv.js';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || 'School Admin';

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!email || !password || password.length < 8) {
  console.error(
    'Set ADMIN_EMAIL and ADMIN_PASSWORD (min 8 chars) in server/.env for seeding'
  );
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: existing } = await supabase
  .from('app_users')
  .select('id')
  .eq('email', email.toLowerCase())
  .maybeSingle();

if (existing) {
  console.log('Admin already exists for', email);
  process.exit(0);
}

const hash = await bcrypt.hash(password, 12);
const { data, error } = await supabase
  .from('app_users')
  .insert({
    email: email.toLowerCase(),
    password_hash: hash,
    full_name: name,
    role: 'admin',
  })
  .select('id, email, role')
  .single();

if (error) {
  console.error('Seed failed:', error.message);
  console.error('Did you run supabase/migrations/003_auth_audit_production.sql?');
  process.exit(1);
}

console.log('Created admin user:', data.email, `(${data.role})`);
