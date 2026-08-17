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
      className="w-full justify-start group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
      disabled={pending}
    >
      <LogOut aria-hidden="true" />
      <span className="group-data-[collapsible=icon]:hidden">
        {pending ? 'Signing out…' : 'Sign out'}
      </span>
    </Button>
  );
}

export function SignOutButton(props: React.ComponentProps<'form'>) {
  return (
    <form action={signOutAction} {...props}>
      <SignOutSubmit />
    </form>
  );
}
