import type { ComponentProps } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  epicStatusEnum,
  expenseCategoryEnum,
  milestoneStatusEnum,
  negotiationStatusEnum,
  paymentStatusEnum,
  projectStatusEnum,
  reminderRepeatEnum,
  reminderStatusEnum,
  taskPriorityEnum,
  taskStatusEnum,
} from '@/db/schema';

export type BadgeVariant = ComponentProps<typeof Badge>['variant'];

export type ProjectStatus = (typeof projectStatusEnum.enumValues)[number];
export type NegotiationStatus =
  (typeof negotiationStatusEnum.enumValues)[number];
export type MilestoneStatus = (typeof milestoneStatusEnum.enumValues)[number];
export type EpicStatus = (typeof epicStatusEnum.enumValues)[number];
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type TaskPriority = (typeof taskPriorityEnum.enumValues)[number];
export type PaymentStatus = (typeof paymentStatusEnum.enumValues)[number];
export type ExpenseCategory = (typeof expenseCategoryEnum.enumValues)[number];
export type ReminderStatus = (typeof reminderStatusEnum.enumValues)[number];
export type ReminderRepeat = (typeof reminderRepeatEnum.enumValues)[number];

export const projectStatusLabel: Record<ProjectStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
};

export const projectStatusVariant: Record<ProjectStatus, BadgeVariant> = {
  planning: 'outline',
  active: 'default',
  paused: 'secondary',
  completed: 'default',
  archived: 'outline',
};

export const negotiationStatusLabel: Record<NegotiationStatus, string> = {
  open: 'Open',
  won: 'Won',
  lost: 'Lost',
};

export const negotiationStatusVariant: Record<NegotiationStatus, BadgeVariant> =
  {
    open: 'default',
    won: 'secondary',
    lost: 'destructive',
  };

export const milestoneStatusLabel: Record<MilestoneStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  done: 'Done',
};

export const milestoneStatusVariant: Record<MilestoneStatus, BadgeVariant> = {
  planned: 'outline',
  active: 'default',
  done: 'secondary',
};

export const epicStatusLabel: Record<EpicStatus, string> = milestoneStatusLabel;
export const epicStatusVariant: Record<EpicStatus, BadgeVariant> =
  milestoneStatusVariant;

export const taskStatusLabel: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export const taskStatusVariant: Record<TaskStatus, BadgeVariant> = {
  todo: 'outline',
  in_progress: 'secondary',
  done: 'default',
};

export const taskPriorityLabel: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const taskPriorityVariant: Record<TaskPriority, BadgeVariant> = {
  low: 'outline',
  medium: 'secondary',
  high: 'default',
  urgent: 'destructive',
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  pending: 'Pending',
  partial: 'Partial',
  received: 'Received',
};

export const paymentStatusVariant: Record<PaymentStatus, BadgeVariant> = {
  pending: 'outline',
  partial: 'secondary',
  received: 'default',
};

export const expenseCategoryLabel: Record<ExpenseCategory, string> = {
  software: 'Software',
  hardware: 'Hardware',
  subcontractors: 'Subcontractors',
  marketing: 'Marketing',
  travel: 'Travel',
  office: 'Office',
  other: 'Other',
};

export const reminderStatusLabel: Record<ReminderStatus, string> = {
  pending: 'Pending',
  done: 'Done',
  dismissed: 'Dismissed',
};

export const reminderStatusVariant: Record<ReminderStatus, BadgeVariant> = {
  pending: 'default',
  done: 'secondary',
  dismissed: 'outline',
};

export const reminderRepeatLabel: Record<ReminderRepeat, string> = {
  once: 'Once',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};
