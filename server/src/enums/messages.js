export const ApiMessage = Object.freeze({
  NOT_FOUND: 'Not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  REQUEST_TIMEOUT: 'Request timeout',
  AUTHENTICATION_REQUIRED: 'Authentication required',
  INVALID_OR_EXPIRED_SESSION: 'Invalid or expired session',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  ACCOUNT_DISABLED: 'Account is disabled',
  INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
  INVALID_LOGIN_PAYLOAD: 'Invalid login payload',
  STUDENT_NOT_FOUND: 'Student not found',
  ROLL_NUMBER_EXISTS: 'Roll number already exists',
  EMAIL_ALREADY_IN_USE: 'Email already in use',
  VOUCHER_NOT_FOUND: 'Voucher not found',
  NO_COLLECTED_AMOUNT: 'No collected amount to credit',
  TOO_MANY_LOGIN_ATTEMPTS: 'Too many login attempts. Try again later.',
  TOO_MANY_REQUESTS: 'Too many requests. Please slow down.',
  UNKNOWN_CLASS: 'Unknown',
});

export const DbMessage = Object.freeze({
  DATABASE_ERROR: 'Database error',
  NOT_FOUND: 'Not found',
});

export const InfraMessage = Object.freeze({
  JWT_SECRET_INVALID:
    'JWT_SECRET missing or too short (min 32 chars). Add to server/.env',
  MISSING_SUPABASE_ENV:
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env',
  SUPABASE_URL_FORMAT_HINT:
    '[supabase] SUPABASE_URL should look like https://YOUR_REF.supabase.co — copy from Supabase Dashboard → Settings → General → Project URL',
  HOST_NOT_FOUND:
    'Host not found. Open Supabase → Settings → General and copy Project URL exactly into server/.env.',
  CONNECTION_BLOCKED:
    'Connection blocked or offline. Check internet, VPN, or firewall.',
  SUPABASE_GENERIC_HINT: 'Check SUPABASE_URL, internet connection, and VPN.',
});

export function dbOperationTimedOut(label) {
  return `${label} operation timed out`;
}

export function paymentExceedsBalance(balance) {
  return `Payment exceeds remaining balance (${balance.toFixed(2)})`;
}

export function supabaseRequestFailed(code, hint) {
  return `Supabase request failed (${code || 'network'}): ${hint}`;
}
