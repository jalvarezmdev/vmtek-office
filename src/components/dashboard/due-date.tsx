import { Badge } from '@/components/ui/badge';
import { formatDate, isOverdue } from '@/lib/money';

export function DueDate({ date }: { date: Date | null | undefined }) {
  if (!date) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      {formatDate(date)}
      {isOverdue(date) ? <Badge variant="destructive">Overdue</Badge> : null}
    </span>
  );
}
