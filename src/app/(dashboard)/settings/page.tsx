import { eq } from 'drizzle-orm';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { formatDate } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Your VMWTEK Office profile and preferences.',
};

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  return (email || '?').slice(0, 2).toUpperCase();
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const user = await getDb().query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  const name = user?.name ?? session.user.name ?? 'Account';
  const email = user?.email ?? session.user.email ?? '';
  const role = user?.role ?? session.user.role;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your profile and workspace preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your account details across VMWTEK Office.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback>{getInitials(name, email)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-medium">{name}</span>
              {email ? (
                <span className="truncate text-sm text-muted-foreground">
                  {email}
                </span>
              ) : null}
            </div>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Role</dt>
              <dd>
                <Badge variant="secondary" className="capitalize">
                  {role}
                </Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Member since</dt>
              <dd className="tabular-nums">
                {user?.createdAt ? formatDate(user.createdAt) : '—'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Coming soon — nothing here is configurable yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            A currency display preference is planned, which would let you choose
            the locale used to format money across VMWTEK. Amounts are currently
            formatted with the default en-US locale, and a preference would
            parameterize that.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            More preferences are planned too, including theme, notifications,
            and portal access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
