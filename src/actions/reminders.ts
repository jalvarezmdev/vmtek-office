'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/auth';
import { getDb } from '@/db';
import {
  clients,
  milestones,
  negotiations,
  payments,
  projects,
  reminderEntityEnum,
  reminders,
  tasks,
} from '@/db/schema';
import { getTimezone, toUtcDate } from '@/lib/dates';
import { reminderSchema, type ReminderInput } from '@/lib/reminder-schemas';

const reminderIdSchema = z.string().min(1);

type ReminderEntity = (typeof reminderEntityEnum.enumValues)[number];

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
// Integrity is enforced here — a linked entity must actually exist.
async function linkedEntityExists(
  db: ReturnType<typeof getDb>,
  entityType: ReminderEntity,
  entityId: string
): Promise<boolean> {
  if (entityType === 'none') return true;
  let found: { id: string } | undefined;
  switch (entityType) {
    case 'client':
      found = await db.query.clients.findFirst({
        columns: { id: true },
        where: eq(clients.id, entityId),
      });
      break;
    case 'project':
      found = await db.query.projects.findFirst({
        columns: { id: true },
        where: eq(projects.id, entityId),
      });
      break;
    case 'task':
      found = await db.query.tasks.findFirst({
        columns: { id: true },
        where: eq(tasks.id, entityId),
      });
      break;
    case 'payment':
      found = await db.query.payments.findFirst({
        columns: { id: true },
        where: eq(payments.id, entityId),
      });
      break;
    case 'negotiation':
      found = await db.query.negotiations.findFirst({
        columns: { id: true },
        where: eq(negotiations.id, entityId),
      });
      break;
    case 'milestone':
      found = await db.query.milestones.findFirst({
        columns: { id: true },
        where: eq(milestones.id, entityId),
      });
      break;
  }
  return Boolean(found);
}

async function resolveDueAt(dueAt: Date | string): Promise<Date> {
  return toUtcDate(dueAt, await getTimezone());
}

export type CompleteReminderResult = { success: boolean };

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

  const db = await getDb();
  const result = await db
    .update(reminders)
    .set({ status: 'done' })
    .where(and(eq(reminders.id, id), eq(reminders.status, 'pending')));

  revalidatePath('/');
  revalidatePath('/reminders');

  return { success: result.rowCount > 0 };
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
