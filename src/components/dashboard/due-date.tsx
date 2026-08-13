import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime, isOverdue } from '@/lib/money';

export function DueDate({
  date,
  showTime = false,
}: {
  date: Date | null | undefined;
  showTime?: boolean;
}) {
  if (!date) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      {showTime ? formatDateTime(date) : formatDate(date)}
      {isOverdue(date) ? <Badge variant="destructive">Overdue</Badge> : null}
    </span>
  );
}
