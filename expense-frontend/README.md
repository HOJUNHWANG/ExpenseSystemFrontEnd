# Company Ops Demo (Frontend)

Public portfolio UI for a corporate-style expense workflow: **create reports → policy checks → exception review → approvals**.

This is an **open demo** (seeded accounts + Reset Demo) designed to be **solo-friendly** via a **Role Switcher**.

## Highlights
- **Solo-friendly demo mode**: Role Switcher (Employee / Manager / CFO / CEO)
- **Policy exceptions** (aka *exception review*) before entering the normal approval queue
- **Dashboard** with Recent Activity
- **Search** with role-based scope
- **Reset Demo** (seed data; safe for public visitors)

## Key routes
- `/` → Welcome
- `/dashboard` → Dashboard + recent activity
- `/create` → Create report
- `/reports` → My reports
- `/approvals` → Approval queue (Manager/CFO/CEO)
- `/policy-exceptions` → Policy exceptions inbox (CFO)

Legacy redirects (kept for compatibility):
- `/special-approvals` → `/policy-exceptions`
- `/special-approval/:id` → `/policy-exceptions/:id`

## Demo policy (simplified)
- **No receipt upload feature** (intentionally omitted for the public demo)
- Caps:
  - Entertainment: **$100**
  - Hotel: **$250**
  - Airfare: **US $500 / Intl $1000**
  - Meals: **$75/day**
- Item dates should be within the trip date range

## Country input
- Country dropdown uses a curated list of major countries.
- Includes **Other…** for manual entry (used only to build the destination label `City, Country`).

## Local development

### Requirements
- Node.js 18+
- Backend running locally on `http://localhost:8080`

### Run
```bash
npm install
npm run dev
```

## Environment variables

### `VITE_API_BASE_URL`
Base URL for the backend API.

Examples:
- Local: `http://localhost:8080`
- Render: `https://company-ops-demo-api.onrender.com`

## Deployment (Vercel)
1. Import this repo into Vercel
2. Set project root to `expense-frontend/`
3. Add env var:
   - `VITE_API_BASE_URL` = your backend public URL
4. Deploy

> Note: This is intended as a public portfolio demo. Do not use for sensitive data.
