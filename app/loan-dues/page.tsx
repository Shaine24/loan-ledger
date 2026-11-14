import { LoanDueExplorer } from "@/components/loan-due-explorer";
import { supabaseServer } from "@/lib/supabase/server";
import { compactMoney, count, money, stamp } from "@/lib/format";
import type { FilterOptions, Summary } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Loan dues — Loan Ledger",
};

export default async function LoanDuesPage() {
  const supabase = supabaseServer();
  const [optionsRes, summaryRes] = await Promise.all([
    supabase.from("v_filter_options").select("*").single(),
    supabase.from("v_summary").select("*").single(),
  ]);

  const options = (optionsRes.data ?? null) as FilterOptions | null;
  const summary = (summaryRes.data ?? null) as Summary | null;

  return (
    <div className="fade-in">
      <section className="shell pt-10 sm:pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Ledger A · overdue instalments</p>
            <h1 className="display mt-2.5 text-[2rem] leading-none text-ink sm:text-[2.6rem]">
              Loan dues
            </h1>
            <p className="mt-3 max-w-xl text-[0.86rem] leading-relaxed text-ink-soft">
              Instalment, interest and other dues per borrower, with the provision
              held and the ageing dates as reported in the consolidated sheet.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="chip">
              <span className="chip-dot" />
              {count(summary?.loan_due_rows)} accounts
            </span>
            <span className="chip num">{compactMoney(summary?.total_due)} due</span>
            <span className="chip">Synced {stamp(summary?.last_import)}</span>
          </div>
        </div>
      </section>

      <section className="shell mt-6">
        <LoanDueExplorer
          branches={options?.loan_branches ?? []}
          loanTypes={options?.loan_types ?? []}
        />
      </section>

      <section className="shell mt-4 flex flex-wrap items-center justify-between gap-2 text-[0.7rem] text-muted">
        <p>
          Source: LoanDueConsolidated sheet · {count(summary?.loan_due_rows)} rows,
          total due {money(summary?.total_due)}.
        </p>
        <p>Tap a borrower to open the full account card.</p>
      </section>
    </div>
  );
}
