import { z } from 'zod';

import {
  reminderEntityEnum,
  reminderRepeatEnum,
  reminderStatusEnum,
} from '@/db/schema';
import { datetimeInput } from './schemas-common';

const reminderStatuses = reminderStatusEnum.enumValues;
const reminderRepeats = reminderRepeatEnum.enumValues;
const reminderEntities = reminderEntityEnum.enumValues;

// Polymorphic link: '' | null | undefined become null in the DB. A non-null
// value is validated against the referenced table in the action.
const optionalEntityId = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal(''))
  .nullable();

export const reminderSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required'),
    notes: z.string().trim().optional().or(z.literal('')),
    dueAt: datetimeInput,
    status: z.enum(reminderStatuses).default('pending'),
    repeat: z.enum(reminderRepeats).default('once'),
    entityType: z.enum(reminderEntities).default('none'),
    entityId: optionalEntityId,
  })
  .superRefine((value, ctx) => {
    const entityId = value.entityId ?? null;
    if (value.entityType !== 'none' && !entityId) {
      ctx.addIssue({
        code: 'custom',
        path: ['entityId'],
        message: 'Select a linked entity',
      });
    }
    if (value.entityType === 'none' && entityId) {
      ctx.addIssue({
        code: 'custom',
        path: ['entityId'],
        message: 'Entity id must be empty when no entity is linked',
      });
    }
  });

export type ReminderInput = z.infer<typeof reminderSchema>;
