import { compactMoney, count, share } from "@/lib/format";

type Slice = { label: string; value: number; color: string; accounts?: number };

export function DonutChart({ data }: { data: Slice[] }) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const radius = 66;
  const stroke = 20;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="relative mx-auto w-[188px] shrink-0">
        <svg viewBox="0 0 180 180" className="h-[188px] w-[188px] -rotate-90">
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#f0ebdf"
            strokeWidth={stroke}
          />
          {total > 0 &&
            data.map((slice) => {
              const length = (slice.value / total) * circumference;
              const dash = Math.max(length - 2.5, 0.6);
              const element = (
                <circle
                  key={slice.label}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += length;
              return element;
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="eyebrow text-[0.6rem]">NPA amount</span>
          <span className="display num mt-1 text-[1.35rem] leading-none text-ink">
            {compactMoney(total)}
          </span>
        </div>
      </div>

      <ul className="flex-1 space-y-2.5">
        {data.map((slice) => (
          <li key={slice.label} className="flex items-baseline gap-2.5">
            <span
              className="mt-[0.32rem] h-2 w-2 shrink-0 rounded-full"
              style={{ background: slice.color }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.82rem] text-ink">{slice.label}</span>
              <span className="block text-[0.7rem] text-muted">
                {count(slice.accounts ?? 0)} accounts · {share(slice.value, total).toFixed(1)}% of NPA
              </span>
            </span>
            <span className="num shrink-0 text-[0.82rem] text-ink-soft">
              {compactMoney(slice.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
