'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/auth';
import { getDb } from '@/db';
import { clients, payments, projects } from '@/db/schema';
import { paymentSchema, type PaymentInput } from '@/lib/payment-schemas';

const paymentIdSchema = z.string().min(1);

export type PaymentActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

// Empty strings from forms become null in the DB (the columns are nullable).
function toNullable<T>(value: T | '' | null | undefined): T | null {
  if (value === '' || value == null) return null;
  return value;
}

function unauthorized(): PaymentActionResult {
  return { success: false, error: 'Unauthorized' };
}

function invalid(): PaymentActionResult {
  return { success: false, error: 'Invalid payment id' };
}

function failed(error: unknown): PaymentActionResult {
  console.error('Payment action failed:', error);
  return { success: false, error: 'Something went wrong' };
}

async function clientExists(
  db: ReturnType<typeof getDb>,
  id: string
): Promise<boolean> {
  return Boolean(
    await db.query.clients.findFirst({
      columns: { id: true },
      where: eq(clients.id, id),
    })
  );
}

async function projectExists(
  db: ReturnType<typeof getDb>,
  id: string
): Promise<boolean> {
  return Boolean(
    await db.query.projects.findFirst({
      columns: { id: true },
      where: eq(projects.id, id),
    })
  );
}

export async function createPaymentAction(
  input: PaymentInput
): Promise<PaymentActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const {
    amount,
    currency,
    status,
    clientId,
    projectId,
    receivedDate,
    dueDate,
    description,
  } = parsed.data;

  try {
    const db = await getDb();

    const client = toNullable(clientId);
    if (client && !(await clientExists(db, client))) {
      return { success: false, error: 'Client not found' };
    }

    const project = toNullable(projectId);
    if (project && !(await projectExists(db, project))) {
      return { success: false, error: 'Project not found' };
    }

    const [row] = await db
      .insert(payments)
      .values({
        amount,
        currency,
        status,
        clientId: client,
        projectId: project,
        receivedDate: toNullable(receivedDate),
        dueDate: toNullable(dueDate),
        description: toNullable(description),
      })
      .returning({ id: payments.id });

    revalidatePath('/payments');
    revalidatePath('/clients');
    revalidatePath('/projects');
    revalidatePath('/');

    return { success: true, id: row.id };
  } catch (error) {
    return failed(error);
  }
}

export async function updatePaymentAction(
  id: string,
  input: PaymentInput
): Promise<PaymentActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!paymentIdSchema.safeParse(id).success) {
    return invalid();
  }

  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  // Full-field update: paymentSchema defaults `status` to 'pending', so an
  // update that omits it (or any field) resets that column. The 7.3 edit form
  // must always submit every field, including `status`.
  const {
    amount,
    currency,
    status,
    clientId,
    projectId,
    receivedDate,
    dueDate,
    description,
  } = parsed.data;

  try {
    const db = await getDb();

    const client = toNullable(clientId);
    if (client && !(await clientExists(db, client))) {
      return { success: false, error: 'Client not found' };
    }

    const project = toNullable(projectId);
    if (project && !(await projectExists(db, project))) {
      return { success: false, error: 'Project not found' };
    }

    const result = await db
      .update(payments)
      .set({
        amount,
        currency,
        status,
        clientId: client,
        projectId: project,
        receivedDate: toNullable(receivedDate),
        dueDate: toNullable(dueDate),
        description: toNullable(description),
      })
      .where(eq(payments.id, id));

    revalidatePath('/payments');
    revalidatePath('/clients');
    revalidatePath('/projects');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Payment not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}

export async function deletePaymentAction(
  id: string
): Promise<PaymentActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!paymentIdSchema.safeParse(id).success) {
    return invalid();
  }

  try {
    const db = await getDb();
    const result = await db.delete(payments).where(eq(payments.id, id));

    revalidatePath('/payments');
    revalidatePath('/clients');
    revalidatePath('/projects');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Payment not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}
