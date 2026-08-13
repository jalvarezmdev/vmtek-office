'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { toast } from 'sonner';

import {
  createEpicAction,
  updateEpicAction,
  type EpicActionResult,
} from '@/actions/epics';
import { epicStatusEnum } from '@/db/schema';
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
import { epicStatusLabel, type EpicStatus } from '@/lib/labels';
import { epicSchema, type EpicInput } from '@/lib/epic-schemas';

const epicStatuses = epicStatusEnum.enumValues;

type EpicFormProps = {
  mode?: 'create' | 'edit';
  epicId?: string;
  projectId: string;
  defaultValues?: Partial<EpicInput>;
  onSuccess?: () => void;
};

export function EpicForm({
  mode = 'create',
  epicId,
  projectId,
  defaultValues,
  onSuccess,
}: EpicFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit' && epicId !== undefined;

  const [status, setStatus] = useState<EpicStatus>(
    defaultValues?.status ?? 'planned'
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
    };

    const parsed = epicSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form.');
      return;
    }

    startTransition(async () => {
      const result: EpicActionResult =
        isEdit && epicId
          ? await updateEpicAction(epicId, parsed.data)
          : await createEpicAction(parsed.data);

      if (result.success) {
        toast.success(isEdit ? 'Epic updated' : 'Epic created');
        formRef.current?.reset();
        onSuccess?.();
      } else {
        setError(result.error ?? 'Something went wrong');
        toast.error(result.error ?? 'Could not save the epic');
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
            placeholder="Onboarding flow"
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
            placeholder="What feature does this epic group together?"
            defaultValue={defaultValues?.description ?? ''}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(next) => setStatus(next as EpicStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {epicStatuses.map((epicStatus) => (
                <SelectItem key={epicStatus} value={epicStatus}>
                  {epicStatusLabel[epicStatus]}
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
              : 'Create epic'}
        </Button>
      </DialogFooter>
    </form>
  );
}
