# VMWTEK Office Proposal

## Why

VMWTEK (an AI/Software agency) has no centralized system to track clients, projects, delivery milestones, negotiations, money (payments/expenses), reminders, and notes. Work is currently scattered across chats, spreadsheets, and memory, which causes missed follow-ups, unpaid invoices slipping through, and no visibility into pipeline value or per-project profitability. We need a single internal "office" app to run the agency.

## What Changes

Build a new Next.js web application ("VMWTEK Office") with:

- **Authentication**: single admin user (email + password) via Auth.js credentials, protecting all routes.
- **Clients**: CRUD for client companies/people.
- **Projects**: CRUD with optional client link (internal/speculative work allowed), optional origin from a won negotiation, and a status lifecycle (planning → active → paused → completed → archived).
- **Milestones**: phases of delivery under a project, each with status, due date, and an optional link to a payment (milestone-based billing).
- **Epics**: feature-sized work blocks under a project, with status.
- **Tasks**: standard work items with status (todo → in_progress → done), priority, due date, optional epic parent (or direct on project), attached notes.
- **Negotiations**: lightweight sales pipeline — title, amount, currency, status (open/won/lost), optional client, expected close date; winning can optionally create a project.
- **Payments**: single-record lifecycle (`pending` → `partial` → `received`) with flexible attachment to project/client/milestone or general income; multi-currency (per-currency labeling only, no conversion).
- **Expenses**: categorized (software, hardware, subcontractors, marketing, travel, office, other) with a recurring flag; flexible attachment like payments.
- **Reminders**: in-app only, attachable to any entity, with repeat (once/daily/weekly/monthly) and status (pending → done → dismissed).
- **Notes**: polymorphic — attachable to any entity or standalone.
- **Dashboard**: six widgets (reminders/overdue, pending payments, active projects, open negotiations, money overview, pending tasks).
- **Architecture**: Next.js App Router with Server Components + Server Actions, Drizzle ORM, shadcn/ui + Tailwind, deployed on Vercel with Neon Postgres.
- **Future-proofing (not in MVP)**: data model supports a read-only client portal (role-based access, per-client scoping) without schema rework.

## Capabilities

### New Capabilities

- `user-auth`: Single admin login with email/password, session handling, protected routes, and seedable first admin.
- `clients`: Manage client companies/people and their contact details.
- `projects`: Project lifecycle with optional client link, milestones, epics, and tasks hierarchy.
- `negotiations`: Sales pipeline tracking with open/won/lost status and optional conversion to project.
- `payments`: Money-in tracking with pending/partial/received lifecycle, flexible attachment, multi-currency.
- `expenses`: Money-out tracking with categories, recurring flag, flexible attachment, multi-currency.
- `reminders`: In-app due-date reminders attachable to any entity, with repeat and dismissal.
- `notes`: Polymorphic notes attachable to any entity.
- `dashboard`: Aggregated overview of reminders, pending payments, active projects, negotiations, money, and tasks.

### Modified Capabilities

None (greenfield — no existing specs).

## Impact

- **New codebase**: greenfield Next.js app in this repo (currently empty beyond `.gitignore`).
- **Stack**: Next.js (App Router) + TypeScript, Drizzle ORM + PostgreSQL (Neon), Auth.js v5, shadcn/ui + Tailwind, Zod validation, Vitest tests, Playwright smoke tests, GitHub Actions CI.
- **Infrastructure**: Vercel deployment, Neon managed Postgres (production DB; local/test DB for dev).
- **No existing systems affected**: no current code, APIs, or data to migrate.
