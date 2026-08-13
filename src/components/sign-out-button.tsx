'use client';

import { LogOut } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { signOutAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';

function SignOutSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      disabled={pending}
    >
      <LogOut aria-hidden="true" />
      {pending ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SignOutSubmit />
    </form>
  );
}
