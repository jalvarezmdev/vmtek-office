# VMWTEK Office — Implementation Tasks

## 1. Project Scaffolding

- [x] 1.1 Initialize Next.js app (App Router, TypeScript, Tailwind) in the repo root
- [x] 1.2 Add and configure Drizzle ORM, drizzle-kit, and the Neon Postgres client
- [x] 1.3 Add Auth.js v5 dependencies and Auth.js schema tables to the DB schema
- [x] 1.4 Install and set up shadcn/ui (components.json, base components, sonner toast)
- [x] 1.5 Add `src/db/schema.ts` with all tables from the design (users, clients, projects, milestones, epics, tasks, negotiations, payments, expenses, reminders, notes, auth tables)
- [x] 1.6 Generate and apply the initial Drizzle migration; verify schema against Neon dev DB
- [x] 1.7 Create the admin seed script (reads ADMIN_EMAIL/ADMIN_PASSWORD, bcrypt-hashes)
- [x] 1.8 Set up ESLint, Prettier, TypeScript strict mode, and GitHub Actions CI (lint + typecheck + test on push)

## 2. Auth

- [x] 2.1 Configure Auth.js credentials provider with bcrypt verification
- [x] 2.2 Create the login page (email + password form with Zod validation)
- [x] 2.3 Add session guard middleware protecting all routes except /login
- [x] 2.4 Add sign-out action and redirect authenticated users away from /login
- [x] 2.5 Verify login, invalid-credentials, session persistence, and route protection scenarios end to end

## 3. App Shell & Dashboard

- [x] 3.1 Build the authenticated sidebar layout (nav: Dashboard, Clients, Projects, Negotiations, Payments, Expenses, Reminders, Notes, Settings)
- [x] 3.2 Create the six dashboard widgets: reminders, pending payments, active projects, open negotiations, money overview, pending tasks
- [x] 3.3 Implement money helpers (per-currency aggregation) and shared widget components (progress bars, empty states)
- [x] 3.4 Wire dashboard quick-actions (complete reminder without reload via Server Action + revalidation)
- [x] 3.5 Verify all dashboard scenarios from the dashboard spec

## 4. Clients

- [x] 4.1 Implement client CRUD server actions with Zod validation (name required)
- [x] 4.2 Build the clients list page (name, company, active projects, open negotiations, outstanding balance)
- [x] 4.3 Build the client detail page with tabs (Projects, Negotiations, Payments, Expenses, Notes, Reminders)
- [x] 4.4 Verify client scenarios (CRUD, validation, empty state, not-found)

## 5. Projects, Milestones, Epics, Tasks

- [x] 5.1 Implement project CRUD actions (nullable clientId, nullable negotiationId, status enum)
- [x] 5.2 Implement milestone CRUD actions (status, dueDate, optional paymentId link)
- [x] 5.3 Implement epic CRUD actions (status)
- [x] 5.4 Implement task CRUD actions (title required, status, priority, dueDate, epicId or projectId)
- [x] 5.5 Build the projects list page (status filter, client, milestone progress)
- [x] 5.6 Build the project detail page with tabs (Overview, Milestones, Epics, Tasks, Payments, Expenses, Notes) and progress indicator
- [x] 5.7 Build create/edit forms and dialogs for project, milestone, epic, and task
- [x] 5.8 Verify project scenarios (internal project, from-won-negotiation, status changes, hierarchy CRUD)

## 6. Negotiations

- [x] 6.1 Implement negotiation CRUD actions (title required, currency, status open/won/lost)
- [x] 6.2 Implement status transitions (won/lost/reopen) and convert-won-to-project action (refuses non-won)
- [x] 6.3 Build the negotiations pipeline page (open/won/lost columns, pipeline value per currency)
- [x] 6.4 Verify negotiation scenarios including conversion to project

## 7. Payments

- [x] 7.1 Implement payment CRUD actions (amount + currency required, status pending/partial/received, flexible client/project/milestone links)
- [x] 7.2 Implement lifecycle transitions (pending → partial → received) with receivedDate recording
- [x] 7.3 Build the payments list page (status filter, pending highlighted, due dates)
- [x] 7.4 Surface pending/partial payments with overdue-first sorting and per-currency totals (list + dashboard widget)
- [x] 7.5 Verify payment scenarios (general income, milestone link, partial → received)

## 8. Expenses

- [x] 8.1 Implement expense CRUD actions (amount, currency, date, category required; optional client/project link; recurring flag + frequency)
- [x] 8.2 Build the expenses list page (category filter, recurring badge)
- [x] 8.3 Include expenses in dashboard money overview (month-to-date per currency)
- [x] 8.4 Verify expense scenarios (validation, project attribution, recurring badge)

## 9. Reminders

- [x] 9.1 Implement reminder CRUD actions (title + due datetime required, polymorphic entityType/entityId, status pending/done/dismissed)
- [x] 9.2 Implement repeat logic (once/daily/weekly/monthly — next occurrence created on completion)
- [x] 9.3 Build the reminders page (overdue first, grouped by due date)
- [x] 9.4 Verify reminder scenarios (standalone, on-entity, repeat, dashboard quick-complete)

## 10. Notes

- [x] 10.1 Implement note CRUD actions (body required, polymorphic entityType/entityId)
- [x] 10.2 Build the notes index page (searchable, grouped by entity type)
- [x] 10.3 Add note forms to entity detail tabs (client, project, task, negotiation, payment, expense, milestone, epic, reminder)
- [x] 10.4 Verify note scenarios (standalone, on-entity, edit, delete, search)

## 11. Settings & Polish

- [x] 11.1 Build the settings page (profile display, currency preferences placeholder)
- [x] 11.2 Add not-found pages and empty states across all lists
- [x] 11.3 Add loading states (suspense skeletons) for server pages
- [x] 11.4 Run a full app pass: lint, typecheck, and manual smoke test of every flow

## 12. Testing

- [x] 12.1 Add Vitest unit tests for validation schemas, money/currency aggregation, and reminder repeat logic
- [x] 12.2 Add Drizzle query integration tests against a test DB for dashboard aggregates
- [x] 12.3 Add Playwright smoke tests: login → create client → create project → create task → complete reminder
- [x] 12.4 Confirm CI runs lint + typecheck + tests green

## 13. Deployment

- [ ] 13.1 Set up Vercel project with Neon Postgres connection, ADMIN_EMAIL/ADMIN_PASSWORD, and AUTH_SECRET env vars
- [ ] 13.2 Configure production migration run on deploy (drizzle-kit migrate in build step or CI)
- [ ] 13.3 Deploy, seed the admin, and verify the live app end to end
