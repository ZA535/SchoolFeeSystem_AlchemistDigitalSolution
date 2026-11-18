import autocannon from 'autocannon';

const base = process.env.LOAD_TEST_BASE || 'http://localhost:4000';
const token = process.env.LOAD_TEST_TOKEN || '';
const connections = Number(process.env.LOAD_CONNECTIONS) || 20;
const duration = Number(process.env.LOAD_DURATION) || 15;

const headers = token ? { authorization: `Bearer ${token}` } : {};

const scenarios = [
  { title: 'GET /health', url: `${base}/health` },
];

if (token) {
  scenarios.push(
    { title: 'GET /api/dashboard/summary', url: `${base}/api/dashboard/summary` },
    { title: 'GET /api/vouchers', url: `${base}/api/vouchers?unpaid=true` },
    { title: 'GET /api/students', url: `${base}/api/students` }
  );
} else {
  console.warn(
    'LOAD_TEST_TOKEN not set — only /health will be load-tested. Set token for /api routes.\n'
  );
}

async function runOne({ title, url }) {
  console.log(`\n--- ${title} ---`);
  const result = await autocannon({
    url,
    connections,
    duration,
    headers,
  });
  console.log(
    autocannon.printResult(result, {
      outputStream: process.stdout,
    })
  );
}

for (const scenario of scenarios) {
  await runOne(scenario);
}