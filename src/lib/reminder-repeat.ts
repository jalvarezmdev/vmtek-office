import { addDays, addMonths, addWeeks } from 'date-fns';

export type ReminderRepeat = 'once' | 'daily' | 'weekly' | 'monthly';

/**
 * The due datetime of the next occurrence of a repeating reminder, or null for
 * a once-only reminder (completed reminders with repeat=once have no next
 * occurrence).
 *
 * Daily and weekly repeats keep the time-of-day of `dueAt`. Monthly repeats use
 * date-fns `addMonths`, which clamps the day-of-month when the target month has
 * fewer days (e.g. Jan 31 + 1 month = Feb 28, or Feb 29 on a leap year).
 */
export function nextDueAt(dueAt: Date, repeat: ReminderRepeat): Date | null {
  switch (repeat) {
    case 'once':
      return null;
    case 'daily':
      return addDays(dueAt, 1);
    case 'weekly':
      return addWeeks(dueAt, 1);
    case 'monthly':
      return addMonths(dueAt, 1);
  }
}
