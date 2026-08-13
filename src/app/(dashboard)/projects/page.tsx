import type { Metadata } from 'next';
import { FolderKanban } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { ProjectFormDialog } from '@/components/projects/project-form-dialog';
import {
  ProjectTable,
  type ProjectRow,
} from '@/components/projects/project-table';
import { Card, CardContent } from '@/components/ui/card';
import { getDb } from '@/db';

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Track the delivery work VMWTEK performs.',
};

export default async function ProjectsPage() {
  const db = await getDb();

  const [projects, clientOptions, negotiationOptions] = await Promise.all([
    db.query.projects.findMany({
      with: { client: true, milestones: true },
      // Most recent first: the list mirrors the work that is current.
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
    }),
    db.query.clients.findMany({
      columns: { id: true, name: true },
      orderBy: (clients, { asc }) => [asc(clients.name)],
    }),
    db.query.negotiations.findMany({
      columns: { id: true, title: true },
      // Only open and won negotiations are linkable to a project.
      where: (negotiations, { inArray }) =>
        inArray(negotiations.status, ['open', 'won']),
      orderBy: (negotiations, { asc }) => [asc(negotiations.title)],
    }),
  ]);

  const rows: ProjectRow[] = projects.map((project) => ({
    id: project.id,
    name: project.name,
    status: project.status,
    clientName: project.client?.name ?? null,
    milestoneDone: project.milestones.filter(
      (milestone) => milestone.status === 'done'
    ).length,
    milestoneTotal: project.milestones.length,
    budgetAmount: project.budgetAmount,
    budgetCurrency: project.budgetCurrency,
  }));

  const clients = clientOptions.map((client) => ({
    id: client.id,
    name: client.name,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            The delivery work VMWTEK performs.
          </p>
        </div>
        <ProjectFormDialog
          clients={clients}
          negotiations={negotiationOptions}
        />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create your first project to start tracking milestones and delivery work."
              action={
                <ProjectFormDialog
                  clients={clients}
                  negotiations={negotiationOptions}
                />
              }
            />
          </CardContent>
        </Card>
      ) : (
        <ProjectTable rows={rows} />
      )}
    </div>
  );
}
