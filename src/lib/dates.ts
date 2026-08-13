import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { cookies } from 'next/headers';

function isValidTimeZone(value: string | undefined | null): value is string {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads the admin's timezone from the `tz` cookie, which is written by the
 * client-side <TimezoneProvider />. On the very first request the cookie is
 * absent, so this falls back to 'UTC' until the client has mounted.
 *
 * Task 9 (reminders page) should import getTimezone/startOfLocalDay from here
 * so the dashboard widget and the page share one definition of "today".
 */
export async function getTimezone(): Promise<string> {
  const tz = (await cookies()).get('tz')?.value;
  return isValidTimeZone(tz) ? tz : 'UTC';
}

/** The UTC instant of local midnight of `date`'s calendar day in `timeZone`. */
export function startOfLocalDay(date: Date, timeZone: string): Date {
  const zoned = toZonedTime(date, timeZone);
  return fromZonedTime(
    new Date(zoned.getFullYear(), zoned.getMonth(), zoned.getDate()),
    timeZone
  );
}

/** The UTC instant of local midnight of the day after `date`'s in `timeZone`. */
export function startOfNextLocalDay(date: Date, timeZone: string): Date {
  const zoned = toZonedTime(date, timeZone);
  return fromZonedTime(
    new Date(zoned.getFullYear(), zoned.getMonth(), zoned.getDate() + 1),
    timeZone
  );
}

export function startOfNextDayUtc(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1)
  );
}

export function startOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function startOfNextMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

export function sortByOverdueThenDue<T>(
  rows: T[],
  getDue: (row: T) => Date | null | undefined
): T[] {
  const now = Date.now();
  return [...rows].sort((a, b) => {
    const aDue = getDue(a);
    const bDue = getDue(b);
    const aOverdue = aDue ? aDue.getTime() < now : false;
    const bOverdue = bDue ? bDue.getTime() < now : false;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    const aTime = aDue?.getTime() ?? Number.POSITIVE_INFINITY;
    const bTime = bDue?.getTime() ?? Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });
}
