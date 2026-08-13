import { ClipboardList } from 'lucide-react';
import type { ComponentProps } from 'react';

import { DueDate } from '@/components/dashboard/due-date';
import { sortByOverdueThenDue } from '@/components/dashboard/utils';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { WidgetCard } from '@/components/widget-card';
import { getDb } from '@/db';

const priorityLabels: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const priorityVariants: Record<
  string,
  ComponentProps<typeof Badge>['variant']
> = {
  low: 'outline',
  medium: 'outline',
  high: 'secondary',
  urgent: 'destructive',
};

export async function PendingTasksWidget({
  className,
}: {
  className?: string;
}) {
  const db = await getDb();
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const tasks = await db.query.tasks.findMany({
    where: (t, { and, inArray, lte }) =>
      and(
        inArray(t.status, ['todo', 'in_progress']),
        lte(t.dueDate, sevenDaysFromNow)
      ),
    with: { project: true },
  });

  const sorted = sortByOverdueThenDue(tasks);

  return (
    <WidgetCard
      title="Pending tasks"
      href="/projects"
      icon={ClipboardList}
      className={className}
    >
      {sorted.length === 0 ? (
        <EmptyState
          title="No pending tasks"
          description="Tasks overdue or due within the next 7 days will show up here."
          icon={ClipboardList}
        />
      ) : (
        <ul className="space-y-3">
          {sorted.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium">{task.title}</span>
                {task.project?.name ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {task.project.name}
                  </span>
                ) : null}
                <DueDate date={task.dueDate} />
              </div>
              <Badge
                variant={priorityVariants[task.priority] ?? 'outline'}
                className="shrink-0"
              >
                {priorityLabels[task.priority] ?? task.priority}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
