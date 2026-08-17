const supportedCurrencies =
  typeof Intl.supportedValuesOf === 'function'
    ? new Set(Intl.supportedValuesOf('currency'))
    : null;

function isValidCurrency(currency: string): boolean {
  if (supportedCurrencies) return supportedCurrencies.has(currency);
  return /^[A-Z]{3}$/.test(currency);
}

export function asNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fallbackMoney(amount: number, currency: string): string {
  return [currency, amount.toFixed(2)].filter(Boolean).join(' ');
}

const moneyFormatters = new Map<string, Intl.NumberFormat>();
const compactFormatters = new Map<string, Intl.NumberFormat>();

function getMoneyFormatter(currency: string): Intl.NumberFormat {
  let formatter = moneyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    });
    moneyFormatters.set(currency, formatter);
  }
  return formatter;
}

export function formatMoney(amount: number, currency: string): string {
  if (!isValidCurrency(currency)) {
    return fallbackMoney(amount, currency);
  }
  try {
    return getMoneyFormatter(currency).format(amount);
  } catch {
    return fallbackMoney(amount, currency);
  }
}

function compactFallback(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toFixed(0);
}

function getCompactFormatter(currency: string): Intl.NumberFormat {
  let formatter = compactFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    });
    compactFormatters.set(currency, formatter);
  }
  return formatter;
}

export function formatCompact(amount: number, currency: string): string {
  if (!isValidCurrency(currency)) {
    return [currency, compactFallback(amount)].filter(Boolean).join(' ');
  }
  try {
    return getCompactFormatter(currency).format(amount);
  } catch {
    return [currency, compactFallback(amount)].filter(Boolean).join(' ');
  }
}

export function sumByCurrency<T>(
  items: T[],
  amountKey: keyof T,
  currencyKey: keyof T
): Array<{ currency: string; total: number }> {
  const totals = new Map<string, number>();

  for (const item of items) {
    if (item[currencyKey] == null) continue;
    const currency = String(item[currencyKey]);
    if (!currency) continue;
    const amount = asNumber(
      item[amountKey] as string | number | null | undefined
    );
    totals.set(currency, (totals.get(currency) ?? 0) + amount);
  }

  return [...totals.entries()]
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

// Pin to UTC because the DB columns are timezone-agnostic business dates
// (timestamp({ mode: 'date' })): date-only strings parse as UTC midnight, and
// this keeps server (Vercel UTC) and client rendering in agreement to avoid
// hydration mismatches.
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return dateFormatter.format(parsed);
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return dateTimeFormatter.format(parsed);
}

export function isOverdue(
  date: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!date) return false;
  const parsed = date instanceof Date ? date : new Date(date);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() < now.getTime();
}
