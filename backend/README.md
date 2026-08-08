# KENSHIN HAKO — Backend (Milestone 1)

Auth + role-based access control + employee management.

## Stack

Node.js, TypeScript, Express, PostgreSQL via Prisma, JWT auth, bcrypt password hashing.

## Setup

1. Provision a PostgreSQL database (e.g. free tier on [Supabase](https://supabase.com) or [Neon](https://neon.tech)).
2. Copy the environment template and fill in real values:
   ```bash
   cp .env.example .env
   ```
   At minimum, set `DATABASE_URL` to your database's connection string and generate a `JWT_SECRET`:
   ```bash
   openssl rand -hex 32
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the initial migration (creates all Milestone 1 tables):
   ```bash
   npm run prisma:migrate -- --name init
   ```
5. Seed roles, permissions, a default branch, and an initial Owner account:
   ```bash
   npm run prisma:seed
   ```
   This prints the seeded Owner email/password to the console — **change that password immediately** after your first login (password-change endpoint is planned for a later milestone; for now, update it directly via `prisma studio` or a follow-up migration).
6. Start the dev server:
   ```bash
   npm run dev
   ```
   API listens on `http://localhost:4000` by default.

## Tests

```bash
npm test
```

Covers password hashing, JWT round-tripping, and RBAC middleware enforcement (allow/deny/unauthenticated cases).

## API surface (Milestone 1)

| Method | Path | Auth | Permission |
|---|---|---|---|
| POST | `/api/auth/login` | — | — |
| GET | `/api/auth/me` | required | — |
| GET | `/api/employees` | required | `employee.manage` |
| POST | `/api/employees` | required | `employee.manage` |
| PATCH | `/api/employees/:id/deactivate` | required | `employee.manage` |
| GET | `/api/roles` | required | `employee.manage` |
| GET | `/api/branches` | required | `employee.manage` |

Every protected route re-checks the permission server-side via `requirePermission()` — the frontend hiding a button is never the only line of defense.

## Data dictionary

See `prisma/schema.prisma` — it's the single source of truth for the schema and is self-documenting via field comments. Run `npx prisma studio` for a visual browser of seeded data.

## Notes for the next milestone

- `AppError` in `middleware/errorHandler.ts` is the pattern to reuse for all future business-logic errors (400/403/404/409 etc.) — throw it from services, never format error JSON by hand in a controller.
- `auditLogs` is already wired into employee create/deactivate — follow the same pattern (`beforeValue`/`afterValue` as JSON) for shipments and payments in later milestones.
- Permission keys for shipment/payment/delivery/report modules are already seeded (see `prisma/seed.ts`) even though nothing enforces them yet — Milestone 3+ can start using `requirePermission("shipment.create")` etc. immediately without a further seed change.
