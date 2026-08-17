import { count, eq, sum } from 'drizzle-orm';
import { Handshake } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { WidgetCard } from '@/components/widget-card';
import { getDb } from '@/db';
import { negotiations as negotiationsTable } from '@/db/schema';
import { formatCompact, sumByCurrency } from '@/lib/money';

export async function OpenNegotiationsWidget({
  className,
}: {
  className?: string;
}) {
  const db = await getDb();
  const [countResult, pipelineRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(negotiationsTable)
      .where(eq(negotiationsTable.status, 'open')),
    db
      .select({
        currency: negotiationsTable.currency,
        total: sum(negotiationsTable.amount),
      })
      .from(negotiationsTable)
      .where(eq(negotiationsTable.status, 'open'))
      .groupBy(negotiationsTable.currency),
  ]);

  const openCount = countResult[0]?.value ?? 0;
  const pipeline = sumByCurrency(pipelineRows, 'total', 'currency');

  return (
    <WidgetCard
      title="Open negotiations"
      href="/negotiations"
      icon={Handshake}
      className={className}
    >
      {openCount === 0 ? (
        <EmptyState
          title="No open negotiations"
          description="New opportunities will show up here."
          icon={Handshake}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-semibold tabular-nums">
              {openCount}
            </span>
            <span className="text-sm text-muted-foreground">
              {openCount === 1 ? 'open negotiation' : 'open negotiations'}
            </span>
          </div>
          {pipeline.length > 0 ? (
            <dl className="space-y-1.5 border-t pt-3">
              {pipeline.map(({ currency, total }) => (
                <div
                  key={currency}
                  className="flex items-baseline justify-between text-sm"
                >
                  <dt className="text-muted-foreground">
                    Pipeline <span className="font-medium">{currency}</span>
                  </dt>
                  <dd className="font-medium tabular-nums">
                    {formatCompact(total, currency)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      )}
    </WidgetCard>
  );
}
