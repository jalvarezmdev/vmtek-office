'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { toast } from 'sonner';

import {
  createProjectAction,
  updateProjectAction,
  type ProjectActionResult,
} from '@/actions/projects';
import { projectStatusEnum } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toDateInputValue } from '@/lib/date-input';
import { projectStatusLabel, type ProjectStatus } from '@/lib/labels';
import { projectSchema, type ProjectInput } from '@/lib/project-schemas';

const projectStatuses = projectStatusEnum.enumValues;
const budgetCurrencies = ['USD', 'EUR', 'MXN', 'GBP'];

export type ClientOption = { id: string; name: string };
export type NegotiationOption = { id: string; title: string };

type ProjectFormProps = {
  mode?: 'create' | 'edit';
  projectId?: string;
  clients: ClientOption[];
  negotiations: NegotiationOption[];
  defaultValues?: Partial<ProjectInput>;
  onSuccess?: () => void;
};

export function ProjectForm({
  mode = 'create',
  projectId,
  clients,
  negotiations,
  defaultValues,
  onSuccess,
}: ProjectFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit' && projectId !== undefined;

  const [status, setStatus] = useState(defaultValues?.status ?? 'planning');
  // '' (from an internal project) and unset default to the 'none' option.
  const [clientSelect, setClientSelect] = useState(
    defaultValues?.clientId || 'none'
  );
  const [negotiationSelect, setNegotiationSelect] = useState(
    defaultValues?.negotiationId || 'none'
  );
  const [currency, setCurrency] = useState(defaultValues?.budgetCurrency ?? '');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const rawAmount = formData.get('budgetAmount');
    const budgetAmount =
      typeof rawAmount === 'string' && rawAmount.trim() === ''
        ? ''
        : Number(rawAmount);

    const raw = {
      name: formData.get('name'),
      description: formData.get('description'),
      status,
      clientId: clientSelect === 'none' ? '' : clientSelect,
      negotiationId: negotiationSelect === 'none' ? '' : negotiationSelect,
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      budgetCurrency: currency,
      budgetAmount,
    };

    const parsed = projectSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form.');
      return;
    }

    startTransition(async () => {
      const result: ProjectActionResult =
        isEdit && projectId
          ? await updateProjectAction(projectId, parsed.data)
          : await createProjectAction(parsed.data);

      if (result.success) {
        toast.success(isEdit ? 'Project updated' : 'Project created');
        formRef.current?.reset();
        onSuccess?.();
      } else {
        setError(result.error ?? 'Something went wrong');
        toast.error(result.error ?? 'Could not save the project');
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Website redesign"
            defaultValue={defaultValues?.name ?? ''}
            required
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="What does this project deliver?"
            defaultValue={defaultValues?.description ?? ''}
            disabled={pending}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(next) => setStatus(next as ProjectStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projectStatuses.map((projectStatus) => (
                  <SelectItem key={projectStatus} value={projectStatus}>
                    {projectStatusLabel[projectStatus]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Client</Label>
            <Select value={clientSelect} onValueChange={setClientSelect}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client (internal)</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Negotiation</Label>
          <Select
            value={negotiationSelect}
            onValueChange={setNegotiationSelect}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No negotiation</SelectItem>
              {negotiations.map((negotiation) => (
                <SelectItem key={negotiation.id} value={negotiation.id}>
                  {negotiation.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="startDate">Start date</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              defaultValue={toDateInputValue(defaultValues?.startDate)}
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="endDate">End date</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              defaultValue={toDateInputValue(defaultValues?.endDate)}
              disabled={pending}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Budget currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {budgetCurrencies.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="budgetAmount">Budget amount</Label>
            <Input
              id="budgetAmount"
              name="budgetAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="12000"
              defaultValue={defaultValues?.budgetAmount?.toString() ?? ''}
              disabled={pending}
            />
          </div>
        </div>
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
              : 'Create project'}
        </Button>
      </DialogFooter>
    </form>
  );
}
