"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import type { TradeLogEntry } from "@/components/trade-builder-app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildTaxReport, isTradeDate, taxTradeRecord, type ExecutionField } from "@/lib/trade-tax-report";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const quantityFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 });
const priceFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 });

export function TradeExecutionFields({
  entry, onChange,
}: {
  entry: TradeLogEntry;
  onChange: (id: string, field: ExecutionField, value: string) => void;
}) {
  const { issues } = taxTradeRecord(entry);
  const now = new Date();
  const maxDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return (
    <fieldset className="space-y-2 rounded-md border p-3">
      <legend className="px-1 text-xs font-medium">Advanced details · Actual execution</legend>
      <p className="text-xs text-muted-foreground">
        Enter broker-confirmed fills, not planned values. Use one log entry per fully closed lot;
        split partial fills or multiple lots into separate records before using this report.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {([
          ["openedOn", "Actual opening date", "date"],
          ["closedOn", "Actual closing date", "date"],
          ["actualEntryPrice", "Actual opening price ($)", "number"],
          ["actualQuantity", "Actual shares", "number"],
        ] as const).map(([field, label, type]) => (
          <label key={field} className="space-y-1">
            <span className="text-xs font-medium">{label}</span>
            <Input
              aria-label={`${label} for ${entry.ticker}`}
              type={type}
              min={type === "number" ? "0" : undefined}
              max={type === "date" ? maxDate : undefined}
              step={type === "number" ? "any" : undefined}
              className={type === "date" ? "dark:scheme:light" : undefined}
              value={entry[field] ?? ""}
              onChange={(event) => onChange(entry.id, field, event.target.value)}
            />
          </label>
        ))}
      </div>
      {issues.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Excluded from tax report until complete: {issues.join(" ")}
        </p>
      ) : null}
    </fieldset>
  );
}

export function TradeTaxReport({ entries }: { entries: TradeLogEntry[] }) {
  const currentYear = String(new Date().getFullYear());
  const [year, setYear] = useState(currentYear);
  const [printError, setPrintError] = useState("");
  const years = [...new Set([currentYear, year, ...entries.flatMap((entry) =>
    isTradeDate(entry.closedOn) ? [entry.closedOn.slice(0, 4)] : [],
  )])].sort().reverse();
  const report = buildTaxReport(entries, year);
  const hasRows = report.rows.length > 0;

  useEffect(() => {
    const reset = () => { delete document.body.dataset.printReport; };
    window.addEventListener("afterprint", reset);
    return () => {
      window.removeEventListener("afterprint", reset);
      reset();
    };
  }, []);

  const print = () => {
    setPrintError("");
    document.body.dataset.printReport = "trade-log";
    try {
      window.print();
    } catch {
      delete document.body.dataset.printReport;
      setPrintError("Printing could not be opened. Check your browser settings and try again.");
    }
  };

  return (
    <section aria-label="Tax supporting report" className="mb-5 space-y-3 rounded-md border p-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-xs font-medium">
          <span className="block">Closing year</span>
          <select aria-label="Closing year" value={year} onChange={(event) => setYear(event.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm">
            {years.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <Button variant="outline" size="sm" onClick={print}>
          <Printer aria-hidden />Print trade log / Save as PDF
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        U.S. tax supporting record in USD, filtered by actual closing date. Uses actual execution
        values, not the planned values used by Realized performance. Blank fees mean $0.
        Not an IRS Form 8949, Schedule D, or a substitute for your broker&apos;s 1099-B.
        Reconcile wash sales, adjusted basis, holding periods, and short-sale reporting with your broker or tax preparer.
      </p>
      <p className="text-xs">
        {report.rows.length} complete closed trades in {year}. Open trades excluded: {report.openCount}.
        Trades closed in other years excluded: {report.otherYearCount}.
      </p>
      {report.problems.length > 0 ? (
        <div role="status" className="space-y-1 text-xs text-destructive">
          <p>Incomplete closed trades are excluded from the tax report until their actual execution details are complete.</p>
          <ul className="list-inside list-disc">
            {report.problems.map((problem) => (
              <li key={problem.id}>{problem.ticker}: {problem.issues.join(" ")}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {!report.rows.length && !report.problems.length ? (
        <p className="text-xs text-muted-foreground">No closed trades to print for this year.</p>
      ) : null}
      {printError ? <p role="alert" className="text-xs text-destructive">{printError}</p> : null}
      <article className="trade-log-print" aria-label="Printable trade log">
        <header>
          <h1>Trade Builder - {year} closed trade log</h1>
          <p>U.S. tax supporting record | USD | Generated {new Date().toLocaleDateString("en-US")}</p>
          <p>{report.rows.length} closed trades | Open trades excluded: {report.openCount} | Other closing years excluded: {report.otherYearCount}</p>
        </header>
        {hasRows ? (
          <>
            <table>
              <caption>Actual execution details, ordered by closing date</caption>
              <thead>
                <tr>{["Ticker / side", "Opened / closed", "Shares", "Open / exit price", "Gross proceeds", "Purchase cost", "Fees", "Net P&L"].map((label) =>
                  <th key={label} scope="col">{label}</th>,
                )}</tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{row.ticker} <br />{row.direction === "long" ? "Long" : "Short"}</th>
                    <td>{row.openedOn} <br />{row.closedOn}</td>
                    <td>{quantityFormat.format(row.quantity)}</td>
                    <td>${priceFormat.format(row.openingPrice)} <br />${priceFormat.format(row.closingPrice)}</td>
                    <td>{usd.format(row.grossProceeds)}</td><td>{usd.format(row.purchaseCost)}</td>
                    <td>{usd.format(row.fees)}</td><td>{usd.format(row.netPnl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="trade-log-totals">
              Totals: Gross proceeds {usd.format(report.totals.grossProceeds)} |
              Purchase cost {usd.format(report.totals.purchaseCost)} |
              Fees {usd.format(report.totals.fees)} |
              Net P&amp;L {usd.format(report.totals.netPnl)}
            </p>
          </>
        ) : <p>No complete closed trade records are available for this year.</p>}
        <footer>
          <p>Net P&amp;L = gross proceeds - purchase cost - total round-trip fees. Amounts are rounded to cents per trade.
            Long: proceeds are the closing sale; cost is the opening purchase.
            Short: proceeds are the opening sale; cost is the closing cover purchase.
            Dates are opening/closing trade dates, not Form 8949 acquired/sold fields for short sales.</p>
          <p>This report assumes each record is one fully closed lot and all amounts are USD.
            It is not IRS Form 8949, Schedule D, a 1099-B substitute, or a calculation of taxable gain.
            Wash-sale adjustments, basis adjustments, corporate actions, dividends, and short-sale
            tax timing rules are not calculated. Reconcile with broker statements and your tax preparer.</p>
        </footer>
      </article>
    </section>
  );
}
