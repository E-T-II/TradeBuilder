// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TradeBuilderApp, normalizeForm, toInputs, type TradeLogEntry } from "@/components/trade-builder-app";
import { buildTrade } from "@/lib/trade-builder";
import { FORM_STORAGE_KEY, TRADE_LOG_STORAGE_KEY, createTradeBackup, parseTradeBackup } from "@/lib/trade-backup";
import { CURRENCY_STORAGE_KEY, RATES_STORAGE_KEY, type DisplayRate } from "@/lib/display-currency";

const setup = normalizeForm({
  ticker: "NVDA", accountBalance: "2500", atr: "4",
  curveLow: "100", curveHigh: "130", demandHigh: "108", demandLow: "106",
  supplyHigh: "126", supplyLow: "124", strength: "2", time: "1", freshness: "2",
});
const rate = (): DisplayRate => ({
  currency: "EUR", rate: 0.9, asOf: new Date().toISOString().slice(0, 10),
  checkedAt: new Date().toISOString(), source: "Frankfurter",
});
afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("rate refresh changes display only; logged, printed, restored, and calendar P&L retain saved rates", async () => {
  window.localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(setup));
  window.localStorage.setItem(CURRENCY_STORAGE_KEY, "EUR");
  const saved = rate();
  window.localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify([saved]));
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify([
    { base: "USD", quote: "EUR", rate: 0.8, date: saved.asOf },
  ])));
  vi.stubGlobal("fetch", fetcher);
  const user = userEvent.setup();
  const { unmount } = render(<TradeBuilderApp />);
  const inputs = toInputs(setup);
  if (!inputs) throw new Error("Test requires valid inputs.");
  const expected = buildTrade(inputs).order;
  if (!expected) throw new Error("Test requires an executable order.");
  expect(screen.getByLabelText("Account balance ($)")).toHaveValue("2,500");
  for (let i = 0; i < 4; i++) await user.click(screen.getByRole("button", { name: /^next$/i }));
  await user.click(screen.getByRole("button", { name: /see my trade/i }));
  await user.click(screen.getByRole("button", { name: "Log trade" }));
  const readLog = (): TradeLogEntry[] => JSON.parse(window.localStorage.getItem(TRADE_LOG_STORAGE_KEY)!);
  const logged = readLog()[0];
  expect(logged).toMatchObject({
    entry: expected.entry, stop: expected.stop, target: expected.target,
    positionSize: expected.positionSize, totalTradeRisk: expected.totalTradeRisk,
    capitalRequirement: expected.capitalRequirement, displayRate: saved, form: setup,
  });
  await user.click(screen.getByRole("radio", { name: "Closed" }));
  await user.click(screen.getByRole("button", { name: new RegExp(`NVDA \\| Buy ${expected.positionSize} shares`) }));
  fireEvent.change(screen.getByRole("spinbutton", { name: "Profit/Loss for NVDA" }), { target: { value: "100" } });
  fireEvent.change(screen.getByLabelText("Closing date for NVDA"), { target: { value: saved.asOf } });
  await user.click(screen.getByRole("button", { name: "Close NVDA trade details" }));
  const historical = readLog();
  await user.click(screen.getByRole("button", { name: "Display currency" }));
  await user.click(screen.getByRole("button", { name: "Refresh rates" }));
  await waitFor(() => expect(within(screen.getByRole("dialog")).getByText("1 USD = 0.8 EUR")).toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(readLog()).toEqual(historical);
  expect(toInputs(setup)).toEqual(inputs);
  const report = screen.getByRole("article", { name: "Printable trade log" });
  expect(report).toHaveTextContent("+$100.00 (≈ +EUR 90.00)");
  expect(report).not.toHaveTextContent("EUR 80.00");
  expect(parseTradeBackup(createTradeBackup(setup, historical)).tradeLog).toEqual(historical);
  await user.click(screen.getByRole("button", { name: "P&L Analysis" }));
  expect(within(screen.getByRole("dialog")).getByRole("cell", {
    name: `${saved.asOf}: +$100.00 (≈ +EUR 90.00), 1 trade`,
  })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close P&L Analysis" }));
  await user.click(screen.getByRole("button", { name: "Display currency" }));
  await user.selectOptions(screen.getByRole("combobox"), "USD");
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(report).toHaveTextContent("+$100.00 (≈ +EUR 90.00)");
  expect(readLog()).toEqual(historical);
  unmount();
  render(<TradeBuilderApp />);
  for (let i = 0; i < 4; i++) await user.click(screen.getByRole("button", { name: /^next$/i }));
  await user.click(screen.getByRole("button", { name: /see my trade/i }));
  expect(screen.getByRole("article", { name: "Printable trade log" })).toHaveTextContent("+EUR 90.00");
});

test("an invalid saved rate is reported and the original log cannot be overwritten", async () => {
  const inputs = toInputs(setup);
  if (!inputs) throw new Error("Test requires inputs.");
  const order = buildTrade(inputs).order;
  if (!order) throw new Error("Test requires order.");
  const damaged = JSON.stringify([{
    id: "damaged", ticker: "NVDA", createdAt: new Date().toISOString(), direction: "long",
    ...order, score: 9, isOpen: true, displayRate: { ...rate(), rate: -1 },
  }]);
  window.localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(setup));
  window.localStorage.setItem(TRADE_LOG_STORAGE_KEY, damaged);
  const user = userEvent.setup();
  render(<TradeBuilderApp />);
  expect(screen.getByRole("alert")).toHaveTextContent("invalid exchange rate");
  for (let i = 0; i < 4; i++) await user.click(screen.getByRole("button", { name: /^next$/i }));
  await user.click(screen.getByRole("button", { name: /see my trade/i }));
  await user.click(screen.getByRole("button", { name: "Log trade" }));
  expect(window.localStorage.getItem(TRADE_LOG_STORAGE_KEY)).toBe(damaged);
});
