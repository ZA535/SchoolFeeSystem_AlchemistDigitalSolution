# Load tests

## Prerequisites

- API running: `npm run dev:server`
- For authenticated endpoints: JWT from login

```bash
# Get token (replace credentials)
curl -s -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@school.local","password":"YOUR_PASSWORD"}' \
  | jq -r .token
export LOAD_TEST_TOKEN="eyJ..."
```

## autocannon (Node)

From repo root:

```bash
# Public health only
npm run load:health

# Health + dashboard + vouchers (needs LOAD_TEST_TOKEN)
npm run load:api
```

Env:

| Variable | Default |
|----------|---------|
| `LOAD_TEST_BASE` | `http://localhost:4000` |
| `LOAD_TEST_TOKEN` | (required for `/api/*`) |
| `LOAD_CONNECTIONS` | `20` |
| `LOAD_DURATION` | `15` |

## k6

Install: [https://k6.io/docs/get-started/installation/](https://k6.io/docs/get-started/installation/)

```bash
LOAD_TEST_TOKEN=eyJ... npm run load:k6
```

Optional:

```bash
K6_VUS=25 K6_DURATION=1m API_BASE=http://localhost:4000 LOAD_TEST_TOKEN=... k6 run load-tests/k6-smoke.js
```

## Interpreting results

- **High latency p95** on vouchers: normal with Supabase round-trips; scale DB plan or add caching later.
- **429 errors**: rate limit (`API_RATE_LIMIT_PER_MIN`); lower VUS or raise limit only in controlled tests.
- **504 errors**: `REQUEST_TIMEOUT_MS` / `DB_TIMEOUT_MS` — investigate slow network or Supabase.