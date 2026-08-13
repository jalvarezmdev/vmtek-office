import { z } from 'zod';

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date')
  .refine(
    (value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    },
    { message: 'Enter a valid date' }
  );

const dateInstance = z
  .date()
  .refine((value) => !Number.isNaN(value.getTime()), {
    message: 'Enter a valid date',
  });

// Accepts '' | null | undefined (which the actions map to null) or a calendar
// date. YYYY-MM-DD strings are parsed at UTC midnight so the server and client
// render the same business date (see formatDate in money.ts). Dates that JS
// would silently roll over (e.g. 2026-02-30 -> 2026-03-02) or that do not
// exist (e.g. 2026-13-45) are rejected rather than persisted. The string -> Date
// transform stays OUTSIDE the union so date-specific checks surface as
// 'Enter a valid date' instead of zod's generic union 'Invalid input'.
export const dateField = z
  .union([z.literal(''), z.null(), dateInstance, dateString])
  .optional()
  .transform((value): Date | '' | null | undefined => {
    if (value instanceof Date || value == null || value === '') {
      return value;
    }
    return new Date(`${value}T00:00:00.000Z`);
  });

export type DateField = z.infer<typeof dateField>;

// Required variant of dateField: a calendar date must always be present. Used
// by fields the spec makes mandatory (expense.date), which must not accept
// ''/null/undefined. Shares the same YYYY-MM-DD and Date parsing as dateField.
export const requiredDateField = z
  .union([dateInstance, dateString])
  .transform((value): Date => {
    if (value instanceof Date) return value;
    return new Date(`${value}T00:00:00.000Z`);
  });

export type RequiredDateField = z.infer<typeof requiredDateField>;
