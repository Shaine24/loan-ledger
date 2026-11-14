#!/usr/bin/env python3
"""
Import the consolidated Excel exports into Supabase.

Usage:
  python3 scripts/import_data.py --loan-due path/to/loan_due.csv \
      --npa path/to/npa_accounts.csv

Each sheet is truncated and reloaded inside one transaction per chunk batch,
so re-running with a fresh export refreshes the site.

Dates arrive in two flavours (ISO yyyy-mm-dd and M/D/YYYY h:mm:ss AM/PM) and
are normalised to real DATE values; blanks become NULL.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import os
import shutil
import subprocess
import sys
import tempfile

PROJECT_REF = os.environ.get("SUPABASE_PROJECT_REF", "zzrraadqlnvhrnhlbknt")
CHUNK_ROWS = 700

LOAN_DUE_COLS = [
    ("Branch", "branch", "text"),
    ("LoanType", "loan_type", "text"),
    ("SrNo", "sr_no", "text"),
    ("AccNo", "acc_no", "text"),
    ("Name", "name", "text"),
    ("LoanDate", "loan_date", "date"),
    ("LoanAmt", "loan_amt", "num"),
    ("Rate", "rate", "num"),
    ("DueDate", "due_date", "date"),
    ("Provision", "provision", "num"),
    ("DueNo", "due_no", "num"),
    ("LastInstDate", "last_inst_date", "date"),
    ("NPADate", "npa_date", "date"),
    ("DueInst", "due_inst", "num"),
    ("DueInt", "due_int", "num"),
    ("DueOther", "due_other", "num"),
    ("TotalDue", "total_due", "num"),
]

NPA_COLS = [
    ("Secured", "secured", "text"),
    ("NpaTypeId", "npa_type_id", "int"),
    ("NpaType", "npa_type", "text"),
    ("GlCode", "gl_code", "text"),
    ("GlName", "gl_name", "text"),
    ("AccNo", "acc_no", "text"),
    ("AccName", "acc_name", "text"),
    ("LoanDate", "loan_date", "date"),
    ("LoanAmount", "loan_amount", "num"),
    ("DueDate", "due_date", "date"),
    ("Balance", "balance", "num"),
    ("Provsion", "provision", "num"),
    ("DueMonth", "due_month", "int"),
    ("LstInstDate", "lst_inst_date", "date"),
    ("NpaDate", "npa_date", "date"),
    ("DueInst", "due_inst", "num"),
    ("DueInt", "due_int", "num"),
    ("Percentage", "percentage", "num"),
    ("NpaAmount", "npa_amount", "num"),
    ("BrId", "br_id", "text"),
    ("BrName", "br_name", "text"),
    ("InstAmount", "inst_amount", "num"),
    ("PeriodType", "period_type", "text"),
    ("MobileNo", "mobile_no", "text"),
    ("Valuation", "valuation", "num"),
    ("AccNoStr", "acc_no_str", "text"),
]


def parse_date(raw: str) -> str | None:
    raw = (raw or "").strip()
    if not raw:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y %I:%M:%S %p", "%m/%d/%Y", "%d/%m/%Y",
                "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S"):
        try:
            return dt.datetime.strptime(raw, fmt).date().isoformat()
        except ValueError:
            continue
    try:  # Excel serial day number
        serial = float(raw)
        if 20000 < serial < 60000:
            return (dt.date(1899, 12, 30) + dt.timedelta(days=int(serial))).isoformat()
    except ValueError:
        pass
    return None


def clean(value: str, kind: str) -> str:
    raw = (value or "").strip()
    if raw == "" or raw.lower() in {"nan", "none", "null", "-"}:
        return "null"
    if kind == "date":
        parsed = parse_date(raw)
        return f"'{parsed}'" if parsed else "null"
    if kind in {"num", "int"}:
        try:
            number = float(raw.replace(",", ""))
        except ValueError:
            return "null"
        if kind == "int":
            return str(int(number))
        return repr(round(number, 4))
    return "'" + raw.replace("'", "''") + "'"


def run_sql_file(path: str) -> None:
    cmd = ["supabase", "db", "query", "-f", path, f"--remote={PROJECT_REF}", "--yes"]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        sys.stderr.write(proc.stdout + "\n" + proc.stderr + "\n")
        raise SystemExit(f"SQL failed: {path}")


def load_csv(path: str, table: str, cols, source_file: str, label: str) -> tuple[int, float]:
    with open(path, newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))

    db_cols = [c for _, c, _ in cols]
    header = ", ".join(db_cols)
    workdir = tempfile.mkdtemp(prefix=f"load-{table}-")
    total = 0.0
    amount_key = "TotalDue" if table == "loan_due" else "NpaAmount"

    try:
        # fresh load each time the sheet is re-shared
        truncate = os.path.join(workdir, "00-truncate.sql")
        with open(truncate, "w") as f:
            f.write(f"truncate table public.{table} restart identity;")
        run_sql_file(truncate)

        for start in range(0, len(rows), CHUNK_ROWS):
            chunk = rows[start:start + CHUNK_ROWS]
            body = []
            for row in chunk:
                values = ", ".join(clean(row.get(src, ""), kind) for src, _, kind in cols)
                body.append(f"({values})")
                try:
                    total += float((row.get(amount_key) or "0").replace(",", ""))
                except ValueError:
                    pass
            sql_path = os.path.join(workdir, f"{start:06d}.sql")
            with open(sql_path, "w") as f:
                f.write(f"insert into public.{table} ({header}) values\n")
                f.write(",\n".join(body))
                f.write(";")
            run_sql_file(sql_path)
            print(f"  {table}: {min(start + CHUNK_ROWS, len(rows))}/{len(rows)}", flush=True)

        meta = os.path.join(workdir, "99-meta.sql")
        esc_file = source_file.replace("'", "''")
        with open(meta, "w") as f:
            f.write(
                "delete from public.datasets where table_name = "
                f"'{table}';\n"
                "insert into public.datasets (source_file, sheet_label, table_name, row_count, total_amount) "
                f"values ('{esc_file}', '{label}', '{table}', {len(rows)}, {round(total, 2)});"
            )
        run_sql_file(meta)
    finally:
        shutil.rmtree(workdir, ignore_errors=True)

    return len(rows), total


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--loan-due", help="CSV converted from LoanDueConsolidated.xls")
    parser.add_argument("--npa", help="CSV converted from Consolidated_Npa_Account.xls")
    args = parser.parse_args()

    if not args.loan_due and not args.npa:
        parser.error("pass at least one of --loan-due / --npa")

    if args.loan_due:
        rows, total = load_csv(args.loan_due, "loan_due", LOAN_DUE_COLS,
                               os.path.basename(args.loan_due), "Loan Due Consolidated")
        print(f"loan_due: {rows} rows, total due {total:,.2f}")
    if args.npa:
        rows, total = load_csv(args.npa, "npa_accounts", NPA_COLS,
                               os.path.basename(args.npa), "Consolidated NPA Account")
        print(f"npa_accounts: {rows} rows, NPA amount {total:,.2f}")


if __name__ == "__main__":
    main()
