import { inArray } from 'drizzle-orm';

import { getDb } from '@/db';
import {
  clients,
  epics,
  expenses,
  milestones,
  negotiations,
  payments,
  projects,
  reminders,
  tasks,
} from '@/db/schema';
import type { PolymorphicEntityType } from '@/lib/entity-exists';

export type EntityContext = { label: string; href?: string };

// Per-type href builders for entity contexts that link to a detail page.
type EntityHrefs = Partial<
  Record<PolymorphicEntityType, (id: string) => string>
>;

export const entityHrefs: EntityHrefs = {
  client: (id) => `/clients/${id}`,
  project: (id) => `/projects/${id}`,
};

type LinkedRow = {
  id: string;
  entityType: PolymorphicEntityType;
  entityId: string | null;
};

// Batch-resolves the display name of every linked entity with one query per
// entity type (no per-row round trips). Unlinked ('none') rows and orphaned
// links resolve to null so callers render '—'.
export async function buildEntityContexts(
  db: ReturnType<typeof getDb>,
  rows: LinkedRow[],
  hrefFor: EntityHrefs = {}
): Promise<Record<string, EntityContext | null>> {
  const idsByType = new Map<PolymorphicEntityType, Set<string>>();
  for (const row of rows) {
    if (row.entityType === 'none' || !row.entityId) continue;
    const ids = idsByType.get(row.entityType) ?? new Set<string>();
    ids.add(row.entityId);
    idsByType.set(row.entityType, ids);
  }

  const labelMaps = await Promise.all(
    [...idsByType.entries()].map(([type, ids]) =>
      fetchEntityLabels(db, type, [...ids]).then((labels) => ({ type, labels }))
    )
  );

  const contexts: Record<string, EntityContext | null> = {};
  for (const row of rows) {
    if (row.entityType === 'none' || !row.entityId) {
      contexts[row.id] = null;
      continue;
    }
    const entry = labelMaps.find(({ type }) => type === row.entityType);
    const label = entry?.labels.get(row.entityId);
    const buildHref = hrefFor[row.entityType];
    contexts[row.id] = label
      ? { label, href: buildHref ? buildHref(row.entityId) : undefined }
      : null;
  }

  return contexts;
}

async function fetchEntityLabels(
  db: ReturnType<typeof getDb>,
  type: PolymorphicEntityType,
  ids: string[]
): Promise<Map<string, string>> {
  switch (type) {
    case 'client': {
      const rows = await db.query.clients.findMany({
        columns: { id: true, name: true },
        where: inArray(clients.id, ids),
      });
      return new Map(rows.map((row) => [row.id, row.name]));
    }
    case 'project': {
      const rows = await db.query.projects.findMany({
        columns: { id: true, name: true },
        where: inArray(projects.id, ids),
      });
      return new Map(rows.map((row) => [row.id, row.name]));
    }
    case 'task': {
      const rows = await db.query.tasks.findMany({
        columns: { id: true, title: true },
        where: inArray(tasks.id, ids),
      });
      return new Map(rows.map((row) => [row.id, row.title]));
    }
    case 'payment': {
      const rows = await db.query.payments.findMany({
        columns: { id: true, description: true },
        where: inArray(payments.id, ids),
      });
      return new Map(rows.map((row) => [row.id, row.description ?? 'Payment']));
    }
    case 'negotiation': {
      const rows = await db.query.negotiations.findMany({
        columns: { id: true, title: true },
        where: inArray(negotiations.id, ids),
      });
      return new Map(rows.map((row) => [row.id, row.title]));
    }
    case 'milestone': {
      const rows = await db.query.milestones.findMany({
        columns: { id: true, name: true },
        where: inArray(milestones.id, ids),
      });
      return new Map(rows.map((row) => [row.id, row.name]));
    }
    case 'epic': {
      const rows = await db.query.epics.findMany({
        columns: { id: true, name: true },
        where: inArray(epics.id, ids),
      });
      return new Map(rows.map((row) => [row.id, row.name]));
    }
    case 'expense': {
      const rows = await db.query.expenses.findMany({
        columns: { id: true, description: true },
        where: inArray(expenses.id, ids),
      });
      return new Map(rows.map((row) => [row.id, row.description ?? 'Expense']));
    }
    case 'reminder': {
      const rows = await db.query.reminders.findMany({
        columns: { id: true, title: true },
        where: inArray(reminders.id, ids),
      });
      return new Map(rows.map((row) => [row.id, row.title]));
    }
    default:
      return new Map();
  }
}
