import type { InferSelectModel } from 'drizzle-orm';
import { Users } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { MoneyList } from '@/components/money-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { negotiations, payments, projects } from '@/db/schema';
import { sumByCurrency } from '@/lib/money';

export type OverviewTabProps = {
  email: string | null;
  phone: string | null;
  address: string | null;
  projects: InferSelectModel<typeof projects>[];
  negotiations: InferSelectModel<typeof negotiations>[];
  payments: InferSelectModel<typeof payments>[];
};

export function OverviewTab({
  email,
  phone,
  address,
  projects: projectRows,
  negotiations: negotiationRows,
  payments: paymentRows,
}: OverviewTabProps) {
  const activeProjects = projectRows.filter(
    (p) => p.status === 'active'
  ).length;
  const openNegotiations = negotiationRows.filter(
    (n) => n.status === 'open'
  ).length;
  const received = sumByCurrency(
    paymentRows.filter((p) => p.status === 'received'),
    'amount',
    'currency'
  );
  const outstanding = sumByCurrency(
    paymentRows.filter((p) => p.status === 'pending' || p.status === 'partial'),
    'amount',
    'currency'
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent>
          {email || phone || address ? (
            <dl className="space-y-3 text-sm">
              {email ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{email}</dd>
                </div>
              ) : null}
              {phone ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{phone}</dd>
                </div>
              ) : null}
              {address ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Address</dt>
                  <dd>{address}</dd>
                </div>
              ) : null}
            </dl>
          ) : (
            <EmptyState
              icon={Users}
              title="No contact details"
              description="Add an email, phone, or address to keep in touch with this client."
            />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>At a glance</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Active projects</dt>
              <dd className="font-medium tabular-nums">{activeProjects}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Open negotiations</dt>
              <dd className="font-medium tabular-nums">{openNegotiations}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Received</dt>
              <dd className="font-medium tabular-nums">
                <MoneyList rows={received} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Outstanding</dt>
              <dd className="font-medium tabular-nums">
                <MoneyList rows={outstanding} />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
