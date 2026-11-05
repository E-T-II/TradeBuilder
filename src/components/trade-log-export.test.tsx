// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TradeLogExport } from "@/components/trade-log-export";
import { realizedOutcome, type TradeLogEntry } from "@/components/trade-builder-app";

const entry: TradeLogEntry = {
  id: "one", createdAt: "2026-09-01T12:00:00Z", ticker: "TEST", direction: "long",
  entry: 108, stop: 106, target: 120, positionSize: 10, capitalRequirement: 1080,
  totalTradeRisk: 20, rewardRisk: 6, score: 9, isOpen: false,
};
const rows = (entries: TradeLogEntry[]) => entries.map((item) => ({
  ...item, realizedPnl: realizedOutcome(item),
}));

afterEach(() => {
  vi.restoreAllMocks();
  delete document.body.dataset.printReport;
});

test("prints all trades with notes and the same realized outcomes as performance", async () => {
  const user = userEvent.setup();
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  render(<TradeLogExport entries={rows([
    { ...entry, profitLoss: "-35.47", closedOn: "2026-09-02", notes: "Waited for setup\nClosed manually",
      openedOn: "2026-09-01", actualEntryPrice: "108.25", actualQuantity: "10.5" },
    { ...entry, id: "two", ticker: "SHORT", direction: "short", exitPrice: "106", fees: "2" },
    { ...entry, id: "three", ticker: "OPEN", isOpen: true, profitLoss: "500" },
    { ...entry, id: "four", ticker: "UNFINISHED" },
  ])} />);
  const report = screen.getByRole("article", { name: "Printable trade log" });
  expect(within(report).getAllByRole("rowheader")).toHaveLength(4);
  expect(report).toHaveTextContent("Net P&L -$17.47");
  expect(report).toHaveTextContent("1 open");
  expect(report).toHaveTextContent("2 completed with P&L");
  expect(report).toHaveTextContent("2026-09-02");
  expect(report).toHaveTextContent("Actual opening price: $108.25");
  expect(report).toHaveTextContent("Actual shares: 10.5");
  expect(report).toHaveTextContent("Notes: Waited for setup Closed manually");
  expect(report).not.toHaveTextContent("$500.00");
  await user.click(screen.getByRole("button", { name: "Print / Save PDF" }));
  expect(print).toHaveBeenCalledOnce();
  expect(document.body.dataset.printReport).toBe("trade-log");
  fireEvent(window, new Event("afterprint"));
  expect(document.body.dataset.printReport).toBeUndefined();
});

test("reports print errors and clears the print target before retrying", async () => {
  const user = userEvent.setup();
  const print = vi.spyOn(window, "print").mockImplementation(() => { throw new Error("Unavailable"); });
  const { unmount } = render(<TradeLogExport entries={rows([entry])} />);
  await user.click(screen.getByRole("button", { name: "Print / Save PDF" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Printing could not be opened");
  expect(document.body.dataset.printReport).toBeUndefined();
  print.mockImplementation(() => {});
  await user.click(screen.getByRole("button", { name: "Print / Save PDF" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(document.body.dataset.printReport).toBe("trade-log");
  unmount();
  expect(document.body.dataset.printReport).toBeUndefined();
});
