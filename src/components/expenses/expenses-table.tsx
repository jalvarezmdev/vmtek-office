import type { InferSelectModel } from 'drizzle-orm';
import { Receipt } from 'lucide-react';

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
import { expenses } from '@/db/schema';
import { expenseCategoryLabel } from '@/lib/labels';
import { formatDate, formatMoney } from '@/lib/money';

export type ExpenseRow = InferSelectModel<typeof expenses>;

type ExpensesTableProps = {
  expenses: ExpenseRow[];
  emptyDescription: string;
};

export function ExpensesTable({
  expenses: expenseRows,
  emptyDescription,
}: ExpensesTableProps) {
  return (
    <Card>
      <CardContent className="px-0 pt-0">
        {expenseRows.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses"
            description={emptyDescription}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recurring</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseRows.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMoney(expense.amount, expense.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {expenseCategoryLabel[expense.category]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(expense.date)}
                  </TableCell>
                  <TableCell>
                    {expense.recurring ? (
                      <Badge variant="outline">Recurring</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
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
