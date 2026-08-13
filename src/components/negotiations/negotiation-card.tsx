'use client';

import type { InferSelectModel } from 'drizzle-orm';
import {
  Briefcase,
  Check,
  Ellipsis,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  convertNegotiationToProjectAction,
  deleteNegotiationAction,
  setNegotiationStatusAction,
} from '@/actions/negotiations';
import {
  NegotiationForm,
  type ClientOption,
} from '@/components/negotiations/negotiation-form';
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
import { negotiations } from '@/db/schema';
import {
  negotiationStatusLabel,
  negotiationStatusVariant,
  type NegotiationStatus,
} from '@/lib/labels';
import { formatDate, formatMoney } from '@/lib/money';

type Negotiation = InferSelectModel<typeof negotiations>;

export type NegotiationCardProps = {
  negotiation: Negotiation;
  clientName: string | null;
  clients: ClientOption[];
};

export function NegotiationCard({
  negotiation,
  clientName,
  clients,
}: NegotiationCardProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const defaultValues = {
    title: negotiation.title,
    description: negotiation.description ?? '',
    status: negotiation.status,
    amount: negotiation.amount,
    currency: negotiation.currency,
    clientId: negotiation.clientId ?? '',
    expectedCloseDate: negotiation.expectedCloseDate,
  };

  function handleStatusChange(status: NegotiationStatus) {
    startTransition(async () => {
      const result = await setNegotiationStatusAction(negotiation.id, status);
      if (result.success) {
        toast.success(
          status === 'open'
            ? 'Negotiation reopened'
            : `Negotiation marked as ${status}`
        );
        router.refresh();
      } else {
        toast.error(result.error ?? 'Could not update the negotiation');
      }
    });
  }

  function handleConvert() {
    startTransition(async () => {
      const result = await convertNegotiationToProjectAction(negotiation.id);
      if (result.success) {
        toast.success('Project created');
        if (result.id) {
          router.push(`/projects/${result.id}`);
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.error ?? 'Could not convert to a project');
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteNegotiationAction(negotiation.id);
      if (result.success) {
        toast.success('Negotiation deleted');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Could not delete the negotiation');
      }
    });
  }

  const statusActions: Array<{
    label: string;
    status: NegotiationStatus;
    icon: typeof Check;
  }> =
    negotiation.status === 'open'
      ? [
          { label: 'Mark won', status: 'won', icon: Check },
          { label: 'Mark lost', status: 'lost', icon: X },
        ]
      : [{ label: 'Reopen', status: 'open', icon: RotateCcw }];

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <p className="truncate font-medium">{negotiation.title}</p>
            <p className="truncate text-sm text-muted-foreground">
              {clientName ?? 'Internal'}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${negotiation.title}`}
              >
                <Ellipsis aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>{negotiation.title}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {statusActions.map((action) => (
                <DropdownMenuItem
                  key={action.label}
                  onSelect={() => handleStatusChange(action.status)}
                  disabled={pending}
                >
                  <action.icon aria-hidden="true" />
                  {action.label}
                </DropdownMenuItem>
              ))}
              {negotiation.status === 'won' ? (
                <DropdownMenuItem onSelect={handleConvert} disabled={pending}>
                  <Briefcase aria-hidden="true" />
                  Convert to project
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil aria-hidden="true" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium tabular-nums">
            {negotiation.amount != null
              ? formatMoney(negotiation.amount, negotiation.currency)
              : '—'}
          </span>
          <Badge variant={negotiationStatusVariant[negotiation.status]}>
            {negotiationStatusLabel[negotiation.status]}
          </Badge>
        </div>
        {negotiation.expectedCloseDate ? (
          <p className="text-xs text-muted-foreground">
            Close {formatDate(negotiation.expectedCloseDate)}
          </p>
        ) : null}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit negotiation</DialogTitle>
            <DialogDescription>
              Update the details for {negotiation.title}.
            </DialogDescription>
          </DialogHeader>
          <NegotiationForm
            mode="edit"
            negotiationId={negotiation.id}
            clients={clients}
            defaultValues={defaultValues}
            onSuccess={() => {
              setEditOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete negotiation</DialogTitle>
            <DialogDescription>
              Delete {negotiation.title}? This removes it from the pipeline.
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
    </Card>
  );
}
