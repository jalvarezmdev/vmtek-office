import type { InferSelectModel } from 'drizzle-orm';
import { Flag } from 'lucide-react';

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
import { milestones, payments } from '@/db/schema';
import {
  milestoneStatusLabel,
  milestoneStatusVariant,
  paymentStatusLabel,
  paymentStatusVariant,
} from '@/lib/labels';
import { formatDate, formatMoney } from '@/lib/money';

export type MilestonesTabProps = {
  milestones: Array<
    InferSelectModel<typeof milestones> & {
      payment: InferSelectModel<typeof payments> | null;
    }
  >;
};

export function MilestonesTab({
  milestones: milestoneRows,
}: MilestonesTabProps) {
  return (
    <Card>
      <CardContent className="px-0 pt-0">
        {milestoneRows.length === 0 ? (
          <EmptyState
            icon={Flag}
            title="No milestones"
            description="Milestones for this project will show up here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Linked payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestoneRows.map((milestone) => (
                <TableRow key={milestone.id}>
                  <TableCell className="font-medium">
                    {milestone.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={milestoneStatusVariant[milestone.status]}>
                      {milestoneStatusLabel[milestone.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {milestone.dueDate ? formatDate(milestone.dueDate) : '—'}
                  </TableCell>
                  <TableCell>
                    {milestone.payment ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="font-medium tabular-nums">
                          {formatMoney(
                            milestone.payment.amount,
                            milestone.payment.currency
                          )}
                        </span>
                        <Badge
                          variant={
                            paymentStatusVariant[milestone.payment.status]
                          }
                        >
                          {paymentStatusLabel[milestone.payment.status]}
                        </Badge>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="border-t pt-3 text-xs text-muted-foreground">
          Milestones are managed from the project edit view.
        </p>
      </CardContent>
    </Card>
  );
}
