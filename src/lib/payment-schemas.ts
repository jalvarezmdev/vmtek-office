import { z } from 'zod';

import { paymentStatusEnum } from '@/db/schema';
import { dateField } from './schemas-common';

const paymentStatuses = paymentStatusEnum.enumValues;

// Optional links: '' | null | undefined become null in the DB. Non-empty
// values are validated against the referenced table in the action.
const optionalId = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal(''))
  .nullable();

export const paymentSchema = z.object({
  clientId: optionalId,
  projectId: optionalId,
  amount: z
    .number({ error: 'Enter a valid amount' })
    .positive('Amount must be positive'),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/, 'Select a currency'),
  status: z.enum(paymentStatuses).default('pending'),
  receivedDate: dateField,
  dueDate: dateField,
  description: z.string().trim().optional().or(z.literal('')),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
