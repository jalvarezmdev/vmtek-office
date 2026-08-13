import type { Metadata } from 'next';
import { Banknote } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { PaymentFormDialog } from '@/components/payments/payment-form-dialog';
import {
  PaymentsListTable,
  type PaymentListRow,
} from '@/components/payments/payments-list-table';
import { Card, CardContent } from '@/components/ui/card';
import { getDb } from '@/db';
import { formatMoney, sumByCurrency } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Payments',
  description: 'Track money coming into VMWTEK.',
};

export default async function PaymentsPage() {
  const db = await getDb();

  const [payments, clientOptions, projectOptions] = await Promise.all([
    db.query.payments.findMany({
      with: { client: true, project: true },
      // Soonest due date first (nulls last, Postgres default) so overdue
      // payments surface at the top; newest payments break ties.
      orderBy: (payments, { asc, desc }) => [
        asc(payments.dueDate),
        desc(payments.createdAt),
      ],
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

  const rows: PaymentListRow[] = payments.map((payment) => ({
    id: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    client: payment.client
      ? { id: payment.client.id, name: payment.client.name }
      : null,
    project: payment.project
      ? { id: payment.project.id, name: payment.project.name }
      : null,
    dueDate: payment.dueDate,
    receivedDate: payment.receivedDate,
    description: payment.description,
  }));

  const clients = clientOptions.map((client) => ({
    id: client.id,
    name: client.name,
  }));
  const projects = projectOptions.map((project) => ({
    id: project.id,
    name: project.name,
  }));

  // "Money you're waiting on": everything not yet received, per currency.
  const outstanding = sumByCurrency(
    payments.filter((payment) => payment.status !== 'received'),
    'amount',
    'currency'
  );
  const outstandingLabel = outstanding
    .map(({ currency, total }) => formatMoney(total, currency))
    .join(' · ');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">
            {outstanding.length > 0 ? (
              <>
                Outstanding:{' '}
                <span className="font-medium text-foreground">
                  {outstandingLabel}
                </span>
              </>
            ) : (
              'Money owed to and received by VMWTEK.'
            )}
          </p>
        </div>
        <PaymentFormDialog clients={clients} projects={projects} />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Banknote}
              title="No payments yet"
              description="Create your first payment to start tracking money coming into VMWTEK."
              action={
                <PaymentFormDialog clients={clients} projects={projects} />
              }
            />
          </CardContent>
        </Card>
      ) : (
        <PaymentsListTable rows={rows} clients={clients} projects={projects} />
      )}
    </div>
  );
}
