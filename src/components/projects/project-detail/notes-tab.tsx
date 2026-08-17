import type { InferSelectModel } from 'drizzle-orm';

import { EntityNotesTab } from '@/components/notes/entity-notes-tab';
import { notes } from '@/db/schema';

export type NotesTabProps = {
  notes: InferSelectModel<typeof notes>[];
  entityId: string;
};

export function NotesTab(props: NotesTabProps) {
  return <EntityNotesTab entityType="project" {...props} />;
}
