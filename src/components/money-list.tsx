import { formatMoney } from '@/lib/money';

type MoneyListProps = {
  rows: Array<{ currency: string; total: number }>;
};

export function MoneyList({ rows }: MoneyListProps) {
  if (rows.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      {rows.map(({ currency, total }) => (
        <span key={currency}>{formatMoney(total, currency)}</span>
      ))}
    </span>
  );
}
