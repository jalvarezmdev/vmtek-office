CREATE TYPE "public"."epic_status" AS ENUM('planned', 'active', 'done');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('software', 'hardware', 'subcontractors', 'marketing', 'travel', 'office', 'other');--> statement-breakpoint
CREATE TYPE "public"."expense_frequency" AS ENUM('monthly', 'yearly', 'quarterly', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."milestone_status" AS ENUM('planned', 'active', 'done');--> statement-breakpoint
CREATE TYPE "public"."negotiation_status" AS ENUM('open', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."note_entity" AS ENUM('client', 'project', 'task', 'negotiation', 'payment', 'expense', 'milestone', 'epic', 'reminder', 'none');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'partial', 'received');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('planning', 'active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."reminder_entity" AS ENUM('client', 'project', 'task', 'payment', 'negotiation', 'milestone', 'none');--> statement-breakpoint
CREATE TYPE "public"."reminder_repeat" AS ENUM('once', 'daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."reminder_status" AS ENUM('pending', 'done', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'done');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'client');--> statement-breakpoint
CREATE TABLE "accounts" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"company" text,
	"email" text,
	"phone" text,
	"address" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "epics" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "epic_status" DEFAULT 'planned' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"clientId" text,
	"projectId" text,
	"category" "expense_category" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text NOT NULL,
	"date" timestamp NOT NULL,
	"recurring" boolean DEFAULT false NOT NULL,
	"recurringFrequency" "expense_frequency",
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_recurring_requires_frequency" CHECK (NOT "expenses"."recurring" OR "expenses"."recurringFrequency" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"projectId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "milestone_status" DEFAULT 'planned' NOT NULL,
	"dueDate" timestamp,
	"paymentId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "negotiations" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"amount" numeric(12, 2),
	"currency" text NOT NULL,
	"status" "negotiation_status" DEFAULT 'open' NOT NULL,
	"clientId" text,
	"expectedCloseDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"body" text NOT NULL,
	"entityType" "note_entity" DEFAULT 'none' NOT NULL,
	"entityId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"clientId" text,
	"projectId" text,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"receivedDate" timestamp,
	"dueDate" timestamp,
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "project_status" DEFAULT 'planning' NOT NULL,
	"clientId" text,
	"negotiationId" text,
	"startDate" timestamp,
	"endDate" timestamp,
	"budgetCurrency" text,
	"budgetAmount" numeric(12, 2),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"notes" text,
	"dueAt" timestamp NOT NULL,
	"status" "reminder_status" DEFAULT 'pending' NOT NULL,
	"repeat" "reminder_repeat" DEFAULT 'once' NOT NULL,
	"entityType" "reminder_entity" DEFAULT 'none' NOT NULL,
	"entityId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"dueDate" timestamp,
	"epicId" text,
	"projectId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"passwordHash" text,
	"role" "user_role" DEFAULT 'admin' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationTokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationTokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "epics" ADD CONSTRAINT "epics_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_paymentId_payments_id_fk" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "negotiations" ADD CONSTRAINT "negotiations_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_clientId_clients_id_fk" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_negotiationId_negotiations_id_fk" FOREIGN KEY ("negotiationId") REFERENCES "public"."negotiations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_epicId_epics_id_fk" FOREIGN KEY ("epicId") REFERENCES "public"."epics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "epics_project_idx" ON "epics" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "expenses_client_idx" ON "expenses" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "expenses_project_idx" ON "expenses" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "milestones_project_idx" ON "milestones" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "notes_entity_idx" ON "notes" USING btree ("entityType","entityId");--> statement-breakpoint
CREATE INDEX "payments_client_idx" ON "payments" USING btree ("clientId");--> statement-breakpoint
CREATE INDEX "payments_project_idx" ON "payments" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reminders_entity_idx" ON "reminders" USING btree ("entityType","entityId");--> statement-breakpoint
CREATE INDEX "reminders_status_due_idx" ON "reminders" USING btree ("status","dueAt");--> statement-breakpoint
CREATE INDEX "tasks_project_idx" ON "tasks" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "tasks_epic_idx" ON "tasks" USING btree ("epicId");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");