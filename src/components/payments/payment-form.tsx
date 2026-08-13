'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { toast } from 'sonner';

import {
  createPaymentAction,
  updatePaymentAction,
  type PaymentActionResult,
} from '@/actions/payments';
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
import { paymentStatusEnum } from '@/db/schema';
import { toDateInputValue } from '@/lib/date-input';
import { paymentStatusLabel, type PaymentStatus } from '@/lib/labels';
import { paymentSchema, type PaymentInput } from '@/lib/payment-schemas';

const paymentStatuses = paymentStatusEnum.enumValues;
const paymentCurrencies = ['USD', 'EUR', 'MXN', 'GBP'];

export type ClientOption = { id: string; name: string };
export type ProjectOption = { id: string; name: string };

type PaymentFormProps = {
  mode?: 'create' | 'edit';
  paymentId?: string;
  clients: ClientOption[];
  projects: ProjectOption[];
  defaultValues?: Partial<PaymentInput>;
  onSuccess?: () => void;
};

export function PaymentForm({
  mode = 'create',
  paymentId,
  clients,
  projects,
  defaultValues,
  onSuccess,
}: PaymentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit' && paymentId !== undefined;

  // Status is always submitted (full-field update contract).
  const [status, setStatus] = useState<PaymentStatus>(
    defaultValues?.status ?? 'pending'
  );
  const [clientSelect, setClientSelect] = useState(
    defaultValues?.clientId || 'none'
  );
  const [projectSelect, setProjectSelect] = useState(
    defaultValues?.projectId || 'none'
  );
  const [currency, setCurrency] = useState(defaultValues?.currency ?? '');

  // Only meaningful once money arrives: disabled (and forced empty) while
  // pending, so a pending payment never carries a received date.
  const receivedDateDisabled = status === 'pending';

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
      amount,
      currency,
      status,
      clientId: clientSelect === 'none' ? '' : clientSelect,
      projectId: projectSelect === 'none' ? '' : projectSelect,
      receivedDate: receivedDateDisabled ? '' : formData.get('receivedDate'),
      dueDate: formData.get('dueDate'),
      description: formData.get('description'),
    };

    const parsed = paymentSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form.');
      return;
    }

    startTransition(async () => {
      const result: PaymentActionResult =
        isEdit && paymentId
          ? await updatePaymentAction(paymentId, parsed.data)
          : await createPaymentAction(parsed.data);

      if (result.success) {
        toast.success(isEdit ? 'Payment updated' : 'Payment created');
        formRef.current?.reset();
        onSuccess?.();
      } else {
        setError(result.error ?? 'Something went wrong');
        toast.error(result.error ?? 'Could not save the payment');
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
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
          <div className="flex flex-col gap-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {paymentCurrencies.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(next) => setStatus(next as PaymentStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentStatuses.map((paymentStatus) => (
                  <SelectItem key={paymentStatus} value={paymentStatus}>
                    {paymentStatusLabel[paymentStatus]}
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
                <SelectItem value="none">No client (general)</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Project</Label>
          <Select value={projectSelect} onValueChange={setProjectSelect}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No project (general)</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={toDateInputValue(defaultValues?.dueDate)}
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="receivedDate">Received date</Label>
            <Input
              id="receivedDate"
              name="receivedDate"
              type="date"
              defaultValue={toDateInputValue(defaultValues?.receivedDate)}
              disabled={pending || receivedDateDisabled}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="What is this payment for?"
            defaultValue={defaultValues?.description ?? ''}
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
              : 'Create payment'}
        </Button>
      </DialogFooter>
    </form>
  );
}
