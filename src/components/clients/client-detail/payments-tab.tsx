import type { InferSelectModel } from 'drizzle-orm';

import {
  PaymentsTable,
  type PaymentRow,
} from '@/components/payments/payments-table';
import { payments, projects } from '@/db/schema';

export type PaymentsTabProps = {
  payments: Array<
    InferSelectModel<typeof payments> & {
      project: InferSelectModel<typeof projects> | null;
    }
  >;
};

export function PaymentsTab({ payments: paymentRows }: PaymentsTabProps) {
  const rows: PaymentRow[] = paymentRows.map((payment) => ({
    ...payment,
    context: payment.project
      ? {
          href: `/projects/${payment.project.id}`,
          label: payment.project.name,
        }
      : null,
  }));

  return (
    <PaymentsTable
      payments={rows}
      contextHeader="Project"
      emptyDescription="Payments for this client will show up here."
    />
  );
}
