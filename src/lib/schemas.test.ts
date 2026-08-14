import { describe, expect, it } from 'vitest';
import type { z } from 'zod';

import { clientSchema } from '@/lib/client-schemas';
import { epicSchema } from '@/lib/epic-schemas';
import { expenseSchema } from '@/lib/expense-schemas';
import { milestoneSchema } from '@/lib/milestone-schemas';
import { negotiationSchema } from '@/lib/negotiation-schemas';
import { noteSchema } from '@/lib/note-schemas';
import { paymentSchema } from '@/lib/payment-schemas';
import { projectSchema } from '@/lib/project-schemas';
import { reminderSchema } from '@/lib/reminder-schemas';
import { taskSchema } from '@/lib/task-schemas';

function issues(
  schema: z.ZodType<unknown>,
  input: unknown
): { path: PropertyKey[]; message: string }[] {
  const result = schema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.map((issue) => ({
    path: issue.path,
    message: issue.message,
  }));
}

describe('clientSchema', () => {
  it('requires a non-empty name', () => {
    expect(clientSchema.safeParse({}).success).toBe(false);
    expect(clientSchema.safeParse({ name: '   ' }).success).toBe(false);
    expect(clientSchema.safeParse({ name: 'Acme' }).success).toBe(true);
  });

  it('validates email format', () => {
    expect(
      clientSchema.safeParse({ name: 'Acme', email: 'nope' }).success
    ).toBe(false);
    expect(
      clientSchema.safeParse({ name: 'Acme', email: 'a@b.co' }).success
    ).toBe(true);
    expect(clientSchema.safeParse({ name: 'Acme', email: '' }).success).toBe(
      true
    );
  });
});

describe('projectSchema', () => {
  it('defaults status to planning', () => {
    const result = projectSchema.parse({ name: 'Website' });
    expect(result.status).toBe('planning');
  });

  it('accepts a valid status', () => {
    const result = projectSchema.parse({ name: 'Website', status: 'active' });
    expect(result.status).toBe('active');
  });

  it('rejects an unknown status', () => {
    expect(
      projectSchema.safeParse({ name: 'Website', status: 'bogus' }).success
    ).toBe(false);
  });

  it('parses a valid start date and rejects an invalid calendar date', () => {
    const result = projectSchema.parse({
      name: 'Website',
      startDate: '2026-01-15',
    });
    expect((result.startDate as Date).toISOString()).toBe(
      '2026-01-15T00:00:00.000Z'
    );
    expect(
      projectSchema.safeParse({ name: 'Website', startDate: '2026-02-30' })
        .success
    ).toBe(false);
  });

  it('rejects a non-positive budget amount and invalid currency', () => {
    expect(
      projectSchema.safeParse({ name: 'Website', budgetAmount: -5 }).success
    ).toBe(false);
    expect(
      projectSchema.safeParse({ name: 'Website', budgetCurrency: 'usd' })
        .success
    ).toBe(false);
    expect(
      projectSchema.safeParse({ name: 'Website', budgetCurrency: 'USD' })
        .success
    ).toBe(true);
  });
});

describe('paymentSchema', () => {
  it('requires a positive amount and a currency', () => {
    expect(paymentSchema.safeParse({}).success).toBe(false);
    expect(
      paymentSchema.safeParse({ amount: 0, currency: 'USD' }).success
    ).toBe(false);
    expect(
      paymentSchema.safeParse({ amount: -5, currency: 'USD' }).success
    ).toBe(false);
    expect(paymentSchema.safeParse({ amount: 5 }).success).toBe(false);
    expect(
      paymentSchema.safeParse({ amount: 5, currency: 'usd' }).success
    ).toBe(false);
    expect(
      paymentSchema.safeParse({ amount: 5, currency: 'USD' }).success
    ).toBe(true);
  });

  it('defaults status to pending', () => {
    const result = paymentSchema.parse({ amount: 5, currency: 'USD' });
    expect(result.status).toBe('pending');
  });
});

describe('expenseSchema', () => {
  const validExpense = {
    category: 'software',
    amount: 10,
    currency: 'USD',
    date: '2026-01-15',
  };

  it('requires a category, positive amount, currency, and date', () => {
    expect(expenseSchema.safeParse({}).success).toBe(false);
    expect(
      expenseSchema.safeParse({ ...validExpense, category: 'bogus' }).success
    ).toBe(false);
    expect(
      expenseSchema.safeParse({ ...validExpense, amount: -1 }).success
    ).toBe(false);
    expect(expenseSchema.safeParse(validExpense).success).toBe(true);
  });

  it('requires a frequency when recurring (superRefine)', () => {
    expect(issues(expenseSchema, { ...validExpense, recurring: true })).toEqual(
      [
        {
          path: ['recurringFrequency'],
          message: 'Frequency is required for recurring expenses',
        },
      ]
    );
  });

  it('accepts a frequency with a non-recurring expense', () => {
    expect(
      expenseSchema.safeParse({
        ...validExpense,
        recurringFrequency: 'monthly',
      }).success
    ).toBe(true);
  });

  it('coerces checkbox-style recurring strings', () => {
    expect(issues(expenseSchema, { ...validExpense, recurring: 'on' })).toEqual(
      [
        {
          path: ['recurringFrequency'],
          message: 'Frequency is required for recurring expenses',
        },
      ]
    );
    expect(
      expenseSchema.safeParse({
        ...validExpense,
        recurring: 'on',
        recurringFrequency: 'monthly',
      }).success
    ).toBe(true);
  });
});

describe('reminderSchema', () => {
  it('requires a title and a due datetime', () => {
    expect(reminderSchema.safeParse({}).success).toBe(false);
    expect(reminderSchema.safeParse({ title: 'Call' }).success).toBe(false);
    expect(
      reminderSchema.safeParse({ title: 'Call', dueAt: '2026-03-15T09:30' })
        .success
    ).toBe(true);
  });

  it('requires an entityId when an entity is linked (superRefine)', () => {
    expect(
      issues(reminderSchema, {
        title: 'Call',
        dueAt: '2026-03-15T09:30',
        entityType: 'client',
      })
    ).toEqual([{ path: ['entityId'], message: 'Select a linked entity' }]);
  });

  it('rejects an entityId when no entity is linked (superRefine)', () => {
    expect(
      issues(reminderSchema, {
        title: 'Call',
        dueAt: '2026-03-15T09:30',
        entityType: 'none',
        entityId: 'abc',
      })
    ).toEqual([
      {
        path: ['entityId'],
        message: 'Entity id must be empty when no entity is linked',
      },
    ]);
  });

  it('defaults status, repeat, and entityType', () => {
    const result = reminderSchema.parse({
      title: 'Call',
      dueAt: '2026-03-15T09:30',
    });
    expect(result.status).toBe('pending');
    expect(result.repeat).toBe('once');
    expect(result.entityType).toBe('none');
  });
});

describe('noteSchema', () => {
  it('requires a non-empty body', () => {
    expect(noteSchema.safeParse({}).success).toBe(false);
    expect(noteSchema.safeParse({ body: '   ' }).success).toBe(false);
    expect(noteSchema.safeParse({ body: 'Hello' }).success).toBe(true);
  });

  it('requires an entityId when an entity is linked (superRefine)', () => {
    expect(issues(noteSchema, { body: 'Hello', entityType: 'client' })).toEqual(
      [{ path: ['entityId'], message: 'Select a linked entity' }]
    );
  });

  it('rejects an entityId when no entity is linked (superRefine)', () => {
    expect(
      issues(noteSchema, { body: 'Hello', entityType: 'none', entityId: 'abc' })
    ).toEqual([
      {
        path: ['entityId'],
        message: 'Entity id must be empty when no entity is linked',
      },
    ]);
  });
});

describe('milestone/task/epic/negotiation schemas', () => {
  it('require a projectId and name', () => {
    expect(milestoneSchema.safeParse({}).success).toBe(false);
    expect(taskSchema.safeParse({}).success).toBe(false);
    expect(epicSchema.safeParse({}).success).toBe(false);
    expect(
      milestoneSchema.safeParse({ projectId: 'p1', name: 'Launch' }).success
    ).toBe(true);
    expect(
      taskSchema.safeParse({ projectId: 'p1', title: 'Ship' }).success
    ).toBe(true);
    expect(epicSchema.safeParse({ projectId: 'p1', name: 'Eng' }).success).toBe(
      true
    );
  });

  it('default statuses', () => {
    expect(milestoneSchema.parse({ projectId: 'p1', name: 'L' }).status).toBe(
      'planned'
    );
    expect(taskSchema.parse({ projectId: 'p1', title: 'T' }).status).toBe(
      'todo'
    );
    expect(taskSchema.parse({ projectId: 'p1', title: 'T' }).priority).toBe(
      'medium'
    );
    expect(epicSchema.parse({ projectId: 'p1', name: 'E' }).status).toBe(
      'planned'
    );
  });

  it('requires a title and valid currency for negotiations', () => {
    expect(negotiationSchema.safeParse({}).success).toBe(false);
    expect(negotiationSchema.safeParse({ title: 'X' }).success).toBe(false);
    expect(
      negotiationSchema.safeParse({ title: 'X', currency: 'usd' }).success
    ).toBe(false);
    expect(
      negotiationSchema.safeParse({ title: 'X', currency: 'USD' }).success
    ).toBe(true);
    expect(
      negotiationSchema.safeParse({ title: 'X', currency: 'USD', amount: -1 })
        .success
    ).toBe(false);
  });
});
