import type { Metadata } from 'next';
import Link from 'next/link';
import { Users } from 'lucide-react';

import { ClientFormDialog } from '@/components/clients/client-form-dialog';
import { EmptyState } from '@/components/empty-state';
import { getDb } from '@/db';
import { formatMoney, sumByCurrency } from '@/lib/money';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const metadata: Metadata = {
  title: 'Clients',
  description: 'Manage the companies and people you work with.',
};

type ClientRow = {
  id: string;
  name: string;
  company: string | null;
  activeProjects: number;
  openNegotiations: number;
  outstanding: Array<{ currency: string; total: number }>;
};

export default async function ClientsPage() {
  const db = await getDb();
  const clients = await db.query.clients.findMany({
    with: {
      projects: {
        where: (projects, { eq }) => eq(projects.status, 'active'),
      },
      negotiations: {
        where: (negotiations, { eq }) => eq(negotiations.status, 'open'),
      },
      payments: {
        where: (payments, { inArray }) =>
          inArray(payments.status, ['pending', 'partial']),
      },
    },
    orderBy: (clients, { asc }) => [asc(clients.name)],
  });

  const rows: ClientRow[] = clients.map((client) => ({
    id: client.id,
    name: client.name,
    company: client.company,
    activeProjects: client.projects.length,
    openNegotiations: client.negotiations.length,
    outstanding: sumByCurrency(client.payments, 'amount', 'currency'),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            The companies and people you work with.
          </p>
        </div>
        <ClientFormDialog />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Users}
              title="No clients yet"
              description="Create your first client to start tracking projects and payments."
              action={<ClientFormDialog />}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="px-0 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Active projects</TableHead>
                  <TableHead className="text-right">
                    Open negotiations
                  </TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-medium hover:underline"
                      >
                        {client.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.company ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {client.activeProjects}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {client.openNegotiations}
                    </TableCell>
                    <TableCell className="text-right">
                      {client.outstanding.length > 0 ? (
                        <span className="inline-flex flex-col items-end">
                          {client.outstanding.map(({ currency, total }) => (
                            <span
                              key={currency}
                              className="font-medium tabular-nums"
                            >
                              {formatMoney(total, currency)}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
