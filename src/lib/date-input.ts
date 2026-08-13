// Native date inputs take YYYY-MM-DD. Dates are stored at UTC midnight, so
// ISO string slicing keeps the rendered business date in agreement.
export function toDateInputValue(
  value: Date | string | null | undefined
): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}
