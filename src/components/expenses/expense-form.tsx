'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { toast } from 'sonner';

import {
  createExpenseAction,
  updateExpenseAction,
  type ExpenseActionResult,
} from '@/actions/expenses';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { expenseCategoryEnum, expenseFrequencyEnum } from '@/db/schema';
import { toDateInputValue } from '@/lib/date-input';
import { expenseSchema, type ExpenseInput } from '@/lib/expense-schemas';
import {
  expenseCategoryLabel,
  expenseFrequencyLabel,
  type ExpenseCategory,
  type ExpenseFrequency,
} from '@/lib/labels';

const expenseCategories = expenseCategoryEnum.enumValues;
const expenseFrequencies = expenseFrequencyEnum.enumValues;
const expenseCurrencies = ['USD', 'EUR', 'MXN', 'GBP'];

export type ClientOption = { id: string; name: string };
export type ProjectOption = { id: string; name: string };

type ExpenseFormProps = {
  mode?: 'create' | 'edit';
  expenseId?: string;
  clients: ClientOption[];
  projects: ProjectOption[];
  defaultValues?: Partial<ExpenseInput>;
  onSuccess?: () => void;
};

export function ExpenseForm({
  mode = 'create',
  expenseId,
  clients,
  projects,
  defaultValues,
  onSuccess,
}: ExpenseFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit' && expenseId !== undefined;

  const [category, setCategory] = useState<ExpenseCategory | ''>(
    defaultValues?.category ?? ''
  );
  const [currency, setCurrency] = useState(defaultValues?.currency ?? '');
  const [clientSelect, setClientSelect] = useState(
    defaultValues?.clientId || 'none'
  );
  const [projectSelect, setProjectSelect] = useState(
    defaultValues?.projectId || 'none'
  );
  const [recurring, setRecurring] = useState(defaultValues?.recurring ?? false);
  // Shown only when recurring is checked. Defaults to the most common
  // frequency so the toggle-on path is a single step.
  const [frequency, setFrequency] = useState<ExpenseFrequency | ''>(
    defaultValues?.recurringFrequency ?? 'monthly'
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const rawAmount = formData.get('amount');
    const amount =
      typeof rawAmount === 'string' && rawAmount.trim() === ''
        ? ''
        : Number(rawAmount);

    const raw = {
      amount,
      currency,
      category,
      date: formData.get('date'),
      recurring,
      recurringFrequency: recurring ? frequency : '',
      clientId: clientSelect === 'none' ? '' : clientSelect,
      projectId: projectSelect === 'none' ? '' : projectSelect,
      description: formData.get('description'),
    };

    const parsed = expenseSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check the form.');
      return;
    }

    startTransition(async () => {
      const result: ExpenseActionResult =
        isEdit && expenseId
          ? await updateExpenseAction(expenseId, parsed.data)
          : await createExpenseAction(parsed.data);

      if (result.success) {
        toast.success(isEdit ? 'Expense updated' : 'Expense created');
        formRef.current?.reset();
        onSuccess?.();
      } else {
        setError(result.error ?? 'Something went wrong');
        toast.error(result.error ?? 'Could not save the expense');
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(next) => setCategory(next as ExpenseCategory)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((expenseCategory) => (
                  <SelectItem key={expenseCategory} value={expenseCategory}>
                    {expenseCategoryLabel[expenseCategory]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="150"
              defaultValue={defaultValues?.amount?.toString() ?? ''}
              disabled={pending}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {expenseCurrencies.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={toDateInputValue(defaultValues?.date)}
              disabled={pending}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Client</Label>
            <Select value={clientSelect} onValueChange={setClientSelect}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No client (general)</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Project</Label>
            <Select value={projectSelect} onValueChange={setProjectSelect}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project (general)</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="recurring"
              checked={recurring}
              onCheckedChange={(checked) => setRecurring(checked === true)}
              disabled={pending}
            />
            <Label htmlFor="recurring">Recurring expense</Label>
          </div>
          {recurring ? (
            <div className="flex flex-col gap-2">
              <Label>Frequency</Label>
              <Select
                value={frequency}
                onValueChange={(next) => setFrequency(next as ExpenseFrequency)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {expenseFrequencies.map((expenseFrequency) => (
                    <SelectItem key={expenseFrequency} value={expenseFrequency}>
                      {expenseFrequencyLabel[expenseFrequency]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="What is this expense for?"
            defaultValue={defaultValues?.description ?? ''}
            disabled={pending}
          />
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
              : 'Create expense'}
        </Button>
      </DialogFooter>
    </form>
  );
}
