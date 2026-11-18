const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data.error === 'string'
        ? data.error
        : data.error?.message || 'Request failed';
    throw new Error(msg);
  }
  return data;
}

export const api = {
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