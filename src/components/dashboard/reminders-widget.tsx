import { Bell } from 'lucide-react';

import { DueDate } from '@/components/dashboard/due-date';
import { EmptyState } from '@/components/empty-state';
import { WidgetCard } from '@/components/widget-card';
import { getDb } from '@/db';
import { sortByOverdueThenDue, startOfNextDayUtc } from '@/lib/dates';

export async function RemindersWidget({ className }: { className?: string }) {
  const db = await getDb();
  const reminders = await db.query.reminders.findMany({
    where: (r, { and, eq, lt }) =>
      // "Due today or overdue" is currently bounded by a UTC day. This may be
      // revisited once the product decides on local-timezone semantics.
      and(eq(r.status, 'pending'), lt(r.dueAt, startOfNextDayUtc(new Date()))),
    orderBy: (r, { asc }) => [asc(r.dueAt)],
    limit: 8,
  });

  const sorted = sortByOverdueThenDue(reminders, (reminder) => reminder.dueAt);

  return (
    <WidgetCard
      title="Reminders"
      href="/reminders"
      icon={Bell}
      className={className}
    >
      {sorted.length === 0 ? (
        <EmptyState
          title="No reminders due"
          description="You are all caught up."
          icon={Bell}
        />
      ) : (
        <ul className="space-y-3">
          {sorted.map((reminder) => (
            <li key={reminder.id} className="flex flex-col gap-0.5">
              <span className="truncate font-medium">{reminder.title}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <DueDate date={reminder.dueAt} showTime />
                {reminder.entityType !== 'none' ? (
                  <span className="capitalize">{reminder.entityType}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
