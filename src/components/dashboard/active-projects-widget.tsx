import { FolderKanban } from 'lucide-react';

import { EmptyState } from '@/components/empty-state';
import { ProjectProgress } from '@/components/project-progress';
import { WidgetCard } from '@/components/widget-card';
import { getDb } from '@/db';

export async function ActiveProjectsWidget({
  className,
}: {
  className?: string;
}) {
  const db = await getDb();
  const projects = await db.query.projects.findMany({
    where: (p, { eq }) => eq(p.status, 'active'),
    with: { client: true, milestones: true },
    orderBy: (p, { asc }) => [asc(p.name)],
  });

  return (
    <WidgetCard
      title="Active projects"
      href="/projects"
      icon={FolderKanban}
      className={className}
    >
      {projects.length === 0 ? (
        <EmptyState
          title="No active projects"
          description="Projects you start will show up here."
          icon={FolderKanban}
        />
      ) : (
        <ul className="space-y-4">
          {projects.map((project) => {
            const done = project.milestones.filter(
              (m) => m.status === 'done'
            ).length;
            const total = project.milestones.length;
            return (
              <li key={project.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium">{project.name}</span>
                  {project.client?.name ? (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {project.client.name}
                    </span>
                  ) : null}
                </div>
                <ProjectProgress done={done} total={total} />
              </li>
            );
          })}
        </ul>
      )}
    </WidgetCard>
  );
}
