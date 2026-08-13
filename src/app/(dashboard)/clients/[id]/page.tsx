import type { ComponentProps } from 'react';
import { eq } from 'drizzle-orm';
import {
  Banknote,
  Bell,
  FolderKanban,
  Handshake,
  Mail,
  MapPin,
  Phone,
  Receipt,
  StickyNote,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ClientActions } from '@/components/clients/client-actions';
import { EmptyState } from '@/components/empty-state';
import { ProjectProgress } from '@/components/project-progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDb } from '@/db';
import {
  clients,
  expenseCategoryEnum,
  negotiationStatusEnum,
  paymentStatusEnum,
  projectStatusEnum,
  reminderRepeatEnum,
  reminderStatusEnum,
} from '@/db/schema';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  sumByCurrency,
} from '@/lib/money';

type ProjectStatus = (typeof projectStatusEnum.enumValues)[number];
type NegotiationStatus = (typeof negotiationStatusEnum.enumValues)[number];
type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
type ExpenseCategory = (typeof expenseCategoryEnum.enumValues)[number];
type ReminderStatus = (typeof reminderStatusEnum.enumValues)[number];
type ReminderRepeat = (typeof reminderRepeatEnum.enumValues)[number];

type BadgeVariant = ComponentProps<typeof Badge>['variant'];

const projectStatusLabels: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
};

const projectStatusVariants: Record<ProjectStatus, BadgeVariant> = {
  planning: 'outline',
  active: 'default',
  paused: 'secondary',
  completed: 'default',
  archived: 'outline',
};

const negotiationStatusLabels: Record<NegotiationStatus, string> = {
  open: 'Open',
  won: 'Won',
  lost: 'Lost',
};

const negotiationStatusVariants: Record<NegotiationStatus, BadgeVariant> = {
  open: 'default',
  won: 'secondary',
  lost: 'destructive',
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: 'Pending',
  partial: 'Partial',
  received: 'Received',
};

const paymentStatusVariants: Record<PaymentStatus, BadgeVariant> = {
  pending: 'outline',
  partial: 'secondary',
  received: 'default',
};

const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  software: 'Software',
  hardware: 'Hardware',
  subcontractors: 'Subcontractors',
  marketing: 'Marketing',
  travel: 'Travel',
  office: 'Office',
  other: 'Other',
};

const reminderStatusLabels: Record<ReminderStatus, string> = {
  pending: 'Pending',
  done: 'Done',
  dismissed: 'Dismissed',
};

const reminderStatusVariants: Record<ReminderStatus, BadgeVariant> = {
  pending: 'default',
  done: 'secondary',
  dismissed: 'outline',
};

const reminderRepeatLabels: Record<ReminderRepeat, string> = {
  once: 'Once',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

function MoneyList({
  rows,
}: {
  rows: Array<{ currency: string; total: number }>;
}) {
  if (rows.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      {rows.map(({ currency, total }) => (
        <span key={currency}>{formatMoney(total, currency)}</span>
      ))}
    </span>
  );
}

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

  const activeProjects = client.projects.filter((p) => p.status === 'active');
  const openNegotiations = client.negotiations.filter(
    (n) => n.status === 'open'
  );
  const received = sumByCurrency(
    client.payments.filter((p) => p.status === 'received'),
    'amount',
    'currency'
  );
  const outstanding = sumByCurrency(
    client.payments.filter(
      (p) => p.status === 'pending' || p.status === 'partial'
    ),
    'amount',
    'currency'
  );

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
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent>
                {client.email || client.phone || client.address ? (
                  <dl className="space-y-3 text-sm">
                    {client.email ? (
                      <div className="flex items-center gap-2">
                        <Mail
                          aria-hidden="true"
                          className="size-4 shrink-0 text-muted-foreground"
                        />
                        <dd className="text-muted-foreground">
                          {client.email}
                        </dd>
                      </div>
                    ) : null}
                    {client.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone
                          aria-hidden="true"
                          className="size-4 shrink-0 text-muted-foreground"
                        />
                        <dd className="text-muted-foreground">
                          {client.phone}
                        </dd>
                      </div>
                    ) : null}
                    {client.address ? (
                      <div className="flex items-center gap-2">
                        <MapPin
                          aria-hidden="true"
                          className="size-4 shrink-0 text-muted-foreground"
                        />
                        <dd className="text-muted-foreground">
                          {client.address}
                        </dd>
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
                    <dd className="font-medium tabular-nums">
                      {activeProjects.length}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Open negotiations</dt>
                    <dd className="font-medium tabular-nums">
                      {openNegotiations.length}
                    </dd>
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
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardContent className="px-0 pt-0">
              {client.projects.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="No projects"
                  description="Projects for this client will show up here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-48">Milestones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.projects.map((project) => {
                      const done = project.milestones.filter(
                        (m) => m.status === 'done'
                      ).length;
                      const total = project.milestones.length;
                      return (
                        <TableRow key={project.id}>
                          <TableCell>
                            <Link
                              href={`/projects/${project.id}`}
                              className="font-medium hover:underline"
                            >
                              {project.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={projectStatusVariants[project.status]}
                            >
                              {projectStatusLabels[project.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {total === 0 ? (
                              <span className="text-muted-foreground">
                                No milestones
                              </span>
                            ) : (
                              <ProjectProgress done={done} total={total} />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="negotiations">
          <Card>
            <CardContent className="px-0 pt-0">
              {client.negotiations.length === 0 ? (
                <EmptyState
                  icon={Handshake}
                  title="No negotiations"
                  description="Deals for this client will show up here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.negotiations.map((negotiation) => (
                      <TableRow key={negotiation.id}>
                        <TableCell>
                          <Link
                            href={`/negotiations/${negotiation.id}`}
                            className="font-medium hover:underline"
                          >
                            {negotiation.title}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {negotiation.amount != null
                            ? formatMoney(
                                negotiation.amount,
                                negotiation.currency
                              )
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              negotiationStatusVariants[negotiation.status]
                            }
                          >
                            {negotiationStatusLabels[negotiation.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="px-0 pt-0">
              {client.payments.length === 0 ? (
                <EmptyState
                  icon={Banknote}
                  title="No payments"
                  description="Payments for this client will show up here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due date</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Project</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatMoney(payment.amount, payment.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={paymentStatusVariants[payment.status]}
                          >
                            {paymentStatusLabels[payment.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.dueDate ? formatDate(payment.dueDate) : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.receivedDate
                            ? formatDate(payment.receivedDate)
                            : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.project ? (
                            <Link
                              href={`/projects/${payment.project.id}`}
                              className="hover:underline"
                            >
                              {payment.project.name}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardContent className="px-0 pt-0">
              {client.expenses.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No expenses"
                  description="Expenses for this client will show up here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Recurring</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatMoney(expense.amount, expense.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {expenseCategoryLabels[expense.category]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(expense.date)}
                        </TableCell>
                        <TableCell>
                          {expense.recurring ? (
                            <Badge variant="outline">Recurring</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardContent className="pt-0">
              {notes.length === 0 ? (
                <EmptyState
                  icon={StickyNote}
                  title="No notes"
                  description="Notes for this client will show up here."
                />
              ) : (
                <ul className="divide-y">
                  {notes.map((note) => (
                    <li key={note.id} className="flex flex-col gap-1 py-3">
                      <p className="text-sm whitespace-pre-wrap">{note.body}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(note.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <p className="border-t pt-3 text-xs text-muted-foreground">
                Notes are added from the Notes page or entity forms.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders">
          <Card>
            <CardContent className="px-0 pt-0">
              {reminders.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No reminders"
                  description="Reminders for this client will show up here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Repeat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reminders.map((reminder) => (
                      <TableRow key={reminder.id}>
                        <TableCell className="font-medium">
                          {reminder.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(reminder.dueAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={reminderStatusVariants[reminder.status]}
                          >
                            {reminderStatusLabels[reminder.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {reminderRepeatLabels[reminder.repeat]}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
