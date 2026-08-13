import type { InferSelectModel } from 'drizzle-orm';

import {
  PaymentsTable,
  type PaymentRow,
} from '@/components/payments/payments-table';
import { clients, payments } from '@/db/schema';

export type ProjectPaymentsTabProps = {
  payments: Array<
    InferSelectModel<typeof payments> & {
      client: InferSelectModel<typeof clients> | null;
    }
  >;
};

export function PaymentsTab({
  payments: paymentRows,
}: ProjectPaymentsTabProps) {
  const rows: PaymentRow[] = paymentRows.map((payment) => ({
    ...payment,
    context: payment.client
      ? {
          href: `/clients/${payment.client.id}`,
          label: payment.client.name,
        }
      : null,
  }));

  return (
    <PaymentsTable
      payments={rows}
      contextHeader="Client"
      emptyDescription="Payments for this project will show up here."
    />
  );
}
