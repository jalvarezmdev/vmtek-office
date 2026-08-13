import { z } from 'zod';

import { negotiationStatusEnum } from '@/db/schema';
import { dateField } from './schemas-common';

const negotiationStatuses = negotiationStatusEnum.enumValues;

// Optional links: '' | null | undefined become null in the DB. Non-empty
// values are validated against the referenced table in the action.
const optionalId = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal(''))
  .nullable();

const optionalAmount = z
  .number({ error: 'Enter a valid amount' })
  .positive('Amount must be positive')
  .optional()
  .or(z.literal(''))
  .nullable();

export const negotiationSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional().or(z.literal('')),
  amount: optionalAmount,
  currency: z
    .string()
    .trim()
    .regex(/^[A-Z]{3}$/, 'Select a currency'),
  status: z.enum(negotiationStatuses).default('open'),
  clientId: optionalId,
  expectedCloseDate: dateField,
});

export type NegotiationInput = z.infer<typeof negotiationSchema>;
