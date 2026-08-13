'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/auth';
import { getDb } from '@/db';
import { clients } from '@/db/schema';
import { clientSchema, type ClientInput } from '@/lib/client-schemas';

const clientIdSchema = z.string().min(1);

export type ClientActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

// Empty strings from forms become null in the DB (the columns are nullable).
function toNullable(value?: string): string | null {
  return value || null;
}

function unauthorized(): ClientActionResult {
  return { success: false, error: 'Unauthorized' };
}

function invalid(): ClientActionResult {
  return { success: false, error: 'Invalid client id' };
}

function failed(error: unknown): ClientActionResult {
  console.error('Client action failed:', error);
  return { success: false, error: 'Something went wrong' };
}

export async function createClientAction(
  input: ClientInput
): Promise<ClientActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const { name, company, email, phone, address } = parsed.data;

  try {
    const db = await getDb();
    const [row] = await db
      .insert(clients)
      .values({
        name,
        company: toNullable(company),
        email: toNullable(email),
        phone: toNullable(phone),
        address: toNullable(address),
      })
      .returning({ id: clients.id });

    revalidatePath('/clients');
    revalidatePath('/');

    return { success: true, id: row.id };
  } catch (error) {
    return failed(error);
  }
}

export async function updateClientAction(
  id: string,
  input: ClientInput
): Promise<ClientActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!clientIdSchema.safeParse(id).success) {
    return invalid();
  }

  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const { name, company, email, phone, address } = parsed.data;

  try {
    const db = await getDb();
    const result = await db
      .update(clients)
      .set({
        name,
        company: toNullable(company),
        email: toNullable(email),
        phone: toNullable(phone),
        address: toNullable(address),
      })
      .where(eq(clients.id, id));

    revalidatePath('/clients');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Client not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}

export async function deleteClientAction(
  id: string
): Promise<ClientActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!clientIdSchema.safeParse(id).success) {
    return invalid();
  }

  try {
    const db = await getDb();
    const result = await db.delete(clients).where(eq(clients.id, id));

    revalidatePath('/clients');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Client not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}
