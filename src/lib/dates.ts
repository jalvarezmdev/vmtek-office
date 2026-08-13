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
