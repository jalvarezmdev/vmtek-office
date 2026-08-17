'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import { deleteProjectAction } from '@/actions/projects';
import {
  ProjectForm,
  type ClientOption,
  type NegotiationOption,
} from '@/components/projects/project-form';
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
import type { ProjectStatus } from '@/lib/labels';

type ProjectActionsProject = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  clientId: string | null;
  negotiationId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  budgetCurrency: string | null;
  budgetAmount: number | null;
};

export function ProjectActions({
  project,
  clients,
  negotiations,
}: {
  project: ProjectActionsProject;
  clients: ClientOption[];
  negotiations: NegotiationOption[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const defaultValues = {
    name: project.name,
    description: project.description ?? '',
    status: project.status,
    clientId: project.clientId ?? '',
    negotiationId: project.negotiationId ?? '',
    startDate: project.startDate,
    endDate: project.endDate,
    budgetCurrency: project.budgetCurrency ?? '',
    budgetAmount: project.budgetAmount,
  };

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProjectAction(project.id);
      if (result.success) {
        toast.success('Project deleted');
        router.push('/projects');
      } else {
        toast.error(result.error ?? 'Could not delete the project');
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Pencil data-icon="inline-start" aria-hidden="true" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
            <DialogDescription>
              Update the details for {project.name}.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            mode="edit"
            projectId={project.id}
            clients={clients}
            negotiations={negotiations}
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
          <Button variant="outline">
            <Trash2 data-icon="inline-start" aria-hidden="true" />
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete project</DialogTitle>
            <DialogDescription>
              Delete {project.name}? This removes the project and its
              milestones, epics, and tasks.
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
