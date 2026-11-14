import Link from "next/link";
import { KpiCard } from "@/components/kpi-card";
import { DonutChart } from "@/components/donut-chart";
import { BarList, CompactRows } from "@/components/bar-list";
import { supabaseServer } from "@/lib/supabase/server";
import { compactMoney, count, day, money, share, stamp } from "@/lib/format";
import {
  npaColor,
  type BranchBucket,
  type Dataset,
  type DueBranchBucket,
  type DueTypeBucket,
  type ProductBucket,
  type Summary,
  type TypeBucket,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const supabase = supabaseServer();

  const [summaryRes, typesRes, branchRes, productRes, dueTypeRes, dueBranchRes, datasetRes] =
    await Promise.all([
      supabase.from("v_summary").select("*").single(),
      supabase.from("v_npa_by_type").select("*").order("npa_amount", { ascending: false }),
      supabase.from("v_npa_by_branch").select("*").order("npa_amount", { ascending: false }).limit(200),
      supabase.from("v_npa_by_product").select("*").order("npa_amount", { ascending: false }).limit(200),
      supabase.from("v_loan_due_by_type").select("*").order("total_due", { ascending: false }),
      supabase.from("v_loan_due_by_branch").select("*").order("total_due", { ascending: false }).limit(200),
      supabase.from("datasets").select("*").order("id"),
    ]);

  const summary = (summaryRes.data ?? null) as Summary | null;
  const types = (typesRes.data ?? []) as TypeBucket[];
  const branches = (branchRes.data ?? []) as BranchBucket[];
  const products = (productRes.data ?? []) as ProductBucket[];
  const dueTypes = (dueTypeRes.data ?? []) as DueTypeBucket[];
  const dueBranches = (dueBranchRes.data ?? []) as DueBranchBucket[];
  const datasets = (datasetRes.data ?? []) as Dataset[];

  if (!summary) {
    return (
      <div className="shell pt-16">
        <div className="card p-8">
          <p className="eyebrow">No data yet</p>
          <h1 className="display mt-3 text-3xl">The ledger is empty.</h1>
          <p className="mt-3 max-w-lg text-sm text-ink-soft">
            The Supabase tables are reachable but hold no rows. Re-run the import
            script with the consolidated sheets to populate the dashboard.
          </p>
        </div>
      </div>
    );
  }

  const doubtful = types
    .filter((row) => (row.npa_type ?? "").toLowerCase().includes("doubtful"))
    .reduce((sum, row) => sum + Number(row.npa_amount ?? 0), 0);

  const npaRatio = summary.npa_balance ? (summary.npa_amount / summary.npa_balance) * 100 : 0;
  const dueRatio = summary.npa_balance ? (summary.total_due / summary.npa_balance) * 100 : 0;

  const topBranches = branches.slice(0, 7).map((row) => ({
    label: row.br_name ?? "Unassigned",
    value: Number(row.npa_amount ?? 0),
    secondary: `${count(row.accounts)} ac`,
  }));

  const topProducts = products.slice(0, 7).map((row) => ({
    label: row.gl_name ?? "Unclassified",
    value: Number(row.npa_amount ?? 0),
    secondary: `${count(row.accounts)} ac`,
  }));

  const topDueBranches = dueBranches.slice(0, 6).map((row) => ({
    label: row.branch ?? "Unassigned",
    value: Number(row.total_due ?? 0),
    secondary: `${count(row.accounts)} ac`,
  }));

  const dueTypeRows = dueTypes.slice(0, 8).map((row) => ({
    label: row.loan_type ?? "Unclassified",
    value: Number(row.total_due ?? 0),
    secondary: `${count(row.accounts)} ac`,
  }));

  return (
    <div className="fade-in">
      <section className="shell pt-10 sm:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="eyebrow">Consolidated position</p>
            <h1 className="display mt-3 text-[2.15rem] leading-[1.05] text-ink sm:text-[3rem]">
              Everything the two sheets say,
              <br className="hidden sm:block" /> in one quiet place.
            </h1>
            <p className="mt-4 max-w-xl text-[0.9rem] leading-relaxed text-ink-soft">
              Loan dues and NPA classification from the consolidated exports —
              balances, provisions, ageing and branch exposure, read live from
              Supabase.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="chip">
              <span className="chip-dot" />
              Synced {stamp(summary.last_import)}
            </span>
            <span className="chip">{datasets.length} source sheets</span>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-5">
          <Stat label="NPA to book" value={`${npaRatio.toFixed(1)}%`} />
          <Stat label="Overdue to book" value={`${dueRatio.toFixed(1)}%`} />
          <Stat label="Doubtful share" value={`${share(doubtful, summary.npa_amount).toFixed(1)}%`} />
          <Stat label="Products" value={count(summary.product_count)} />
          <Stat label="Branches" value={count(summary.branch_count)} />
        </div>
      </section>

      <section className="shell mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total due"
          value={summary.total_due}
          hint={`Across ${count(summary.loan_due_rows)} loan accounts`}
          accent="sage"
        />
        <KpiCard
          label="NPA amount"
          value={summary.npa_amount}
          hint={`Provisioned on a ${compactMoney(summary.npa_balance)} book`}
          accent="blush"
        />
        <KpiCard
          label="Book balance"
          value={summary.npa_balance}
          hint={`${count(summary.npa_rows)} accounts in the NPA sheet`}
          accent="sand"
        />
        <KpiCard
          label="Loans disbursed"
          value={summary.loan_amt}
          hint={`${count(summary.loan_due_rows)} accounts · ${count(summary.branch_count)} branches`}
          accent="sky"
        />
      </section>

      <section className="shell mt-3 grid gap-3 lg:grid-cols-12">
        <div className="card p-5 lg:col-span-5">
          <PanelHead
            eyebrow="Classification"
            title="Where the NPA sits"
            note="Share of NPA amount by asset class"
          />
          <div className="mt-5">
            <DonutChart
              data={types.map((row, index) => ({
                label: row.npa_type ?? "Unclassified",
                value: Number(row.npa_amount ?? 0),
                color: npaColor(row.npa_type ?? "", index),
                accounts: row.accounts,
              }))}
            />
          </div>
          <div className="mt-5 border-t border-line-soft pt-4">
            <p className="text-[0.72rem] leading-relaxed text-muted">
              Doubtful assets carry{" "}
              {share(doubtful, summary.npa_amount).toFixed(1)}% of the NPA book,
              while standard assets — {count(types.find((row) => (row.npa_type ?? "").toLowerCase().includes("standard"))?.accounts ?? 0)}{" "}
              accounts — contribute the remaining{" "}
              {(100 - share(doubtful, summary.npa_amount)).toFixed(1)}%.
            </p>
          </div>
        </div>

        <div className="card p-5 lg:col-span-7">
          <PanelHead
            eyebrow="Exposure"
            title="Branches carrying the most NPA"
            note="NPA amount per branch · top seven"
            action={{ href: "/npa", label: "All branches" }}
          />
          <div className="mt-5">
            <BarList rows={topBranches} />
          </div>
          <div className="mt-5 border-t border-line-soft pt-4">
            <p className="text-[0.72rem] leading-relaxed text-muted">
              {topBranches.length > 0
                ? `${topBranches[0].label} leads with ${compactMoney(topBranches[0].value)}, or ${share(
                    topBranches[0].value,
                    summary.npa_amount,
                  ).toFixed(1)}% of total NPA across ${count(summary.branch_count)} branches.`
                : "No branch data in the current sheet."}
            </p>
          </div>
        </div>
      </section>

      <section className="shell mt-3 grid gap-3 lg:grid-cols-12">
        <div className="card p-5 lg:col-span-7">
          <PanelHead
            eyebrow="Product mix"
            title="Schemes ranked by NPA"
            note="Grouped by general ledger product name"
            action={{ href: "/npa", label: "All products" }}
          />
          <div className="mt-5">
            <BarList rows={topProducts} tone="#3f5a49" />
          </div>
        </div>

        <div className="card p-5 lg:col-span-5">
          <PanelHead
            eyebrow="Overdues"
            title="Due by loan scheme"
            note="Total outstanding due per scheme"
            action={{ href: "/loan-dues", label: "All dues" }}
          />
          <div className="mt-4">
            <CompactRows rows={dueTypeRows} />
          </div>
        </div>
      </section>

      <section className="shell mt-3 grid gap-3 lg:grid-cols-12">
        <div className="card p-5 lg:col-span-5">
          <PanelHead
            eyebrow="Overdues"
            title="Branches with the heaviest dues"
            note="Total due per branch · top six"
          />
          <div className="mt-4">
            <CompactRows rows={topDueBranches} />
          </div>
        </div>

        <div className="lg:col-span-7 grid gap-3 sm:grid-cols-2">
          <Link
            href="/loan-dues"
            className="card group flex flex-col justify-between p-5 transition-colors hover:bg-[#fbf8f0]"
          >
            <div>
              <p className="eyebrow">Ledger A</p>
              <h3 className="display mt-2 text-[1.5rem] leading-tight text-ink">
                Loan dues
              </h3>
              <p className="mt-2 text-[0.78rem] leading-relaxed text-muted">
                Every account with an outstanding instalment, interest and other
                dues, plus provision held.
              </p>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <span>
                <span className="display num block text-[1.6rem] leading-none text-ink">
                  {count(summary.loan_due_rows)}
                </span>
                <span className="num mt-1 block text-[0.68rem] text-muted">
                  {compactMoney(summary.total_due)} due
                </span>
              </span>
              <span className="text-[0.75rem] text-ink-soft group-hover:text-sage-deep">
                Open ledger →
              </span>
            </div>
          </Link>

          <Link
            href="/npa"
            className="card group flex flex-col justify-between p-5 transition-colors hover:bg-[#fbf8f0]"
          >
            <div>
              <p className="eyebrow">Ledger B</p>
              <h3 className="display mt-2 text-[1.5rem] leading-tight text-ink">
                NPA accounts
              </h3>
              <p className="mt-2 text-[0.78rem] leading-relaxed text-muted">
                Classification, balance, percentage provision and NPA date for
                every borrower in the sheet.
              </p>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <span>
                <span className="display num block text-[1.6rem] leading-none text-ink">
                  {count(summary.npa_rows)}
                </span>
                <span className="num mt-1 block text-[0.68rem] text-muted">
                  {compactMoney(summary.npa_amount)} NPA
                </span>
              </span>
              <span className="text-[0.75rem] text-ink-soft group-hover:text-sage-deep">
                Open ledger →
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section className="shell mt-3">
        <div className="card-quiet p-5">
          <PanelHead
            eyebrow="Lineage"
            title="What this page is built from"
            note="Each consolidated sheet lands in its own Supabase table"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {datasets.map((dataset) => (
              <div
                key={dataset.id}
                className="rounded-2xl border border-line bg-surface/70 p-4"
              >
                <p className="text-[0.86rem] text-ink">{dataset.sheet_label}</p>
                <p className="mt-1 truncate font-mono text-[0.68rem] text-muted">
                  {dataset.source_file} → {dataset.table_name}
                </p>
                <div className="mt-3 flex items-center justify-between text-[0.72rem] text-ink-soft">
                  <span className="num">{count(dataset.row_count)} rows</span>
                  <span className="num">{money(Number(dataset.total_amount ?? 0))}</span>
                </div>
                <p className="mt-1 text-[0.68rem] text-muted">
                  Imported {day(dataset.imported_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.66rem] uppercase tracking-[0.13em] text-muted">{label}</p>
      <p className="num mt-1 text-[0.95rem] text-ink">{value}</p>
    </div>
  );
}

function PanelHead({
  eyebrow,
  title,
  note,
  action,
}: {
  eyebrow: string;
  title: string;
  note?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="display mt-1.5 text-[1.3rem] leading-tight text-ink">{title}</h2>
        {note ? <p className="mt-1 text-[0.72rem] text-muted">{note}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="shrink-0 text-[0.72rem] text-ink-soft underline decoration-line underline-offset-4 hover:text-sage-deep"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
