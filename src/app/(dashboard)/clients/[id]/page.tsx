import { eq } from 'drizzle-orm';
import { Mail, MapPin, Phone } from 'lucide-react';
import { notFound } from 'next/navigation';

import { ClientActions } from '@/components/clients/client-actions';
import { ExpensesTab } from '@/components/clients/client-detail/expenses-tab';
import { NegotiationsTab } from '@/components/clients/client-detail/negotiations-tab';
import { NotesTab } from '@/components/clients/client-detail/notes-tab';
import { OverviewTab } from '@/components/clients/client-detail/overview-tab';
import { PaymentsTab } from '@/components/clients/client-detail/payments-tab';
import { ProjectsTab } from '@/components/clients/client-detail/projects-tab';
import { RemindersTab } from '@/components/clients/client-detail/reminders-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDb } from '@/db';
import { clients } from '@/db/schema';
import { formatDate } from '@/lib/money';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, id),
    with: {
      projects: {
        with: { milestones: true },
        orderBy: (projects, { desc }) => [desc(projects.createdAt)],
      },
      negotiations: {
        orderBy: (negotiations, { desc }) => [desc(negotiations.createdAt)],
      },
      payments: {
        with: { project: true },
        orderBy: (payments, { desc }) => [desc(payments.createdAt)],
      },
      expenses: {
        orderBy: (expenses, { desc }) => [desc(expenses.date)],
      },
    },
  });

  if (!client) notFound();

  const [notes, reminders] = await Promise.all([
    db.query.notes.findMany({
      where: (n, { and, eq }) =>
        and(eq(n.entityType, 'client'), eq(n.entityId, id)),
      orderBy: (n, { desc }) => [desc(n.createdAt)],
    }),
    db.query.reminders.findMany({
      where: (r, { and, eq }) =>
        and(eq(r.entityType, 'client'), eq(r.entityId, id)),
      orderBy: (r, { asc }) => [asc(r.dueAt)],
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {client.name}
          </h1>
          <ClientActions client={client} />
        </div>
        {client.company ? (
          <p className="text-sm text-muted-foreground">{client.company}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Client since {formatDate(client.createdAt)}
        </p>
        {client.email || client.phone || client.address ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            {client.email ? (
              <span className="inline-flex items-center gap-1.5">
                <Mail aria-hidden="true" className="size-4" />
                {client.email}
              </span>
            ) : null}
            {client.phone ? (
              <span className="inline-flex items-center gap-1.5">
                <Phone aria-hidden="true" className="size-4" />
                {client.phone}
              </span>
            ) : null}
            {client.address ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-4" />
                {client.address}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="negotiations">Negotiations</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <OverviewTab
            email={client.email}
            phone={client.phone}
            address={client.address}
            projects={client.projects}
            negotiations={client.negotiations}
            payments={client.payments}
          />
        </TabsContent>

        <TabsContent value="projects">
          <ProjectsTab projects={client.projects} />
        </TabsContent>

        <TabsContent value="negotiations">
          <NegotiationsTab negotiations={client.negotiations} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTab payments={client.payments} />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesTab expenses={client.expenses} />
        </TabsContent>

        <TabsContent value="notes">
          <NotesTab notes={notes} />
        </TabsContent>

        <TabsContent value="reminders">
          <RemindersTab reminders={reminders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
