'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/auth';
import { getDb } from '@/db';
import { clients, negotiations, projects } from '@/db/schema';
import { projectSchema, type ProjectInput } from '@/lib/project-schemas';

const projectIdSchema = z.string().min(1);

export type ProjectActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

// Empty strings from forms become null in the DB (the columns are nullable).
function toNullable<T>(value: T | '' | null | undefined): T | null {
  if (value === '' || value == null) return null;
  return value;
}

function unauthorized(): ProjectActionResult {
  return { success: false, error: 'Unauthorized' };
}

function invalid(): ProjectActionResult {
  return { success: false, error: 'Invalid project id' };
}

function failed(error: unknown): ProjectActionResult {
  console.error('Project action failed:', error);
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

async function negotiationExists(
  db: ReturnType<typeof getDb>,
  id: string
): Promise<boolean> {
  return Boolean(
    await db.query.negotiations.findFirst({
      columns: { id: true },
      where: eq(negotiations.id, id),
    })
  );
}

export async function createProjectAction(
  input: ProjectInput
): Promise<ProjectActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const {
    name,
    description,
    status,
    clientId,
    negotiationId,
    startDate,
    endDate,
    budgetCurrency,
    budgetAmount,
  } = parsed.data;

  try {
    const db = await getDb();

    const client = toNullable(clientId);
    if (client && !(await clientExists(db, client))) {
      return { success: false, error: 'Client not found' };
    }

    const negotiation = toNullable(negotiationId);
    if (negotiation && !(await negotiationExists(db, negotiation))) {
      return { success: false, error: 'Negotiation not found' };
    }

    const [row] = await db
      .insert(projects)
      .values({
        name,
        description: toNullable(description),
        status,
        clientId: client,
        negotiationId: negotiation,
        startDate: toNullable(startDate),
        endDate: toNullable(endDate),
        budgetCurrency: toNullable(budgetCurrency),
        budgetAmount: toNullable(budgetAmount),
      })
      .returning({ id: projects.id });

    revalidatePath('/projects');
    revalidatePath('/clients');
    revalidatePath('/');

    return { success: true, id: row.id };
  } catch (error) {
    return failed(error);
  }
}

export async function updateProjectAction(
  id: string,
  input: ProjectInput
): Promise<ProjectActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!projectIdSchema.safeParse(id).success) {
    return invalid();
  }

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const {
    name,
    description,
    status,
    clientId,
    negotiationId,
    startDate,
    endDate,
    budgetCurrency,
    budgetAmount,
  } = parsed.data;

  try {
    const db = await getDb();

    const client = toNullable(clientId);
    if (client && !(await clientExists(db, client))) {
      return { success: false, error: 'Client not found' };
    }

    const negotiation = toNullable(negotiationId);
    if (negotiation && !(await negotiationExists(db, negotiation))) {
      return { success: false, error: 'Negotiation not found' };
    }

    const result = await db
      .update(projects)
      .set({
        name,
        description: toNullable(description),
        status,
        clientId: client,
        negotiationId: negotiation,
        startDate: toNullable(startDate),
        endDate: toNullable(endDate),
        budgetCurrency: toNullable(budgetCurrency),
        budgetAmount: toNullable(budgetAmount),
      })
      .where(eq(projects.id, id));

    revalidatePath('/projects');
    revalidatePath('/clients');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Project not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}

export async function deleteProjectAction(
  id: string
): Promise<ProjectActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!projectIdSchema.safeParse(id).success) {
    return invalid();
  }

  try {
    const db = await getDb();
    const result = await db.delete(projects).where(eq(projects.id, id));

    revalidatePath('/projects');
    revalidatePath('/clients');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Project not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}
