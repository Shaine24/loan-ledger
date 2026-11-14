# Loan Ledger

A quiet, pale dashboard for the consolidated **loan due** and **NPA account** sheets —
balances, provisions, classification, ageing and branch exposure.

- Next.js 16 (App Router, TypeScript, Tailwind v4)
- Supabase for data (Postgres + PostgREST, public read-only views)
- Vercel for hosting
- GitHub for source

## Pages

- `/` — position summary: totals, NPA classification donut, branch and product exposure
- `/loan-dues` — every account with outstanding instalment / interest / other dues, searchable and filterable
- `/npa` — every NPA account with class, balance, provision %, dates, searchable and filterable
- `/account/[accNo]` — full account card combining both sheets

## Data

Two Supabase tables hold the consolidated sheets:

- `public.loan_due` ← `LoanDueConsolidated.xls`
- `public.npa_accounts` ← `Consolidated_Npa_Account.xls`
- `public.datasets` ← one row per import (source file, row count, total, timestamp)

Aggregation views (`v_summary`, `v_npa_by_type`, `v_npa_by_branch`, `v_npa_by_product`,
`v_loan_due_by_branch`, `v_loan_due_by_type`, `v_filter_options`) feed the dashboard.
RLS is on with a public `select` policy; the browser only ever holds the anon key.

## Refreshing when a new sheet arrives

1. Convert the exports to CSV (handles both BIFF `.xls` and the HTML-flavoured `.xls`):

```bash
python3 scripts/convert_sheets.py --loan-due LoanDueConsolidated.xls \
    --npa Consolidated_Npa_Account.xls --out converted
```

2. Push it into Supabase — the importer truncates and reloads, then stamps `datasets`:

```bash
python3 scripts/import_data.py --loan-due converted/loan_due.csv \
    --npa converted/npa_accounts.csv
```

3. Pages are rendered per request (`force-dynamic`), so no redeploy is needed — reload the site.

`xlrd` (for BIFF `.xls`) is the only extra requirement: `python3 -m pip install --user xlrd`.

## Deploying

```bash
vercel --prod
```

The Vercel project is linked to this folder (`shaine24/loan-ledger`). Pushing to GitHub does
not auto-deploy yet — the Vercel GitHub app needs to be installed on the account first.

Environment (`.env.local` locally, project env vars on Vercel):

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

## Local development

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build && pnpm start
```

## Scripts

- `scripts/schema.sql` — tables, indexes, RLS policies
- `scripts/views.sql` — aggregation views and grants
- `scripts/import_data.py` — CSV → Supabase importer (chunked inserts, date normalisation)

## Design notes

Warm ivory paper, sage and sand accents, hairline rules, and a serif display face
(Instrument Serif) over Inter for figures. Amounts render in Indian numbering
(lakh / crore). Tables paginate 25/50/100 rows server-side and switch to cards on phones.
