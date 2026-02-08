# Company Ops Demo (Frontend)

Public portfolio demo UI for a corporate expense workflow (Expense → Finance special approval for policy exceptions → Manager approval).

## Highlights
- **Solo-friendly demo mode**: Role Switcher (Employee / Manager / Finance)
- **Finance special approval gate** for policy exceptions
- **Search + Recent Activity** dashboard
- **Reset Demo** (seed data)

## Demo policy (simplified)
- Receipts typically required for expenses **$25+**
- Hotel nightly cap (demo): **$300/night**
- Meals daily cap (demo): **$75/day**
- Item dates should be within trip date range

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
- Render: `https://<your-backend>.onrender.com`

## Deployment (Vercel)
1. Import this repo into Vercel
2. Set project root to `expense-frontend/`
3. Add env var:
   - `VITE_API_BASE_URL` = your backend public URL
4. Deploy

> Note: This is intended as a public portfolio demo. Do not use for sensitive data.
