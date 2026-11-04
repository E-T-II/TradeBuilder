// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TradeLogEntry } from "@/components/trade-builder-app";
import { TradeExecutionFields, TradeTaxReport } from "@/components/trade-tax-report";

const entry: TradeLogEntry = {
  id: "one", createdAt: "2025-01-01T00:00:00Z", ticker: "TEST", direction: "long",
  entry: 10, stop: 9, target: 20, positionSize: 100, capitalRequirement: 1000,
  totalTradeRisk: 100, rewardRisk: 10, score: 9, isOpen: false,
  openedOn: "2025-12-30", closedOn: "2026-01-02", actualEntryPrice: "12.5",
  actualQuantity: "2.5", exitPrice: "15", fees: "1",
};

afterEach(() => {
  vi.restoreAllMocks();
  delete document.body.dataset.printReport;
});

test("prints only the selected closing year and resets the print target afterward", async () => {
  const user = userEvent.setup();
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  render(<TradeTaxReport entries={[entry, { ...entry, id: "old", ticker: "OLD", closedOn: "2025-12-31" }]} />);
  await user.selectOptions(screen.getByLabelText("Closing year"), "2026");
  const report = screen.getByRole("article", { name: "Printable trade log" });
  expect(within(report).getByRole("rowheader", { name: "TEST Long" })).toBeInTheDocument();
  expect(within(report).queryByText("OLD")).not.toBeInTheDocument();
  expect(within(report).getByText(/Totals:/)).toHaveTextContent("Net P&L $5.25");
  await user.click(screen.getByRole("button", { name: /Print trade log/ }));
  expect(print).toHaveBeenCalledOnce();
  expect(document.body.dataset.printReport).toBe("trade-log");
  fireEvent(window, new Event("afterprint"));
  expect(document.body.dataset.printReport).toBeUndefined();
  await user.selectOptions(screen.getByLabelText("Closing year"), "2025");
  expect(within(report).getByRole("rowheader", { name: "OLD Long" })).toBeInTheDocument();
  expect(within(report).queryByText("TEST")).not.toBeInTheDocument();
});

test("allows printing incomplete or empty reports and explains what is excluded", async () => {
  const user = userEvent.setup();
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  const { rerender } = render(<TradeTaxReport entries={[{ ...entry, closedOn: "" }]} />);
  expect(screen.getByRole("button", { name: /Print trade log/ })).toBeEnabled();
  expect(screen.getByRole("status")).toHaveTextContent("excluded from the tax report");
  await user.click(screen.getByRole("button", { name: /Print trade log/ }));
  expect(print).toHaveBeenCalledOnce();
  expect(within(screen.getByRole("article", { name: "Printable trade log" })).getByText(/No complete closed trade records/)).toBeInTheDocument();

  rerender(<TradeTaxReport entries={[]} />);
  expect(screen.getByRole("button", { name: /Print trade log/ })).toBeEnabled();
  expect(screen.getByText(/No closed trades to print/)).toBeInTheDocument();
});

test("reports print failure without leaving the log print target active", async () => {
  const user = userEvent.setup();
  vi.spyOn(window, "print").mockImplementation(() => { throw new Error("Unavailable"); });
  render(<TradeTaxReport entries={[entry]} />);
  await user.selectOptions(screen.getByLabelText("Closing year"), "2026");
  await user.click(screen.getByRole("button", { name: /Print trade log/ }));
  expect(screen.getByRole("alert")).toHaveTextContent("Printing could not be opened");
  expect(document.body.dataset.printReport).toBeUndefined();
});

test("execution fields report changes without filling in planned prices or dates", () => {
  const onChange = vi.fn();
  render(<TradeExecutionFields entry={{ ...entry, actualEntryPrice: undefined }} onChange={onChange} />);
  const today = new Date();
  const maxDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  expect(screen.getByLabelText("Actual opening price ($) for TEST")).toHaveValue(null);
  expect(screen.getByLabelText("Actual opening date for TEST")).toHaveClass("dark:scheme:light");
  expect(screen.getByLabelText("Actual closing date for TEST")).toHaveClass("dark:scheme:light");
  expect(screen.getByLabelText("Actual opening date for TEST")).toHaveAttribute("max", maxDate);
  expect(screen.getByLabelText("Actual closing date for TEST")).toHaveAttribute("max", maxDate);
  expect(screen.getByLabelText("Actual opening price ($) for TEST")).not.toHaveClass("dark:scheme:light");
  fireEvent.change(screen.getByLabelText("Actual opening date for TEST"), { target: { value: "2025-12-29" } });
  expect(onChange).toHaveBeenCalledWith("one", "openedOn", "2025-12-29");
});
