import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.API_BASE || 'http://localhost:4000';
const TOKEN = __ENV.LOAD_TEST_TOKEN || '';
const VUS = Number(__ENV.K6_VUS) || 10;
const DURATION = __ENV.K6_DURATION || '30s';

export const options = {
  vus: VUS,
  duration: DURATION,
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000'],
  },
};

function authHeaders() {
  if (!TOKEN) return {};
  return { Authorization: `Bearer ${TOKEN}` };
}

export default function () {
  const health = http.get(`${BASE}/health`);
  check(health, { 'health 200': (r) => r.status === 200 });

  if (TOKEN) {
    const dashboard = http.get(`${BASE}/api/dashboard/summary`, {
      headers: authHeaders(),
    });
    check(dashboard, { 'dashboard 200': (r) => r.status === 200 });

    const vouchers = http.get(`${BASE}/api/vouchers?unpaid=true`, {
      headers: authHeaders(),
    });
    check(vouchers, { 'vouchers 200': (r) => r.status === 200 });
  }

  sleep(0.3);
}
