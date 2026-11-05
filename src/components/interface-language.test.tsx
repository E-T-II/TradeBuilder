// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "@/components/language-provider";
import { LanguageSelector } from "@/components/language-selector";
import { TradeForm } from "@/components/trade-form";
import { TradeBackupControls } from "@/components/trade-backup-controls";
import { TradeLogExport } from "@/components/trade-log-export";
import { PnlCalendar } from "@/components/pnl-calendar";
import { Disclaimer } from "@/lib/copy";
import type { FormState } from "@/components/trade-builder-app";
import { LANGUAGES, LANGUAGE_STORAGE_KEY } from "@/lib/languages";
import { translate, translateText } from "@/lib/translations";

const initialState: FormState = {
  ticker: "", accountBalance: "", riskTolerance: "2", targetBuffer: "75",
  targetMode: "percent", direction: "long", trend: "uptrend", timeframe: "daily",
  atr: "", curveLow: "", curveHigh: "", demandHigh: "", demandLow: "",
  supplyHigh: "", supplyLow: "", strength: "", time: "", freshness: "",
  opposingStrength: "", opposingTime: "", opposingFreshness: "",
  openTradeRisk: "0", xltAcknowledgement: "",
};

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.lang = "en";
  document.documentElement.dir = "ltr";
  vi.restoreAllMocks();
});

test("switching languages translates the real form, instructions, footer, and backup dialog without altering inputs", async () => {
  const user = userEvent.setup();
  const form = { ...initialState, ticker: "SHORT", accountBalance: "1500" };
  const change = vi.fn();
  render(
    <LanguageProvider>
      <LanguageSelector />
      <LanguageProvider>
        <TradeForm form={form} onChange={change} step={0} onBack={vi.fn()} onNext={vi.fn()}
          showAdvanced={false} onToggleAdvanced={vi.fn()} autoOpenTradeRisk={false} onToggleAutoOpenTradeRisk={vi.fn()} />
        <TradeBackupControls form={form} tradeLog={[]} onRestore={vi.fn()} />
      </LanguageProvider>
      <Disclaimer />
    </LanguageProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Language preference" }));
  await user.selectOptions(screen.getByRole("combobox"), "es");
  await user.click(screen.getByRole("button", { name: translate("es", "closeLanguage") }));
  expect(screen.getByRole("heading", { name: translateText("es", "Pre-steps") })).toBeInTheDocument();
  expect(screen.getByText(translateText("es", "Your balance with your broker, used for all risk limits"))).toBeInTheDocument();
  expect(screen.getByLabelText(translateText("es", "Ticker symbol"))).toHaveValue("SHORT");
  expect(screen.getByLabelText(translateText("es", "Account balance ($)"))).toHaveValue("1,500");
  expect(screen.getAllByRole("link", { name: new RegExp(translateText("es", "Engineered Risk Trading Strategy")) })).toHaveLength(2);
  expect(change).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: translateText("es", "Backup and restore") }));
  expect(screen.getByRole("dialog")).toHaveAccessibleName(translateText("es", "Backup and restore"));
  expect(screen.getByText(translateText("es", "Restore backup"))).toBeInTheDocument();
});

test("a real validation error is translated while the trade's values remain untouched", () => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
  render(<LanguageProvider><TradeForm form={{ ...initialState, curveLow: "120", curveHigh: "100" }}
    onChange={vi.fn()} step={1} onBack={vi.fn()} onNext={vi.fn()} showAdvanced={false}
    onToggleAdvanced={vi.fn()} autoOpenTradeRisk={false} onToggleAutoOpenTradeRisk={vi.fn()} /></LanguageProvider>);
  expect(screen.getByText(translateText("es", "Curve low must be below curve high."))).toBeInTheDocument();
});

test.each(LANGUAGES)("$name is applied to real form labels, instructions, and validation", ({ code }) => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  const { unmount } = render(<LanguageProvider><TradeForm form={initialState}
    onChange={vi.fn()} step={0} onBack={vi.fn()} onNext={vi.fn()} showAdvanced={false}
    onToggleAdvanced={vi.fn()} autoOpenTradeRisk={false} onToggleAutoOpenTradeRisk={vi.fn()} /></LanguageProvider>);
  expect(screen.getByLabelText(translateText(code, "Account balance ($)"))).toBeInTheDocument();
  expect(screen.getByText(translateText(code, "Your balance with your broker, used for all risk limits"))).toBeInTheDocument();
  unmount();
  render(<LanguageProvider><TradeForm form={{ ...initialState, curveLow: "120", curveHigh: "100" }}
    onChange={vi.fn()} step={1} onBack={vi.fn()} onNext={vi.fn()} showAdvanced={false}
    onToggleAdvanced={vi.fn()} autoOpenTradeRisk={false} onToggleAutoOpenTradeRisk={vi.fn()} /></LanguageProvider>);
  expect(screen.getByText(translateText(code, "Curve low must be below curve high."))).toBeInTheDocument();
});

test("Arabic and Hebrew use right-to-left layout, and returning to English restores left-to-right", async () => {
  const user = userEvent.setup();
  render(<LanguageProvider><LanguageSelector /></LanguageProvider>);
  await user.click(screen.getByRole("button", { name: "Language preference" }));
  for (const language of ["ar", "he", "en"]) {
    await user.selectOptions(screen.getByRole("combobox"), language);
    expect(document.documentElement.lang).toBe(language);
    expect(document.documentElement.dir).toBe(language === "en" ? "ltr" : "rtl");
  }
});

test("print labels and calendar month names follow the selected interface language", async () => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
  const user = userEvent.setup();
  render(<LanguageProvider><TradeLogExport entries={[]} /><PnlCalendar outcomes={[]} /></LanguageProvider>);
  expect(screen.getByRole("button", { name: translateText("es", "Print / Save PDF") })).toBeInTheDocument();
  expect(screen.getByLabelText(translateText("es", "Printable trade log"))).toHaveTextContent(translateText("es", "Profit/Loss"));
  await user.click(screen.getByRole("button", { name: translateText("es", "P&L Analysis") }));
  expect(within(screen.getByRole("dialog")).getByRole("table")).toHaveAccessibleName(
    new Date().toLocaleDateString("es", { month: "long", year: "numeric" }),
  );
});
