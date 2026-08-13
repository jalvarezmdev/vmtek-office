'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { SignOutButton } from '@/components/sign-out-button';

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
  return (email ?? '?').slice(0, 2).toUpperCase();
}

export function DashboardHeader({
  user,
}: {
  user: { name?: string | null; email?: string | null };
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Open account menu"
            >
              <Avatar className="size-8">
                <AvatarFallback>
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="truncate text-sm font-medium">
                  {user.name ?? 'Account'}
                </span>
                {user.email ? (
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                ) : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="p-1">
              <SignOutButton />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
