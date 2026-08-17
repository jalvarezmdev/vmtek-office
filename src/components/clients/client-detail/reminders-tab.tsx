import type { InferSelectModel } from 'drizzle-orm';
import { Bell } from 'lucide-react';

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
import { reminders } from '@/db/schema';
import {
  reminderRepeatLabel,
  reminderStatusLabel,
  reminderStatusVariant,
} from '@/lib/labels';
import { formatDateTime } from '@/lib/money';

export type RemindersTabProps = {
  reminders: InferSelectModel<typeof reminders>[];
};

export function RemindersTab({ reminders: reminderRows }: RemindersTabProps) {
  return (
    <Card>
      <CardContent className="px-0 pt-0">
        {reminderRows.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No reminders"
            description="Reminders for this client will show up here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Repeat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reminderRows.map((reminder) => (
                <TableRow key={reminder.id}>
                  <TableCell className="font-medium">
                    {reminder.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(reminder.dueAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={reminderStatusVariant[reminder.status]}>
                      {reminderStatusLabel[reminder.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {reminderRepeatLabel[reminder.repeat]}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
