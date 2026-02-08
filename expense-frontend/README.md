# Company Ops Demo (Frontend)

Public demo UI for a corporate expense workflow.

## Features
- Demo-friendly onboarding (Guided Demo)
- Role Switcher (Employee / Manager / Finance) to complete approval flows as a solo visitor
- Reset Demo (calls backend seed/reset endpoint)

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
