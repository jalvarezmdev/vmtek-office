import { formatInTimeZone } from 'date-fns-tz';

import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime, isOverdue } from '@/lib/money';

export function DueDate({
  date,
  showTime = false,
  timeZone,
}: {
  date: Date | null | undefined;
  showTime?: boolean;
  timeZone?: string;
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
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      {formatted}
      {isOverdue(date) ? <Badge variant="destructive">Overdue</Badge> : null}
    </span>
  );
}
