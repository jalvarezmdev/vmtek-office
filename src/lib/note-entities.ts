import { noteEntityEnum } from '@/db/schema';

export type NoteEntityType = (typeof noteEntityEnum.enumValues)[number];

export type NoteEntityOption = { id: string; label: string };

// Lookup lists for the polymorphic entity picker on the notes form, keyed by
// the entityType values that link to a real row (none is excluded).
export type NoteEntityOptions = {
  clients: NoteEntityOption[];
  projects: NoteEntityOption[];
  tasks: NoteEntityOption[];
  negotiations: NoteEntityOption[];
  payments: NoteEntityOption[];
  expenses: NoteEntityOption[];
  milestones: NoteEntityOption[];
  epics: NoteEntityOption[];
  reminders: NoteEntityOption[];
};
