import type { InferSelectModel } from 'drizzle-orm';
import { ListTodo } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import {
  TaskCreateDialog,
  TaskRowActions,
} from '@/components/projects/project-detail/task-dialog';
import type { EpicOption } from '@/components/projects/project-detail/task-form';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  projectId: string;
  epics: EpicOption[];
  tasks: Array<
    InferSelectModel<typeof tasks> & {
      epic: InferSelectModel<typeof epics> | null;
    }
  >;
};

export function TasksTab({ projectId, epics, tasks: taskRows }: TasksTabProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Tasks</CardTitle>
        <CardAction>
          <TaskCreateDialog projectId={projectId} epics={epics} />
        </CardAction>
      </CardHeader>
      <CardContent className="px-0 pt-0">
        {taskRows.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No tasks"
            description="Tasks for this project will show up here."
            action={<TaskCreateDialog projectId={projectId} epics={epics} />}
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
                <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right">
                      <TaskRowActions
                        task={task}
                        projectId={projectId}
                        epics={epics}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
