import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Loan Ledger — NPA & Loan Due Consolidation",
  description:
    "A quiet dashboard for the consolidated loan due and NPA account sheets: balances, provisions, classification and branch exposure.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrument.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1 pb-20">{children}</main>
        <footer className="border-t border-line/80 py-8">
          <div className="shell flex flex-col gap-3 text-[0.75rem] text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              Loan Ledger · figures read live from Supabase, refreshed each time a
              consolidated sheet is shared.
            </p>
            <p className="num">Amounts in INR · as reported in the source sheets</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
