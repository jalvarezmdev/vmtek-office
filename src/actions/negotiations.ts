'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createProjectAction } from '@/actions/projects';
import { auth } from '@/auth';
import { getDb } from '@/db';
import {
  clients,
  negotiations,
  negotiationStatusEnum,
  projects,
} from '@/db/schema';
import {
  negotiationSchema,
  type NegotiationInput,
} from '@/lib/negotiation-schemas';

const negotiationIdSchema = z.string().min(1);

export type NegotiationActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

// Empty strings from forms become null in the DB (the columns are nullable).
function toNullable<T>(value: T | '' | null | undefined): T | null {
  if (value === '' || value == null) return null;
  return value;
}

function unauthorized(): NegotiationActionResult {
  return { success: false, error: 'Unauthorized' };
}

function invalid(): NegotiationActionResult {
  return { success: false, error: 'Invalid negotiation id' };
}

function failed(error: unknown): NegotiationActionResult {
  console.error('Negotiation action failed:', error);
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

export async function createNegotiationAction(
  input: NegotiationInput
): Promise<NegotiationActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  const parsed = negotiationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const {
    title,
    description,
    amount,
    currency,
    status,
    clientId,
    expectedCloseDate,
  } = parsed.data;

  try {
    const db = await getDb();

    const client = toNullable(clientId);
    if (client && !(await clientExists(db, client))) {
      return { success: false, error: 'Client not found' };
    }

    const [row] = await db
      .insert(negotiations)
      .values({
        title,
        description: toNullable(description),
        amount: toNullable(amount),
        currency,
        status,
        clientId: client,
        expectedCloseDate: toNullable(expectedCloseDate),
      })
      .returning({ id: negotiations.id });

    revalidatePath('/negotiations');
    revalidatePath('/clients');
    revalidatePath('/');

    return { success: true, id: row.id };
  } catch (error) {
    return failed(error);
  }
}

export async function updateNegotiationAction(
  id: string,
  input: NegotiationInput
): Promise<NegotiationActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!negotiationIdSchema.safeParse(id).success) {
    return invalid();
  }

  const parsed = negotiationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  // Full-field update: negotiationSchema defaults `status` to 'open', so an
  // update that omits it (or any field) resets that column. The edit form
  // must always submit every field, including `status`.
  const {
    title,
    description,
    amount,
    currency,
    status,
    clientId,
    expectedCloseDate,
  } = parsed.data;

  try {
    const db = await getDb();

    const client = toNullable(clientId);
    if (client && !(await clientExists(db, client))) {
      return { success: false, error: 'Client not found' };
    }

    const result = await db
      .update(negotiations)
      .set({
        title,
        description: toNullable(description),
        amount: toNullable(amount),
        currency,
        status,
        clientId: client,
        expectedCloseDate: toNullable(expectedCloseDate),
      })
      .where(eq(negotiations.id, id));

    revalidatePath('/negotiations');
    revalidatePath('/clients');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Negotiation not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}

export async function deleteNegotiationAction(
  id: string
): Promise<NegotiationActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!negotiationIdSchema.safeParse(id).success) {
    return invalid();
  }

  try {
    const db = await getDb();
    const result = await db.delete(negotiations).where(eq(negotiations.id, id));

    revalidatePath('/negotiations');
    revalidatePath('/clients');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Negotiation not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}

const negotiationStatusSchema = z.enum(negotiationStatusEnum.enumValues);

export async function setNegotiationStatusAction(
  id: string,
  status: 'open' | 'won' | 'lost'
): Promise<NegotiationActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!negotiationIdSchema.safeParse(id).success) {
    return invalid();
  }

  const parsed = negotiationStatusSchema.safeParse(status);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid status',
    };
  }

  try {
    const db = await getDb();
    const result = await db
      .update(negotiations)
      .set({ status: parsed.data })
      .where(eq(negotiations.id, id));

    revalidatePath('/negotiations');
    revalidatePath('/clients');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Negotiation not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}

export async function convertNegotiationToProjectAction(
  negotiationId: string,
  name?: string
): Promise<NegotiationActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!negotiationIdSchema.safeParse(negotiationId).success) {
    return invalid();
  }

  try {
    const db = await getDb();
    const negotiation = await db.query.negotiations.findFirst({
      where: eq(negotiations.id, negotiationId),
    });

    if (!negotiation) {
      return { success: false, error: 'Negotiation not found' };
    }

    if (negotiation.status !== 'won') {
      return {
        success: false,
        error: 'Only won negotiations can be converted to projects',
      };
    }

    const existing = await db.query.projects.findFirst({
      columns: { id: true },
      where: eq(projects.negotiationId, negotiationId),
    });
    if (existing) {
      return {
        success: false,
        error: 'A project already exists for this negotiation',
      };
    }

    const project = await createProjectAction({
      name: name?.trim() || negotiation.title,
      status: 'planning',
      clientId: negotiation.clientId,
      negotiationId: negotiation.id,
      startDate: null,
      endDate: null,
    });

    if (!project.success) {
      return { success: false, error: project.error ?? 'Something went wrong' };
    }

    revalidatePath('/negotiations');

    return { success: true, id: project.id };
  } catch (error) {
    return failed(error);
  }
}
