# School Fee Management System

Staff portal: students, monthly vouchers, fee collection, receipts/challans, reports.

**Stack:** React (Vite) + Express + Supabase

---

## Setup

**Requirements:** Node.js 18+, Supabase project

From the project folder:

```bash
npm run install:all
```

**Supabase SQL Editor** — run in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/003_auth_audit_production.sql`
3. `supabase/migrations/004_task1_fees_rls.sql`

**`server/.env`** (copy from `server/.env.example`):

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
JWT_SECRET=at-least-32-random-characters
ADMIN_EMAIL=admin@school.edu
ADMIN_PASSWORD=your-password
ADMIN_FULL_NAME=School Admin
```

Optional **`client/.env`:** `VITE_SCHOOL_NAME=Your School Name`

```bash
cd server && npm run seed:admin && cd ..
npm run dev:server    # http://localhost:4000
npm run dev:client    # http://localhost:5173
```

Sign in at `/login` with the admin email and password from `server/.env`.

---

## Day-to-day use

1. Add **Students**
2. **Dashboard** → generate monthly vouchers
3. **Collect fee** → record payment → print receipt
4. **Vouchers** → challan print · **Reports** → collections & defaulters

**Roles:** Admin (full) · Accountant / Cashier (students, vouchers, payments)

Database keys stay in `server/.env` only — not in the client.