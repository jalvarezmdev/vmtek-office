import type { InferSelectModel } from 'drizzle-orm';
import { Layers } from 'lucide-react';

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
import { epicStatusLabel, epicStatusVariant } from '@/lib/labels';

export type EpicsTabProps = {
  epics: Array<
    InferSelectModel<typeof epics> & {
      tasks: InferSelectModel<typeof tasks>[];
    }
  >;
};

export function EpicsTab({ epics: epicRows }: EpicsTabProps) {
  return (
    <Card>
      <CardContent className="px-0 pt-0">
        {epicRows.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No epics"
            description="Epics for this project will show up here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tasks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {epicRows.map((epic) => (
                <TableRow key={epic.id}>
                  <TableCell className="font-medium">{epic.name}</TableCell>
                  <TableCell>
                    <Badge variant={epicStatusVariant[epic.status]}>
                      {epicStatusLabel[epic.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {epic.tasks.length === 0
                      ? 'No tasks'
                      : `${epic.tasks.length} task${epic.tasks.length === 1 ? '' : 's'}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="border-t pt-3 text-xs text-muted-foreground">
          Epics are managed from the project edit view.
        </p>
      </CardContent>
    </Card>
  );
}
