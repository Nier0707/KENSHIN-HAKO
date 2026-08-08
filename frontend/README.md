# KENSHIN HAKO — Frontend (Milestone 1)

Staff portal: login + employee roster (view, create, deactivate — gated by role).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Optionally set `VITE_API_BASE` in a `.env` file if the backend isn't at `http://localhost:4000/api`.
3. Start the dev server:
   ```bash
   npm run dev
   ```
   Runs at `http://localhost:5173`. Make sure the backend (Milestone 1) is running first.

## What's here

- `src/context/AuthContext.tsx` — login/logout, current employee, permission checks. Token is stored in `localStorage` under `kh_token`.
- `src/components/ProtectedRoute.tsx` — client-side route gate (UX only; the backend independently enforces every permission).
- `src/pages/Login.tsx`, `src/pages/Employees.tsx` — the two Milestone 1 screens.
- `src/api/client.ts` — thin fetch wrapper that attaches the bearer token and normalizes errors.

## Design tokens (for consistency in later milestones)

- Colors: `navy-950/900/800/700` (base/surfaces), `signal-500/600` (accent — actions, alerts, active status), `paper` (light background).
- Type: `font-display` (IBM Plex Sans Condensed, headings/buttons), `font-body` (Inter, body text), `font-mono` (IBM Plex Mono, labels/codes/tracking numbers — anything that should read as data rather than prose).
- The manifest/waybill visual motif (mono uppercase micro-labels, hairline borders, sharp corners) is the established identity — carry it into shipment and tracking screens in later milestones rather than introducing a new style.
