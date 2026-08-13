'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { toast } from 'sonner';

import {
  createTaskAction,
  updateTaskAction,
  type TaskActionResult,
} from '@/actions/tasks';
import { taskPriorityEnum, taskStatusEnum } from '@/db/schema';
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
import {
  taskPriorityLabel,
  taskStatusLabel,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/labels';
import { taskSchema, type TaskInput } from '@/lib/task-schemas';

const taskStatuses = taskStatusEnum.enumValues;
const taskPriorities = taskPriorityEnum.enumValues;

export type EpicOption = { id: string; name: string };

type TaskFormProps = {
  mode?: 'create' | 'edit';
  taskId?: string;
  projectId: string;
  epics: EpicOption[];
  defaultValues?: Partial<TaskInput>;
  onSuccess?: () => void;
};

export function TaskForm({
  mode = 'create',
  taskId,
  projectId,
  epics,
  defaultValues,
  onSuccess,
}: TaskFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit' && taskId !== undefined;

  const [status, setStatus] = useState<TaskStatus>(
    defaultValues?.status ?? 'todo'
  );
  const [priority, setPriority] = useState<TaskPriority>(
    defaultValues?.priority ?? 'medium'
  );
  const [epicSelect, setEpicSelect] = useState(defaultValues?.epicId || 'none');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    const raw = {
      projectId: formData.get('projectId'),
      title: formData.get('title'),
      description: formData.get('description'),
      status,
      priority,
      dueDate: formData.get('dueDate'),
      epicId: epicSelect === 'none' ? '' : epicSelect,
    };

    const parsed = taskSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form.');
      return;
    }

    startTransition(async () => {
      const result: TaskActionResult =
        isEdit && taskId
          ? await updateTaskAction(taskId, parsed.data)
          : await createTaskAction(parsed.data);

      if (result.success) {
        toast.success(isEdit ? 'Task updated' : 'Task created');
        formRef.current?.reset();
        onSuccess?.();
      } else {
        setError(result.error ?? 'Something went wrong');
        toast.error(result.error ?? 'Could not save the task');
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="Write the landing page copy"
            defaultValue={defaultValues?.title ?? ''}
            required
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="What does this task involve?"
            defaultValue={defaultValues?.description ?? ''}
            disabled={pending}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(next) => setStatus(next as TaskStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {taskStatuses.map((taskStatus) => (
                  <SelectItem key={taskStatus} value={taskStatus}>
                    {taskStatusLabel[taskStatus]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Priority</Label>
            <Select
              value={priority}
              onValueChange={(next) => setPriority(next as TaskPriority)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {taskPriorities.map((taskPriority) => (
                  <SelectItem key={taskPriority} value={taskPriority}>
                    {taskPriorityLabel[taskPriority]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={toDateInputValue(defaultValues?.dueDate)}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Epic</Label>
          <Select value={epicSelect} onValueChange={setEpicSelect}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No epic (direct task)</SelectItem>
              {epics.map((epic) => (
                <SelectItem key={epic.id} value={epic.id}>
                  {epic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              : 'Create task'}
        </Button>
      </DialogFooter>
    </form>
  );
}
