import { z } from 'zod';

import { epicStatusEnum } from '@/db/schema';

const epicStatuses = epicStatusEnum.enumValues;

export const epicSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().trim().optional().or(z.literal('')),
  // Full-field update contract: the edit form must always submit `status`
  // (and every field) — an update that omits it falls back to 'planned'.
  status: z.enum(epicStatuses).default('planned'),
});

export type EpicInput = z.infer<typeof epicSchema>;
