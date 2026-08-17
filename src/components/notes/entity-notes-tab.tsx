'use client';

import type { InferSelectModel } from 'drizzle-orm';
import { Pencil, StickyNote, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { deleteNoteAction } from '@/actions/notes';
import { EmptyState } from '@/components/empty-state';
import { NoteFormDialog } from '@/components/notes/note-form-dialog';
import type { FixedNoteEntity } from '@/components/notes/note-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { notes } from '@/db/schema';
import { noteEntityLabel } from '@/lib/labels';
import { formatDateTime } from '@/lib/money';
import {
  emptyNoteEntityOptions,
  type NoteEntityType,
} from '@/lib/note-entities';
import type { NoteInput } from '@/lib/note-schemas';

type NoteRow = InferSelectModel<typeof notes>;

type EntityNotesTabProps = {
  notes: NoteRow[];
  entityType: Exclude<NoteEntityType, 'none'>;
  entityId: string;
};

function shortBody(body: string): string {
  return body.length > 40 ? `${body.slice(0, 40)}…` : body;
}

export function EntityNotesTab({
  notes: noteRows,
  entityType,
  entityId,
}: EntityNotesTabProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<NoteRow | null>(null);
  const [deleting, setDeleting] = useState<NoteRow | null>(null);
  const [pending, startTransition] = useTransition();

  const fixedEntity: FixedNoteEntity = { entityType, entityId };

  function handleDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteNoteAction(deleting.id);
      if (result.success) {
        toast.success('Note deleted');
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Could not delete the note');
      }
    });
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Notes</CardTitle>
        <CardAction>
          <NoteFormDialog
            entityOptions={emptyNoteEntityOptions}
            fixedEntity={fixedEntity}
            triggerLabel="Add note"
            onSuccess={() => router.refresh()}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="px-0 pt-0">
        {noteRows.length === 0 ? (
          <EmptyState
            icon={StickyNote}
            title="No notes"
            description={`Notes for this ${noteEntityLabel[entityType].toLowerCase()} will show up here.`}
          />
        ) : (
          <ul className="divide-y">
            {noteRows.map((note) => (
              <li
                key={note.id}
                className="flex items-start justify-between gap-4 px-4 py-3"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="text-sm whitespace-pre-wrap">{note.body}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(note.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit note ${shortBody(note.body)}`}
                    onClick={() => setEditing(note)}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete note ${shortBody(note.body)}`}
                    onClick={() => setDeleting(note)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {editing ? (
        <NoteFormDialog
          mode="edit"
          noteId={editing.id}
          entityOptions={emptyNoteEntityOptions}
          fixedEntity={fixedEntity}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
          defaultValues={
            {
              body: editing.body,
              entityType,
              entityId,
            } satisfies Partial<NoteInput>
          }
          onSuccess={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete note</DialogTitle>
            <DialogDescription>
              {deleting
                ? `Delete "${deleting.body.slice(0, 60)}${
                    deleting.body.length > 60 ? '…' : ''
                  }"? This cannot be undone.`
                : ''}
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
    </Card>
  );
}
