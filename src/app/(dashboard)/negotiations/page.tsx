import type { Metadata } from 'next';
import { Handshake } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import {
  NegotiationCard,
  type NegotiationCardProps,
} from '@/components/negotiations/negotiation-card';
import { NegotiationFormDialog } from '@/components/negotiations/negotiation-form-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDb } from '@/db';
import { negotiationStatusLabel } from '@/lib/labels';
import { formatMoney, sumByCurrency } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Negotiations',
  description: 'Track the sales pipeline before projects start.',
};

const pipelineStatuses = ['open', 'won', 'lost'] as const;

export default async function NegotiationsPage() {
  const db = await getDb();

  const [negotiations, clientOptions] = await Promise.all([
    db.query.negotiations.findMany({
      with: { client: true },
      // Pipeline ordering: soonest expected close first; nulls last (Postgres
      // default), with newest deals as a tiebreaker.
      orderBy: (negotiations, { asc, desc }) => [
        asc(negotiations.expectedCloseDate),
        desc(negotiations.createdAt),
      ],
    }),
    db.query.clients.findMany({
      columns: { id: true, name: true },
      orderBy: (clients, { asc }) => [asc(clients.name)],
    }),
  ]);

  const clients = clientOptions.map((client) => ({
    id: client.id,
    name: client.name,
  }));

  const openNegotiations = negotiations.filter((n) => n.status === 'open');
  const pipeline = sumByCurrency(openNegotiations, 'amount', 'currency');
  const pipelineLabel = pipeline
    .map(({ currency, total }) => formatMoney(total, currency))
    .join(' · ');

  const rowsByStatus: Record<
    (typeof pipelineStatuses)[number],
    NegotiationCardProps[]
  > = {
    open: [],
    won: [],
    lost: [],
  };

  for (const negotiation of negotiations) {
    rowsByStatus[negotiation.status].push({
      negotiation,
      clientName: negotiation.client?.name ?? null,
      clients,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Negotiations
          </h1>
          <p className="text-sm text-muted-foreground">
            {pipeline.length > 0 ? (
              <>
                Pipeline:{' '}
                <span className="font-medium text-foreground">
                  {pipelineLabel}
                </span>
              </>
            ) : (
              'Deals before they become projects.'
            )}
          </p>
        </div>
        <NegotiationFormDialog clients={clients} />
      </div>

      {negotiations.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Handshake}
              title="No negotiations yet"
              description="Create your first negotiation to start building a sales pipeline."
              action={<NegotiationFormDialog clients={clients} />}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-3">
          {pipelineStatuses.map((status) => {
            const rows = rowsByStatus[status];
            return (
              <Card key={status}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{negotiationStatusLabel[status]}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {rows.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No {negotiationStatusLabel[status].toLowerCase()}{' '}
                      negotiations.
                    </p>
                  ) : (
                    rows.map(({ negotiation, clientName, clients }) => (
                      <NegotiationCard
                        key={negotiation.id}
                        negotiation={negotiation}
                        clientName={clientName}
                        clients={clients}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
