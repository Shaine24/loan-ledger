"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { compactMoney, count, day, money, pct } from "@/lib/format";
import type { LoanDueRow } from "@/lib/types";
import { FilterSelect, LoadingRows, Pager, SearchBox } from "@/components/ui";

const SORTS = [
  { value: "total_due.desc", label: "Highest total due" },
  { value: "total_due.asc", label: "Lowest total due" },
  { value: "loan_amt.desc", label: "Largest loan" },
  { value: "due_date.asc", label: "Oldest due date" },
  { value: "npa_date.desc", label: "Recent NPA date" },
  { value: "name.asc", label: "Borrower A–Z" },
];

export function LoanDueExplorer({
  branches,
  loanTypes,
}: {
  branches: string[];
  loanTypes: string[];
}) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("");
  const [loanType, setLoanType] = useState("");
  const [sort, setSort] = useState("total_due.desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [rows, setRows] = useState<LoanDueRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(0);
  }, [query, branch, loanType, sort, pageSize]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const [column, direction] = sort.split(".");
      let request = supabase.from("loan_due").select("*", { count: "exact" });

      const term = query.trim().replace(/[%,()]/g, " ").trim();
      if (term) {
        request = request.or(
          `name.ilike.%${term}%,acc_no.ilike.%${term}%,branch.ilike.%${term}%,loan_type.ilike.%${term}%`,
        );
      }
      if (branch) request = request.eq("branch", branch);
      if (loanType) request = request.eq("loan_type", loanType);

      request = request
        .order(column, { ascending: direction === "asc", nullsFirst: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);

      const { data, count: counted, error } = await request;
      if (cancelled) return;
      if (!error) {
        setRows((data ?? []) as LoanDueRow[]);
        setTotal(counted ?? 0);
      }
      setLoading(false);
    };

    const timer = setTimeout(run, query ? 260 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [supabase, query, branch, loanType, sort, page, pageSize]);

  const dirty = Boolean(query || branch || loanType || sort !== "total_due.desc");

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search borrower, account no, branch…"
        />
        <FilterSelect
          label="Branch"
          value={branch}
          onChange={setBranch}
          options={[
            { value: "", label: "All branches" },
            ...branches.map((item) => ({ value: item, label: item })),
          ]}
        />
        <FilterSelect
          label="Scheme"
          value={loanType}
          onChange={setLoanType}
          options={[
            { value: "", label: "All schemes" },
            ...loanTypes.map((item) => ({ value: item, label: item })),
          ]}
        />
        <FilterSelect
          label="Sort"
          value={sort}
          onChange={setSort}
          options={SORTS}
        />
        {dirty ? (
          <button
            type="button"
            className="btn py-1.5 text-[0.76rem]"
            onClick={() => {
              setQuery("");
              setBranch("");
              setLoanType("");
              setSort("total_due.desc");
            }}
          >
            Reset
          </button>
        ) : null}
      </div>

      <p className="hidden border-b border-line-soft px-4 py-2 text-[0.66rem] text-muted md:block">
        Scroll sideways for instalment, interest, other dues, provision and ageing
        dates.
      </p>
      <div className="table-wrap hidden md:block">
        <table className="dt">
          <thead>
            <tr>
              <th className="sticky-col min-w-[15rem]">Borrower</th>
              <th>Branch</th>
              <th>Scheme</th>
              <th className="text-right">Loan amount</th>
              <th className="text-right">Rate</th>
              <th>Loan date</th>
              <th>Due date</th>
              <th className="text-right">Instalment</th>
              <th className="text-right">Interest</th>
              <th className="text-right">Other</th>
              <th className="text-right">Total due</th>
              <th className="text-right">Provision</th>
              <th className="text-right">Due no</th>
              <th>Last inst.</th>
              <th>NPA date</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <LoadingRows columns={15} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-4 py-10 text-center text-[0.82rem] text-muted">
                  No accounts match these filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="sticky-col">
                    <Link
                      href={`/account/${row.acc_no ?? ""}`}
                      className="block max-w-[16rem] truncate text-[0.82rem] text-ink hover:text-sage-deep hover:underline hover:decoration-line hover:underline-offset-4"
                    >
                      {row.name ?? "—"}
                    </Link>
                    <span className="num block text-[0.68rem] text-muted">
                      {row.acc_no ?? "—"}
                    </span>
                  </td>
                  <td className="max-w-[9rem] truncate">{row.branch ?? "—"}</td>
                  <td className="max-w-[9rem] truncate">{row.loan_type ?? "—"}</td>
                  <td className="num text-right">{money(row.loan_amt)}</td>
                  <td className="num text-right">{row.rate ? pct(row.rate, 2) : "—"}</td>
                  <td className="num">{day(row.loan_date)}</td>
                  <td className="num">{day(row.due_date)}</td>
                  <td className="num text-right">{money(row.due_inst)}</td>
                  <td className="num text-right">{money(row.due_int)}</td>
                  <td className="num text-right">{money(row.due_other)}</td>
                  <td className="num text-right font-medium text-ink">
                    {money(row.total_due)}
                  </td>
                  <td className="num text-right">{money(row.provision)}</td>
                  <td className="num text-right">
                    {row.due_no === null ? "—" : count(Math.round(row.due_no))}
                  </td>
                  <td className="num">{day(row.last_inst_date)}</td>
                  <td className="num">{day(row.npa_date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line-soft md:hidden">
        {loading && rows.length === 0
          ? Array.from({ length: 5 }).map((_, index) => (
              <li key={index} className="px-4 py-4">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton mt-2 h-3 w-1/2" />
              </li>
            ))
          : rows.map((row) => (
              <li key={row.id}>
                <Link href={`/account/${row.acc_no ?? ""}`} className="block px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[0.86rem] text-ink">{row.name ?? "—"}</p>
                      <p className="num mt-0.5 text-[0.68rem] text-muted">
                        {row.acc_no ?? "—"} · {row.branch ?? "—"}
                      </p>
                    </div>
                    <p className="num shrink-0 text-[0.86rem] text-ink">
                      {compactMoney(row.total_due)}
                    </p>
                  </div>
                  <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[0.68rem] text-muted">
                    <span>{row.loan_type ?? "—"}</span>
                    <span className="num">Due {day(row.due_date)}</span>
                    <span className="num">Loan {compactMoney(row.loan_amt)}</span>
                  </p>
                </Link>
              </li>
            ))}
        {!loading && rows.length === 0 ? (
          <li className="px-4 py-10 text-center text-[0.82rem] text-muted">
            No accounts match these filters.
          </li>
        ) : null}
      </ul>

      <Pager
        page={page}
        pageSize={pageSize}
        total={total}
        onPage={setPage}
        onPageSize={setPageSize}
        loading={loading}
      />
    </div>
  );
}
