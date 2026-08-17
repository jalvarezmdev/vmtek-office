import type { InferSelectModel } from 'drizzle-orm';

import { ExpensesTable } from '@/components/expenses/expenses-table';
import { expenses } from '@/db/schema';

export type ProjectExpensesTabProps = {
  expenses: InferSelectModel<typeof expenses>[];
};

export function ExpensesTab({
  expenses: expenseRows,
}: ProjectExpensesTabProps) {
  return (
    <ExpensesTable
      expenses={expenseRows}
      emptyDescription="Expenses for this project will show up here."
    />
  );
}
