import { describe, expect, it } from 'vitest';

import {
  asNumber,
  formatCompact,
  formatDate,
  formatDateTime,
  formatMoney,
  isOverdue,
  sumByCurrency,
} from '@/lib/money';

describe('asNumber', () => {
  it('parses numeric strings', () => {
    expect(asNumber('123')).toBe(123);
    expect(asNumber('12.5')).toBe(12.5);
    expect(asNumber('0')).toBe(0);
  });

  it('passes numbers through', () => {
    expect(asNumber(42)).toBe(42);
    expect(asNumber(0)).toBe(0);
    expect(asNumber(-7.25)).toBe(-7.25);
  });

  it('coerces empty/missing/NaN inputs to zero', () => {
    expect(asNumber(null)).toBe(0);
    expect(asNumber(undefined)).toBe(0);
    expect(asNumber('')).toBe(0);
    expect(asNumber(NaN)).toBe(0);
  });

  it('coerces unparseable strings to zero', () => {
    expect(asNumber('abc')).toBe(0);
    expect(asNumber('42abc')).toBe(0);
  });
});

describe('formatMoney', () => {
  it('formats a valid currency in en-US', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatMoney(0, 'USD')).toBe('$0.00');
    expect(formatMoney(1234.5, 'EUR')).toBe('€1,234.50');
  });

  it('formats currencies without minor units without decimals', () => {
    expect(formatMoney(1234, 'JPY')).toBe('¥1,234');
  });

  it('falls back to a plain string for invalid currencies', () => {
    expect(formatMoney(100, 'XYZ')).toBe('XYZ 100.00');
    expect(formatMoney(100, 'usd')).toBe('usd 100.00');
  });

  it('omits the currency prefix when the code is empty', () => {
    expect(formatMoney(100, '')).toBe('100.00');
  });
});

describe('formatCompact', () => {
  it('formats compact currency in en-US', () => {
    expect(formatCompact(1_500_000, 'USD')).toBe('$1.5M');
    expect(formatCompact(2_500, 'USD')).toBe('$2.5K');
    expect(formatCompact(999, 'USD')).toBe('$999');
  });

  it('falls back to a compact plain string for invalid currencies', () => {
    expect(formatCompact(1_500_000, 'XYZ')).toBe('XYZ 1.5M');
    expect(formatCompact(2_500, 'XYZ')).toBe('XYZ 2.5K');
    expect(formatCompact(999, 'XYZ')).toBe('XYZ 999');
  });
});

describe('sumByCurrency', () => {
  it('groups and sums by currency', () => {
    const items = [
      { amount: 100, currency: 'USD' },
      { amount: 200, currency: 'USD' },
      { amount: 50, currency: 'EUR' },
    ];
    expect(sumByCurrency(items, 'amount', 'currency')).toEqual([
      { currency: 'EUR', total: 50 },
      { currency: 'USD', total: 300 },
    ]);
  });

  it('coerces string amounts', () => {
    const items = [
      { amount: '10', currency: 'USD' },
      { amount: '20.5', currency: 'USD' },
    ];
    expect(sumByCurrency(items, 'amount', 'currency')).toEqual([
      { currency: 'USD', total: 30.5 },
    ]);
  });

  it('returns an empty array for empty input', () => {
    expect(sumByCurrency([], 'amount', 'currency')).toEqual([]);
  });

  it('skips items with nullish or empty currencies', () => {
    const items = [
      { amount: 5, currency: null },
      { amount: 6, currency: undefined },
      { amount: 7, currency: '' },
      { amount: 8, currency: 'USD' },
    ];
    expect(sumByCurrency(items, 'amount', 'currency')).toEqual([
      { currency: 'USD', total: 8 },
    ]);
  });

  it('coerces unparseable amounts to zero rather than dropping the item', () => {
    const items = [
      { amount: 'abc', currency: 'USD' },
      { amount: 5, currency: 'USD' },
    ];
    expect(sumByCurrency(items, 'amount', 'currency')).toEqual([
      { currency: 'USD', total: 5 },
    ]);
  });

  it('works with arbitrary key names', () => {
    const items = [
      { value: 10, code: 'USD' },
      { value: 20, code: 'USD' },
    ];
    expect(sumByCurrency(items, 'value', 'code')).toEqual([
      { currency: 'USD', total: 30 },
    ]);
  });
});

describe('formatDate', () => {
  it('formats a date-only string at UTC', () => {
    expect(formatDate('2026-03-15')).toBe('Mar 15, 2026');
  });

  it('formats a Date instance at UTC', () => {
    expect(formatDate(new Date('2026-03-15T00:00:00.000Z'))).toBe(
      'Mar 15, 2026'
    );
  });

  it('returns an empty string for nullish input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });

  it('returns an empty string for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('');
    expect(formatDate(new Date(NaN))).toBe('');
  });
});

describe('formatDateTime', () => {
  it('formats a Date at UTC with time', () => {
    expect(formatDateTime(new Date('2026-03-15T09:30:00.000Z'))).toBe(
      'Mar 15, 2026, 9:30 AM'
    );
  });

  it('returns an empty string for nullish or invalid input', () => {
    expect(formatDateTime(null)).toBe('');
    expect(formatDateTime('garbage')).toBe('');
  });
});

describe('isOverdue', () => {
  const now = new Date('2026-01-15T12:00:00.000Z');

  it('returns true for dates in the past', () => {
    expect(isOverdue('2026-01-01T00:00:00.000Z', now)).toBe(true);
    expect(isOverdue(new Date('2026-01-15T11:59:59.000Z'), now)).toBe(true);
  });

  it('returns false for dates in the future', () => {
    expect(isOverdue('2026-02-01T00:00:00.000Z', now)).toBe(false);
    expect(isOverdue(new Date('2026-01-15T12:00:01.000Z'), now)).toBe(false);
  });

  it('returns false for nullish input', () => {
    expect(isOverdue(null, now)).toBe(false);
    expect(isOverdue(undefined, now)).toBe(false);
  });

  it('returns false for invalid dates', () => {
    expect(isOverdue('garbage', now)).toBe(false);
  });
});
