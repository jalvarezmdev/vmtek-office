'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/auth';
import { getDb } from '@/db';
import { notes } from '@/db/schema';
import { linkedEntityExists } from '@/lib/entity-exists';
import { noteSchema, type NoteInput } from '@/lib/note-schemas';

const noteIdSchema = z.string().min(1);

export type NoteActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

// Empty strings from forms become null in the DB (the column is nullable).
function toNullable(value?: string | null): string | null {
  return value || null;
}

function unauthorized(): NoteActionResult {
  return { success: false, error: 'Unauthorized' };
}

function invalid(): NoteActionResult {
  return { success: false, error: 'Invalid note id' };
}

function failed(error: unknown): NoteActionResult {
  console.error('Note action failed:', error);
  return { success: false, error: 'Something went wrong' };
}

// Notes appear on the notes index page and on entity detail tabs. The
// polymorphic entityId is a UUID we cannot map to a route path here, so we
// revalidate the index plus the entity list pages. Detail tabs read their
// notes fresh from the DB per request, so they do not depend on this cache.
function revalidateNotePaths(): void {
  revalidatePath('/notes');
  revalidatePath('/');
  revalidatePath('/clients');
  revalidatePath('/projects');
}

export async function createNoteAction(
  input: NoteInput
): Promise<NoteActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const { body, entityType } = parsed.data;
  const entityId = toNullable(parsed.data.entityId);

  try {
    const db = await getDb();

    if (entityType !== 'none' && entityId) {
      if (!(await linkedEntityExists(db, entityType, entityId))) {
        return { success: false, error: 'Linked entity not found' };
      }
    }

    const [row] = await db
      .insert(notes)
      .values({ body, entityType, entityId })
      .returning({ id: notes.id });

    revalidateNotePaths();

    return { success: true, id: row.id };
  } catch (error) {
    return failed(error);
  }
}

export async function updateNoteAction(
  id: string,
  input: NoteInput
): Promise<NoteActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!noteIdSchema.safeParse(id).success) {
    return invalid();
  }

  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const { body, entityType } = parsed.data;
  const entityId = toNullable(parsed.data.entityId);

  try {
    const db = await getDb();

    if (entityType !== 'none' && entityId) {
      if (!(await linkedEntityExists(db, entityType, entityId))) {
        return { success: false, error: 'Linked entity not found' };
      }
    }

    const result = await db
      .update(notes)
      .set({ body, entityType, entityId })
      .where(eq(notes.id, id));

    revalidateNotePaths();

    if (result.rowCount === 0) {
      return { success: false, error: 'Note not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}

export async function deleteNoteAction(id: string): Promise<NoteActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!noteIdSchema.safeParse(id).success) {
    return invalid();
  }

  try {
    const db = await getDb();
    const result = await db.delete(notes).where(eq(notes.id, id));

    revalidateNotePaths();

    if (result.rowCount === 0) {
      return { success: false, error: 'Note not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}
