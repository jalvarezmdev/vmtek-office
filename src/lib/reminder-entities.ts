import { reminderEntityEnum } from '@/db/schema';

export type ReminderEntityType = (typeof reminderEntityEnum.enumValues)[number];

export type ReminderEntityOption = { id: string; label: string };

// Lookup lists for the polymorphic entity picker on the reminders form,
// keyed by the entityType values that link to a real row (none is excluded).
export type ReminderEntityOptions = {
  clients: ReminderEntityOption[];
  projects: ReminderEntityOption[];
  tasks: ReminderEntityOption[];
  payments: ReminderEntityOption[];
  negotiations: ReminderEntityOption[];
  milestones: ReminderEntityOption[];
};

export const reminderEntityLabel: Record<ReminderEntityType, string> = {
  none: 'Standalone',
  client: 'Client',
  project: 'Project',
  task: 'Task',
  payment: 'Payment',
  negotiation: 'Negotiation',
  milestone: 'Milestone',
};
