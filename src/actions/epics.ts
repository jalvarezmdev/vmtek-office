'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/auth';
import { getDb } from '@/db';
import { epics, projects } from '@/db/schema';
import { epicSchema, type EpicInput } from '@/lib/epic-schemas';

const epicIdSchema = z.string().min(1);

export type EpicActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

// Empty strings from forms become null in the DB (the columns are nullable).
function toNullable<T>(value: T | '' | null | undefined): T | null {
  if (value === '' || value == null) return null;
  return value;
}

function unauthorized(): EpicActionResult {
  return { success: false, error: 'Unauthorized' };
}

function invalid(): EpicActionResult {
  return { success: false, error: 'Invalid epic id' };
}

function failed(error: unknown): EpicActionResult {
  console.error('Epic action failed:', error);
  return { success: false, error: 'Something went wrong' };
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

export async function createEpicAction(
  input: EpicInput
): Promise<EpicActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  const parsed = epicSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const { projectId, name, description, status } = parsed.data;

  try {
    const db = await getDb();

    if (!(await projectExists(db, projectId))) {
      return { success: false, error: 'Project not found' };
    }

    const [row] = await db
      .insert(epics)
      .values({
        projectId,
        name,
        description: toNullable(description),
        status,
      })
      .returning({ id: epics.id });

    // Epic status shows on the project detail Epics tab and the projects list.
    // The client detail path is not revalidated here (would need
    // /clients/[id]): it renders dynamically so it refreshes on the next
    // navigation.
    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/clients');
    revalidatePath('/');

    return { success: true, id: row.id };
  } catch (error) {
    return failed(error);
  }
}

export async function updateEpicAction(
  id: string,
  input: EpicInput
): Promise<EpicActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!epicIdSchema.safeParse(id).success) {
    return invalid();
  }

  const parsed = epicSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  // Full-field update: epicSchema defaults `status` to 'planned', so an
  // update that omits it (or any field) resets that column. The edit form
  // must always submit every field, including `status`.
  const { projectId, name, description, status } = parsed.data;

  try {
    const db = await getDb();

    if (!(await projectExists(db, projectId))) {
      return { success: false, error: 'Project not found' };
    }

    const result = await db
      .update(epics)
      .set({
        projectId,
        name,
        description: toNullable(description),
        status,
      })
      .where(eq(epics.id, id));

    // See createEpicAction for the client detail revalidation note.
    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/clients');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Epic not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}

export async function deleteEpicAction(id: string): Promise<EpicActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!epicIdSchema.safeParse(id).success) {
    return invalid();
  }

  try {
    const db = await getDb();

    // Fetch the epic first so its project detail path can be revalidated.
    const epic = await db.query.epics.findFirst({
      columns: { projectId: true },
      where: eq(epics.id, id),
    });

    if (!epic) {
      return { success: false, error: 'Epic not found' };
    }

    // Deleting an epic removes its tasks: tasks.epicId has an onDelete
    // cascade FK, so the epic's tasks are deleted with it.
    const result = await db.delete(epics).where(eq(epics.id, id));

    // See createEpicAction for the client detail revalidation note.
    revalidatePath('/projects');
    revalidatePath(`/projects/${epic.projectId}`);
    revalidatePath('/clients');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Epic not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}
