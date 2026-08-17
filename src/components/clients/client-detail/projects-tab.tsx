import type { InferSelectModel } from 'drizzle-orm';
import { FolderKanban } from 'lucide-react';
import Link from 'next/link';

import { EmptyState } from '@/components/empty-state';
import { ProjectProgress } from '@/components/project-progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { milestones, projects } from '@/db/schema';
import { projectStatusLabel, projectStatusVariant } from '@/lib/labels';

export type ProjectsTabProps = {
  projects: Array<
    InferSelectModel<typeof projects> & {
      milestones: InferSelectModel<typeof milestones>[];
    }
  >;
};

export function ProjectsTab({ projects: projectRows }: ProjectsTabProps) {
  return (
    <Card>
      <CardContent className="px-0 pt-0">
        {projectRows.length === 0 ? (
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
              {projectRows.map((project) => {
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
                      <Badge variant={projectStatusVariant[project.status]}>
                        {projectStatusLabel[project.status]}
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
  );
}
