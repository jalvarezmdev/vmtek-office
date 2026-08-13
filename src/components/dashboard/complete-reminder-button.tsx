'use client';

import { Check } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { completeReminderAction } from '@/actions/reminders';
import { Button } from '@/components/ui/button';

export function CompleteReminderButton({ reminderId }: { reminderId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        startTransition(async () => {
          const result = await completeReminderAction(reminderId);
          if (result.success) {
            toast.success('Reminder completed');
          } else {
            toast.error('Could not complete the reminder');
          }
        });
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        disabled={pending}
        aria-label="Mark as done"
        title="Mark as done"
      >
        <Check aria-hidden="true" />
      </Button>
    </form>
  );
}
