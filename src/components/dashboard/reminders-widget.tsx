import { Bell } from 'lucide-react';

import { DueDate } from '@/components/dashboard/due-date';
import { EmptyState } from '@/components/empty-state';
import { WidgetCard } from '@/components/widget-card';
import { getDb } from '@/db';
import {
  getTimezone,
  sortByOverdueThenDue,
  startOfLocalDay,
  startOfNextLocalDay,
} from '@/lib/dates';

export async function RemindersWidget({ className }: { className?: string }) {
  const db = await getDb();
  const timeZone = await getTimezone();
  const now = new Date();
  const reminders = await db.query.reminders.findMany({
    where: (r, { and, eq, gte, lt, or }) =>
      // "Due today or overdue" is bounded by the admin's local day (from the
      // tz cookie), not a UTC day. On the very first request before the cookie
      // is set, getTimezone() falls back to UTC.
      and(
        eq(r.status, 'pending'),
        or(
          lt(r.dueAt, now),
          and(
            gte(r.dueAt, startOfLocalDay(now, timeZone)),
            lt(r.dueAt, startOfNextLocalDay(now, timeZone))
          )
        )
      ),
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
                <DueDate date={reminder.dueAt} showTime timeZone={timeZone} />
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
