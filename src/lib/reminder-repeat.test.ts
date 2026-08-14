import { describe, expect, it } from 'vitest';

import { nextDueAt } from '@/lib/reminder-repeat';

const at = (y: number, m: number, d: number, h = 9, min = 30): Date =>
  new Date(y, m - 1, d, h, min);

describe('nextDueAt', () => {
  it('returns null for a once-only reminder', () => {
    expect(nextDueAt(at(2026, 1, 15), 'once')).toBeNull();
  });

  it('adds one day for daily repeats, preserving time-of-day', () => {
    const next = nextDueAt(at(2026, 1, 15, 9, 30), 'daily');
    expect(next).toEqual(at(2026, 1, 16, 9, 30));
  });

  it('adds seven days for weekly repeats, preserving time-of-day', () => {
    const next = nextDueAt(at(2026, 1, 15, 9, 30), 'weekly');
    expect(next).toEqual(at(2026, 1, 22, 9, 30));
  });

  it('adds one month for monthly repeats', () => {
    const next = nextDueAt(at(2026, 3, 15, 9, 30), 'monthly');
    expect(next).toEqual(at(2026, 4, 15, 9, 30));
  });

  it('clamps a non-leap year month-end (Jan 31 -> Feb 28)', () => {
    const next = nextDueAt(at(2026, 1, 31, 9, 30), 'monthly');
    expect(next).toEqual(at(2026, 2, 28, 9, 30));
  });

  it('clamps a leap year month-end (Jan 31 -> Feb 29)', () => {
    const next = nextDueAt(at(2028, 1, 31, 9, 30), 'monthly');
    expect(next).toEqual(at(2028, 2, 29, 9, 30));
  });

  it('clamps the end of a shorter month (Mar 31 -> Apr 30)', () => {
    const next = nextDueAt(at(2026, 3, 31, 9, 30), 'monthly');
    expect(next).toEqual(at(2026, 4, 30, 9, 30));
  });

  it('rolls the year over across December', () => {
    const next = nextDueAt(at(2026, 12, 31, 9, 30), 'monthly');
    expect(next).toEqual(at(2027, 1, 31, 9, 30));
  });
});
