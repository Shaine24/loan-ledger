import { compactMoney, count } from "@/lib/format";

export function KpiCard({
  label,
  value,
  hint,
  accent = "sage",
}: {
  label: string;
  value: number | null | undefined;
  hint: string;
  accent?: "sage" | "sand" | "blush" | "sky";
}) {
  const tint = {
    sage: "bg-sage-pale",
    sand: "bg-sand-pale",
    blush: "bg-blush-pale",
    sky: "bg-sky-pale",
  }[accent];

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${tint} ring-1 ring-line`} />
        <p className="eyebrow">{label}</p>
      </div>
      <p className="display num mt-3 text-[1.9rem] leading-none text-ink">
        {compactMoney(value)}
      </p>
      <p className="mt-2 text-[0.76rem] leading-relaxed text-muted">{hint}</p>
    </div>
  );
}

export function CountCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | null | undefined;
  hint: string;
}) {
  return (
    <div className="card-quiet p-5">
      <p className="eyebrow">{label}</p>
      <p className="display num mt-3 text-[1.6rem] leading-none text-ink">
        {count(value)}
      </p>
      <p className="mt-2 text-[0.74rem] leading-relaxed text-muted">{hint}</p>
    </div>
  );
}
