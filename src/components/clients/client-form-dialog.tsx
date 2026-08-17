'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { ClientForm } from '@/components/clients/client-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function ClientFormDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" aria-hidden="true" />
          New client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New client</DialogTitle>
          <DialogDescription>
            Add the contact details for a client.
          </DialogDescription>
        </DialogHeader>
        <ClientForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
