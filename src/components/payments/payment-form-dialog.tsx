'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import {
  PaymentForm,
  type ClientOption,
  type ProjectOption,
} from '@/components/payments/payment-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { PaymentInput } from '@/lib/payment-schemas';

type PaymentFormDialogProps = {
  clients: ClientOption[];
  projects: ProjectOption[];
  mode?: 'create' | 'edit';
  paymentId?: string;
  defaultValues?: Partial<PaymentInput>;
  // Edit mode renders without a trigger button, so the parent controls open.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
};

export function PaymentFormDialog({
  clients,
  projects,
  mode = 'create',
  paymentId,
  defaultValues,
  open,
  onOpenChange,
  onSuccess,
}: PaymentFormDialogProps) {
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
            New payment
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit payment' : 'New payment'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details of this payment.'
              : 'Record money coming into VMWTEK.'}
          </DialogDescription>
        </DialogHeader>
        <PaymentForm
          mode={mode}
          paymentId={paymentId}
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
