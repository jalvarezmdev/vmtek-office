import { describe, expect, it } from 'vitest';

import { toUtcDate } from '@/lib/dates';

describe('toUtcDate', () => {
  it('converts a fixed-offset zone (America/Caracas, UTC-4)', () => {
    expect(toUtcDate('2026-03-15T10:00', 'America/Caracas').toISOString()).toBe(
      '2026-03-15T14:00:00.000Z'
    );
  });

  it('is DST-aware (America/New_York)', () => {
    // January is EST (UTC-5).
    expect(
      toUtcDate('2026-01-15T10:00', 'America/New_York').toISOString()
    ).toBe('2026-01-15T15:00:00.000Z');
    // July is EDT (UTC-4).
    expect(
      toUtcDate('2026-07-15T10:00', 'America/New_York').toISOString()
    ).toBe('2026-07-15T14:00:00.000Z');
  });

  it('passes a Date through unchanged', () => {
    const date = new Date('2026-03-15T10:00:00.000Z');
    expect(toUtcDate(date, 'UTC')).toBe(date);
  });

  it('throws for a string that fails to parse', () => {
    expect(() => toUtcDate('garbage', 'UTC')).toThrow();
    expect(() => toUtcDate('', 'UTC')).toThrow();
  });
});
