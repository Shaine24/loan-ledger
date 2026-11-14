import { NpaExplorer } from "@/components/npa-explorer";
import { supabaseServer } from "@/lib/supabase/server";
import { compactMoney, count, money, share, stamp } from "@/lib/format";
import { npaColor, type FilterOptions, type Summary, type TypeBucket } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "NPA accounts — Loan Ledger",
};

export default async function NpaPage() {
  const supabase = supabaseServer();
  const [optionsRes, summaryRes, typesRes] = await Promise.all([
    supabase.from("v_filter_options").select("*").single(),
    supabase.from("v_summary").select("*").single(),
    supabase.from("v_npa_by_type").select("*").order("npa_amount", { ascending: false }),
  ]);

  const options = (optionsRes.data ?? null) as FilterOptions | null;
  const summary = (summaryRes.data ?? null) as Summary | null;
  const types = (typesRes.data ?? []) as TypeBucket[];

  return (
    <div className="fade-in">
      <section className="shell pt-10 sm:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Ledger B · classification</p>
            <h1 className="display mt-2.5 text-[2rem] leading-none text-ink sm:text-[2.6rem]">
              NPA accounts
            </h1>
            <p className="mt-3 max-w-xl text-[0.86rem] leading-relaxed text-ink-soft">
              Asset classification, balance, provision and NPA date for every
              borrower in the consolidated NPA sheet.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="chip">
              <span className="chip-dot" />
              {count(summary?.npa_rows)} accounts
            </span>
            <span className="chip num">{compactMoney(summary?.npa_amount)} NPA</span>
            <span className="chip">Synced {stamp(summary?.last_import)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {types.map((row, index) => (
            <span key={row.npa_type} className="chip">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: npaColor(row.npa_type ?? "", index) }}
              />
              {row.npa_type ?? "Unclassified"}
              <span className="num text-muted">
                {compactMoney(row.npa_amount)} · {share(Number(row.npa_amount), Number(summary?.npa_amount ?? 0)).toFixed(1)}%
              </span>
            </span>
          ))}
        </div>
      </section>

      <section className="shell mt-5">
        <NpaExplorer
          types={options?.npa_types ?? []}
          products={options?.npa_products ?? []}
          branches={options?.npa_branches ?? []}
        />
      </section>

      <section className="shell mt-4 flex flex-wrap items-center justify-between gap-2 text-[0.7rem] text-muted">
        <p>
          Source: Consolidated NPA Account sheet · {count(summary?.npa_rows)} rows,
          NPA amount {money(summary?.npa_amount)}.
        </p>
        <p>Tap a borrower to open the full account card.</p>
      </section>
    </div>
  );
}
