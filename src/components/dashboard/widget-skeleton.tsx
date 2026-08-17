import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function WidgetSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('gap-(--card-spacing)', className)} aria-hidden="true">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}
