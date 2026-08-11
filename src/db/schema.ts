import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'client']);
export const projectStatusEnum = pgEnum('project_status', [
  'planning',
  'active',
  'paused',
  'completed',
  'archived',
]);
export const milestoneStatusEnum = pgEnum('milestone_status', [
  'planned',
  'active',
  'done',
]);
export const epicStatusEnum = pgEnum('epic_status', ['planned', 'active', 'done']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'done']);
export const taskPriorityEnum = pgEnum('task_priority', [
  'low',
  'medium',
  'high',
  'urgent',
]);
export const negotiationStatusEnum = pgEnum('negotiation_status', [
  'open',
  'won',
  'lost',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'partial',
  'received',
]);
export const expenseCategoryEnum = pgEnum('expense_category', [
  'software',
  'hardware',
  'subcontractors',
  'marketing',
  'travel',
  'office',
  'other',
]);
export const expenseFrequencyEnum = pgEnum('expense_frequency', [
  'monthly',
  'yearly',
  'quarterly',
  'weekly',
]);
export const reminderStatusEnum = pgEnum('reminder_status', [
  'pending',
  'done',
  'dismissed',
]);
export const reminderRepeatEnum = pgEnum('reminder_repeat', [
  'once',
  'daily',
  'weekly',
  'monthly',
]);
export const reminderEntityTypeEnum = pgEnum('reminder_entity', [
  'client',
  'project',
  'task',
  'payment',
  'negotiation',
  'milestone',
  'none',
]);
export const noteEntityTypeEnum = pgEnum('note_entity', [
  'client',
  'project',
  'task',
  'negotiation',
  'payment',
  'expense',
  'milestone',
  'epic',
  'reminder',
  'none',
]);

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  passwordHash: text('passwordHash'),
  role: userRoleEnum('role').notNull().default('admin'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Auth.js adapter tables: snake_case columns are adapter-required, leave as-is.
export const accounts = pgTable(
  'accounts',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verificationTokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ],
);

export const clients = pgTable('clients', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  company: text('company'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const negotiations = pgTable('negotiations', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description'),
  amount: numeric('amount', { precision: 12, scale: 2 }).$type<number>(),
  currency: text('currency').notNull(),
  status: negotiationStatusEnum('status').notNull().default('open'),
  clientId: text('clientId').references(() => clients.id, {
    onDelete: 'set null',
  }),
  expectedCloseDate: timestamp('expectedCloseDate', { mode: 'date' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const projects = pgTable('projects', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  status: projectStatusEnum('status').notNull().default('planning'),
  clientId: text('clientId').references(() => clients.id, {
    onDelete: 'set null',
  }),
  negotiationId: text('negotiationId').references(() => negotiations.id, {
    onDelete: 'set null',
  }),
  startDate: timestamp('startDate', { mode: 'date' }),
  endDate: timestamp('endDate', { mode: 'date' }),
  budgetCurrency: text('budgetCurrency'),
  budgetAmount: numeric('budgetAmount', { precision: 12, scale: 2 }).$type<number>(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const milestones = pgTable('milestones', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text('projectId')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  status: milestoneStatusEnum('status').notNull().default('planned'),
  dueDate: timestamp('dueDate', { mode: 'date' }),
  paymentId: text('paymentId').references((): AnyPgColumn => payments.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const epics = pgTable('epics', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text('projectId')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  status: epicStatusEnum('status').notNull().default('planned'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const tasks = pgTable('tasks', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('todo'),
  priority: taskPriorityEnum('priority').notNull().default('medium'),
  dueDate: timestamp('dueDate', { mode: 'date' }),
  epicId: text('epicId').references(() => epics.id, { onDelete: 'cascade' }),
  projectId: text('projectId')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const payments = pgTable('payments', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clientId: text('clientId').references(() => clients.id, {
    onDelete: 'set null',
  }),
  projectId: text('projectId').references(() => projects.id, {
    onDelete: 'set null',
  }),
  milestoneId: text('milestoneId').references((): AnyPgColumn => milestones.id, {
    onDelete: 'set null',
  }),
  amount: numeric('amount', { precision: 12, scale: 2 })
    .notNull()
    .$type<number>(),
  currency: text('currency').notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  receivedDate: timestamp('receivedDate', { mode: 'date' }),
  dueDate: timestamp('dueDate', { mode: 'date' }),
  description: text('description'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const expenses = pgTable('expenses', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clientId: text('clientId').references(() => clients.id, {
    onDelete: 'set null',
  }),
  projectId: text('projectId').references(() => projects.id, {
    onDelete: 'set null',
  }),
  category: expenseCategoryEnum('category').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 })
    .notNull()
    .$type<number>(),
  currency: text('currency').notNull(),
  date: timestamp('date', { mode: 'date' }).notNull(),
  recurring: boolean('recurring').notNull().default(false),
  recurringFrequency: expenseFrequencyEnum('recurringFrequency'),
  description: text('description'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const reminders = pgTable('reminders', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  notes: text('notes'),
  dueAt: timestamp('dueAt', { mode: 'date' }).notNull(),
  status: reminderStatusEnum('status').notNull().default('pending'),
  repeat: reminderRepeatEnum('repeat').notNull().default('once'),
  entityType: reminderEntityTypeEnum('entityType').notNull().default('none'),
  // Polymorphic link to any entity type: no FK by design; integrity enforced in server actions.
  entityId: text('entityId'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const notes = pgTable('notes', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  body: text('body').notNull(),
  entityType: noteEntityTypeEnum('entityType').notNull().default('none'),
  // Polymorphic link to any entity type: no FK by design; integrity enforced in server actions.
  entityId: text('entityId'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
  negotiations: many(negotiations),
  payments: many(payments),
  expenses: many(expenses),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  negotiation: one(negotiations, {
    fields: [projects.negotiationId],
    references: [negotiations.id],
  }),
  milestones: many(milestones),
  epics: many(epics),
  tasks: many(tasks),
  payments: many(payments),
  expenses: many(expenses),
}));

export const milestonesRelations = relations(milestones, ({ one }) => ({
  project: one(projects, {
    fields: [milestones.projectId],
    references: [projects.id],
  }),
  payment: one(payments, {
    fields: [milestones.paymentId],
    references: [payments.id],
  }),
}));

export const epicsRelations = relations(epics, ({ one, many }) => ({
  project: one(projects, {
    fields: [epics.projectId],
    references: [projects.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  epic: one(epics, {
    fields: [tasks.epicId],
    references: [epics.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
}));

export const negotiationsRelations = relations(negotiations, ({ one, many }) => ({
  client: one(clients, {
    fields: [negotiations.clientId],
    references: [clients.id],
  }),
  projects: many(projects),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  client: one(clients, {
    fields: [payments.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [payments.projectId],
    references: [projects.id],
  }),
  milestone: one(milestones, {
    fields: [payments.milestoneId],
    references: [milestones.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  client: one(clients, {
    fields: [expenses.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [expenses.projectId],
    references: [projects.id],
  }),
}));
