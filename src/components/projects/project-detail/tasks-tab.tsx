import type { InferSelectModel } from 'drizzle-orm';
import { ListTodo } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { epics, tasks } from '@/db/schema';
import {
  taskPriorityLabel,
  taskPriorityVariant,
  taskStatusLabel,
  taskStatusVariant,
} from '@/lib/labels';
import { formatDate, isOverdue } from '@/lib/money';
import { cn } from '@/lib/utils';

export type TasksTabProps = {
  tasks: Array<
    InferSelectModel<typeof tasks> & {
      epic: InferSelectModel<typeof epics> | null;
    }
  >;
};

export function TasksTab({ tasks: taskRows }: TasksTabProps) {
  return (
    <Card>
      <CardContent className="px-0 pt-0">
        {taskRows.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No tasks"
            description="Tasks for this project will show up here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Epic</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taskRows.map((task) => {
                const overdue =
                  task.status !== 'done' && isOverdue(task.dueDate);
                return (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant={taskStatusVariant[task.status]}>
                        {taskStatusLabel[task.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={taskPriorityVariant[task.priority]}>
                        {taskPriorityLabel[task.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-muted-foreground',
                        overdue && 'font-medium text-destructive'
                      )}
                    >
                      {task.dueDate
                        ? `${formatDate(task.dueDate)}${overdue ? ' (overdue)' : ''}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {task.epic ? task.epic.name : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <p className="border-t pt-3 text-xs text-muted-foreground">
          Tasks are managed from the project edit view.
        </p>
      </CardContent>
    </Card>
  );
}
