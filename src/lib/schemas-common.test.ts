import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import {
  dateField,
  datetimeInput,
  requiredDateField,
} from '@/lib/schemas-common';

const utcMidnight = 'T00:00:00.000Z';

describe('dateField', () => {
  it('parses a valid YYYY-MM-DD string to a Date at UTC midnight', () => {
    const result = dateField.parse('2026-03-15');
    expect(result).toBeInstanceOf(Date);
    expect((result as Date).toISOString()).toBe(`2026-03-15${utcMidnight}`);
  });

  it('passes a Date through unchanged', () => {
    const date = new Date('2026-03-15T10:00:00.000Z');
    expect(dateField.parse(date)).toBe(date);
  });

  it('rejects invalid calendar dates', () => {
    expect(() => dateField.parse('2026-02-30')).toThrow(ZodError);
    expect(() => dateField.parse('2026-13-45')).toThrow(ZodError);
  });

  it('rejects malformed strings', () => {
    expect(() => dateField.parse('not-a-date')).toThrow(ZodError);
    expect(() => dateField.parse('2026-3-15')).toThrow(ZodError);
  });

  it('passes empty and nullish values through', () => {
    expect(dateField.parse('')).toBe('');
    expect(dateField.parse(null)).toBeNull();
    expect(dateField.parse(undefined)).toBeUndefined();
  });
});

describe('requiredDateField', () => {
  it('parses a valid YYYY-MM-DD string to a Date at UTC midnight', () => {
    const result = requiredDateField.parse('2026-03-15');
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe(`2026-03-15${utcMidnight}`);
  });

  it('rejects missing, empty, and invalid values', () => {
    expect(() => requiredDateField.parse(undefined)).toThrow(ZodError);
    expect(() => requiredDateField.parse(null)).toThrow(ZodError);
    expect(() => requiredDateField.parse('')).toThrow(ZodError);
    expect(() => requiredDateField.parse('2026-02-30')).toThrow(ZodError);
  });
});

describe('datetimeInput', () => {
  it('accepts a valid YYYY-MM-DDTHH:mm string', () => {
    expect(datetimeInput.parse('2026-03-15T09:30')).toBe('2026-03-15T09:30');
  });

  it('accepts a Date', () => {
    const date = new Date('2026-03-15T09:30:00.000Z');
    expect(datetimeInput.parse(date)).toBe(date);
  });

  it('rejects garbage input without crashing (Task 9.1 regression)', () => {
    expect(() => datetimeInput.parse('garbage')).toThrow(ZodError);
    expect(datetimeInput.safeParse('garbage').success).toBe(false);
    expect(() => datetimeInput.parse('')).toThrow(ZodError);
  });

  it('rejects a datetime whose parts do not exist', () => {
    expect(datetimeInput.safeParse('2026-02-30T10:00').success).toBe(false);
    expect(datetimeInput.safeParse('2026-13-45T25:99').success).toBe(false);
  });
});
