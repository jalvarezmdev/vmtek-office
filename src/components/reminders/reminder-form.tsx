'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { toast } from 'sonner';

import {
  createReminderAction,
  updateReminderAction,
  type ReminderActionResult,
} from '@/actions/reminders';
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
import {
  reminderEntityEnum,
  reminderRepeatEnum,
  reminderStatusEnum,
} from '@/db/schema';
import {
  reminderRepeatLabel,
  reminderStatusLabel,
  type ReminderRepeat,
  type ReminderStatus,
} from '@/lib/labels';
import {
  reminderEntityLabel,
  type ReminderEntityOption,
  type ReminderEntityOptions,
  type ReminderEntityType,
} from '@/lib/reminder-entities';
import { reminderSchema, type ReminderInput } from '@/lib/reminder-schemas';

const statuses = reminderStatusEnum.enumValues;
const repeats = reminderRepeatEnum.enumValues;
const entityTypes = reminderEntityEnum.enumValues;

type ReminderFormProps = {
  mode?: 'create' | 'edit';
  reminderId?: string;
  entityOptions: ReminderEntityOptions;
  defaultValues?: Partial<ReminderInput>;
  onSuccess?: () => void;
};

export function ReminderForm({
  mode = 'create',
  reminderId,
  entityOptions,
  defaultValues,
  onSuccess,
}: ReminderFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit' && reminderId !== undefined;

  const [status, setStatus] = useState<ReminderStatus>(
    defaultValues?.status ?? 'pending'
  );
  const [repeat, setRepeat] = useState<ReminderRepeat>(
    defaultValues?.repeat ?? 'once'
  );
  const [entityType, setEntityType] = useState<ReminderEntityType>(
    defaultValues?.entityType ?? 'none'
  );
  const [entityId, setEntityId] = useState(defaultValues?.entityId ?? '');

  const optionsByType: Record<
    Exclude<ReminderEntityType, 'none'>,
    ReminderEntityOption[]
  > = {
    client: entityOptions.clients,
    project: entityOptions.projects,
    task: entityOptions.tasks,
    payment: entityOptions.payments,
    negotiation: entityOptions.negotiations,
    milestone: entityOptions.milestones,
  };

  const entityOptionsForType =
    entityType === 'none'
      ? []
      : (optionsByType[entityType as Exclude<ReminderEntityType, 'none'>] ??
        []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const raw = {
      title: formData.get('title'),
      notes: formData.get('notes'),
      dueAt: formData.get('dueAt'),
      status,
      repeat,
      entityType,
      entityId: entityType === 'none' ? '' : entityId,
    };

    const parsed = reminderSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form.');
      return;
    }

    startTransition(async () => {
      const result: ReminderActionResult =
        isEdit && reminderId
          ? await updateReminderAction(reminderId, parsed.data)
          : await createReminderAction(parsed.data);

      if (result.success) {
        toast.success(isEdit ? 'Reminder updated' : 'Reminder created');
        formRef.current?.reset();
        onSuccess?.();
      } else {
        setError(result.error ?? 'Something went wrong');
        toast.error(result.error ?? 'Could not save the reminder');
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
            placeholder="Follow up on proposal"
            defaultValue={defaultValues?.title ?? ''}
            disabled={pending}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="dueAt">Due date and time</Label>
            <Input
              id="dueAt"
              name="dueAt"
              type="datetime-local"
              defaultValue={
                typeof defaultValues?.dueAt === 'string'
                  ? defaultValues.dueAt
                  : ''
              }
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Repeat</Label>
            <Select
              value={repeat}
              onValueChange={(next) => setRepeat(next as ReminderRepeat)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {repeats.map((repeatValue) => (
                  <SelectItem key={repeatValue} value={repeatValue}>
                    {reminderRepeatLabel[repeatValue]}
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
              onValueChange={(next) => setStatus(next as ReminderStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((statusValue) => (
                  <SelectItem key={statusValue} value={statusValue}>
                    {reminderStatusLabel[statusValue]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Linked entity</Label>
            <Select
              value={entityType}
              onValueChange={(next) => {
                setEntityType(next as ReminderEntityType);
                setEntityId('');
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {entityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {reminderEntityLabel[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {entityType !== 'none' ? (
          <div className="flex flex-col gap-2">
            <Label>{reminderEntityLabel[entityType]}</Label>
            <Select value={entityId} onValueChange={setEntityId}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={`Select a ${reminderEntityLabel[entityType].toLowerCase()}`}
                />
              </SelectTrigger>
              <SelectContent>
                {entityOptionsForType.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Optional details about this reminder."
            defaultValue={defaultValues?.notes ?? ''}
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
              : 'Create reminder'}
        </Button>
      </DialogFooter>
    </form>
  );
}
