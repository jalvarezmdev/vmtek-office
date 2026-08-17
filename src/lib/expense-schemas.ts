import { z } from 'zod';

import { expenseCategoryEnum, expenseFrequencyEnum } from '@/db/schema';
import { requiredDateField } from './schemas-common';

const expenseCategories = expenseCategoryEnum.enumValues;
const expenseFrequencies = expenseFrequencyEnum.enumValues;

// Optional links: '' | null | undefined become null in the DB. Non-empty
// values are validated against the referenced table in the action.
const optionalId = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal(''))
  .nullable();

// Checkbox input: HTML sends 'on' when checked and omits the field when not;
// some clients also send 'true'/'false'. Coerce all of those to a boolean.
// z.coerce.boolean() is wrong here — it treats any non-empty string ('false')
// as truthy — so normalize explicitly. An omitted field (unchecked box) falls
// back to false via default().
const recurring = z
  .union([
    z.boolean(),
    z.literal('true'),
    z.literal('false'),
    z.literal('on'),
    z.literal(''),
  ])
  .default(false)
  .transform((value) => value === true || value === 'true' || value === 'on');

const recurringFrequency = z
  .enum(expenseFrequencies)
  .optional()
  .or(z.literal(''))
  .nullable()
  .transform((value) => (value === '' ? null : value));

export const expenseSchema = z
  .object({
    clientId: optionalId,
    projectId: optionalId,
    category: z.enum(expenseCategories, { error: 'Select a category' }),
    amount: z
      .number({ error: 'Enter a valid amount' })
      .positive('Amount must be positive'),
    currency: z
      .string()
      .trim()
      .regex(/^[A-Z]{3}$/, 'Select a currency'),
    date: requiredDateField,
    recurring,
    recurringFrequency,
    description: z.string().trim().optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    // Mirror the DB CHECK constraint expenses_recurring_requires_frequency:
    // a recurring expense must carry a frequency.
    if (data.recurring && !data.recurringFrequency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Frequency is required for recurring expenses',
        path: ['recurringFrequency'],
      });
    }
  });

export type ExpenseInput = z.infer<typeof expenseSchema>;
