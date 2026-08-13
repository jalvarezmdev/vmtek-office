'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/auth';
import { getDb } from '@/db';
import { milestones, payments, projects } from '@/db/schema';
import { milestoneSchema, type MilestoneInput } from '@/lib/milestone-schemas';

const milestoneIdSchema = z.string().min(1);

export type MilestoneActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

// Empty strings from forms become null in the DB (the columns are nullable).
function toNullable<T>(value: T | '' | null | undefined): T | null {
  if (value === '' || value == null) return null;
  return value;
}

function unauthorized(): MilestoneActionResult {
  return { success: false, error: 'Unauthorized' };
}

function invalid(): MilestoneActionResult {
  return { success: false, error: 'Invalid milestone id' };
}

function failed(error: unknown): MilestoneActionResult {
  console.error('Milestone action failed:', error);
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

async function paymentExists(
  db: ReturnType<typeof getDb>,
  id: string
): Promise<boolean> {
  return Boolean(
    await db.query.payments.findFirst({
      columns: { id: true },
      where: eq(payments.id, id),
    })
  );
}

export async function createMilestoneAction(
  input: MilestoneInput
): Promise<MilestoneActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  const parsed = milestoneSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const { projectId, name, description, status, dueDate, paymentId } =
    parsed.data;

  try {
    const db = await getDb();

    if (!(await projectExists(db, projectId))) {
      return { success: false, error: 'Project not found' };
    }

    const payment = toNullable(paymentId);
    if (payment && !(await paymentExists(db, payment))) {
      return { success: false, error: 'Payment not found' };
    }

    const [row] = await db
      .insert(milestones)
      .values({
        projectId,
        name,
        description: toNullable(description),
        status,
        dueDate: toNullable(dueDate),
        paymentId: payment,
      })
      .returning({ id: milestones.id });

    // Milestone progress shows on the projects list/detail, the dashboard
    // active-projects widget, and the client detail page. The client detail
    // path is not revalidated here (would need /clients/[id]): it renders
    // dynamically so it refreshes on the next navigation.
    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/clients');
    revalidatePath('/');

    return { success: true, id: row.id };
  } catch (error) {
    return failed(error);
  }
}

export async function updateMilestoneAction(
  id: string,
  input: MilestoneInput
): Promise<MilestoneActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!milestoneIdSchema.safeParse(id).success) {
    return invalid();
  }

  const parsed = milestoneSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  // Full-field update: milestoneSchema defaults `status` to 'planned', so an
  // update that omits it (or any field) resets that column. The 5.7 edit form
  // must always submit every field, including `status`.
  const { projectId, name, description, status, dueDate, paymentId } =
    parsed.data;

  try {
    const db = await getDb();

    if (!(await projectExists(db, projectId))) {
      return { success: false, error: 'Project not found' };
    }

    const payment = toNullable(paymentId);
    if (payment && !(await paymentExists(db, payment))) {
      return { success: false, error: 'Payment not found' };
    }

    const result = await db
      .update(milestones)
      .set({
        projectId,
        name,
        description: toNullable(description),
        status,
        dueDate: toNullable(dueDate),
        paymentId: payment,
      })
      .where(eq(milestones.id, id));

    // See createMilestoneAction for the client detail revalidation note.
    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/clients');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Milestone not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}

export async function deleteMilestoneAction(
  id: string
): Promise<MilestoneActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!milestoneIdSchema.safeParse(id).success) {
    return invalid();
  }

  try {
    const db = await getDb();

    // Fetch the milestone first so its project detail path can be revalidated.
    const milestone = await db.query.milestones.findFirst({
      columns: { projectId: true },
      where: eq(milestones.id, id),
    });

    if (!milestone) {
      return { success: false, error: 'Milestone not found' };
    }

    // Deleting a milestone only deletes the row: milestones.paymentId has an
    // onDelete set null FK, so a linked payment is untouched.
    const result = await db.delete(milestones).where(eq(milestones.id, id));

    // See createMilestoneAction for the client detail revalidation note.
    revalidatePath('/projects');
    revalidatePath(`/projects/${milestone.projectId}`);
    revalidatePath('/clients');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Milestone not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}
