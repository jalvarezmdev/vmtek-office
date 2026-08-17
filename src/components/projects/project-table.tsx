'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { ProjectProgress } from '@/components/project-progress';
import {
  StatusFilter,
  type ProjectStatusFilter,
} from '@/components/projects/status-filter';
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
import {
  projectStatusLabel,
  projectStatusVariant,
  type ProjectStatus,
} from '@/lib/labels';
import { formatMoney } from '@/lib/money';

export type ProjectRow = {
  id: string;
  name: string;
  status: ProjectStatus;
  clientName: string | null;
  milestoneDone: number;
  milestoneTotal: number;
  budgetAmount: number | null;
  budgetCurrency: string | null;
};

export function ProjectTable({ rows }: { rows: ProjectRow[] }) {
  const [status, setStatus] = useState<ProjectStatusFilter>('all');

  const filtered = useMemo(
    () =>
      status === 'all' ? rows : rows.filter((row) => row.status === status),
    [rows, status]
  );

  return (
    <div className="flex flex-col gap-4">
      <StatusFilter value={status} onChange={setStatus} />
      <Card>
        <CardContent className="px-0 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Milestones</TableHead>
                <TableHead className="text-right">Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No projects match the selected status.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/projects/${row.id}`}
                        className="hover:underline"
                      >
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.clientName ?? 'Internal'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={projectStatusVariant[row.status]}>
                        {projectStatusLabel[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.milestoneTotal > 0 ? (
                        <ProjectProgress
                          done={row.milestoneDone}
                          total={row.milestoneTotal}
                          className="w-28"
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.budgetAmount != null && row.budgetCurrency ? (
                        formatMoney(row.budgetAmount, row.budgetCurrency)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
