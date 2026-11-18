const BASE = '/api';
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 60000;
const MAX_RETRIES = 1;

let authToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  authToken = token;
}

export function setOnUnauthorized(handler) {
  onUnauthorized = handler;
}

async function fetchWithTimeout(url, options, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function request(path, options = {}, attempt = 0) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const method = (options.method || 'GET').toUpperCase();
  const res = await fetchWithTimeout(`${BASE}${path}`, { ...options, headers });

  const requestId = res.headers.get('X-Request-Id');
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && authToken && onUnauthorized) {
    onUnauthorized();
  }

  if (!res.ok) {
    if (res.status >= 500 && method === 'GET' && attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      return request(path, options, attempt + 1);
    }
    const base =
      typeof data.error === 'string'
        ? data.error
        : data.error?.message || 'Request failed';
    const suffix = requestId ? ` (ref: ${requestId.slice(0, 8)})` : '';
    throw new Error(base + suffix);
  }

  return data;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request('/auth/me'),
  getUsers: () => request('/users'),
  createUser: (body) =>
    request('/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: (id, body) =>
    request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  getDefaulters: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/defaulters?${q}`);
  },
  getDailyCollection: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/reports/daily-collection?${q}`);
  },
  getAuditLog: () => request('/reports/audit?limit=80'),
  getDashboard: (params) => {
    const q = new URLSearchParams(params).toString();
    return request(`/dashboard/summary?${q}`);
  },
  getStudents: (params = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v != null && v !== '')
      )
    ).toString();
    return request(`/students?${q}`);
  },
  getStudent: (id) => request(`/students/${id}`),
  createStudent: (body) =>
    request('/students', { method: 'POST', body: JSON.stringify(body) }),
  updateStudent: (id, body) =>
    request(`/students/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deactivateStudent: (id) => request(`/students/${id}/deactivate`, { method: 'PATCH' }),
  getVouchers: (params = {}) => {
    const q = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v != null && v !== '')
      )
    ).toString();
    return request(`/vouchers?${q}`);
  },
  getVoucher: (id) => request(`/vouchers/${id}`),
  generateVouchers: (body) =>
    request('/vouchers/generate', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    }),
  recordPayment: (voucherId, body) =>
    request(`/vouchers/${voucherId}/payments`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getVoucherPayments: (voucherId) => request(`/vouchers/${voucherId}/payments`),
};

export function formatMoney(amount) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function monthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}
