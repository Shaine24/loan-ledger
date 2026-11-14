import { compactMoney, count, share } from "@/lib/format";

type Row = {
  label: string;
  value: number;
  secondary?: string;
  href?: string;
};

export function BarList({ rows, tone = "#6f8b74" }: { rows: Row[]; tone?: string }) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate text-[0.82rem] text-ink">{row.label}</span>
              {row.secondary ? (
                <span className="block text-[0.67rem] text-muted">{row.secondary}</span>
              ) : null}
            </span>
            <span className="num shrink-0 text-[0.82rem] text-ink-soft">
              {compactMoney(row.value)}
            </span>
          </div>
          <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-line-soft">
            <div
              className="h-full rounded-full"
              style={{
                width: `${share(row.value, max)}%`,
                background: tone,
                opacity: 0.55 + 0.45 * (row.value / max),
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CompactRows({ rows }: { rows: Row[] }) {
  return (
    <ul className="divide-y divide-line-soft">
      {rows.map((row) => (
        <li key={row.label} className="flex items-center justify-between gap-3 py-2.5">
          <span className="min-w-0">
            <span className="block truncate text-[0.82rem] text-ink">{row.label}</span>
            {row.secondary ? (
              <span className="block text-[0.68rem] text-muted">{row.secondary}</span>
            ) : null}
          </span>
          <span className="num shrink-0 text-[0.82rem] text-ink-soft">
            {compactMoney(row.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function accountLabel(accounts: number): string {
  return `${count(accounts)} ${accounts === 1 ? "account" : "accounts"}`;
}
