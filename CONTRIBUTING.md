# Contributing

## Setup

```bash
git clone https://github.com/ZA535/SchoolFeeSystem_AlchemistDigitalSolution.git
cd SchoolFeeSystem_AlchemistDigitalSolution
npm run install:all
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Run Supabase migrations `001`, `003`, then `npm run seed:admin` in `server/`.

## Code style

- Format with **Prettier** before opening a PR: `npm run format`
- Check formatting in CI: `npm run format:check`
- Lint: `npm run lint` (ESLint for `client/` and `server/`)
- Load smoke (optional): `npm run load:health` or `LOAD_TEST_TOKEN=... npm run load:api` — see `load-tests/README.md`
- **Client:** React components in `client/src` as `.js` files (JSX enabled via Vite).
- **Server:** keep HTTP thin in `*.routes.js`; shared logic in `shared/`; DB in `infrastructure/`.

## Backend layout

```
server/src/
  config/           # environment
  infrastructure/   # Supabase client, timeouts
  middleware/       # auth, security, errors, request tracing
  modules/          # feature routers (auth, students, vouchers, …)
  shared/           # audit, receipts, domain helpers
  app.js            # Express wiring
  server.js         # process entry
```

## Pull requests

1. Branch from `main`.
2. Run `npm run format:check` and `npm run build --prefix client`.
3. Describe behavior changes and any new env vars.
4. Never commit `.env` files or secrets.

CI runs on every push/PR to `main` and `develop`.
