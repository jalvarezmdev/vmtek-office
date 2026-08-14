'use client';

import type { InferSelectModel } from 'drizzle-orm';
import { formatInTimeZone } from 'date-fns-tz';
import { Check, Ellipsis, Pencil, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  completeReminderAction,
  deleteReminderAction,
  dismissReminderAction,
} from '@/actions/reminders';
import { DueDate } from '@/components/dashboard/due-date';
import { ReminderFormDialog } from '@/components/reminders/reminder-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { reminders } from '@/db/schema';
import {
  reminderRepeatLabel,
  reminderStatusLabel,
  reminderStatusVariant,
} from '@/lib/labels';
import {
  reminderEntityLabel,
  type ReminderEntityOptions,
} from '@/lib/reminder-entities';
import type { ReminderInput } from '@/lib/reminder-schemas';

type Reminder = InferSelectModel<typeof reminders>;

export type ReminderEntityContext = { label: string; href?: string };

type RemindersTableProps = {
  rows: Reminder[];
  contexts: Record<string, ReminderEntityContext | null>;
  entityOptions: ReminderEntityOptions;
  timeZone: string;
  dueClassName?: string;
};

export function RemindersTable({
  rows,
  contexts,
  entityOptions,
  timeZone,
  dueClassName,
}: RemindersTableProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [deleting, setDeleting] = useState<Reminder | null>(null);
  const [pending, startTransition] = useTransition();

  function handleComplete(reminder: Reminder) {
    startTransition(async () => {
      const result = await completeReminderAction(reminder.id);
      if (result.success) {
        toast.success(
          result.nextId
            ? 'Reminder completed — next occurrence scheduled'
            : 'Reminder completed'
        );
        router.refresh();
      } else {
        toast.error('Could not complete the reminder');
      }
    });
  }

  function handleDismiss(reminder: Reminder) {
    startTransition(async () => {
      const result = await dismissReminderAction(reminder.id);
      if (result.success) {
        toast.success('Reminder dismissed');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Could not dismiss the reminder');
      }
    });
  }

  function handleDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteReminderAction(deleting.id);
      if (result.success) {
        toast.success('Reminder deleted');
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Could not delete the reminder');
      }
    });
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Repeat</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="sr-only">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((reminder) => {
            const context = contexts[reminder.id];
            return (
              <TableRow key={reminder.id}>
                <TableCell className="max-w-56 truncate font-medium">
                  {reminder.title}
                </TableCell>
                <TableCell>
                  <DueDate
                    date={reminder.dueAt}
                    showTime
                    timeZone={timeZone}
                    className={dueClassName}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={reminderStatusVariant[reminder.status]}>
                    {reminderStatusLabel[reminder.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {reminderRepeatLabel[reminder.repeat]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {context ? (
                    <span className="flex items-center gap-1.5">
                      <span>{reminderEntityLabel[reminder.entityType]}</span>
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
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  {reminder.notes || '—'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${reminder.title}`}
                      >
                        <Ellipsis aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuLabel>{reminder.title}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {reminder.status === 'pending' ? (
                        <>
                          <DropdownMenuItem
                            onSelect={() => handleComplete(reminder)}
                            disabled={pending}
                          >
                            <Check aria-hidden="true" />
                            Complete
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => handleDismiss(reminder)}
                            disabled={pending}
                          >
                            <X aria-hidden="true" />
                            Dismiss
                          </DropdownMenuItem>
                        </>
                      ) : null}
                      <DropdownMenuItem
                        onSelect={() => setEditing(reminder)}
                        disabled={pending}
                      >
                        <Pencil aria-hidden="true" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setDeleting(reminder)}
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

      {editing ? (
        <ReminderFormDialog
          mode="edit"
          reminderId={editing.id}
          entityOptions={entityOptions}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
          defaultValues={
            {
              title: editing.title,
              notes: editing.notes ?? '',
              dueAt: formatInTimeZone(
                editing.dueAt,
                timeZone,
                "yyyy-MM-dd'T'HH:mm"
              ),
              status: editing.status,
              repeat: editing.repeat,
              entityType: editing.entityType,
              entityId: editing.entityId ?? '',
            } satisfies Partial<ReminderInput>
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
            <DialogTitle>Delete reminder</DialogTitle>
            <DialogDescription>
              {deleting
                ? `Delete "${deleting.title}"? This cannot be undone.`
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
    </>
  );
}
