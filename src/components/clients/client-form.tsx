'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { toast } from 'sonner';

import {
  createClientAction,
  updateClientAction,
  type ClientActionResult,
} from '@/actions/clients';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clientSchema, type ClientInput } from '@/lib/client-schemas';

type ClientFormProps = {
  mode?: 'create' | 'edit';
  clientId?: string;
  defaultValues?: Partial<ClientInput>;
  onSuccess?: () => void;
};

export function ClientForm({
  mode = 'create',
  clientId,
  defaultValues,
  onSuccess,
}: ClientFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit' && clientId !== undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const raw = {
      name: formData.get('name'),
      company: formData.get('company'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
    };

    const parsed = clientSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form.');
      return;
    }

    startTransition(async () => {
      const result: ClientActionResult =
        mode === 'edit' && clientId
          ? await updateClientAction(clientId, parsed.data)
          : await createClientAction(parsed.data);

      if (result.success) {
        toast.success(isEdit ? 'Client updated' : 'Client created');
        formRef.current?.reset();
        onSuccess?.();
      } else {
        setError(result.error ?? 'Something went wrong');
        toast.error(result.error ?? 'Could not save the client');
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Acme Corp"
            defaultValue={defaultValues?.name ?? ''}
            required
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            name="company"
            placeholder="Acme Corp"
            defaultValue={defaultValues?.company ?? ''}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="billing@acme.com"
            defaultValue={defaultValues?.email ?? ''}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+1 555 000 1234"
            defaultValue={defaultValues?.phone ?? ''}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            placeholder="123 Main St"
            defaultValue={defaultValues?.address ?? ''}
            disabled={pending}
          />
        </div>
        {error ? (
          <p
            id="form-error"
            role="alert"
            data-slot="form-error"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}
      </div>
      <DialogFooter className="mt-4">
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={pending}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending
            ? isEdit
              ? 'Saving…'
              : 'Creating…'
            : isEdit
              ? 'Save changes'
              : 'Create client'}
        </Button>
      </DialogFooter>
    </form>
  );
}
