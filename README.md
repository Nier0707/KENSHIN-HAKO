# KENSHIN HAKO — Business Management System

Balikbayan Box shipping company management system. Built as a phased project — see `docs/kenshin-hako-phase1.md` for the full architecture, database schema, roles matrix, and tracking-number design.

## Milestone status

- [x] Milestone 1 — Auth + role-based access + employee management
- [x] **Milestone 2 — Customer/sender/receiver management** (this delivery)
- [ ] Milestone 3 — Shipment booking + tracking number generation + status management
- [ ] Milestone 4 — Payment tracking
- [ ] Milestone 5 — Customer-facing tracking lookup
- [ ] Milestone 6 — Pickup/delivery scheduling + notifications
- [ ] Milestone 7 — Dashboard + reports + export
- [ ] Milestone 8 — Audit logs (backend already logging) + printable documents + polish/hardening

## Structure

```
kenshin-hako/
  backend/    Node.js + TypeScript + Express + PostgreSQL (Prisma)
  frontend/   React + TypeScript + Vite + Tailwind
  docs/       Phase 1 design document
```

## Quick start

1. Follow `backend/README.md` first — provision a database, migrate, seed, run the API.
2. Then follow `frontend/README.md` — install, run the dev server.
3. Log in at `http://localhost:5173/login` with the Owner credentials printed by the seed script.

## What Milestone 1 actually does

- Employees log in with email + password (bcrypt-hashed, rate-limited login endpoint).
- JWT carries the employee's role and resolved permission list.
- Every backend route re-checks permissions server-side (`requirePermission`) — matches the roles matrix in the Phase 1 doc exactly.
- Owner/Admin can view the employee roster, create new employees (assigning role + branch), and deactivate employees.
- Every employee create/deactivate action writes an audit log row — the audit trail starts now, not bolted on at the end.

## What Milestone 2 adds

- Customer, Sender, and Receiver records (`customers`, `senders`, `receivers` tables).
- Branch Staff can register and edit customers **for their own branch only**; Accountant and Owner can view **all branches**; only Owner/Branch Staff can create or edit.
- Each customer can have multiple senders (people sending boxes abroad) and receivers (people receiving in PH) — added inline from the customer's expanded row.
- Search by name, phone, or email on the customer list.
- A shared top nav now lets staff move between **Customers** and **Employees** depending on what their role can access.
- Same audit-log pattern as Milestone 1 — every customer/sender/receiver create and every customer edit writes an audit row.

## Upgrading from Milestone 1

If you already have Milestone 1 running:

1. Replace your `backend/` and `frontend/` folders' `src`, `prisma`, and page files with the ones in this delivery (or just re-extract the whole zip over your existing folder — your `.env` file is untouched since it's not part of the zip).
2. In `backend/`, run the new migration:
   ```bash
   npm run prisma:migrate -- --name add_customers
   ```
3. Re-run the seed script (safe to re-run — it only adds the two new permissions, doesn't duplicate anything):
   ```bash
   npm run prisma:seed
   ```
4. Restart both `npm run dev` processes (backend and frontend).

## What's deliberately not here yet

Shipments, payments, tracking, notifications, dashboards — all scoped to later milestones per the phased plan. Delivery Rider and Dispatcher currently have no landing page since neither role touches customer records or the employee roster yet — that gap closes once shipment/delivery screens exist in Milestone 3 and 6.

Reply to continue once you've run this and it works end-to-end (or tell me what broke) — next up is **Milestone 3: Shipment booking + tracking number generation + status management**.
