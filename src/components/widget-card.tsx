import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type WidgetCardProps = {
  title: string;
  href?: string;
  icon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function WidgetCard({
  title,
  href,
  icon: Icon,
  children,
  footer,
  className,
}: WidgetCardProps) {
  return (
    <Card className={cn('gap-(--card-spacing)', className)}>
      <CardHeader>
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon aria-hidden="true" className="size-4" />
            </span>
          ) : null}
          <CardTitle className="truncate">{title}</CardTitle>
        </div>
        {href ? (
          <CardAction>
            <Link
              href={href}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all<span aria-hidden="true"> →</span>
            </Link>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}
