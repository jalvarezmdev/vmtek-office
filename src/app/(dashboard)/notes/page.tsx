import type { Metadata } from 'next';
import { StickyNote } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { NoteFormDialog } from '@/components/notes/note-form-dialog';
import { NotesList } from '@/components/notes/notes-list';
import { Card, CardContent } from '@/components/ui/card';
import { getDb } from '@/db';
import { buildEntityContexts, entityHrefs } from '@/lib/entity-labels';
import type { NoteEntityOptions } from '@/lib/note-entities';

export const metadata: Metadata = {
  title: 'Notes',
  description: 'Free-form notes attached to any entity across VMWTEK.',
};

export default async function NotesPage() {
  const db = await getDb();

  const [
    noteRows,
    clientRows,
    projectRows,
    taskRows,
    negotiationRows,
    paymentRows,
    expenseRows,
    milestoneRows,
    epicRows,
    reminderRows,
  ] = await Promise.all([
    db.query.notes.findMany({
      orderBy: (note, { desc }) => [desc(note.createdAt)],
    }),
    db.query.clients.findMany({
      columns: { id: true, name: true },
      orderBy: (client, { asc }) => [asc(client.name)],
    }),
    db.query.projects.findMany({
      columns: { id: true, name: true },
      orderBy: (project, { asc }) => [asc(project.name)],
    }),
    db.query.tasks.findMany({
      columns: { id: true, title: true },
      orderBy: (task, { asc }) => [asc(task.title)],
    }),
    db.query.negotiations.findMany({
      columns: { id: true, title: true },
      orderBy: (negotiation, { asc }) => [asc(negotiation.title)],
    }),
    db.query.payments.findMany({
      columns: { id: true, description: true },
      orderBy: (payment, { asc }) => [asc(payment.createdAt)],
    }),
    db.query.expenses.findMany({
      columns: { id: true, description: true },
      orderBy: (expense, { asc }) => [asc(expense.date)],
    }),
    db.query.milestones.findMany({
      columns: { id: true, name: true },
      orderBy: (milestone, { asc }) => [asc(milestone.name)],
    }),
    db.query.epics.findMany({
      columns: { id: true, name: true },
      orderBy: (epic, { asc }) => [asc(epic.name)],
    }),
    db.query.reminders.findMany({
      columns: { id: true, title: true },
      orderBy: (reminder, { asc }) => [asc(reminder.title)],
    }),
  ]);

  const entityOptions: NoteEntityOptions = {
    clients: clientRows.map((client) => ({
      id: client.id,
      label: client.name,
    })),
    projects: projectRows.map((project) => ({
      id: project.id,
      label: project.name,
    })),
    tasks: taskRows.map((task) => ({ id: task.id, label: task.title })),
    negotiations: negotiationRows.map((negotiation) => ({
      id: negotiation.id,
      label: negotiation.title,
    })),
    payments: paymentRows.map((payment) => ({
      id: payment.id,
      label: payment.description ?? 'Payment',
    })),
    expenses: expenseRows.map((expense) => ({
      id: expense.id,
      label: expense.description ?? 'Expense',
    })),
    milestones: milestoneRows.map((milestone) => ({
      id: milestone.id,
      label: milestone.name,
    })),
    epics: epicRows.map((epic) => ({ id: epic.id, label: epic.name })),
    reminders: reminderRows.map((reminder) => ({
      id: reminder.id,
      label: reminder.title,
    })),
  };

  const contexts = await buildEntityContexts(db, noteRows, entityHrefs);
  const hasNotes = noteRows.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
          <p className="text-sm text-muted-foreground">
            Free-form notes attached to any entity, or standalone.
          </p>
        </div>
        <NoteFormDialog entityOptions={entityOptions} />
      </div>

      {!hasNotes ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={StickyNote}
              title="No notes yet"
              description="Create your first note to capture something worth remembering across VMWTEK."
              action={<NoteFormDialog entityOptions={entityOptions} />}
            />
          </CardContent>
        </Card>
      ) : (
        <NotesList
          rows={noteRows}
          contexts={contexts}
          entityOptions={entityOptions}
        />
      )}
    </div>
  );
}
