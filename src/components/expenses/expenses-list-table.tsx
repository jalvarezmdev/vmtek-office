'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ellipsis, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteExpenseAction } from '@/actions/expenses';
import {
  StatusFilter,
  type StatusFilterOption,
} from '@/components/filters/status-filter';
import { ExpenseFormDialog } from '@/components/expenses/expense-form-dialog';
import type {
  ClientOption,
  ProjectOption,
} from '@/components/expenses/expense-form';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { expenseCategoryEnum } from '@/db/schema';
import {
  expenseCategoryLabel,
  expenseFrequencyLabel,
  type ExpenseCategory,
  type ExpenseFrequency,
} from '@/lib/labels';
import { formatDate, formatMoney } from '@/lib/money';

const filterOptions: StatusFilterOption<ExpenseCategory>[] =
  expenseCategoryEnum.enumValues.map((category) => ({
    value: category,
    label: expenseCategoryLabel[category],
  }));

export type ExpenseListRow = {
  id: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: Date;
  recurring: boolean;
  recurringFrequency: ExpenseFrequency | null;
  client: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  description: string | null;
};

type ExpensesListTableProps = {
  rows: ExpenseListRow[];
  clients: ClientOption[];
  projects: ProjectOption[];
};

export function ExpensesListTable({
  rows,
  clients,
  projects,
}: ExpensesListTableProps) {
  const router = useRouter();
  const [category, setCategory] = useState<'all' | ExpenseCategory>('all');
  const [editing, setEditing] = useState<ExpenseListRow | null>(null);
  const [deleting, setDeleting] = useState<ExpenseListRow | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      category === 'all'
        ? rows
        : rows.filter((row) => row.category === category),
    [rows, category]
  );

  function handleDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteExpenseAction(deleting.id);
      if (result.success) {
        toast.success('Expense deleted');
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Could not delete the expense');
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <StatusFilter
        value={category}
        onChange={setCategory}
        options={filterOptions}
        label="Filter expenses by category"
        allLabel="All categories"
      />
      <Card>
        <CardContent className="px-0 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No expenses match the selected category.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(row.date)}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground">
                      {row.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {expenseCategoryLabel[row.category]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatMoney(row.amount, row.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.client ? (
                        <Link
                          href={`/clients/${row.client.id}`}
                          className="hover:underline"
                        >
                          {row.client.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.project ? (
                        <Link
                          href={`/projects/${row.project.id}`}
                          className="hover:underline"
                        >
                          {row.project.name}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {row.recurring ? (
                        <Badge variant="outline">
                          {row.recurringFrequency
                            ? expenseFrequencyLabel[row.recurringFrequency]
                            : 'Recurring'}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${formatMoney(row.amount, row.currency)} expense`}
                          >
                            <Ellipsis aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel>
                            {formatMoney(row.amount, row.currency)}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => setEditing(row)}
                            disabled={pending}
                          >
                            <Pencil aria-hidden="true" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleting(row)}
                            disabled={pending}
                          >
                            <Trash2 aria-hidden="true" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editing ? (
        <ExpenseFormDialog
          mode="edit"
          expenseId={editing.id}
          clients={clients}
          projects={projects}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
          defaultValues={{
            amount: editing.amount,
            currency: editing.currency,
            category: editing.category,
            clientId: editing.client?.id ?? '',
            projectId: editing.project?.id ?? '',
            date: editing.date,
            recurring: editing.recurring,
            recurringFrequency: editing.recurringFrequency,
            description: editing.description ?? '',
          }}
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
            <DialogTitle>Delete expense</DialogTitle>
            <DialogDescription>
              {deleting
                ? `Delete the ${formatMoney(deleting.amount, deleting.currency)} expense? This cannot be undone.`
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
