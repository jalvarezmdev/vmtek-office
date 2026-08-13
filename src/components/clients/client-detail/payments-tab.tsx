import type { InferSelectModel } from 'drizzle-orm';
import { Banknote } from 'lucide-react';
import Link from 'next/link';

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
import { payments, projects } from '@/db/schema';
import { paymentStatusLabel, paymentStatusVariant } from '@/lib/labels';
import { formatDate, formatMoney } from '@/lib/money';

export type PaymentsTabProps = {
  payments: Array<
    InferSelectModel<typeof payments> & {
      project: InferSelectModel<typeof projects> | null;
    }
  >;
};

export function PaymentsTab({ payments: paymentRows }: PaymentsTabProps) {
  return (
    <Card>
      <CardContent className="px-0 pt-0">
        {paymentRows.length === 0 ? (
          <EmptyState
            icon={Banknote}
            title="No payments"
            description="Payments for this client will show up here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Project</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentRows.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={paymentStatusVariant[payment.status]}>
                      {paymentStatusLabel[payment.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.dueDate ? formatDate(payment.dueDate) : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.receivedDate
                      ? formatDate(payment.receivedDate)
                      : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.project ? (
                      <Link
                        href={`/projects/${payment.project.id}`}
                        className="hover:underline"
                      >
                        {payment.project.name}
                      </Link>
                    ) : (
                      '—'
                    )}
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
