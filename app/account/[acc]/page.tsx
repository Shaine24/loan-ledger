import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { compactMoney, count, day, money, pct } from "@/lib/format";
import type { LoanDueRow, NpaRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ acc: string }>;
}) {
  const { acc } = await params;
  const accountNo = decodeURIComponent(acc);
  const supabase = supabaseServer();

  const [dueRes, npaRes] = await Promise.all([
    supabase.from("loan_due").select("*").eq("acc_no", accountNo).limit(10),
    supabase.from("npa_accounts").select("*").eq("acc_no", accountNo).limit(10),
  ]);

  const dues = (dueRes.data ?? []) as LoanDueRow[];
  const npas = (npaRes.data ?? []) as NpaRow[];

  if (dues.length === 0 && npas.length === 0) {
    notFound();
  }

  const primary = npas[0] ?? null;
  const due = dues[0] ?? null;
  const name = primary?.acc_name ?? due?.name ?? "Account";
  const branch = primary?.br_name ?? due?.branch ?? "—";

  return (
    <div className="fade-in">
      <section className="shell pt-9 sm:pt-12">
        <Link
          href="/npa"
          className="text-[0.74rem] text-muted underline decoration-line underline-offset-4 hover:text-sage-deep"
        >
          ← Back to accounts
        </Link>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <p className="eyebrow">Account card</p>
            <h1 className="display mt-2.5 text-[1.85rem] leading-tight text-ink sm:text-[2.4rem]">
              {name}
            </h1>
            <p className="num mt-2 text-[0.82rem] text-ink-soft">
              {accountNo} · {branch}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {primary?.npa_type ? <span className="chip">{primary.npa_type}</span> : null}
              {primary?.gl_name ? <span className="chip">{primary.gl_name}</span> : null}
              {primary?.secured ? <span className="chip">{primary.secured}</span> : null}
              {primary?.period_type ? <span className="chip">{primary.period_type}</span> : null}
            </div>
          </div>
          {primary?.mobile_no ? (
            <span className="chip num">Mobile {primary.mobile_no}</span>
          ) : null}
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Book balance" value={money(primary?.balance)} />
          <Metric label="NPA amount" value={money(primary?.npa_amount)} emphasis />
          <Metric label="Total due" value={money(due?.total_due)} />
          <Metric label="Loan amount" value={money(primary?.loan_amount ?? due?.loan_amt)} />
        </div>
      </section>

      <section className="shell mt-3 grid gap-3 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="display text-[1.25rem] text-ink">NPA classification</h2>
          <p className="mt-1 text-[0.72rem] text-muted">
            {npas.length > 0
              ? `${npas.length} classification row${npas.length > 1 ? "s" : ""} for this account`
              : "Not present in the NPA sheet"}
          </p>
          <div className="mt-4 divide-y divide-line-soft">
            {primary ? (
              <>
                <Field label="Classification" value={primary.npa_type} />
                <Field label="Product / GL" value={`${primary.gl_name ?? "—"} (${primary.gl_code ?? "—"})`} />
                <Field label="Secured" value={primary.secured} />
                <Field label="Loan date" value={day(primary.loan_date)} />
                <Field label="Due date" value={day(primary.due_date)} />
                <Field label="Loan amount" value={money(primary.loan_amount)} />
                <Field label="Balance" value={money(primary.balance)} />
                <Field label="Provision held" value={money(primary.provision)} />
                <Field label="Provision %" value={primary.percentage === null ? "—" : pct(primary.percentage, 2)} />
                <Field label="NPA amount" value={money(primary.npa_amount)} />
                <Field label="Instalment due" value={money(primary.due_inst)} />
                <Field label="Interest due" value={money(primary.due_int)} />
                <Field label="Due month" value={primary.due_month === null ? "—" : count(primary.due_month)} />
                <Field label="Last instalment" value={day(primary.lst_inst_date)} />
                <Field label="NPA date" value={day(primary.npa_date)} />
                <Field label="Instalment amount" value={money(primary.inst_amount)} />
                <Field label="Valuation" value={money(primary.valuation)} />
                <Field label="Branch code" value={primary.br_id} />
              </>
            ) : (
              <p className="py-4 text-[0.82rem] text-muted">
                This account has outstanding dues but no NPA classification row.
              </p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="display text-[1.25rem] text-ink">Loan due ledger</h2>
          <p className="mt-1 text-[0.72rem] text-muted">
            {dues.length > 0
              ? `${dues.length} due row${dues.length > 1 ? "s" : ""} for this account`
              : "Not present in the loan due sheet"}
          </p>
          <div className="mt-4 divide-y divide-line-soft">
            {due ? (
              <>
                <Field label="Branch" value={due.branch} />
                <Field label="Scheme" value={due.loan_type} />
                <Field label="Loan date" value={day(due.loan_date)} />
                <Field label="Loan amount" value={money(due.loan_amt)} />
                <Field label="Interest rate" value={due.rate === null ? "—" : pct(due.rate, 2)} />
                <Field label="Due date" value={day(due.due_date)} />
                <Field label="Due numbers" value={due.due_no === null ? "—" : count(Math.round(due.due_no))} />
                <Field label="Instalment due" value={money(due.due_inst)} />
                <Field label="Interest due" value={money(due.due_int)} />
                <Field label="Other due" value={money(due.due_other)} />
                <Field label="Total due" value={money(due.total_due)} />
                <Field label="Provision" value={money(due.provision)} />
                <Field label="Last instalment" value={day(due.last_inst_date)} />
                <Field label="NPA date" value={day(due.npa_date)} />
              </>
            ) : (
              <p className="py-4 text-[0.82rem] text-muted">
                This account is classified as NPA but carries no due row in the
                loan due sheet.
              </p>
            )}
          </div>
          {due?.total_due ? (
            <p className="mt-4 rounded-xl bg-sand-pale px-3 py-2.5 text-[0.74rem] text-ink-soft">
              Reported total due {money(due.total_due)} against a book balance of{" "}
              {compactMoney(primary?.balance)}.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className={`card p-5 ${emphasis ? "bg-sage-deep/[0.04]" : ""}`}>
      <p className="eyebrow">{label}</p>
      <p className="display num mt-3 text-[1.35rem] leading-none text-ink">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="text-[0.74rem] text-muted">{label}</span>
      <span className="num text-right text-[0.8rem] text-ink">{value ?? "—"}</span>
    </div>
  );
}
