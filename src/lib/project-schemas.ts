import { z } from 'zod';

import { projectStatusEnum } from '@/db/schema';

const projectStatuses = projectStatusEnum.enumValues;

// Optional links: '' | null | undefined become null in the DB. Non-empty
// values are validated against the referenced table in the action.
const optionalId = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal(''))
  .nullable();

// Native <input type="date"> sends YYYY-MM-DD; parse at UTC midnight so the
// server and client render the same business date (see formatDate in money.ts).
const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

const optionalDate = z
  .union([dateString, z.date()])
  .optional()
  .or(z.literal(''))
  .nullable();

const optionalCurrency = z
  .string()
  .trim()
  .regex(/^[A-Z]{3}$/, 'Enter a valid currency code')
  .optional()
  .or(z.literal(''))
  .nullable();

const optionalBudgetAmount = z
  .number({ error: 'Enter a valid budget amount' })
  .positive('Budget amount must be positive')
  .optional()
  .or(z.literal(''))
  .nullable();

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional().or(z.literal('')),
  status: z.enum(projectStatuses).default('planning'),
  clientId: optionalId,
  negotiationId: optionalId,
  startDate: optionalDate,
  endDate: optionalDate,
  budgetCurrency: optionalCurrency,
  budgetAmount: optionalBudgetAmount,
});

export type ProjectInput = z.infer<typeof projectSchema>;
