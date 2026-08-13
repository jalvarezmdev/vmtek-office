'use client';

import { LogOut } from 'lucide-react';

import { signOutAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="w-full justify-start"
      >
        <LogOut aria-hidden="true" />
        Sign out
      </Button>
    </form>
  );
}
