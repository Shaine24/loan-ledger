#!/usr/bin/env python3
"""
Convert the two consolidated Excel exports into the CSVs the importer expects.

Handles both formats this ledger receives:
  * BIFF .xls  (real Excel workbook)        -> read with xlrd
  * HTML .xls  (a table saved as .xls)      -> parsed from the <tr>/<td> markup

Usage:
  python3 scripts/convert_sheets.py --loan-due LoanDueConsolidated.xls \
      --npa Consolidated_Npa_Account.xls --out ./converted

Writes loan_due.csv / npa_accounts.csv (any subset you pass).
"""
from __future__ import annotations

import argparse
import csv
import html
import os
import re
import sys

LOAN_DUE_HEADER = [
    "Branch", "LoanType", "SrNo", "AccNo", "Name", "LoanDate", "LoanAmt", "Rate",
    "DueDate", "Provision", "DueNo", "LastInstDate", "NPADate", "DueInst", "DueInt",
    "DueOther", "TotalDue",
]


def looks_like_html(path: str) -> bool:
    with open(path, "rb") as handle:
        head = handle.read(2048).lower()
    return b"<html" in head or b"<table" in head or b"<tr" in head


def read_html_table(path: str) -> tuple[list[str], list[list[str]]]:
    raw = open(path, "rb").read()
    text = raw.decode("cp1252", errors="replace")
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", text, re.S | re.I)

    def cells(row: str) -> list[str]:
        out = []
        for match in re.finditer(r"<t[hd][^>]*>(.*?)</t[hd]>", row, re.S | re.I):
            value = re.sub(r"<[^>]+>", "", match.group(1))
            out.append(html.unescape(value).replace("\xa0", " ").strip())
        return out

    if not rows:
        raise SystemExit(f"No table rows found in {path}")
    header = cells(rows[0])
    body = [cells(r) for r in rows[1:]]
    body = [r for r in body if len(r) >= len(header)]
    return header, body


def read_biff(path: str) -> tuple[list[str], list[list[str]]]:
    try:
        import xlrd  # noqa: PLC0415
    except ImportError:
        raise SystemExit(
            "xlrd is required for BIFF .xls files: python3 -m pip install --user xlrd"
        )

    sheet = xlrd.open_workbook(path).sheet_by_index(0)
    grid = [[_cell(cell) for cell in sheet.row_values(r)] for r in range(sheet.nrows)]
    # header is the first row that contains a known column name
    for index, row in enumerate(grid[:10]):
        joined = " ".join(str(cell) for cell in row).lower()
        if "accno" in joined.replace(" ", "") or "acc name" in joined:
            return [str(cell) for cell in row], grid[index + 1:]
    return [str(cell) for cell in grid[0]], grid[1:]


def _cell(value) -> str:
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def normalise_loan_due(rows: list[list[str]]) -> list[list[str]]:
    """The loan due export repeats a branch block header above each branch and a
    scheme header above each scheme. Carry both downward and keep data rows only."""
    out: list[list[str]] = []
    branch = ""
    scheme = ""
    for row in rows:
        if not row:
            continue
        padded = list(row) + [""] * (17 - len(row))
        first = str(padded[0]).strip()
        second = str(padded[1]).strip()
        if first.lower().startswith("branch"):
            branch = second or first.split(":", 1)[-1].strip()
            scheme = ""
            continue
        if not re.fullmatch(r"[\d.]+", first.replace(",", "")):
            continue
        if not re.fullmatch(r"[\d.]+", second.replace(",", "")):
            scheme = second
            continue
        out.append([branch, scheme, first.replace(".0", ""), second.replace(".0", ""),
                    *padded[2:15]])
    return out


def write_csv(path: str, header: list[str], rows: list[list[str]]) -> int:
    with open(path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(header)
        writer.writerows(rows)
    return len(rows)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--loan-due", help="Loan due consolidated .xls")
    parser.add_argument("--npa", help="Consolidated NPA account .xls")
    parser.add_argument("--out", default="converted", help="output directory")
    args = parser.parse_args()

    if not args.loan_due and not args.npa:
        parser.error("pass --loan-due and/or --npa")

    os.makedirs(args.out, exist_ok=True)
    jobs = [
        (args.loan_due, "loan_due.csv", LOAN_DUE_HEADER),
        (args.npa, "npa_accounts.csv", None),
    ]

    for source, filename, fallback_header in jobs:
        if not source:
            continue
        if looks_like_html(source):
            header, rows = read_html_table(source)
        else:
            header, rows = read_biff(source)
            # the loan due export has a title block; keep only data columns
            if fallback_header and len(header) < len(fallback_header):
                header = fallback_header
        if filename == "loan_due.csv":
            rows = normalise_loan_due(rows)
            if fallback_header:
                header = fallback_header
        if fallback_header and filename == "loan_due.csv" and len(header) != len(fallback_header):
            print(f"! {source}: header has {len(header)} columns, expected {len(fallback_header)}",
                  file=sys.stderr)
        count = write_csv(os.path.join(args.out, filename), header, rows)
        print(f"{source} -> {os.path.join(args.out, filename)} ({count} rows, {len(header)} cols)")


if __name__ == "__main__":
    main()
