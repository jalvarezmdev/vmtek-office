'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { deleteClientAction } from '@/actions/clients';
import { ClientForm } from '@/components/clients/client-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type ClientDetail = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export function ClientActions({ client }: { client: ClientDetail }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const defaultValues = {
    name: client.name,
    company: client.company ?? '',
    email: client.email ?? '',
    phone: client.phone ?? '',
    address: client.address ?? '',
  };

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteClientAction(client.id);
      if (result.success) {
        toast.success('Client deleted');
        router.push('/clients');
      } else {
        toast.error(result.error ?? 'Could not delete the client');
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Pencil data-icon="inline-start" aria-hidden="true" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit client</DialogTitle>
            <DialogDescription>
              Update the contact details for {client.name}.
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            mode="edit"
            clientId={client.id}
            defaultValues={defaultValues}
            onSuccess={() => {
              setEditOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Trash2 data-icon="inline-start" aria-hidden="true" />
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete client</DialogTitle>
            <DialogDescription>
              Delete {client.name}? This removes the client and its contact
              details.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              {pending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
