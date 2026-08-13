import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type ProjectProgressProps = {
  done: number;
  total: number;
  className?: string;
};

export function ProjectProgress({
  done,
  total,
  className,
}: ProjectProgressProps) {
  const percentage =
    total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {done}/{total}
        </span>
        <span>{percentage}%</span>
      </div>
      <Progress value={percentage} />
    </div>
  );
}
