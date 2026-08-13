'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/auth';
import { getDb } from '@/db';
import { clients, expenses, projects } from '@/db/schema';
import { expenseSchema, type ExpenseInput } from '@/lib/expense-schemas';

const expenseIdSchema = z.string().min(1);

export type ExpenseActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

// Empty strings from forms become null in the DB (the columns are nullable).
function toNullable<T>(value: T | '' | null | undefined): T | null {
  if (value === '' || value == null) return null;
  return value;
}

function unauthorized(): ExpenseActionResult {
  return { success: false, error: 'Unauthorized' };
}

function invalid(): ExpenseActionResult {
  return { success: false, error: 'Invalid expense id' };
}

function failed(error: unknown): ExpenseActionResult {
  console.error('Expense action failed:', error);
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

export async function createExpenseAction(
  input: ExpenseInput
): Promise<ExpenseActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const {
    amount,
    currency,
    category,
    date,
    recurring,
    recurringFrequency,
    clientId,
    projectId,
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

    // A non-recurring expense never stores a frequency, matching the DB CHECK
    // constraint expenses_recurring_requires_frequency.
    const [row] = await db
      .insert(expenses)
      .values({
        amount,
        currency,
        category,
        date,
        recurring,
        recurringFrequency: recurring ? recurringFrequency : null,
        clientId: client,
        projectId: project,
        description: toNullable(description),
      })
      .returning({ id: expenses.id });

    revalidatePath('/expenses');
    revalidatePath('/clients');
    revalidatePath('/projects');
    revalidatePath('/');

    return { success: true, id: row.id };
  } catch (error) {
    return failed(error);
  }
}

export async function updateExpenseAction(
  id: string,
  input: ExpenseInput
): Promise<ExpenseActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!expenseIdSchema.safeParse(id).success) {
    return invalid();
  }

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  // Full-field update: the edit form must always submit every field (amount,
  // currency, category, date, recurring + frequency, links, description).
  const {
    amount,
    currency,
    category,
    date,
    recurring,
    recurringFrequency,
    clientId,
    projectId,
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
      .update(expenses)
      .set({
        amount,
        currency,
        category,
        date,
        recurring,
        recurringFrequency: recurring ? recurringFrequency : null,
        clientId: client,
        projectId: project,
        description: toNullable(description),
      })
      .where(eq(expenses.id, id));

    revalidatePath('/expenses');
    revalidatePath('/clients');
    revalidatePath('/projects');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Expense not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}

export async function deleteExpenseAction(
  id: string
): Promise<ExpenseActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!expenseIdSchema.safeParse(id).success) {
    return invalid();
  }

  try {
    const db = await getDb();
    const result = await db.delete(expenses).where(eq(expenses.id, id));

    revalidatePath('/expenses');
    revalidatePath('/clients');
    revalidatePath('/projects');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Expense not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}
