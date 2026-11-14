-- Aggregation views the dashboard reads (fast, no client-side grouping)

create or replace view public.v_summary as
select
  (select count(*) from public.loan_due)                              as loan_due_rows,
  (select coalesce(sum(total_due), 0) from public.loan_due)           as total_due,
  (select coalesce(sum(loan_amt), 0) from public.loan_due)            as loan_amt,
  (select count(distinct branch) from public.loan_due)                as branch_count,
  (select count(*) from public.npa_accounts)                          as npa_rows,
  (select coalesce(sum(npa_amount), 0) from public.npa_accounts)      as npa_amount,
  (select coalesce(sum(balance), 0) from public.npa_accounts)         as npa_balance,
  (select coalesce(sum(loan_amount), 0) from public.npa_accounts)     as npa_loan_amount,
  (select count(distinct npa_type) from public.npa_accounts)          as npa_type_count,
  (select count(distinct gl_name) from public.npa_accounts)           as product_count,
  (select max(imported_at) from public.datasets)                      as last_import;

create or replace view public.v_npa_by_type as
select npa_type,
       count(*)::int          as accounts,
       coalesce(sum(balance), 0)    as balance,
       coalesce(sum(npa_amount), 0) as npa_amount,
       coalesce(sum(loan_amount), 0) as loan_amount
from public.npa_accounts
group by npa_type
order by npa_amount desc;

create or replace view public.v_npa_by_product as
select gl_name,
       count(*)::int                  as accounts,
       coalesce(sum(balance), 0)      as balance,
       coalesce(sum(npa_amount), 0)   as npa_amount
from public.npa_accounts
group by gl_name
order by npa_amount desc;

create or replace view public.v_npa_by_branch as
select br_name,
       count(*)::int                as accounts,
       coalesce(sum(balance), 0)    as balance,
       coalesce(sum(npa_amount), 0) as npa_amount
from public.npa_accounts
group by br_name
order by npa_amount desc;

create or replace view public.v_loan_due_by_branch as
select branch,
       count(*)::int                as accounts,
       coalesce(sum(total_due), 0)  as total_due,
       coalesce(sum(loan_amt), 0)   as loan_amt,
       coalesce(sum(due_int), 0)    as due_int
from public.loan_due
group by branch
order by total_due desc;

create or replace view public.v_loan_due_by_type as
select loan_type,
       count(*)::int                as accounts,
       coalesce(sum(total_due), 0)  as total_due,
       coalesce(sum(loan_amt), 0)   as loan_amt
from public.loan_due
group by loan_type
order by total_due desc;

create or replace view public.v_filter_options as
select
  (select json_agg(distinct branch order by branch) from public.loan_due)     as loan_branches,
  (select json_agg(distinct loan_type order by loan_type) from public.loan_due) as loan_types,
  (select json_agg(distinct br_name order by br_name) from public.npa_accounts) as npa_branches,
  (select json_agg(distinct npa_type order by npa_type) from public.npa_accounts) as npa_types,
  (select json_agg(distinct gl_name order by gl_name) from public.npa_accounts)  as npa_products;

grant select on public.v_summary,
                public.v_npa_by_type,
                public.v_npa_by_product,
                public.v_npa_by_branch,
                public.v_loan_due_by_branch,
                public.v_loan_due_by_type,
                public.v_filter_options
  to anon, authenticated;
