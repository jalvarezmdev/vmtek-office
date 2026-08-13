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

export function sortByOverdueThenDue<T extends { dueDate?: Date | null }>(
  rows: T[]
): T[] {
  const now = Date.now();
  return [...rows].sort((a, b) => {
    const aOverdue = a.dueDate ? a.dueDate.getTime() < now : false;
    const bOverdue = b.dueDate ? b.dueDate.getTime() < now : false;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    const aTime = a.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
    const bTime = b.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });
}

export function sortByOverdueThenDueAt<T extends { dueAt: Date }>(
  rows: T[]
): T[] {
  const now = Date.now();
  return [...rows].sort((a, b) => {
    const aOverdue = a.dueAt.getTime() < now;
    const bOverdue = b.dueAt.getTime() < now;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    return a.dueAt.getTime() - b.dueAt.getTime();
  });
}
