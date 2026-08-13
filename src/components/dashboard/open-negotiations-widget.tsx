import { Handshake } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { WidgetCard } from '@/components/widget-card';
import { getDb } from '@/db';
import { formatCompact, sumByCurrency } from '@/lib/money';

export async function OpenNegotiationsWidget({
  className,
}: {
  className?: string;
}) {
  const db = await getDb();
  const negotiations = await db.query.negotiations.findMany({
    where: (n, { eq }) => eq(n.status, 'open'),
  });

  const count = negotiations.length;
  const pipeline = sumByCurrency(negotiations, 'amount', 'currency');

  return (
    <WidgetCard
      title="Open negotiations"
      href="/negotiations"
      icon={Handshake}
      className={className}
    >
      {count === 0 ? (
        <EmptyState
          title="No open negotiations"
          description="New opportunities will show up here."
          icon={Handshake}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-semibold tabular-nums">{count}</span>
            <span className="text-sm text-muted-foreground">
              {count === 1 ? 'open negotiation' : 'open negotiations'}
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
