import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import {
  clients,
  epics,
  expenses,
  milestones,
  negotiations,
  noteEntityEnum,
  payments,
  projects,
  reminders,
  tasks,
} from '@/db/schema';

// The note entity enum is the superset of the polymorphic entity types
// across notes and reminders (reminder_entity values are all present here).
export type PolymorphicEntityType = (typeof noteEntityEnum.enumValues)[number];

// Design D4: polymorphic links (entityType + entityId, no FK) enforce their
// integrity in server actions — a linked entity must actually exist. Shared
// by the notes and reminders actions.
export async function linkedEntityExists(
  db: ReturnType<typeof getDb>,
  entityType: PolymorphicEntityType,
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
    case 'epic':
      found = await db.query.epics.findFirst({
        columns: { id: true },
        where: eq(epics.id, entityId),
      });
      break;
    case 'expense':
      found = await db.query.expenses.findFirst({
        columns: { id: true },
        where: eq(expenses.id, entityId),
      });
      break;
    case 'reminder':
      found = await db.query.reminders.findFirst({
        columns: { id: true },
        where: eq(reminders.id, entityId),
      });
      break;
  }
  return Boolean(found);
}
