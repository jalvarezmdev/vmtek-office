'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/auth';
import { getDb } from '@/db';
import { reminders } from '@/db/schema';
import { getTimezone, toUtcDate } from '@/lib/dates';
import { linkedEntityExists } from '@/lib/entity-exists';
import { nextDueAt } from '@/lib/reminder-repeat';
import { reminderSchema, type ReminderInput } from '@/lib/reminder-schemas';

const reminderIdSchema = z.string().min(1);

export type ReminderActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

// Empty strings from forms become null in the DB (the column is nullable).
function toNullable(value?: string | null): string | null {
  return value || null;
}

function unauthorized(): ReminderActionResult {
  return { success: false, error: 'Unauthorized' };
}

function invalid(): ReminderActionResult {
  return { success: false, error: 'Invalid reminder id' };
}

function failed(error: unknown): ReminderActionResult {
  console.error('Reminder action failed:', error);
  return { success: false, error: 'Something went wrong' };
}

function revalidateReminderPaths(): void {
  revalidatePath('/');
  revalidatePath('/reminders');
  revalidatePath('/clients');
  revalidatePath('/projects');
}

// Design D4: reminders link polymorphically (entityType + entityId, no FK).
// Integrity is enforced here — a linked entity must actually exist. The
// existence check is shared with the notes actions (see src/lib/entity-exists).

async function resolveDueAt(dueAt: Date | string): Promise<Date> {
  return toUtcDate(dueAt, await getTimezone());
}

export type CompleteReminderResult = {
  success: boolean;
  error?: string;
  id?: string;
  nextId?: string;
};

export async function completeReminderAction(
  id: string
): Promise<CompleteReminderResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false };
  }

  if (!reminderIdSchema.safeParse(id).success) {
    return { success: false };
  }

  try {
    const db = await getDb();

    const [reminder] = await db
      .select({
        title: reminders.title,
        notes: reminders.notes,
        dueAt: reminders.dueAt,
        repeat: reminders.repeat,
        entityType: reminders.entityType,
        entityId: reminders.entityId,
      })
      .from(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.status, 'pending')))
      .limit(1);

    if (!reminder) {
      return { success: false };
    }

    const result = await db
      .update(reminders)
      .set({ status: 'done' })
      .where(and(eq(reminders.id, id), eq(reminders.status, 'pending')));

    if (result.rowCount === 0) {
      return { success: false };
    }

    // The neon-http driver does not support db.transaction() (it throws), so
    // the completion and the next occurrence run as two separate statements.
    // A failure between them leaves the original done without a next
    // occurrence — a tiny, accepted non-atomic window.
    let nextId: string | undefined;
    const nextDue = nextDueAt(reminder.dueAt, reminder.repeat);
    if (nextDue) {
      const [row] = await db
        .insert(reminders)
        .values({
          title: reminder.title,
          notes: reminder.notes,
          dueAt: nextDue,
          status: 'pending',
          repeat: reminder.repeat,
          entityType: reminder.entityType,
          entityId: reminder.entityId,
        })
        .returning({ id: reminders.id });
      nextId = row.id;
    }

    revalidateReminderPaths();

    return { success: true, id, nextId };
  } catch (error) {
    return failed(error);
  }
}

export async function dismissReminderAction(
  id: string
): Promise<ReminderActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!reminderIdSchema.safeParse(id).success) {
    return invalid();
  }

  try {
    const db = await getDb();
    const result = await db
      .update(reminders)
      .set({ status: 'dismissed' })
      .where(and(eq(reminders.id, id), eq(reminders.status, 'pending')));

    revalidateReminderPaths();

    if (result.rowCount === 0) {
      return { success: false, error: 'Reminder not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}

export async function createReminderAction(
  input: ReminderInput
): Promise<ReminderActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  const parsed = reminderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const { title, notes, status, repeat, entityType } = parsed.data;
  const entityId = toNullable(parsed.data.entityId);

  try {
    const db = await getDb();

    if (entityType !== 'none' && entityId) {
      if (!(await linkedEntityExists(db, entityType, entityId))) {
        return { success: false, error: 'Linked entity not found' };
      }
    }

    const dueAt = await resolveDueAt(parsed.data.dueAt);

    const [row] = await db
      .insert(reminders)
      .values({
        title,
        notes: toNullable(notes),
        dueAt,
        status,
        repeat,
        entityType,
        entityId,
      })
      .returning({ id: reminders.id });

    revalidateReminderPaths();

    return { success: true, id: row.id };
  } catch (error) {
    return failed(error);
  }
}

export async function updateReminderAction(
  id: string,
  input: ReminderInput
): Promise<ReminderActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!reminderIdSchema.safeParse(id).success) {
    return invalid();
  }

  const parsed = reminderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  // Full-field update: reminderSchema defaults `status`/`repeat`/`entityType`,
  // so an update that omits any field resets that column. The edit form must
  // always submit every field.
  const { title, notes, status, repeat, entityType } = parsed.data;
  const entityId = toNullable(parsed.data.entityId);

  try {
    const db = await getDb();

    if (entityType !== 'none' && entityId) {
      if (!(await linkedEntityExists(db, entityType, entityId))) {
        return { success: false, error: 'Linked entity not found' };
      }
    }

    const dueAt = await resolveDueAt(parsed.data.dueAt);

    const result = await db
      .update(reminders)
      .set({
        title,
        notes: toNullable(notes),
        dueAt,
        status,
        repeat,
        entityType,
        entityId,
      })
      .where(eq(reminders.id, id));

    revalidateReminderPaths();

    if (result.rowCount === 0) {
      return { success: false, error: 'Reminder not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}

export async function deleteReminderAction(
  id: string
): Promise<ReminderActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!reminderIdSchema.safeParse(id).success) {
    return invalid();
  }

  try {
    const db = await getDb();
    const result = await db.delete(reminders).where(eq(reminders.id, id));

    revalidateReminderPaths();

    if (result.rowCount === 0) {
      return { success: false, error: 'Reminder not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}
