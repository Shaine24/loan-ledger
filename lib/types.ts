export type Summary = {
  loan_due_rows: number;
  total_due: number;
  loan_amt: number;
  branch_count: number;
  npa_rows: number;
  npa_amount: number;
  npa_balance: number;
  npa_loan_amount: number;
  npa_type_count: number;
  product_count: number;
  last_import: string | null;
};

export type TypeBucket = {
  npa_type: string;
  accounts: number;
  balance: number;
  npa_amount: number;
  loan_amount: number;
};

export type ProductBucket = {
  gl_name: string;
  accounts: number;
  balance: number;
  npa_amount: number;
};

export type BranchBucket = {
  br_name: string;
  accounts: number;
  balance: number;
  npa_amount: number;
};

export type DueBranchBucket = {
  branch: string;
  accounts: number;
  total_due: number;
  loan_amt: number;
  due_int: number;
};

export type DueTypeBucket = {
  loan_type: string;
  accounts: number;
  total_due: number;
  loan_amt: number;
};

export type FilterOptions = {
  loan_branches: string[] | null;
  loan_types: string[] | null;
  npa_branches: string[] | null;
  npa_types: string[] | null;
  npa_products: string[] | null;
};

export type LoanDueRow = {
  id: number;
  branch: string | null;
  loan_type: string | null;
  sr_no: string | null;
  acc_no: string | null;
  name: string | null;
  loan_date: string | null;
  loan_amt: number | null;
  rate: number | null;
  due_date: string | null;
  provision: number | null;
  due_no: number | null;
  last_inst_date: string | null;
  npa_date: string | null;
  due_inst: number | null;
  due_int: number | null;
  due_other: number | null;
  total_due: number | null;
};

export type NpaRow = {
  id: number;
  secured: string | null;
  npa_type_id: number | null;
  npa_type: string | null;
  gl_code: string | null;
  gl_name: string | null;
  acc_no: string | null;
  acc_name: string | null;
  loan_date: string | null;
  loan_amount: number | null;
  due_date: string | null;
  balance: number | null;
  provision: number | null;
  due_month: number | null;
  lst_inst_date: string | null;
  npa_date: string | null;
  due_inst: number | null;
  due_int: number | null;
  percentage: number | null;
  npa_amount: number | null;
  br_id: string | null;
  br_name: string | null;
  inst_amount: number | null;
  period_type: string | null;
  mobile_no: string | null;
  valuation: number | null;
  acc_no_str: string | null;
};

export type Dataset = {
  id: number;
  source_file: string;
  sheet_label: string;
  table_name: string;
  row_count: number;
  total_amount: number | null;
  imported_at: string;
};

export const NPA_COLORS: Record<string, string> = {
  "Doubtful Asset 3": "#3f5a49",
  "Doubtful Asset 1": "#6f8b74",
  "Doubtful Asset 2": "#a3b8a2",
  "Sub Standrad Asset": "#c9a86a",
  "Standard Asset": "#dcc0b2",
};

export function npaColor(name: string, index: number): string {
  const known = NPA_COLORS[name];
  if (known) return known;
  const fallback = ["#3f5a49", "#6f8b74", "#a3b8a2", "#c9a86a", "#dcc0b2", "#aec3d2"];
  return fallback[index % fallback.length];
}
