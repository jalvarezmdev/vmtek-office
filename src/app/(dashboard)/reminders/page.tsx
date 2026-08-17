import type { InferSelectModel } from 'drizzle-orm';
import { formatInTimeZone } from 'date-fns-tz';
import { Bell } from 'lucide-react';
import type { Metadata } from 'next';

import { EmptyState } from '@/components/empty-state';
import { ReminderFormDialog } from '@/components/reminders/reminder-form-dialog';
import {
  RemindersTable,
  type ReminderEntityContext,
} from '@/components/reminders/reminders-table';
import { Card, CardContent } from '@/components/ui/card';
import { getDb } from '@/db';
import { reminders } from '@/db/schema';
import { getTimezone, startOfNextLocalDay } from '@/lib/dates';
import { buildEntityContexts, entityHrefs } from '@/lib/entity-labels';
import type { ReminderEntityOptions } from '@/lib/reminder-entities';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Reminders',
  description: 'Track due dates across VMWTEK.',
};

type ReminderRow = InferSelectModel<typeof reminders>;

type ReminderGroups = {
  overdue: ReminderRow[];
  today: ReminderRow[];
  upcoming: Array<{ dateKey: string; label: string; rows: ReminderRow[] }>;
  past: ReminderRow[];
};

function groupReminders(
  rows: ReminderRow[],
  now: Date,
  timeZone: string
): ReminderGroups {
  const startTomorrow = startOfNextLocalDay(now, timeZone);
  const overdue: ReminderRow[] = [];
  const today: ReminderRow[] = [];
  const upcomingMap = new Map<
    string,
    { dateKey: string; label: string; rows: ReminderRow[] }
  >();
  const past: ReminderRow[] = [];

  for (const row of rows) {
    if (row.status !== 'pending') {
      past.push(row);
      continue;
    }
    const due = row.dueAt.getTime();
    if (due < now.getTime()) {
      overdue.push(row);
    } else if (due < startTomorrow.getTime()) {
      today.push(row);
    } else {
      const dateKey = formatInTimeZone(row.dueAt, timeZone, 'yyyy-MM-dd');
      const label = formatInTimeZone(row.dueAt, timeZone, 'EEEE, MMM d');
      const group = upcomingMap.get(dateKey);
      if (group) {
        group.rows.push(row);
      } else {
        upcomingMap.set(dateKey, { dateKey, label, rows: [row] });
      }
    }
  }

  return {
    overdue,
    today,
    upcoming: [...upcomingMap.values()],
    // Ascending due order from the query; newest due last-completed first.
    past: past.reverse(),
  };
}

export default async function RemindersPage() {
  const db = await getDb();
  const timeZone = await getTimezone();

  const [
    reminderRows,
    clientRows,
    projectRows,
    taskRows,
    paymentRows,
    negotiationRows,
    milestoneRows,
  ] = await Promise.all([
    db.query.reminders.findMany({
      orderBy: (r, { asc }) => [asc(r.dueAt)],
    }),
    db.query.clients.findMany({
      columns: { id: true, name: true },
      orderBy: (c, { asc }) => [asc(c.name)],
    }),
    db.query.projects.findMany({
      columns: { id: true, name: true },
      orderBy: (p, { asc }) => [asc(p.name)],
    }),
    db.query.tasks.findMany({
      columns: { id: true, title: true },
      orderBy: (t, { asc }) => [asc(t.title)],
    }),
    db.query.payments.findMany({
      columns: { id: true, description: true },
      orderBy: (p, { asc }) => [asc(p.createdAt)],
    }),
    db.query.negotiations.findMany({
      columns: { id: true, title: true },
      orderBy: (n, { asc }) => [asc(n.title)],
    }),
    db.query.milestones.findMany({
      columns: { id: true, name: true },
      orderBy: (m, { asc }) => [asc(m.name)],
    }),
  ]);

  const entityOptions: ReminderEntityOptions = {
    clients: clientRows.map((client) => ({
      id: client.id,
      label: client.name,
    })),
    projects: projectRows.map((project) => ({
      id: project.id,
      label: project.name,
    })),
    tasks: taskRows.map((task) => ({ id: task.id, label: task.title })),
    payments: paymentRows.map((payment) => ({
      id: payment.id,
      label: payment.description ?? 'Payment',
    })),
    negotiations: negotiationRows.map((negotiation) => ({
      id: negotiation.id,
      label: negotiation.title,
    })),
    milestones: milestoneRows.map((milestone) => ({
      id: milestone.id,
      label: milestone.name,
    })),
  };

  const contexts = await buildEntityContexts(db, reminderRows, entityHrefs);
  const groups = groupReminders(reminderRows, new Date(), timeZone);

  const hasReminders = reminderRows.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Reminders</h1>
          <p className="text-sm text-muted-foreground">
            Upcoming, overdue, and past due dates across VMWTEK.
          </p>
        </div>
        <ReminderFormDialog entityOptions={entityOptions} />
      </div>

      {!hasReminders ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Bell}
              title="No reminders yet"
              description="Create your first reminder to track a due date across VMWTEK."
              action={<ReminderFormDialog entityOptions={entityOptions} />}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.overdue.length > 0 ? (
            <RemindersSection
              title="Overdue"
              count={groups.overdue.length}
              destructive
              rows={groups.overdue}
              contexts={contexts}
              entityOptions={entityOptions}
              timeZone={timeZone}
            />
          ) : null}
          {groups.today.length > 0 ? (
            <RemindersSection
              title="Today"
              count={groups.today.length}
              rows={groups.today}
              contexts={contexts}
              entityOptions={entityOptions}
              timeZone={timeZone}
            />
          ) : null}
          {groups.upcoming.map((group) => (
            <RemindersSection
              key={group.dateKey}
              title={group.label}
              count={group.rows.length}
              rows={group.rows}
              contexts={contexts}
              entityOptions={entityOptions}
              timeZone={timeZone}
            />
          ))}
          {groups.past.length > 0 ? (
            <RemindersSection
              title="Completed / dismissed"
              count={groups.past.length}
              muted
              rows={groups.past}
              contexts={contexts}
              entityOptions={entityOptions}
              timeZone={timeZone}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function RemindersSection({
  title,
  count,
  destructive,
  muted,
  rows,
  contexts,
  entityOptions,
  timeZone,
}: {
  title: string;
  count: number;
  destructive?: boolean;
  muted?: boolean;
  rows: ReminderRow[];
  contexts: Record<string, ReminderEntityContext | null>;
  entityOptions: ReminderEntityOptions;
  timeZone: string;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <h2
          className={cn(
            'text-lg font-semibold tracking-tight',
            destructive && 'text-destructive',
            muted && 'text-muted-foreground'
          )}
        >
          {title}
        </h2>
        <span className="text-sm text-muted-foreground">{count}</span>
      </div>
      <Card>
        <CardContent className="px-0 pt-0">
          <RemindersTable
            rows={rows}
            contexts={contexts}
            entityOptions={entityOptions}
            timeZone={timeZone}
            dueClassName={
              destructive ? 'text-destructive font-medium' : undefined
            }
          />
        </CardContent>
      </Card>
    </section>
  );
}
