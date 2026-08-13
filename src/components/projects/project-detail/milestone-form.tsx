'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { toast } from 'sonner';

import {
  createMilestoneAction,
  updateMilestoneAction,
  type MilestoneActionResult,
} from '@/actions/milestones';
import { milestoneStatusEnum } from '@/db/schema';
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
import { milestoneStatusLabel, type MilestoneStatus } from '@/lib/labels';
import { milestoneSchema, type MilestoneInput } from '@/lib/milestone-schemas';

const milestoneStatuses = milestoneStatusEnum.enumValues;

export type PaymentOption = { id: string; label: string };

type MilestoneFormProps = {
  mode?: 'create' | 'edit';
  milestoneId?: string;
  projectId: string;
  payments: PaymentOption[];
  defaultValues?: Partial<MilestoneInput>;
  onSuccess?: () => void;
};

export function MilestoneForm({
  mode = 'create',
  milestoneId,
  projectId,
  payments,
  defaultValues,
  onSuccess,
}: MilestoneFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit' && milestoneId !== undefined;

  const [status, setStatus] = useState<MilestoneStatus>(
    defaultValues?.status ?? 'planned'
  );
  const [paymentSelect, setPaymentSelect] = useState(
    defaultValues?.paymentId || 'none'
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    const raw = {
      projectId: formData.get('projectId'),
      name: formData.get('name'),
      description: formData.get('description'),
      status,
      dueDate: formData.get('dueDate'),
      paymentId: paymentSelect === 'none' ? '' : paymentSelect,
    };

    const parsed = milestoneSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form.');
      return;
    }

    startTransition(async () => {
      const result: MilestoneActionResult =
        isEdit && milestoneId
          ? await updateMilestoneAction(milestoneId, parsed.data)
          : await createMilestoneAction(parsed.data);

      if (result.success) {
        toast.success(isEdit ? 'Milestone updated' : 'Milestone created');
        formRef.current?.reset();
        onSuccess?.();
      } else {
        setError(result.error ?? 'Something went wrong');
        toast.error(result.error ?? 'Could not save the milestone');
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Discovery phase"
            defaultValue={defaultValues?.name ?? ''}
            required
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="What does this milestone deliver?"
            defaultValue={defaultValues?.description ?? ''}
            disabled={pending}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(next) => setStatus(next as MilestoneStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {milestoneStatuses.map((milestoneStatus) => (
                  <SelectItem key={milestoneStatus} value={milestoneStatus}>
                    {milestoneStatusLabel[milestoneStatus]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
        </div>
        <div className="flex flex-col gap-2">
          <Label>Linked payment</Label>
          <Select value={paymentSelect} onValueChange={setPaymentSelect}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No linked payment</SelectItem>
              {payments.map((payment) => (
                <SelectItem key={payment.id} value={payment.id}>
                  {payment.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              : 'Create milestone'}
        </Button>
      </DialogFooter>
    </form>
  );
}
