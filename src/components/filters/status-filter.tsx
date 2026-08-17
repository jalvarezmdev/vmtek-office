'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type StatusFilterOption<T extends string> = {
  value: T;
  label: string;
};

type StatusFilterProps<T extends string> = {
  value: 'all' | T;
  onChange: (value: 'all' | T) => void;
  options: StatusFilterOption<T>[];
  label: string;
  allLabel?: string;
};

export function StatusFilter<T extends string>({
  value,
  onChange,
  options,
  label,
  allLabel = 'All statuses',
}: StatusFilterProps<T>) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as 'all' | T)}>
      <SelectTrigger className="w-44" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
