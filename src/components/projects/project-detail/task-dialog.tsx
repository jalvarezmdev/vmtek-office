'use client';

import type { InferSelectModel } from 'drizzle-orm';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { deleteTaskAction } from '@/actions/tasks';
import {
  TaskForm,
  type EpicOption,
} from '@/components/projects/project-detail/task-form';
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
import { tasks } from '@/db/schema';

type Task = InferSelectModel<typeof tasks>;

export function TaskCreateDialog({
  projectId,
  epics,
}: {
  projectId: string;
  epics: EpicOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" aria-hidden="true" />
          Add task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
          <DialogDescription>
            Add a work item to this project, optionally under an epic.
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          projectId={projectId}
          epics={epics}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export function TaskRowActions({
  task,
  projectId,
  epics,
}: {
  task: Task;
  projectId: string;
  epics: EpicOption[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const defaultValues = {
    title: task.title,
    description: task.description ?? '',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    epicId: task.epicId ?? '',
  };

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTaskAction(task.id);
      if (result.success) {
        toast.success('Task deleted');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Could not delete the task');
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
            aria-label={`Edit ${task.title}`}
          >
            <Pencil aria-hidden="true" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>
              Update the details for {task.title}.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            mode="edit"
            taskId={task.id}
            projectId={projectId}
            epics={epics}
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
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete task</DialogTitle>
            <DialogDescription>
              Delete {task.title}? This removes the work item from the project.
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
