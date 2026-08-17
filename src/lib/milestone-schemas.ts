import { z } from 'zod';

import { milestoneStatusEnum } from '@/db/schema';
import { dateField } from './schemas-common';

const milestoneStatuses = milestoneStatusEnum.enumValues;

// Optional payment link: '' | null | undefined become null in the DB. Non-empty
// values are validated against the referenced table in the action.
const optionalId = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal(''))
  .nullable();

export const milestoneSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional().or(z.literal('')),
  // Full-field update contract: the 5.7 edit form must always submit `status`
  // (and every field) — an update that omits it falls back to 'planned'.
  status: z.enum(milestoneStatuses).default('planned'),
  dueDate: dateField,
  paymentId: optionalId,
});

export type MilestoneInput = z.infer<typeof milestoneSchema>;
