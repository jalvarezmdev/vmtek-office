import { formatInTimeZone } from 'date-fns-tz';

import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime, isOverdue } from '@/lib/money';
import { cn } from '@/lib/utils';

export function DueDate({
  date,
  showTime = false,
  timeZone,
  className,
}: {
  date: Date | null | undefined;
  showTime?: boolean;
  timeZone?: string;
  className?: string;
}) {
  if (!date) return null;

  const formatted = timeZone
    ? formatInTimeZone(
        date,
        timeZone,
        showTime ? 'MMM d, yyyy, h:mm a' : 'MMM d, yyyy'
      )
    : showTime
      ? formatDateTime(date)
      : formatDate(date);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs text-muted-foreground',
        className
      )}
    >
      {formatted}
      {isOverdue(date) ? <Badge variant="destructive">Overdue</Badge> : null}
    </span>
  );
}
