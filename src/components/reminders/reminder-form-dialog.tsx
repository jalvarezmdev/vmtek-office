'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { ReminderForm } from '@/components/reminders/reminder-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { ReminderEntityOptions } from '@/lib/reminder-entities';
import type { ReminderInput } from '@/lib/reminder-schemas';

type ReminderFormDialogProps = {
  entityOptions: ReminderEntityOptions;
  mode?: 'create' | 'edit';
  reminderId?: string;
  defaultValues?: Partial<ReminderInput>;
  // Edit mode renders without a trigger button, so the parent controls open.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ReminderFormDialog({
  entityOptions,
  mode = 'create',
  reminderId,
  defaultValues,
  open,
  onOpenChange,
  onSuccess,
}: ReminderFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isEdit = mode === 'edit';
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {mode === 'create' ? (
        <DialogTrigger asChild>
          <Button>
            <Plus data-icon="inline-start" aria-hidden="true" />
            New reminder
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit reminder' : 'New reminder'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details of this reminder.'
              : 'Remind yourself of a due date across VMWTEK.'}
          </DialogDescription>
        </DialogHeader>
        <ReminderForm
          mode={mode}
          reminderId={reminderId}
          entityOptions={entityOptions}
          defaultValues={defaultValues}
          onSuccess={() => {
            setOpen(false);
            onSuccess?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
