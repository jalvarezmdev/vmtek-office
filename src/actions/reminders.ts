'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/auth';
import { getDb } from '@/db';
import { reminders } from '@/db/schema';

const reminderIdSchema = z.string().min(1);

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

  return { success: result.rowCount > 0 };
}
