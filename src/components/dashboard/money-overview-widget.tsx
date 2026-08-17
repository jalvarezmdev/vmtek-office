import { Wallet } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { WidgetCard } from '@/components/widget-card';
import { getDb } from '@/db';
import { startOfMonthUtc, startOfNextMonthUtc } from '@/lib/dates';
import { formatMoney, sumByCurrency } from '@/lib/money';
import { cn } from '@/lib/utils';

type CurrencyRow = {
  currency: string;
  received: number;
  expenses: number;
  net: number;
};

export async function MoneyOverviewWidget({
  className,
}: {
  className?: string;
}) {
  const db = await getDb();
  const monthStart = startOfMonthUtc(new Date());
  const nextMonthStart = startOfNextMonthUtc(new Date());

  const [received, expenses] = await Promise.all([
    db.query.payments.findMany({
      where: (p, { and, eq, gte, lt }) =>
        and(
          eq(p.status, 'received'),
          gte(p.receivedDate, monthStart),
          lt(p.receivedDate, nextMonthStart)
        ),
    }),
    db.query.expenses.findMany({
      where: (e, { and, gte, lt }) =>
        and(gte(e.date, monthStart), lt(e.date, nextMonthStart)),
    }),
  ]);

  const rows = mergeMonthTotals(
    sumByCurrency(received, 'amount', 'currency'),
    sumByCurrency(expenses, 'amount', 'currency')
  );

  return (
    <WidgetCard
      title="Money overview"
      href="/payments"
      icon={Wallet}
      className={className}
    >
      {rows.length === 0 ? (
        <EmptyState
          title="No activity this month"
          description="Received payments and expenses will show up here."
          icon={Wallet}
        />
      ) : (
        <dl className="space-y-3">
          {rows.map(({ currency, received: rev, expenses: exp, net }) => (
            <div key={currency} className="space-y-1">
              <div className="flex items-baseline justify-between text-sm">
                <dt className="font-medium">{currency}</dt>
                <dd
                  className={cn(
                    'font-semibold tabular-nums',
                    net < 0 ? 'text-destructive' : 'text-foreground'
                  )}
                >
                  {formatMoney(net, currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                <span>Received {formatMoney(rev, currency)}</span>
                <span>Spent {formatMoney(exp, currency)}</span>
              </div>
            </div>
          ))}
        </dl>
      )}
    </WidgetCard>
  );
}

function mergeMonthTotals(
  received: Array<{ currency: string; total: number }>,
  expenses: Array<{ currency: string; total: number }>
): CurrencyRow[] {
  const totals = new Map<string, { received: number; expenses: number }>();

  for (const { currency, total } of received) {
    totals.set(currency, { received: total, expenses: 0 });
  }
  for (const { currency, total } of expenses) {
    const current = totals.get(currency) ?? { received: 0, expenses: 0 };
    current.expenses = total;
    totals.set(currency, current);
  }

  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, { received: rev, expenses: exp }]) => ({
      currency,
      received: rev,
      expenses: exp,
      net: rev - exp,
    }));
}
