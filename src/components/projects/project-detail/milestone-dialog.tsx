'use client';

import type { InferSelectModel } from 'drizzle-orm';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { deleteMilestoneAction } from '@/actions/milestones';
import {
  MilestoneForm,
  type PaymentOption,
} from '@/components/projects/project-detail/milestone-form';
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
import { milestones } from '@/db/schema';

type Milestone = InferSelectModel<typeof milestones>;

export function MilestoneCreateDialog({
  projectId,
  payments,
}: {
  projectId: string;
  payments: PaymentOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Add milestone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New milestone</DialogTitle>
          <DialogDescription>
            Add a billing phase or delivery milestone for this project.
          </DialogDescription>
        </DialogHeader>
        <MilestoneForm
          projectId={projectId}
          payments={payments}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export function MilestoneRowActions({
  milestone,
  projectId,
  payments,
}: {
  milestone: Milestone;
  projectId: string;
  payments: PaymentOption[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const defaultValues = {
    name: milestone.name,
    description: milestone.description ?? '',
    status: milestone.status,
    dueDate: milestone.dueDate,
    paymentId: milestone.paymentId ?? '',
  };

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteMilestoneAction(milestone.id);
      if (result.success) {
        toast.success('Milestone deleted');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Could not delete the milestone');
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
            aria-label={`Edit ${milestone.name}`}
          >
            <Pencil aria-hidden="true" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit milestone</DialogTitle>
            <DialogDescription>
              Update the details for {milestone.name}.
            </DialogDescription>
          </DialogHeader>
          <MilestoneForm
            mode="edit"
            milestoneId={milestone.id}
            projectId={projectId}
            payments={payments}
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
            aria-label={`Delete ${milestone.name}`}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete milestone</DialogTitle>
            <DialogDescription>
              Delete {milestone.name}? This only removes the milestone; a linked
              payment is kept.
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
