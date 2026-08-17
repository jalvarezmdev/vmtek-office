'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/auth';
import { getDb } from '@/db';
import { epics, projects, tasks } from '@/db/schema';
import { taskSchema, type TaskInput } from '@/lib/task-schemas';

const taskIdSchema = z.string().min(1);

export type TaskActionResult = {
  success: boolean;
  error?: string;
  id?: string;
};

// Empty strings from forms become null in the DB (the columns are nullable).
function toNullable<T>(value: T | '' | null | undefined): T | null {
  if (value === '' || value == null) return null;
  return value;
}

function unauthorized(): TaskActionResult {
  return { success: false, error: 'Unauthorized' };
}

function invalid(): TaskActionResult {
  return { success: false, error: 'Invalid task id' };
}

function failed(error: unknown): TaskActionResult {
  console.error('Task action failed:', error);
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

// A task MAY belong to an epic, but only to an epic of the SAME project. The
// epic is resolved by id and its projectId must match the task's projectId,
// which prevents cross-project tasks.
async function epicProjectId(
  db: ReturnType<typeof getDb>,
  id: string
): Promise<string | undefined> {
  const epic = await db.query.epics.findFirst({
    columns: { projectId: true },
    where: eq(epics.id, id),
  });
  return epic?.projectId;
}

export async function createTaskAction(
  input: TaskInput
): Promise<TaskActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  const { projectId, title, description, status, priority, dueDate, epicId } =
    parsed.data;

  try {
    const db = await getDb();

    if (!(await projectExists(db, projectId))) {
      return { success: false, error: 'Project not found' };
    }

    const epic = toNullable(epicId);
    if (epic) {
      const epicOfProject = await epicProjectId(db, epic);
      if (!epicOfProject) {
        return { success: false, error: 'Epic not found' };
      }
      if (epicOfProject !== projectId) {
        return {
          success: false,
          error: 'Epic does not belong to this project',
        };
      }
    }

    const [row] = await db
      .insert(tasks)
      .values({
        projectId,
        title,
        description: toNullable(description),
        status,
        priority,
        dueDate: toNullable(dueDate),
        epicId: epic,
      })
      .returning({ id: tasks.id });

    // Task status/priority shows on the project detail Tasks tab, the pending
    // tasks dashboard widget, and the projects list. The client detail path is
    // not revalidated here (would need /clients/[id]): it renders dynamically
    // so it refreshes on the next navigation.
    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/clients');
    revalidatePath('/');

    return { success: true, id: row.id };
  } catch (error) {
    return failed(error);
  }
}

export async function updateTaskAction(
  id: string,
  input: TaskInput
): Promise<TaskActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!taskIdSchema.safeParse(id).success) {
    return invalid();
  }

  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    };
  }

  // Full-field update: taskSchema defaults `status` to 'todo' and `priority`
  // to 'medium', so an update that omits them (or any field) resets those
  // columns. The task edit form must always submit every field.
  const { projectId, title, description, status, priority, dueDate, epicId } =
    parsed.data;

  try {
    const db = await getDb();

    if (!(await projectExists(db, projectId))) {
      return { success: false, error: 'Project not found' };
    }

    const epic = toNullable(epicId);
    if (epic) {
      const epicOfProject = await epicProjectId(db, epic);
      if (!epicOfProject) {
        return { success: false, error: 'Epic not found' };
      }
      if (epicOfProject !== projectId) {
        return {
          success: false,
          error: 'Epic does not belong to this project',
        };
      }
    }

    const result = await db
      .update(tasks)
      .set({
        projectId,
        title,
        description: toNullable(description),
        status,
        priority,
        dueDate: toNullable(dueDate),
        epicId: epic,
      })
      .where(eq(tasks.id, id));

    // See createTaskAction for the client detail revalidation note.
    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/clients');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Task not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}

export async function deleteTaskAction(id: string): Promise<TaskActionResult> {
  const session = await auth();
  if (!session?.user) {
    return unauthorized();
  }

  if (!taskIdSchema.safeParse(id).success) {
    return invalid();
  }

  try {
    const db = await getDb();

    // Fetch the task first so its project detail path can be revalidated.
    const task = await db.query.tasks.findFirst({
      columns: { projectId: true },
      where: eq(tasks.id, id),
    });

    if (!task) {
      return { success: false, error: 'Task not found' };
    }

    // Deleting a task only deletes the row: tasks.epicId and tasks.projectId
    // are cascade FKs on the OTHER side, so deleting an epic or project removes
    // its tasks, but deleting a task leaves the epic and project intact.
    const result = await db.delete(tasks).where(eq(tasks.id, id));

    // See createTaskAction for the client detail revalidation note.
    revalidatePath('/projects');
    revalidatePath(`/projects/${task.projectId}`);
    revalidatePath('/clients');
    revalidatePath('/');

    if (result.rowCount === 0) {
      return { success: false, error: 'Task not found' };
    }

    return { success: true };
  } catch (error) {
    return failed(error);
  }
}
