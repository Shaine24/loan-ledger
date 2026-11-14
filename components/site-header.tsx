"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Overview" },
  { href: "/loan-dues", label: "Loan dues" },
  { href: "/npa", label: "NPA accounts" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="shell flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 py-2.5 sm:h-16 sm:flex-nowrap sm:py-0">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-sage-deep text-[0.78rem] font-medium text-paper">
            LL
          </span>
          <span className="leading-tight">
            <span className="block whitespace-nowrap font-display text-[1.02rem] text-ink sm:text-[1.05rem]">
              Loan Ledger
            </span>
            <span className="hidden whitespace-nowrap text-[0.62rem] uppercase tracking-[0.14em] text-muted sm:block">
              NPA &amp; due consolidation
            </span>
          </span>
        </Link>

        <nav className="flex w-full items-center gap-1 overflow-x-auto pb-0.5 sm:w-auto sm:overflow-visible sm:pb-0">
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="nav-pill text-[0.8rem] sm:text-[0.83rem]"
                data-active={active}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
