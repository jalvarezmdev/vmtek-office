'use client';

import type { InferSelectModel } from 'drizzle-orm';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { deleteEpicAction } from '@/actions/epics';
import { EpicForm } from '@/components/projects/project-detail/epic-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { epics } from '@/db/schema';

type Epic = InferSelectModel<typeof epics>;

export function EpicCreateDialog({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Add epic
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New epic</DialogTitle>
          <DialogDescription>
            Group a set of related tasks into a feature block.
          </DialogDescription>
        </DialogHeader>
        <EpicForm
          projectId={projectId}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EpicRowActions({
  epic,
  projectId,
}: {
  epic: Epic;
  projectId: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const defaultValues = {
    name: epic.name,
    description: epic.description ?? '',
    status: epic.status,
  };

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteEpicAction(epic.id);
      if (result.success) {
        toast.success('Epic deleted');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Could not delete the epic');
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${epic.name}`}
          >
            <Pencil aria-hidden="true" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit epic</DialogTitle>
            <DialogDescription>
              Update the details for {epic.name}.
            </DialogDescription>
          </DialogHeader>
          <EpicForm
            mode="edit"
            epicId={epic.id}
            projectId={projectId}
            defaultValues={defaultValues}
            onSuccess={() => {
              setEditOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${epic.name}`}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete epic</DialogTitle>
            <DialogDescription>
              Delete {epic.name}? This removes the epic and its tasks.
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
