'use client';

import { projectStatusEnum } from '@/db/schema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { projectStatusLabel, type ProjectStatus } from '@/lib/labels';

export type ProjectStatusFilter = 'all' | ProjectStatus;

const statuses = projectStatusEnum.enumValues;

type StatusFilterProps = {
  value: ProjectStatusFilter;
  onChange: (value: ProjectStatusFilter) => void;
};

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as ProjectStatusFilter)}
    >
      <SelectTrigger className="w-44" aria-label="Filter projects by status">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        {statuses.map((status) => (
          <SelectItem key={status} value={status}>
            {projectStatusLabel[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
