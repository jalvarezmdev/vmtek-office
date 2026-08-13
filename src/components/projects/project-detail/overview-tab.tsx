import type { InferSelectModel } from 'drizzle-orm';
import Link from 'next/link';

import { MoneyList } from '@/components/money-list';
import { ProjectProgress } from '@/components/project-progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  clients,
  epics,
  expenses,
  milestones,
  negotiations,
  payments,
  projects,
  tasks,
} from '@/db/schema';
import { formatDate, formatMoney, sumByCurrency } from '@/lib/money';

export type OverviewTabProps = {
  project: InferSelectModel<typeof projects> & {
    client: InferSelectModel<typeof clients> | null;
    negotiation: InferSelectModel<typeof negotiations> | null;
  };
  milestones: Array<
    InferSelectModel<typeof milestones> & {
      payment: InferSelectModel<typeof payments> | null;
    }
  >;
  tasks: Array<
    InferSelectModel<typeof tasks> & {
      epic: InferSelectModel<typeof epics> | null;
    }
  >;
  payments: Array<
    InferSelectModel<typeof payments> & {
      client: InferSelectModel<typeof clients> | null;
    }
  >;
  expenses: InferSelectModel<typeof expenses>[];
};

export function OverviewTab({
  project,
  milestones: milestoneRows,
  tasks: taskRows,
  payments: paymentRows,
  expenses: expenseRows,
}: OverviewTabProps) {
  const milestoneDone = milestoneRows.filter((m) => m.status === 'done').length;
  const milestoneTotal = milestoneRows.length;
  const openTasks = taskRows.filter((t) => t.status !== 'done').length;
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
  const expenseTotal = sumByCurrency(expenseRows, 'amount', 'currency');

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Milestones</dt>
              <dd className="font-medium tabular-nums">
                {milestoneDone}/{milestoneTotal}
              </dd>
            </div>
            <ProjectProgress done={milestoneDone} total={milestoneTotal} />
            <div className="flex items-center justify-between gap-4 pt-1">
              <dt className="text-muted-foreground">Open tasks</dt>
              <dd className="font-medium tabular-nums">{openTasks}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Money</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
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
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Expenses</dt>
              <dd className="font-medium tabular-nums">
                <MoneyList rows={expenseTotal} />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Key info</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Client</dt>
              <dd>
                {project.client ? (
                  <Link
                    href={`/clients/${project.client.id}`}
                    className="font-medium hover:underline"
                  >
                    {project.client.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Internal</span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">From negotiation</dt>
              <dd>
                {project.negotiation ? (
                  <Link
                    href="/negotiations"
                    className="font-medium hover:underline"
                  >
                    {project.negotiation.title}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Start</dt>
              <dd className="tabular-nums">
                {project.startDate ? formatDate(project.startDate) : '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">End</dt>
              <dd className="tabular-nums">
                {project.endDate ? formatDate(project.endDate) : '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Budget</dt>
              <dd className="font-medium tabular-nums">
                {project.budgetAmount != null && project.budgetCurrency ? (
                  formatMoney(project.budgetAmount, project.budgetCurrency)
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
