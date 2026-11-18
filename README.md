# School Fee Management System (MVP)

A full-stack app for managing students, generating monthly fee vouchers, recording payments (including partial installments), and viewing financial summaries. Built with **React (Vite)**, **Express**, and **PostgreSQL via Supabase**.

## Features

| Area | Capability |
|------|------------|
| **Students** | Add, edit, search, and filter by class/section (name, roll, class, monthly fee, guardian contact) |
| **Vouchers** | One-click monthly generation per student; statuses `pending`, `paid`, `overdue` |
| **Payments** | Cash / bank transfer / EasyPaisa–JazzCash; auto receipt numbers; partial payments with balance shown |
| **Dashboard** | Total expected, collected, pending, and overdue defaulter count for the selected month |
| **Filters** | Fee list by class/section, payment status, and unpaid-only |
| **Receipt** | Printable fee receipt per payment (bonus) |

## Project structure

```
school-fee-management-system/
├── client/                 # React + Vite UI
├── server/                 # Express REST API (uses Supabase service role)
├── supabase/migrations/    # SQL schema
├── .env.example
└── README.md
```

## Database schema

### `students`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID | Primary key |
| `full_name` | text | |
| `roll_number` | text | Unique |
| `class_section` | text | e.g. `8-A` |
| `monthly_fee` | numeric | Fee template for new vouchers |
| `guardian_contact` | text | Phone or other contact |
| `created_at`, `updated_at` | timestamptz | |

### `fee_vouchers`

One row per student per calendar month.

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID | Primary key |
| `student_id` | UUID | FK → `students` |
| `billing_year`, `billing_month` | int | Unique with `student_id` |
| `amount_due` | numeric | Usually copied from `monthly_fee` at generation |
| `amount_paid` | numeric | Sum of payments (partial allowed) |
| `status` | enum | `pending`, `paid`, `overdue` (maintained by trigger) |
| `due_date` | date | Default 10th of billing month |
| `receipt_number` | text | Set when fully paid (last clearing receipt) |

### `payments`

| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID | Primary key |
| `voucher_id` | UUID | FK → `fee_vouchers` |
| `amount` | numeric | Single installment |
| `payment_date` | date | |
| `payment_method` | enum | `cash`, `bank_transfer`, `easypaisa_jazzcash` |
| `receipt_number` | text | Unique per payment (`RCP-YYYYMMDD-####`) |

### Status rules

- **Paid**: `amount_paid >= amount_due`
- **Overdue**: not fully paid and `due_date < today`
- **Pending**: otherwise  

Function `sync_voucher_statuses()` re-runs triggers so overdue dates are reflected without manual edits.

## Setup

### 1. Supabase (cloud database — not your local PostgreSQL)

This app does **not** connect to PostgreSQL you installed on your Mac unless you manually point Supabase at it. You use **Supabase’s hosted Postgres** in the cloud.

**A. Create a project**

1. Go to [https://supabase.com](https://supabase.com) and sign in (GitHub is fine).
2. Click **New project**.
3. Pick an **Organization** (create one if asked).
4. Set **Project name** (e.g. `school-fees`), a strong **Database password** (save it somewhere safe), and a **Region** close to you.
5. Click **Create new project** and wait 1–2 minutes until the dashboard loads.

**B. Run the migration in SQL Editor**

1. In the left sidebar, open **SQL Editor**.
2. Click **New query** (top right).
3. On your computer, open this file in Cursor/VS Code:  
   `supabase/migrations/001_initial_schema.sql`
4. Select all (`Cmd+A`), copy (`Cmd+C`).
5. Paste into the Supabase SQL Editor.
6. Click **Run** (or `Cmd+Enter`).
7. You should see **Success** at the bottom. If you see an error, copy the message and fix before continuing.

**C. Confirm tables exist**

1. Open **Table Editor** in the sidebar.
2. You should see `students`, `fee_vouchers`, and `payments`.

**D. Copy API keys**

1. Go to **Project Settings** (gear icon) → **API**.
2. Copy **Project URL** → paste into `server/.env` as `SUPABASE_URL`.
3. Copy **service_role** under **Project API keys** (click Reveal) → paste into `server/.env` as `SUPABASE_SERVICE_ROLE_KEY`.  
   Never commit this key or put it in the React app.
4. (Optional) Copy **anon** `public` key → `client/.env` as `VITE_SUPABASE_ANON_KEY` (not required for the MVP API flow).

### 2. Environment variables

Pre-created files (fill in the blank values):

| File | Purpose |
|------|---------|
| `server/.env` | **Required** — `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` |
| `client/.env` | Optional — mainly `VITE_SCHOOL_NAME` for receipts |

Example after filling `server/.env`:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
```

The server loads `server/.env` automatically (and falls back to a root `.env` if you use one).

### 3. Install and run

```bash
npm run install:all
```

In two terminals:

```bash
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173 (proxies /api → server)
```

Or from the repo root (runs both):

```bash
npm run dev
```

### 4. Quick start workflow

1. **Students** — add a few students with monthly fees.
2. **Dashboard** — click **Generate monthly vouchers** for the current month.
3. **Fee Vouchers** — record full or partial payments; open **Receipt** or print from the receipt page.

## API overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/students` | List (`?class_section`, `?q`) |
| POST | `/api/students` | Create |
| PUT | `/api/students/:id` | Update |
| GET | `/api/vouchers` | List (`?year`, `?month`, `?status`, `?unpaid=true`) |
| POST | `/api/vouchers/generate` | Body optional `{ year, month }` |
| POST | `/api/vouchers/:id/payments` | Record payment |
| GET | `/api/vouchers/:id` | Voucher + student + payments (for receipt) |
| GET | `/api/dashboard/summary` | Metrics for `?year` & `?month` |

## Tech stack

- **Frontend**: React 19, React Router, Vite 6
- **Backend**: Node.js, Express 4, Zod validation
- **Database**: PostgreSQL on Supabase (`@supabase/supabase-js`)

## Security notes (MVP)

This MVP uses the Supabase **service role** on the API server only. There is no end-user auth yet; do not deploy publicly without adding authentication and Row Level Security policies.

## License

MIT (or as required by your institution).