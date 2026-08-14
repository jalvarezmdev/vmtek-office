'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { toast } from 'sonner';

import {
  createNoteAction,
  updateNoteAction,
  type NoteActionResult,
} from '@/actions/notes';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { noteEntityEnum } from '@/db/schema';
import { noteEntityLabel } from '@/lib/labels';
import {
  type NoteEntityOption,
  type NoteEntityOptions,
  type NoteEntityType,
} from '@/lib/note-entities';
import { noteSchema, type NoteInput } from '@/lib/note-schemas';

const entityTypes = noteEntityEnum.enumValues;

type NoteFormProps = {
  mode?: 'create' | 'edit';
  noteId?: string;
  entityOptions: NoteEntityOptions;
  defaultValues?: Partial<NoteInput>;
  onSuccess?: () => void;
};

export function NoteForm({
  mode = 'create',
  noteId,
  entityOptions,
  defaultValues,
  onSuccess,
}: NoteFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit' && noteId !== undefined;

  const [entityType, setEntityType] = useState<NoteEntityType>(
    defaultValues?.entityType ?? 'none'
  );
  const [entityId, setEntityId] = useState(defaultValues?.entityId ?? '');

  const optionsByType: Record<
    Exclude<NoteEntityType, 'none'>,
    NoteEntityOption[]
  > = {
    client: entityOptions.clients,
    project: entityOptions.projects,
    task: entityOptions.tasks,
    negotiation: entityOptions.negotiations,
    payment: entityOptions.payments,
    expense: entityOptions.expenses,
    milestone: entityOptions.milestones,
    epic: entityOptions.epics,
    reminder: entityOptions.reminders,
  };

  const entityOptionsForType =
    entityType === 'none'
      ? []
      : (optionsByType[entityType as Exclude<NoteEntityType, 'none'>] ?? []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const raw = {
      body: formData.get('body'),
      entityType,
      entityId: entityType === 'none' ? '' : entityId,
    };

    const parsed = noteSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form.');
      return;
    }

    startTransition(async () => {
      const result: NoteActionResult =
        isEdit && noteId
          ? await updateNoteAction(noteId, parsed.data)
          : await createNoteAction(parsed.data);

      if (result.success) {
        toast.success(isEdit ? 'Note updated' : 'Note created');
        formRef.current?.reset();
        onSuccess?.();
      } else {
        setError(result.error ?? 'Something went wrong');
        toast.error(result.error ?? 'Could not save the note');
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="body">Note</Label>
          <Textarea
            id="body"
            name="body"
            placeholder="Write a note about an entity, a deal, or anything worth remembering."
            defaultValue={defaultValues?.body ?? ''}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Attach to</Label>
          <Select
            value={entityType}
            onValueChange={(next) => {
              setEntityType(next as NoteEntityType);
              setEntityId('');
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {entityTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {noteEntityLabel[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {entityType !== 'none' ? (
          <div className="flex flex-col gap-2">
            <Label>{noteEntityLabel[entityType]}</Label>
            <Select value={entityId} onValueChange={setEntityId}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={`Select a ${noteEntityLabel[entityType].toLowerCase()}`}
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
              : 'Create note'}
        </Button>
      </DialogFooter>
    </form>
  );
}
