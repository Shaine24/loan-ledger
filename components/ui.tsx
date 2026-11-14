"use client";

import type { ReactNode } from "react";

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-0 flex-1 basis-[15rem]">
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      >
        <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="m13.2 13.2 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field pl-9"
        aria-label={placeholder}
      />
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className="field w-auto min-w-0 max-w-full flex-1 basis-[8.5rem] cursor-pointer text-[0.8rem] sm:text-[0.86rem]"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Pager({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
  loading,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  loading: boolean;
}) {
  const start = total === 0 ? 0 : page * pageSize + 1;
  const end = Math.min(total, page * pageSize + pageSize);
  const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);

  return (
    <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="num text-[0.74rem] text-muted">
        {start.toLocaleString("en-IN")}–{end.toLocaleString("en-IN")} of{" "}
        {total.toLocaleString("en-IN")}
      </p>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(event) => onPageSize(Number(event.target.value))}
          className="field w-auto cursor-pointer py-1 text-[0.76rem]"
          aria-label="Rows per page"
        >
          {[25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} rows
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn py-1.5 text-[0.76rem]"
          onClick={() => onPage(Math.max(0, page - 1))}
          disabled={page === 0 || loading}
        >
          Prev
        </button>
        <button
          type="button"
          className="btn py-1.5 text-[0.76rem]"
          onClick={() => onPage(Math.min(lastPage, page + 1))}
          disabled={page >= lastPage || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function CardShell({ children }: { children: ReactNode }) {
  return <div className="card overflow-hidden">{children}</div>;
}

export function LoadingRows({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 8 }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((__, cellIndex) => (
            <td key={cellIndex} className="px-3 py-3">
              <div className="skeleton h-3 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
