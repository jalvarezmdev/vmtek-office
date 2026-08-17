'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { toast } from 'sonner';

import {
  createNegotiationAction,
  updateNegotiationAction,
  type NegotiationActionResult,
} from '@/actions/negotiations';
import { negotiationStatusEnum } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toDateInputValue } from '@/lib/date-input';
import { negotiationStatusLabel, type NegotiationStatus } from '@/lib/labels';
import {
  negotiationSchema,
  type NegotiationInput,
} from '@/lib/negotiation-schemas';

const negotiationStatuses = negotiationStatusEnum.enumValues;
const negotiationCurrencies = ['USD', 'EUR', 'MXN', 'GBP'];

export type ClientOption = { id: string; name: string };

type NegotiationFormProps = {
  mode?: 'create' | 'edit';
  negotiationId?: string;
  clients: ClientOption[];
  defaultValues?: Partial<NegotiationInput>;
  onSuccess?: () => void;
};

export function NegotiationForm({
  mode = 'create',
  negotiationId,
  clients,
  defaultValues,
  onSuccess,
}: NegotiationFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit' && negotiationId !== undefined;

  // Status is always submitted (full-field update contract).
  const [status, setStatus] = useState(defaultValues?.status ?? 'open');
  // '' (no client) and unset default to the 'none' option.
  const [clientSelect, setClientSelect] = useState(
    defaultValues?.clientId || 'none'
  );
  const [currency, setCurrency] = useState(defaultValues?.currency ?? '');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const rawAmount = formData.get('amount');
    const amount =
      typeof rawAmount === 'string' && rawAmount.trim() === ''
        ? ''
        : Number(rawAmount);

    const raw = {
      title: formData.get('title'),
      description: formData.get('description'),
      status,
      amount,
      currency,
      clientId: clientSelect === 'none' ? '' : clientSelect,
      expectedCloseDate: formData.get('expectedCloseDate'),
    };

    const parsed = negotiationSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form.');
      return;
    }

    startTransition(async () => {
      const result: NegotiationActionResult =
        isEdit && negotiationId
          ? await updateNegotiationAction(negotiationId, parsed.data)
          : await createNegotiationAction(parsed.data);

      if (result.success) {
        toast.success(isEdit ? 'Negotiation updated' : 'Negotiation created');
        formRef.current?.reset();
        onSuccess?.();
      } else {
        setError(result.error ?? 'Something went wrong');
        toast.error(result.error ?? 'Could not save the negotiation');
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="Website redesign"
            defaultValue={defaultValues?.title ?? ''}
            required
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="What is this deal about?"
            defaultValue={defaultValues?.description ?? ''}
            disabled={pending}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(next) => setStatus(next as NegotiationStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {negotiationStatuses.map((negotiationStatus) => (
                  <SelectItem key={negotiationStatus} value={negotiationStatus}>
                    {negotiationStatusLabel[negotiationStatus]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Client</Label>
            <Select value={clientSelect} onValueChange={setClientSelect}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client (internal)</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {negotiationCurrencies.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="12000"
              defaultValue={defaultValues?.amount?.toString() ?? ''}
              disabled={pending}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expectedCloseDate">Expected close date</Label>
          <Input
            id="expectedCloseDate"
            name="expectedCloseDate"
            type="date"
            defaultValue={toDateInputValue(defaultValues?.expectedCloseDate)}
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
              : 'Create negotiation'}
        </Button>
      </DialogFooter>
    </form>
  );
}
