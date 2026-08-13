'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import {
  ProjectForm,
  type ClientOption,
} from '@/components/projects/project-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type ProjectFormDialogProps = {
  clients: ClientOption[];
};

export function ProjectFormDialog({ clients }: ProjectFormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" aria-hidden="true" />
          New project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            Start tracking a delivery project and its milestones.
          </DialogDescription>
        </DialogHeader>
        <ProjectForm clients={clients} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
