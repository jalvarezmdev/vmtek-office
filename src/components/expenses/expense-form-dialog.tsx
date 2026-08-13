'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import {
  ExpenseForm,
  type ClientOption,
  type ProjectOption,
} from '@/components/expenses/expense-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { ExpenseInput } from '@/lib/expense-schemas';

type ExpenseFormDialogProps = {
  clients: ClientOption[];
  projects: ProjectOption[];
  mode?: 'create' | 'edit';
  expenseId?: string;
  defaultValues?: Partial<ExpenseInput>;
  // Edit mode renders without a trigger button, so the parent controls open.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ExpenseFormDialog({
  clients,
  projects,
  mode = 'create',
  expenseId,
  defaultValues,
  open,
  onOpenChange,
  onSuccess,
}: ExpenseFormDialogProps) {
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
            New expense
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit expense' : 'New expense'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details of this expense.'
              : 'Record money going out of VMWTEK.'}
          </DialogDescription>
        </DialogHeader>
        <ExpenseForm
          mode={mode}
          expenseId={expenseId}
          clients={clients}
          projects={projects}
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
