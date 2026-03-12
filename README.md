# Expense System — Frontend

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery)

A full-featured enterprise expense management frontend demonstrating modern React patterns, JWT authentication, and a multi-role approval workflow.


## 🛠 Engineering & Development Process

**AI-Assisted Frontend Development**
To accelerate the UI development process, I leveraged AI code generation tools (e.g., Claude) to build component boilerplates and layout structures. This approach enabled me to concentrate on the core logic and integration aspects, such as:
- **API Integration:** Seamlessly connecting the frontend client to the decoupled backend REST API.
- **State Management:** Handling asynchronous data flows and updating UI states based on financial data changes.
- **User Flow Design:** Architecting a logical and intuitive user experience for expense tracking.
  

## Features

- **JWT Authentication** — login returns a signed JWT; all API calls send `Authorization: Bearer <token>`
- **Multi-role approval workflow** — Employee → Manager → CFO → CEO chain with special-review exceptions
- **Policy engine integration** — real-time warnings for hotel, airfare, and meal policy violations
- **Role switching** — four demo accounts (Employee, Manager, CFO, CEO), all sharing password `demo1234`
- **TanStack Query** — optimistic updates, loading skeletons, background refetch
- **Dark mode** — CSS variable-based theme (shadcn/ui + Tailwind)
- **Command palette** — `Ctrl+K` quick navigation
- **Dashboard charts** — spend-by-category and monthly trends (recharts, lazy-loaded)
- **PDF / Excel export** — available on all finalized reports
- **Accessibility** — `aria-current`, `role="dialog"`, `aria-label` throughout

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 18 + Vite 5 |
| Language | TypeScript 5 (strict) |
| Styling | TailwindCSS 3 + shadcn/ui |
| State / Data | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Animation | Framer Motion |
| Toast | Sonner |
| Charts | Recharts |
| Testing | Vitest + Testing Library |

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (requires backend running on :8080)
npm run dev

# Type-check
npx tsc --noEmit

# Run tests
npm test
```

## Authentication

All demo accounts share the password **`demo1234`**.

| Email | Role |
|---|---|
| `jun@example.com` | Employee |
| `manager@example.com` | Manager |
| `finance@example.com` | CFO |
| `ceo@example.com` | CEO |

After login, the JWT is stored in `localStorage` and sent as `Authorization: Bearer <token>` on every request. Switch roles by logging in with a different demo account.

## Key Routes

| Route | Description |
|---|---|
| `/` | Welcome / landing |
| `/dashboard` | Dashboard + recent activity |
| `/create` | Create report |
| `/reports` | My reports |
| `/approvals` | Approval queue (Manager/CFO/CEO) |
| `/policy-exceptions` | Exception inbox (CFO/CEO) |
| `/search` | Role-scoped search |

## Demo Policy (simplified)

| Category | Limit |
|---|---|
| Hotel | $250/night |
| Airfare (domestic) | $500 |
| Airfare (international) | $1,000 |
| Meals | $75/day |
| Entertainment | $100 |

Items outside the trip date range also generate a policy warning.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend base URL |

## Deployment (Vercel)

1. Import this repo into Vercel
2. Set project root to `expense-frontend/`
3. Add env var: `VITE_API_BASE_URL` = your backend public URL
4. Deploy

> This is a public portfolio demo. Do not use for sensitive data.

