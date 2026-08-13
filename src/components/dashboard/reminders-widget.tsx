import { Bell } from 'lucide-react';

import { DueDate } from '@/components/dashboard/due-date';
import {
  sortByOverdueThenDueAt,
  startOfNextDayUtc,
} from '@/components/dashboard/utils';
import { EmptyState } from '@/components/empty-state';
import { WidgetCard } from '@/components/widget-card';
import { getDb } from '@/db';

export async function RemindersWidget({ className }: { className?: string }) {
  const db = await getDb();
  const reminders = await db.query.reminders.findMany({
    where: (r, { and, eq, lt }) =>
      and(eq(r.status, 'pending'), lt(r.dueAt, startOfNextDayUtc(new Date()))),
  });

  const sorted = sortByOverdueThenDueAt(reminders);

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
                <DueDate date={reminder.dueAt} />
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
