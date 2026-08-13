import type { InferSelectModel } from 'drizzle-orm';
import { Handshake } from 'lucide-react';
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
import { negotiations } from '@/db/schema';
import { negotiationStatusLabel, negotiationStatusVariant } from '@/lib/labels';
import { formatMoney } from '@/lib/money';

export type NegotiationsTabProps = {
  negotiations: InferSelectModel<typeof negotiations>[];
};

export function NegotiationsTab({
  negotiations: negotiationRows,
}: NegotiationsTabProps) {
  return (
    <Card>
      <CardContent className="px-0 pt-0">
        {negotiationRows.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="No negotiations"
            description="Deals for this client will show up here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {negotiationRows.map((negotiation) => (
                <TableRow key={negotiation.id}>
                  <TableCell>
                    <Link
                      href={`/negotiations/${negotiation.id}`}
                      className="font-medium hover:underline"
                    >
                      {negotiation.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {negotiation.amount != null
                      ? formatMoney(negotiation.amount, negotiation.currency)
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={negotiationStatusVariant[negotiation.status]}
                    >
                      {negotiationStatusLabel[negotiation.status]}
                    </Badge>
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
