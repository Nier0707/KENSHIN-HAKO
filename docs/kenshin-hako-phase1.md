# KENSHIN HAKO — Phase 1: Architecture & Data Design

Confirmed scope: phased build, sea-freight balikbayan box workflow, hundreds → 1,000–2,000 shipments/month over 2–3 years, ~5 roles, internal payment tracking (no gateway), public tracking portal, SMS-first notifications, small/lightly-technical team, low-ops managed hosting.

---

## 1. System Architecture

**Choice: Modular monolith**, not microservices.

Justification: at 1,000–2,000 shipments/month and under 20 concurrent staff, you have nowhere near the scale or team size that justifies microservices' operational overhead (service discovery, distributed tracing, multiple deployments, network failure modes). A modular monolith gives you clear internal boundaries (Auth, Customers, Shipments, Payments, Notifications, Reporting as separate modules/packages) so it can be split later *if* volume ever demands it, while staying cheap to run and easy for a small/solo team to debug and deploy.

**Components:**

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (SPA)                       │
│   Staff Portal (data-dense)   │  Public Tracking Page      │
└───────────────┬─────────────────────────┬─────────────────┘
                │ HTTPS/REST               │ HTTPS/REST
┌───────────────▼─────────────────────────▼─────────────────┐
│                   Backend API (modular monolith)           │
│  ┌────────┐ ┌───────────┐ ┌──────────┐ ┌────────────────┐ │
│  │  Auth  │ │ Customers/ │ │ Shipments │ │   Payments     │ │
│  │  & RBAC│ │ Sender/    │ │ & Tracking│ │                │ │
│  │        │ │ Receiver   │ │           │ │                │ │
│  └────────┘ └───────────┘ └──────────┘ └────────────────┘ │
│  ┌──────────────┐ ┌───────────────┐ ┌────────────────────┐│
│  │ Notifications │ │  Reporting /  │ │    Audit Log       ││
│  │ (SMS/Email)   │ │  Dashboard    │ │                    ││
│  └──────────────┘ └───────────────┘ └────────────────────┘│
└───────────┬───────────────────┬─────────────────┬──────────┘
            │                   │                 │
      ┌─────▼─────┐     ┌───────▼──────┐   ┌──────▼──────┐
      │ PostgreSQL │     │ Object Store │   │  SMS/Email  │
      │ (managed)  │     │ (receipts,   │   │  provider   │
      │            │     │  photos)     │   │  (e.g. Semaphore│
      └────────────┘     └──────────────┘   │  /Twilio, SES)│
                                             └─────────────┘
```

Background jobs (SMS on status change, scheduled reports, backups) run as a lightweight job queue inside the same service to start — no separate worker infrastructure needed at this scale.

---

## 2. Tech Stack Recommendation

One recommendation, not a menu — picked for low ops burden and solo/small-team maintainability:

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React + TypeScript + Vite**, Tailwind CSS | Widely documented, huge hiring pool if you ever add a dev, TypeScript catches schema-mismatch bugs early |
| Backend | **Node.js + TypeScript, Express (or Fastify)** | Same language as frontend — one skill set covers the whole stack, easier for a small/solo team |
| Database | **PostgreSQL** (managed, e.g. Supabase or Neon) | Relational integrity matters here (payments, balances) — not a NoSQL fit; managed hosting removes backup/patching burden |
| Auth | **Supabase Auth** or **Auth.js (NextAuth)** with role claims in JWT | Avoid hand-rolling auth; server-side role checks on every route regardless of provider |
| File/object storage | **Supabase Storage** or **AWS S3** | Receipts, box photos, proof-of-delivery images |
| Hosting | **Railway or Render** (backend), **Vercel** (frontend) | Git-push deploys, free/cheap tiers at this scale, no server ops |
| SMS | **Semaphore** (PH-focused SMS API) | Built for Philippine numbers/pricing — better fit than Twilio for PH-side delivery notifications |
| Email | **Resend** or **AWS SES** | Cheap, simple transactional email |

If Supabase is used for both DB + Auth + Storage, that collapses three infra decisions into one dashboard — worth strongly considering for a solo/small team specifically because it minimizes the number of services you have to separately monitor and pay for.

---

## 3. Database Schema

Normalized relational design. Core entities below (columns abbreviated to the essential ones; full migration-ready DDL comes in Milestone 1).

**customers** — id, full_name, phone, email, address, origin_country, preferred_contact_channel, created_at

**senders** — id, customer_id (FK), full_name, phone, address_abroad, id_document_ref, created_at
*(a customer is usually the sender; kept separate so one customer account can have multiple sender profiles, e.g. sending on behalf of relatives)*

**receivers** — id, customer_id (FK, nullable — receiver may not have an account), full_name, phone, address_ph, region, created_at

**shipments** — id, tracking_number (unique, indexed), sender_id (FK), receiver_id (FK), branch_id (FK), status, weight_kg, box_count, declared_value, origin_country, booked_by_employee_id (FK), booked_at, estimated_delivery_date, created_at, updated_at

**shipment_items** — id, shipment_id (FK), description, quantity, category (for prohibited-item flagging), photo_url

**tracking_events** — id, shipment_id (FK, indexed), status, notes, location, changed_by_employee_id (FK), created_at
*(append-only status history — never update shipment.status without also inserting here)*

**payments** — id, shipment_id (FK, indexed), amount, currency, method (cash/bank/remittance/COD), payment_type (deposit/balance/full), received_by_employee_id (FK), reconciled (bool), created_at

**employees** — id, full_name, email, phone, role_id (FK), branch_id (FK), is_active, created_at

**roles** — id, name (Owner, Branch Staff, Dispatcher, Delivery Rider, Accountant), description

**role_permissions** — id, role_id (FK), permission_key (e.g. `shipment.create`, `payment.edit`, `report.export`)

**branches** — id, name, country, address, phone

**deliveries** — id, shipment_id (FK), rider_employee_id (FK), scheduled_date, delivered_at, proof_of_delivery_url, recipient_signature_name

**audit_logs** — id, employee_id (FK), action, entity_type, entity_id, before_value (jsonb), after_value (jsonb), created_at

**Indexes for common queries:**
- `shipments.tracking_number` — unique index (public tracking lookups)
- `shipments.status` — for status-filtered dashboard views
- `tracking_events.shipment_id` — for pulling full history per shipment
- `payments.shipment_id` + `payments.reconciled` — for outstanding-balance reports
- `shipments.sender_id`, `shipments.receiver_id` — for customer history lookups
- `shipments.booked_at` — for date-range reports

**Deliberate denormalization:** `shipments.status` is stored directly on the shipment row (not derived by querying the latest `tracking_events` row each time) purely for read performance on list/dashboard views — the `tracking_events` table remains the source of truth for history, and every status change writes to both in the same transaction.

---

## 4. Roles & Permissions Matrix

| Capability | Owner/Admin | Branch Staff | Dispatcher | Delivery Rider | Accountant |
|---|:---:|:---:|:---:|:---:|:---:|
| Create booking | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit shipment details | ✅ | ✅ (own branch) | ❌ | ❌ | ❌ |
| View all branches | ✅ | ❌ | ❌ | ❌ | ✅ |
| Update shipment status | ✅ | ✅ | ✅ | ✅ (delivery-only) | ❌ |
| Record payment | ✅ | ✅ | ❌ | ❌ (COD collection only) | ✅ |
| Edit/void payment | ✅ | ❌ | ❌ | ❌ | ✅ |
| Reconcile payments | ✅ | ❌ | ❌ | ❌ | ✅ |
| Assign pickups/deliveries | ✅ | ❌ | ✅ | ❌ | ❌ |
| View assigned deliveries | ✅ | ❌ | ✅ | ✅ (own only) | ❌ |
| Manage employees | ✅ | ❌ | ❌ | ❌ | ❌ |
| View financial reports | ✅ | ❌ | ❌ | ❌ | ✅ |
| Export reports | ✅ | ❌ (own branch only) | ❌ | ❌ | ✅ |
| View audit logs | ✅ | ❌ | ❌ | ❌ | ❌ |

Enforcement: every capability above maps to a `permission_key` checked **server-side** on the relevant route — never inferred from hidden UI elements.

---

## 5. Tracking Number Design

**Format:** `KH-{BRANCH}-{YYMM}-{SEQ}`
Example: `KH-USLA-2608-00417`

- `KH` — company prefix
- `BRANCH` — 4-letter branch/origin code (e.g. `USLA` = US, Los Angeles)
- `YYMM` — year+month of booking (aids sorting and rough age-at-a-glance)
- `SEQ` — 5-digit zero-padded sequence, reset per branch per month

**Collision safety under concurrent bookings:** generated via a **Postgres sequence per branch-month key** (or `SELECT ... FOR UPDATE` on a counter row), not by counting existing rows — counting-based generation race-conditions under concurrent inserts. The sequence increment is atomic at the database level, so two staff booking simultaneously at the same branch can never get the same number.

Human-readable, sortable by branch and month, and collision-safe — no UUID-in-the-open, since staff/customers need to read this over the phone or write it on a box by hand.

---

## Not-Now List (explicit, deferred)

- Payment gateway integration (GCash/card processing)
- Facebook Messenger integration
- Full customs-document generation
- Carrier/freight-forwarder API integration
- Customer mobile app (native)
- Automated spreadsheet migration pipeline (manual/CSV import instead)

---

**Next:** if this looks right, I'll start **Milestone 1 — Auth + role-based access + employee management**: schema migration, backend endpoints, and a minimal frontend (login + employee list) as a working, demoable increment.
