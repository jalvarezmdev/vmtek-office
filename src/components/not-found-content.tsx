import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function NotFoundContent() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileQuestion aria-hidden="true" className="size-6" />
      </span>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved.
        </p>
      </div>
      <Button asChild className="mt-1">
        <Link href="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
