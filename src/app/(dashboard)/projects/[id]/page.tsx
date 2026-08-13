import { eq } from 'drizzle-orm';
import { Calendar, Wallet } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProjectActions } from '@/components/projects/project-actions';
import { EpicsTab } from '@/components/projects/project-detail/epics-tab';
import { ExpensesTab } from '@/components/projects/project-detail/expenses-tab';
import { MilestonesTab } from '@/components/projects/project-detail/milestones-tab';
import { NotesTab } from '@/components/projects/project-detail/notes-tab';
import { OverviewTab } from '@/components/projects/project-detail/overview-tab';
import { PaymentsTab } from '@/components/projects/project-detail/payments-tab';
import { RemindersTab } from '@/components/projects/project-detail/reminders-tab';
import { TasksTab } from '@/components/projects/project-detail/tasks-tab';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDb } from '@/db';
import { projects } from '@/db/schema';
import {
  paymentStatusLabel,
  projectStatusLabel,
  projectStatusVariant,
} from '@/lib/labels';
import { formatDate, formatMoney } from '@/lib/money';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();

  const [project, notes, reminders, clientOptions, negotiationOptions] =
    await Promise.all([
      db.query.projects.findFirst({
        where: eq(projects.id, id),
        with: {
          client: true,
          negotiation: true,
          milestones: {
            with: { payment: true },
            orderBy: (milestones, { asc }) => [asc(milestones.createdAt)],
          },
          epics: {
            with: { tasks: true },
            orderBy: (epics, { asc }) => [asc(epics.createdAt)],
          },
          tasks: {
            with: { epic: true },
            orderBy: (tasks, { asc }) => [asc(tasks.createdAt)],
          },
          payments: {
            with: { client: true },
            orderBy: (payments, { desc }) => [desc(payments.createdAt)],
          },
          expenses: {
            orderBy: (expenses, { desc }) => [desc(expenses.date)],
          },
        },
      }),
      db.query.notes.findMany({
        where: (n, { and, eq }) =>
          and(eq(n.entityType, 'project'), eq(n.entityId, id)),
        orderBy: (n, { desc }) => [desc(n.createdAt)],
      }),
      db.query.reminders.findMany({
        where: (r, { and, eq }) =>
          and(eq(r.entityType, 'project'), eq(r.entityId, id)),
        orderBy: (r, { asc }) => [asc(r.dueAt)],
      }),
      db.query.clients.findMany({
        columns: { id: true, name: true },
        orderBy: (clients, { asc }) => [asc(clients.name)],
      }),
      db.query.negotiations.findMany({
        columns: { id: true, title: true, clientId: true },
        // Only open and won negotiations are linkable to a project.
        where: (negotiations, { inArray }) =>
          inArray(negotiations.status, ['open', 'won']),
        orderBy: (negotiations, { asc }) => [asc(negotiations.title)],
      }),
    ]);

  if (!project) notFound();

  const clients = clientOptions.map((client) => ({
    id: client.id,
    name: client.name,
  }));

  // Keep the currently linked negotiation in the Select even if it later moved
  // to 'lost', so editing the project never silently clears the link.
  const negotiations = [...negotiationOptions];
  if (
    project.negotiationId &&
    project.negotiation &&
    !negotiations.some(
      (negotiation) => negotiation.id === project.negotiationId
    )
  ) {
    negotiations.push({
      id: project.negotiationId,
      title: project.negotiation.title,
      clientId: project.negotiation.clientId,
    });
  }

  const paymentOptions = project.payments.map((payment) => ({
    id: payment.id,
    label: `${formatMoney(payment.amount, payment.currency)} · ${paymentStatusLabel[payment.status]}`,
  }));

  const epicOptions = project.epics.map((epic) => ({
    id: epic.id,
    name: epic.name,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
              <Badge variant={projectStatusVariant[project.status]}>
                {projectStatusLabel[project.status]}
              </Badge>
            </div>
            {project.client ? (
              <p className="text-sm text-muted-foreground">
                Client:{' '}
                <Link
                  href={`/clients/${project.client.id}`}
                  className="font-medium hover:underline"
                >
                  {project.client.name}
                </Link>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Internal project</p>
            )}
          </div>
          <ProjectActions
            project={{
              id: project.id,
              name: project.name,
              description: project.description,
              status: project.status,
              clientId: project.clientId,
              negotiationId: project.negotiationId,
              startDate: project.startDate,
              endDate: project.endDate,
              budgetCurrency: project.budgetCurrency,
              budgetAmount: project.budgetAmount,
            }}
            clients={clients}
            negotiations={negotiations}
          />
        </div>
        {project.description ? (
          <p className="text-sm text-muted-foreground">{project.description}</p>
        ) : null}
        {project.startDate || project.endDate ? (
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar aria-hidden="true" className="size-4" />
            <span>
              {project.startDate ? formatDate(project.startDate) : '—'}
              {' – '}
              {project.endDate ? formatDate(project.endDate) : '—'}
            </span>
          </p>
        ) : null}
        {project.budgetAmount != null && project.budgetCurrency ? (
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Wallet aria-hidden="true" className="size-4" />
            <span>
              Budget:{' '}
              {formatMoney(project.budgetAmount, project.budgetCurrency)}
            </span>
          </p>
        ) : null}
      </div>

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="epics">Epics</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <OverviewTab
            project={project}
            milestones={project.milestones}
            tasks={project.tasks}
            payments={project.payments}
            expenses={project.expenses}
          />
        </TabsContent>

        <TabsContent value="milestones">
          <MilestonesTab
            projectId={project.id}
            payments={paymentOptions}
            milestones={project.milestones}
          />
        </TabsContent>

        <TabsContent value="epics">
          <EpicsTab projectId={project.id} epics={project.epics} />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTab
            projectId={project.id}
            epics={epicOptions}
            tasks={project.tasks}
          />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTab payments={project.payments} />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesTab expenses={project.expenses} />
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
