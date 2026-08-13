import { Banknote } from 'lucide-react';

import { DueDate } from '@/components/dashboard/due-date';
import { sortByOverdueThenDue } from '@/components/dashboard/utils';
import { EmptyState } from '@/components/empty-state';
import { WidgetCard } from '@/components/widget-card';
import { getDb } from '@/db';
import { formatMoney, sumByCurrency } from '@/lib/money';

export async function PendingPaymentsWidget({
  className,
}: {
  className?: string;
}) {
  const db = await getDb();
  const payments = await db.query.payments.findMany({
    where: (p, { inArray }) => inArray(p.status, ['pending', 'partial']),
    with: { project: true, client: true },
  });

  const sorted = sortByOverdueThenDue(payments);
  const totals = sumByCurrency(payments, 'amount', 'currency');

  return (
    <WidgetCard
      title="Pending payments"
      href="/payments"
      icon={Banknote}
      className={className}
      footer={
        totals.length > 0 ? (
          <dl className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1">
            {totals.map(({ currency, total }) => (
              <div
                key={currency}
                className="flex items-baseline gap-1.5 text-sm"
              >
                <dt className="text-xs text-muted-foreground">{currency}</dt>
                <dd className="font-semibold tabular-nums">
                  {formatMoney(total, currency)}
                </dd>
              </div>
            ))}
          </dl>
        ) : undefined
      }
    >
      {sorted.length === 0 ? (
        <EmptyState
          title="No pending payments"
          description="Nothing outstanding right now."
          icon={Banknote}
        />
      ) : (
        <ul className="space-y-3">
          {sorted.map((payment) => {
            const context = payment.project?.name ?? payment.client?.name;
            return (
              <li
                key={payment.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-medium tabular-nums">
                    {formatMoney(payment.amount, payment.currency)}
                  </span>
                  {context ? (
                    <span className="truncate text-xs text-muted-foreground">
                      {context}
                    </span>
                  ) : null}
                  <DueDate date={payment.dueDate} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}
