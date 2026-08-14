import { z } from 'zod';

import { noteEntityEnum } from '@/db/schema';

const noteEntities = noteEntityEnum.enumValues;

// Polymorphic link: '' | null | undefined become null in the DB. A non-null
// value is validated against the referenced table in the action.
const optionalEntityId = z
  .string()
  .trim()
  .min(1)
  .optional()
  .or(z.literal(''))
  .nullable();

export const noteSchema = z
  .object({
    body: z.string().trim().min(1, 'Note cannot be empty'),
    entityType: z.enum(noteEntities).default('none'),
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

export type NoteInput = z.infer<typeof noteSchema>;
