'use client';

import type { InferSelectModel } from 'drizzle-orm';
import { Ellipsis, Pencil, Search, StickyNote, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { deleteNoteAction } from '@/actions/notes';
import { EmptyState } from '@/components/empty-state';
import { NoteFormDialog } from '@/components/notes/note-form-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { noteEntityEnum, notes } from '@/db/schema';
import type { EntityContext } from '@/lib/entity-labels';
import { noteEntityLabel } from '@/lib/labels';
import { formatDateTime } from '@/lib/money';
import type { NoteEntityOptions } from '@/lib/note-entities';
import type { NoteInput } from '@/lib/note-schemas';

type Note = InferSelectModel<typeof notes>;

type NotesListProps = {
  rows: Note[];
  contexts: Record<string, EntityContext | null>;
  entityOptions: NoteEntityOptions;
};

// Enum order matches the spec's group order (Client … Reminder, Standalone).
const groupOrder = noteEntityEnum.enumValues;

export function NotesList({ rows, contexts, entityOptions }: NotesListProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState<Note | null>(null);
  const [pending, startTransition] = useTransition();

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      normalizedQuery
        ? rows.filter((note) =>
            note.body.toLowerCase().includes(normalizedQuery)
          )
        : rows,
    [rows, normalizedQuery]
  );

  const groups = useMemo(() => {
    const byType = new Map<string, Note[]>();
    for (const type of groupOrder) byType.set(type, []);
    for (const note of filtered) {
      byType.get(note.entityType)?.push(note);
    }
    return groupOrder
      .map((type) => ({ type, rows: byType.get(type) ?? [] }))
      .filter((group) => group.rows.length > 0);
  }, [filtered]);

  const noMatches = filtered.length === 0;

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
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes…"
          aria-label="Search notes"
          className="pl-9"
        />
      </div>

      {noMatches ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={StickyNote}
              title="No matching notes"
              description={`No notes match "${query.trim()}". Try a different search.`}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <NotesSection
              key={group.type}
              type={group.type}
              rows={group.rows}
              contexts={contexts}
              pending={pending}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      {editing ? (
        <NoteFormDialog
          mode="edit"
          noteId={editing.id}
          entityOptions={entityOptions}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
          defaultValues={
            {
              body: editing.body,
              entityType: editing.entityType,
              entityId: editing.entityId ?? '',
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
    </div>
  );
}

function NotesSection({
  type,
  rows,
  contexts,
  pending,
  onEdit,
  onDelete,
}: {
  type: (typeof noteEntityEnum.enumValues)[number];
  rows: Note[];
  contexts: Record<string, EntityContext | null>;
  pending: boolean;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {noteEntityLabel[type]}
        </h2>
        <span className="text-sm text-muted-foreground">{rows.length}</span>
      </div>
      <Card>
        <CardContent className="px-0 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Note</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((note) => {
                const context = contexts[note.id];
                return (
                  <TableRow key={note.id}>
                    <TableCell className="max-w-96 truncate font-medium">
                      {note.body}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(note.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {context ? (
                        <span className="flex items-center gap-1.5">
                          <span>{noteEntityLabel[note.entityType]}</span>
                          {context.href ? (
                            <Link
                              href={context.href}
                              className="truncate font-medium hover:underline"
                            >
                              {context.label}
                            </Link>
                          ) : (
                            <span className="truncate font-medium">
                              {context.label}
                            </span>
                          )}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for note "${
                              note.body.length > 40
                                ? note.body.slice(0, 40) + '…'
                                : note.body
                            }"`}
                          >
                            <Ellipsis aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel className="truncate">
                            {note.body}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => onEdit(note)}
                            disabled={pending}
                          >
                            <Pencil aria-hidden="true" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => onDelete(note)}
                            disabled={pending}
                          >
                            <Trash2 aria-hidden="true" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
