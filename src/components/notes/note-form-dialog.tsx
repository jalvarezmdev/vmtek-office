'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { NoteForm } from '@/components/notes/note-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { NoteEntityOptions } from '@/lib/note-entities';
import type { NoteInput } from '@/lib/note-schemas';

type NoteFormDialogProps = {
  entityOptions: NoteEntityOptions;
  mode?: 'create' | 'edit';
  noteId?: string;
  defaultValues?: Partial<NoteInput>;
  // Edit mode renders without a trigger button, so the parent controls open.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
};

export function NoteFormDialog({
  entityOptions,
  mode = 'create',
  noteId,
  defaultValues,
  open,
  onOpenChange,
  onSuccess,
}: NoteFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isEdit = mode === 'edit';
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {mode === 'create' ? (
        <DialogTrigger asChild>
          <Button>
            <Plus data-icon="inline-start" aria-hidden="true" />
            New note
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit note' : 'New note'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update this note.'
              : 'Capture something worth remembering across VMWTEK.'}
          </DialogDescription>
        </DialogHeader>
        <NoteForm
          mode={mode}
          noteId={noteId}
          entityOptions={entityOptions}
          defaultValues={defaultValues}
          onSuccess={() => {
            setOpen(false);
            onSuccess?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
