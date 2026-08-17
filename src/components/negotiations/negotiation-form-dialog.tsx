'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import {
  NegotiationForm,
  type ClientOption,
} from '@/components/negotiations/negotiation-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type NegotiationFormDialogProps = {
  clients: ClientOption[];
};

export function NegotiationFormDialog({ clients }: NegotiationFormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" aria-hidden="true" />
          New negotiation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New negotiation</DialogTitle>
          <DialogDescription>
            Add a deal to the sales pipeline.
          </DialogDescription>
        </DialogHeader>
        <NegotiationForm clients={clients} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
