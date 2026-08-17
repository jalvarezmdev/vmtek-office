import type { InferSelectModel } from 'drizzle-orm';

import { ExpensesTable } from '@/components/expenses/expenses-table';
import { expenses } from '@/db/schema';

export type ExpensesTabProps = {
  expenses: InferSelectModel<typeof expenses>[];
};

export function ExpensesTab({ expenses: expenseRows }: ExpensesTabProps) {
  return (
    <ExpensesTable
      expenses={expenseRows}
      emptyDescription="Expenses for this client will show up here."
    />
  );
}
