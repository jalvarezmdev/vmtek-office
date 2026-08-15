import { like } from 'drizzle-orm';
import 'dotenv/config';

import { getDb } from '../src/db';
import { clients, projects, reminders, tasks } from '../src/db/schema';
import { E2E_PREFIX } from './constants';

// Runs after all tests. Removes only the rows the e2e run created (identified
// by the E2E name prefix); the idempotently seeded admin is left in place.
// Delete order matters for FKs: reminders (no FK), tasks (cascade via
// projectId), projects (set null via clientId), then clients.
export default async function globalTeardown() {
  try {
    const db = await getDb();

    await db.delete(reminders).where(like(reminders.title, `${E2E_PREFIX}%`));
    await db.delete(tasks).where(like(tasks.title, `${E2E_PREFIX}%`));
    await db.delete(projects).where(like(projects.name, `${E2E_PREFIX}%`));
    await db.delete(clients).where(like(clients.name, `${E2E_PREFIX}%`));
  } catch (error) {
    // Never fail the run over cleanup; leftover rows are harmless (unique names).
    console.warn('E2E global teardown skipped:', error);
  }
}
