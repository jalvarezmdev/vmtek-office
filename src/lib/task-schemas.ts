import { z } from 'zod';

import { taskPriorityEnum, taskStatusEnum } from '@/db/schema';
import { dateField } from './schemas-common';

const taskStatuses = taskStatusEnum.enumValues;
const taskPriorities = taskPriorityEnum.enumValues;

// Optional epic link: '' | null | undefined become null in the DB. Non-empty
// values are validated against the epics table (and its project) in the action.
const optionalEpicId = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal(''))
  .nullable();

export const taskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().optional().or(z.literal('')),
  // Full-field update contract: the task edit form must always submit `status`
  // (and every field) — an update that omits it falls back to 'todo'.
  status: z.enum(taskStatuses).default('todo'),
  // Same contract for `priority`: an update that omits it falls back to
  // 'medium'.
  priority: z.enum(taskPriorities).default('medium'),
  dueDate: dateField,
  epicId: optionalEpicId,
});

export type TaskInput = z.infer<typeof taskSchema>;
