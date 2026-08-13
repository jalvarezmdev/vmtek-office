import type { Metadata } from 'next';
import { Receipt } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { ExpenseFormDialog } from '@/components/expenses/expense-form-dialog';
import {
  ExpensesListTable,
  type ExpenseListRow,
} from '@/components/expenses/expenses-list-table';
import { Card, CardContent } from '@/components/ui/card';
import { getDb } from '@/db';
import { startOfMonthUtc, startOfNextMonthUtc } from '@/lib/dates';
import { formatMoney, sumByCurrency } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Expenses',
  description: 'Track money going out of VMWTEK.',
};

export default async function ExpensesPage() {
  const db = await getDb();

  const [expenses, clientOptions, projectOptions] = await Promise.all([
    db.query.expenses.findMany({
      with: { client: true, project: true },
      // Most recent first; newest expenses surface at the top.
      orderBy: (expenses, { desc }) => [desc(expenses.date)],
    }),
    db.query.clients.findMany({
      columns: { id: true, name: true },
      orderBy: (clients, { asc }) => [asc(clients.name)],
    }),
    db.query.projects.findMany({
      columns: { id: true, name: true },
      orderBy: (projects, { asc }) => [asc(projects.name)],
    }),
  ]);

  const rows: ExpenseListRow[] = expenses.map((expense) => ({
    id: expense.id,
    amount: expense.amount,
    currency: expense.currency,
    category: expense.category,
    date: expense.date,
    recurring: expense.recurring,
    recurringFrequency: expense.recurringFrequency,
    client: expense.client
      ? { id: expense.client.id, name: expense.client.name }
      : null,
    project: expense.project
      ? { id: expense.project.id, name: expense.project.name }
      : null,
    description: expense.description,
  }));

  const clients = clientOptions.map((client) => ({
    id: client.id,
    name: client.name,
  }));
  const projects = projectOptions.map((project) => ({
    id: project.id,
    name: project.name,
  }));

  // "Spent this month": expenses dated in the current calendar month, per
  // currency. Dates are stored at UTC midnight, so use UTC month bounds.
  const monthStart = startOfMonthUtc(new Date());
  const nextMonthStart = startOfNextMonthUtc(new Date());
  const spent = sumByCurrency(
    expenses.filter(
      (expense) => expense.date >= monthStart && expense.date < nextMonthStart
    ),
    'amount',
    'currency'
  );
  const spentLabel = spent
    .map(({ currency, total }) => formatMoney(total, currency))
    .join(' · ');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            {spent.length > 0 ? (
              <>
                Spent this month:{' '}
                <span className="font-medium text-foreground">
                  {spentLabel}
                </span>
              </>
            ) : (
              'Track money going out of VMWTEK.'
            )}
          </p>
        </div>
        <ExpenseFormDialog clients={clients} projects={projects} />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Receipt}
              title="No expenses yet"
              description="Create your first expense to start tracking money going out of VMWTEK."
              action={
                <ExpenseFormDialog clients={clients} projects={projects} />
              }
            />
          </CardContent>
        </Card>
      ) : (
        <ExpensesListTable rows={rows} clients={clients} projects={projects} />
      )}
    </div>
  );
}
