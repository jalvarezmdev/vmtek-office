'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  Coins,
  Ellipsis,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  deletePaymentAction,
  setPaymentStatusAction,
} from '@/actions/payments';
import {
  StatusFilter,
  type StatusFilterOption,
} from '@/components/filters/status-filter';
import { PaymentFormDialog } from '@/components/payments/payment-form-dialog';
import type {
  ClientOption,
  ProjectOption,
} from '@/components/payments/payment-form';
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
import { paymentStatusEnum } from '@/db/schema';
import {
  paymentStatusLabel,
  paymentStatusVariant,
  type PaymentStatus,
} from '@/lib/labels';
import { formatDate, formatMoney, isOverdue } from '@/lib/money';

const filterOptions: StatusFilterOption<PaymentStatus>[] =
  paymentStatusEnum.enumValues.map((status) => ({
    value: status,
    label: paymentStatusLabel[status],
  }));

export type PaymentListRow = {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  client: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  dueDate: Date | null;
  receivedDate: Date | null;
  description: string | null;
};

type PaymentsListTableProps = {
  rows: PaymentListRow[];
  clients: ClientOption[];
  projects: ProjectOption[];
};

export function PaymentsListTable({
  rows,
  clients,
  projects,
}: PaymentsListTableProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'all' | PaymentStatus>('all');
  const [editing, setEditing] = useState<PaymentListRow | null>(null);
  const [deleting, setDeleting] = useState<PaymentListRow | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      status === 'all' ? rows : rows.filter((row) => row.status === status),
    [rows, status]
  );

  function handleStatusChange(row: PaymentListRow, next: PaymentStatus) {
    startTransition(async () => {
      const result = await setPaymentStatusAction(row.id, next);
      if (result.success) {
        toast.success(`Payment marked as ${paymentStatusLabel[next]}`);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Could not update the payment');
      }
    });
  }

  function handleDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deletePaymentAction(deleting.id);
      if (result.success) {
        toast.success('Payment deleted');
        setDeleting(null);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Could not delete the payment');
      }
    });
  }

  function actionsFor(row: PaymentListRow): Array<{
    label: string;
    status: PaymentStatus;
    icon: typeof Check;
  }> {
    if (row.status === 'pending') {
      return [
        { label: 'Mark received', status: 'received', icon: Check },
        { label: 'Record partial', status: 'partial', icon: Coins },
      ];
    }
    if (row.status === 'partial') {
      return [
        { label: 'Mark received', status: 'received', icon: Check },
        { label: 'Mark pending', status: 'pending', icon: RotateCcw },
      ];
    }
    return [{ label: 'Mark pending', status: 'pending', icon: RotateCcw }];
  }

  return (
    <div className="flex flex-col gap-4">
      <StatusFilter
        value={status}
        onChange={setStatus}
        options={filterOptions}
        label="Filter payments by status"
      />
      <Card>
        <CardContent className="px-0 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Due date</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Description</TableHead>
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
                    No payments match the selected status.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => {
                  const overdue =
                    row.status !== 'received' && isOverdue(row.dueDate);
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatMoney(row.amount, row.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={paymentStatusVariant[row.status]}>
                          {paymentStatusLabel[row.status]}
                        </Badge>
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
                      <TableCell
                        className={
                          overdue
                            ? 'font-medium text-destructive'
                            : 'text-muted-foreground'
                        }
                      >
                        {row.dueDate ? formatDate(row.dueDate) : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.receivedDate ? formatDate(row.receivedDate) : '—'}
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-muted-foreground">
                        {row.description || '—'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${formatMoney(row.amount, row.currency)} payment`}
                            >
                              <Ellipsis aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel>
                              {formatMoney(row.amount, row.currency)}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {actionsFor(row).map((action) => (
                              <DropdownMenuItem
                                key={action.label}
                                onSelect={() =>
                                  handleStatusChange(row, action.status)
                                }
                                disabled={pending}
                              >
                                <action.icon aria-hidden="true" />
                                {action.label}
                              </DropdownMenuItem>
                            ))}
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editing ? (
        <PaymentFormDialog
          mode="edit"
          paymentId={editing.id}
          clients={clients}
          projects={projects}
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
          defaultValues={{
            amount: editing.amount,
            currency: editing.currency,
            status: editing.status,
            clientId: editing.client?.id ?? '',
            projectId: editing.project?.id ?? '',
            dueDate: editing.dueDate ?? '',
            receivedDate: editing.receivedDate ?? '',
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
            <DialogTitle>Delete payment</DialogTitle>
            <DialogDescription>
              {deleting
                ? `Delete the ${formatMoney(deleting.amount, deleting.currency)} payment? This cannot be undone.`
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
