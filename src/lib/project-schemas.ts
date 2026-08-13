import { z } from 'zod';

import { projectStatusEnum } from '@/db/schema';
import { dateField } from './schemas-common';

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
  // Full-field update contract: the 5.7 edit form must always submit `status`
  // (and every field) — an update that omits it falls back to 'planning'.
  status: z.enum(projectStatuses).default('planning'),
  clientId: optionalId,
  negotiationId: optionalId,
  startDate: dateField,
  endDate: dateField,
  budgetCurrency: optionalCurrency,
  budgetAmount: optionalBudgetAmount,
});

export type ProjectInput = z.infer<typeof projectSchema>;
