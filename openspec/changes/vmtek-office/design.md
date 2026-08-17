# VMWTEK Office — Technical Design

## Context

See proposal.md — Why. This is a greenfield Next.js app in an empty repo (only `.gitignore` exists). Single admin user for the MVP, with the data model designed so a read-only per-client portal can be added later without schema rework. Stack decided with the user: Next.js (App Router) + TypeScript, Drizzle ORM on Neon Postgres, Auth.js v5, shadcn/ui + Tailwind, Zod, deployed on Vercel.

## Goals / Non-Goals

**Goals:**
- Ship a single-admin internal operations tracker covering clients, projects (milestones/epics/tasks), negotiations, payments, expenses, reminders, and notes.
- Keep the data model portal-ready: polymorphic links (`entityType`/`entityId`) on notes and reminders, nullable `clientId` on money records.
- Minimal moving parts: no external services beyond the database; in-app reminders only.

**Non-Goals (MVP):**
- No client portal (role-based access, per-client scoping) — design must not preclude it, but it is not built now.
- No currency conversion — amounts are labeled per currency only.
- No time tracking, no subtasks, no full CRM features.
- No email/calendar notifications, no charts library.

## Decisions

### D1: Next.js App Router with Server Components + Server Actions (no REST layer)
Data reads run directly in Server Components via Drizzle queries; mutations go through Server Actions with Zod validation.
- Rationale: least code for a CRUD-heavy single-admin app; type-safe end-to-end; colocated data fetching.
- Alternatives: route handlers (extra ceremony, no external consumer), tRPC (overkill for server-rendered pages).
- The future portal slots in as new RSC routes with per-client row scoping.

### D2: Drizzle ORM over Prisma
- Rationale: SQL-first, lightweight, excellent type inference, tighter integration with Neon. User preference (ORM: B).
- The schema is defined in `src/db/schema.ts`; migrations managed via `drizzle-kit`.

### D3: Auth.js (NextAuth v5) with credentials provider
- Single admin seeded from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars, bcrypt-hashed. Middleware protects all routes except `/login`.
- Rationale: user preference (Auth: D); open source, no external dependency. Clerk considered but rejected — its value (managed SSO/social) is unused for a single credentials login.
- Sessions use the **JWT strategy** (not database sessions). Verified constraint in `@auth/core@0.41.3`: the credentials-provider path unconditionally encodes a JWT cookie and never calls `createSession`, so `strategy: 'database'` with credentials-only auth is unsupported (`UnsupportedStrategy` error). The `session`/`account`/`verificationTokens` tables exist for future OAuth/database-session support but are unused by the credentials flow. Trade-off: sessions are not server-side revocable; acceptable for a single admin.

### D4: Polymorphic attachments via entityType/entityId columns
Notes and reminders carry `entityType` (enum of entity names or `none`) + nullable `entityId`. No join tables.
- Rationale: one notes system attachable to everything (user requirement); join tables would multiply by entity count.
- Trade-off: no FK enforcement on polymorphic links — integrity is enforced in server-action validation and application code. Acceptable for a single-admin app; a composite key per entity was the rejected alternative (table explosion, YAGNI).

### D5: Money records use flexible optional FKs
`payments` and `expenses` have nullable `clientId`/`projectId`. Neither set = general income/overhead. Validation requires amount + currency; the payment actions check that linked entities exist but allow both `clientId` and `projectId` to be set together.
- Rationale: user decision "mixed" — money can attach to project, client, or neither, and projects may lack clients.
- Projects have nullable `clientId` and nullable `negotiationId` (born from won negotiation).

### D6: Payment lifecycle as a single record with status
`payments.status` ∈ `pending | partial | received`; `receivedDate` set on first receipt. Pending payments are simply payments in `pending`/`partial` status.
- Rationale: avoids double-entry between "expected" and "received" records (user decision A).
- Milestone billing: `milestones.paymentId` links a milestone to its payment.

### D7: Multi-currency as a currency label per amount, no conversion
Every money-carrying table has a `currency` column (ISO 4217). Aggregates group by currency.
- Rationale: user decision — label only; conversion added later without schema changes.

### D8: shadcn/ui + Tailwind, sidebar layout
shadcn components copied into `src/components/ui`, Tailwind for styling, sonner for toasts. Sidebar shell in the dashboard layout. No chart library — numeric widgets with progress bars for MVP.

### D9: Project structure
```
src/
  app/(auth)/login/          + (dashboard)/ layout & pages
  app/api/auth/[...nextauth]/
  components/                (ui + feature components)
  db/schema.ts, db/index.ts
  actions/<domain>.ts        (server actions)
  lib/zod-schemas, lib/utils, lib/money
```
Naming/data model: see specs — the `projects`, `milestones`, `epics`, `tasks` hierarchy is the delivery backbone.

## Risks / Trade-offs

- [Polymorphic links lack FK enforcement] → Centralized validation in server actions; entity existence checked before attach.
- [Credentials-only auth is less convenient than OAuth] → Intentional for MVP (single user); OAuth can be added later in Auth.js without schema changes.
- [No currency conversion limits cross-currency reporting] → Dashboard shows per-currency totals; conversion deferred.
- [Server Actions require care with revalidation] → Use `revalidatePath` after mutations so lists/aggregates stay fresh.
- [Drizzle + Neon migration workflow differs from Prisma] → Use `drizzle-kit generate/push` locally against a local or Neon dev branch; production migrations via Vercel build step or CI.

## Migration Plan

- Greenfield: `drizzle-kit generate` from `src/db/schema.ts`, apply to Neon dev branch and production via CI on merge.
- Rollback: because this is new code, rollback = revert the deployed Vercel deployment; DB is additive-only for MVP.
- Seed: a script creates the first admin user from env vars; run in CI/deploy for production.

## Open Questions

None that block specs or the task breakdown. (Portal access model, currency conversion, notifications, and charting are deferred by design and can be decided after MVP.)
