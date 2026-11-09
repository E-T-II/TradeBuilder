// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { LanguageProvider, useLanguageSettings } from "@/components/language-provider";
import { MyTradePlanDialog, PAGE_TITLES } from "@/components/my-trade-plan-dialog";
import { TRADE_PLAN_GRAPHIC_MESSAGES } from "@/components/trade-plan-graphic";
import { LANGUAGES, type LanguageCode } from "@/lib/languages";
import {
  ACCOUNT_TYPES, ANALYSIS_COLUMNS, ASSET_CLASSES, GOAL_MARKETS, GOAL_PERIODS, IMPROVEMENTS,
  MY_TRADE_PLAN_STORAGE_KEY, PLAN_GRAPHICS, REPORT_SOURCES, RISK_PARAMETERS, RISK_PARAMETER_MARKETS, RISK_PART_TWO_RULES, RISK_RULES, WEEKEND_CHOICES,
  STRENGTHS, TARGET_PURPOSES, TIMEFRAMES, TRADE_LOG_DESTINATIONS, TRADE_LOG_SCHEDULES, TRADE_TYPES, TRADING_PURPOSES,
  SCHEDULE_MARKETS, SCHEDULE_PERIODS, SCHEDULE_PURPOSES,
  EMERGENCY_CONTACT_FIELDS,
} from "@/lib/my-trade-plan";
import catalogs from "@/lib/locales";
import source from "@/lib/locales/en.json";
import { translateText } from "@/lib/translations";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

function LanguageControls() {
  const { selectLanguage } = useLanguageSettings();
  return <>{LANGUAGES.map(({ code }) => <button key={code} data-testid={`language-${code}`}
    onClick={() => selectLanguage(code)}>{code}</button>)}</>;
}

function setup() {
  return render(<LanguageProvider><LanguageControls /><MyTradePlanDialog /></LanguageProvider>);
}

function changeLanguage(language: LanguageCode) {
  fireEvent.click(screen.getByTestId(`language-${language}`));
}

const domainMessages = [
  ...PAGE_TITLES, ...TRADE_PLAN_GRAPHIC_MESSAGES, ...STRENGTHS, ...IMPROVEMENTS,
  ...GOAL_MARKETS, ...GOAL_PERIODS, ...ASSET_CLASSES, ...ACCOUNT_TYPES, ...TRADING_PURPOSES,
  ...ANALYSIS_COLUMNS, ...TIMEFRAMES, ...TRADE_TYPES, ...TARGET_PURPOSES, ...RISK_PART_TWO_RULES,
  ...RISK_RULES.map(({ text }) => text), ...PLAN_GRAPHICS.map(({ title }) => title),
  ...RISK_PARAMETERS, ...RISK_PARAMETER_MARKETS, ...WEEKEND_CHOICES,
  ...TRADE_LOG_DESTINATIONS, ...TRADE_LOG_SCHEDULES,
  ...SCHEDULE_MARKETS, ...SCHEDULE_PERIODS, ...SCHEDULE_PURPOSES,
  ...REPORT_SOURCES,
  ...EMERGENCY_CONTACT_FIELDS.map(({ label }) => label),
];

test.each(LANGUAGES)("worksheet domain messages are catalogued for $name", ({ code }) => {
  const messages: Record<string, string> = code === "en" ? source : catalogs[code];
  for (const message of domainMessages) {
    expect(Object.hasOwn(messages, message), `${code}: ${message}`).toBe(true);
  }
  if (code !== "en") {
    for (const title of PAGE_TITLES) {
      expect(translateText(code, title), `${code}: ${title}`).not.toBe(title);
    }
  }
});

test.each(["es", "ar", "he"] as const)("all pages and navigation respond to live %s changes", async (language) => {
  const user = userEvent.setup();
  setup();
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await user.type(screen.getByLabelText("Author's name"), "Untranslated author");
  const saved = window.localStorage.getItem(MY_TRADE_PLAN_STORAGE_KEY);
  changeLanguage(language);
  const tx = (value: string) => translateText(language, value);
  expect(screen.getByRole("dialog")).toHaveAttribute("lang", language);
  expect(screen.getByRole("dialog")).toHaveAttribute("dir", language === "es" ? "ltr" : "rtl");
  expect(screen.getByLabelText(tx("Author's name"))).toHaveValue("Untranslated author");
  for (let page = 0; page < PAGE_TITLES.length; page++) {
    expect(screen.getByRole("heading", { name: tx(PAGE_TITLES[page]) })).toBeVisible();
    expect(screen.getByRole("button", { name: tx("Preview") })).toBeVisible();
    if (page === 2) {
      expect(screen.getByRole("checkbox", { name: tx("Discipline") })).toBeVisible();
      expect(screen.getByLabelText(tx("Additional Notes"))).toBeVisible();
      expect(screen.getByLabelText(tx("Use notes only"))).toBeVisible();
    }
    if (page === 6) {
      const select = screen.getByRole("combobox", { name: translateText(language, "Market {0} Asset Class", [1]) });
      expect(within(select).getByRole("option", { name: tx("Stocks") })).toHaveValue("Stocks");
    }
    if (page === 12) {
      expect(screen.getAllByRole("img")).toHaveLength(4);
      expect(screen.getByRole("img", { name: tx("Trade Blueprint Steps") }).textContent?.replace(/\s/g, ""))
        .toContain(tx("Before the Trade").replace(/\s/g, ""));
    }
    if (page === 16) {
      expect(screen.getByLabelText(tx("Break-even reward ratio"))).toBeVisible();
      expect(screen.getByLabelText(tx("Trade management timeframe"))).toBeVisible();
      expect(screen.getByLabelText(tx("Additional trade management considerations"))).toBeVisible();
      expect(screen.getByLabelText(tx("Use notes only"))).toBeVisible();
    }
    if (page === 17) {
      expect(screen.getAllByRole("spinbutton")).toHaveLength(40);
      expect(screen.getByRole("columnheader", { name: tx("Risk Parameters") })).toBeVisible();
      const select = screen.getByLabelText(translateText(language, "{0} — {1}", [tx("Can Hold Trades Over the Weekend"), tx("Stocks")]));
      expect(within(select).getByRole("option", { name: tx("Yes") })).toHaveValue("Yes");
      expect(within(select).getByRole("option", { name: tx("No") })).toHaveValue("No");
    }
    if (page === 18) {
      expect(screen.getByRole("columnheader", { name: tx("Report Name") })).toBeVisible();
      const select = screen.getByLabelText(translateText(language, "Report {0} name", [1]));
      expect(within(select).getByRole("option", { name: "Econoday.com" })).toHaveValue("Econoday.com");
      expect(within(select).getByRole("option", { name: tx("Other") })).toHaveValue("Other");
      expect(screen.getByLabelText(translateText(language, "Report {0} notes and purpose", [1]))).toBeVisible();
      expect(screen.getByRole("button", { name: tx("Add Report") })).toHaveTextContent(tx("Add"));
    }
    if (page === 19) {
      expect(screen.getByLabelText(tx("Trade log destination"))).toBeVisible();
      expect(screen.getByLabelText(tx("Trade logging schedule"))).toBeVisible();
      expect(screen.getByRole("option", { name: tx("My personal trade log") })).toHaveValue("My personal trade log");
      expect(screen.getByRole("option", { name: tx("Twice a day") })).toHaveValue("Twice a day");
    }
    if (page === 20) {
      expect(screen.getByLabelText(tx("Additional considerations for reviewing results"))).toBeVisible();
    }
    if (page === 21) {
      const start = screen.getByLabelText(translateText(language, "Schedule {0} start time", [1]));
      expect(within(start).getAllByRole("option")).toHaveLength(49);
      expect(screen.getByLabelText(tx("Additional schedule and time considerations"))).toBeVisible();
      expect(screen.getByRole("button", { name: tx("Add Schedule") })).toHaveTextContent(tx("Add"));
    }
    if (page === 22) {
      expect(screen.getAllByRole("columnheader")).toHaveLength(6);
      expect(screen.getByLabelText(translateText(language, "Emergency contact {0} — {1}", [1, tx("Website")]))).toHaveValue("http://");
      expect(screen.getByRole("button", { name: tx("Finish and Download") })).toBeVisible();
    }
    if (page < PAGE_TITLES.length - 1) fireEvent.click(screen.getByRole("button", { name: tx("Next") }));
  }
  await user.click(screen.getByRole("combobox", { name: tx("Jump to page") }));
  expect(await screen.findAllByRole("option")).toHaveLength(PAGE_TITLES.length);
  expect(screen.getByLabelText(tx("Search pages"))).toHaveAttribute("placeholder", tx("Search by title or page number"));
  expect(screen.getByRole("option", {
    name: translateText(language, "{0} — {1}", [1, tx(PAGE_TITLES[0])]),
  })).toBeVisible();
  fireEvent.change(screen.getByLabelText(tx("Search pages")), { target: { value: tx(PAGE_TITLES[0]) } });
  expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1);
  fireEvent.change(screen.getByLabelText(tx("Search pages")), { target: { value: "unmatched-worksheet-page" } });
  expect(screen.getByText(tx("No pages found"))).toBeVisible();
  await user.keyboard("{Escape}");
  changeLanguage("en");
  expect(screen.getByRole("heading", { name: PAGE_TITLES.at(-1)! })).toBeVisible();
  expect(window.localStorage.getItem(MY_TRADE_PLAN_STORAGE_KEY)).toBe(saved);
}, 15000);

test("emergency contacts and the complete printout follow language changes without translating contact data", async () => {
  const user = userEvent.setup();
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  setup();
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  fireEvent.click(screen.getByRole("combobox", { name: "Jump to page" }));
  fireEvent.click(await screen.findByRole("option", { name: /^23 —/ }));
  fireEvent.change(screen.getByLabelText("Emergency contact 1 — Primary Contact"), { target: { value: "My contact {0}" } });
  const saved = window.localStorage.getItem(MY_TRADE_PLAN_STORAGE_KEY);
  changeLanguage("ar");
  expect(screen.getByLabelText(translateText("ar", "Emergency contact {0} — {1}", [1, translateText("ar", "Primary Contact")]))).toHaveValue("My contact {0}");
  await user.click(screen.getByRole("button", { name: translateText("ar", "Finish and Download") }));
  expect(print).toHaveBeenCalledOnce();
  const report = screen.getByRole("article", { name: translateText("ar", "Printable trading plan"), hidden: true });
  expect(report).toHaveAttribute("dir", "rtl");
  expect(report).toHaveTextContent("My contact {0}");
  expect(report.querySelectorAll("section")).toHaveLength(23);
  expect(window.localStorage.getItem(MY_TRADE_PLAN_STORAGE_KEY)).toBe(saved);
  fireEvent(window, new Event("afterprint"));
  changeLanguage("en");
  expect(screen.getByLabelText("Emergency contact 1 — Primary Contact")).toHaveValue("My contact {0}");
});

test("schedule choices, time labels, and user notes respond to language without changing stored values", async () => {
  const user = userEvent.setup();
  setup();
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  fireEvent.click(screen.getByRole("combobox", { name: "Jump to page" }));
  fireEvent.click(await screen.findByRole("option", { name: /^22 —/ }));
  await user.selectOptions(screen.getByLabelText("Schedule 1 period"), "Month");
  await user.selectOptions(screen.getByLabelText("Schedule 1 start time"), "23:30");
  await user.selectOptions(screen.getByLabelText("Schedule 1 end time"), "00:00");
  await user.selectOptions(screen.getByLabelText("Schedule 1 market"), "Stocks");
  await user.selectOptions(screen.getByLabelText("Schedule 1 purpose"), "Income");
  fireEvent.change(screen.getByLabelText("Additional schedule and time considerations"), { target: { value: "My notes {0}" } });
  const saved = window.localStorage.getItem(MY_TRADE_PLAN_STORAGE_KEY);
  for (const language of ["es", "ar", "he", "en"] as const) {
    changeLanguage(language);
    const start = screen.getByLabelText(translateText(language, "Schedule {0} start time", [1]));
    expect(start).toHaveValue("23:30");
    const formatted = new Intl.DateTimeFormat(language === "en" ? "en-US" : language,
      { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" })
      .format(new Date("2000-01-01T23:30:00Z"));
    expect(within(start).getByRole("option", { name: language === "en" ? formatted.toLowerCase() : formatted })).toHaveValue("23:30");
    expect(screen.getByLabelText(translateText(language, "Schedule {0} market", [1]))).toHaveValue("Stocks");
    expect(screen.getByLabelText(translateText(language, "Schedule {0} purpose", [1]))).toHaveValue("Income");
    expect(screen.getByLabelText(translateText(language, "Additional schedule and time considerations"))).toHaveValue("My notes {0}");
    expect(window.localStorage.getItem(MY_TRADE_PLAN_STORAGE_KEY)).toBe(saved);
  }
});

test("logging selections keep canonical values when changing languages", async () => {
  const user = userEvent.setup();
  setup();
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  fireEvent.click(screen.getByRole("combobox", { name: "Jump to page" }));
  fireEvent.click(await screen.findByRole("option", { name: /^20 —/ }));
  await user.selectOptions(screen.getByLabelText("Trade log destination"), "My trade logs using the Trade Builder");
  await user.selectOptions(screen.getByLabelText("Trade logging schedule"), "Immediately");
  const saved = window.localStorage.getItem(MY_TRADE_PLAN_STORAGE_KEY);
  for (const language of ["es", "ar", "he", "en"] as const) {
    changeLanguage(language);
    expect(screen.getByLabelText(translateText(language, "Trade log destination"))).toHaveValue("My trade logs using the Trade Builder");
    expect(screen.getByLabelText(translateText(language, "Trade logging schedule"))).toHaveValue("Immediately");
    expect(window.localStorage.getItem(MY_TRADE_PLAN_STORAGE_KEY)).toBe(saved);
  }
});

test("translated dropdowns and notes retain canonical values while switching language", async () => {
  const user = userEvent.setup();
  setup();
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  for (let i = 0; i < 6; i++) fireEvent.click(screen.getByRole("button", { name: "Next" }));
  await user.selectOptions(screen.getByLabelText("Market 1 Asset Class"), "Stocks");
  fireEvent.change(screen.getByLabelText("Market 1 Watch List Rules"), { target: { value: "My rules: {0} EUR/USD" } });
  const saved = window.localStorage.getItem(MY_TRADE_PLAN_STORAGE_KEY);
  changeLanguage("ar");
  expect(screen.getByLabelText(translateText("ar", "Market {0} Asset Class", [1]))).toHaveValue("Stocks");
  expect(screen.getByLabelText(translateText("ar", "Market {0} Watch List Rules", [1]))).toHaveValue("My rules: {0} EUR/USD");
  expect(window.localStorage.getItem(MY_TRADE_PLAN_STORAGE_KEY)).toBe(saved);
  changeLanguage("en");
  expect(screen.getByLabelText("Market 1 Asset Class")).toHaveValue("Stocks");
  expect(screen.getByLabelText("Market 1 Watch List Rules")).toHaveValue("My rules: {0} EUR/USD");
});

test("report websites, Other selection, and user notes survive language changes", async () => {
  const user = userEvent.setup();
  setup();
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  fireEvent.click(screen.getByRole("combobox", { name: "Jump to page" }));
  fireEvent.click(await screen.findByRole("option", { name: /^19 —/ }));
  await user.selectOptions(screen.getByLabelText("Report 1 name"), "ForexFactory.com");
  fireEvent.change(screen.getByLabelText("Report 1 notes and purpose"), { target: { value: "EUR/USD notes {0}" } });
  fireEvent.click(screen.getByRole("button", { name: "Add Report" }));
  await user.selectOptions(screen.getByLabelText("Report 2 name"), "Other");
  const saved = window.localStorage.getItem(MY_TRADE_PLAN_STORAGE_KEY);
  changeLanguage("ar");
  const select = screen.getByLabelText(translateText("ar", "Report {0} name", [1]));
  expect(select).toHaveValue("ForexFactory.com");
  expect(within(select).getByRole("option", { name: "ForexFactory.com" })).toHaveValue("ForexFactory.com");
  const other = screen.getByLabelText(translateText("ar", "Report {0} name", [2]));
  expect(other).toHaveValue("Other");
  expect(within(other).getByRole("option", { name: translateText("ar", "Other") })).toHaveValue("Other");
  expect(screen.getByLabelText(translateText("ar", "Report {0} notes and purpose", [1]))).toHaveValue("EUR/USD notes {0}");
  expect(window.localStorage.getItem(MY_TRADE_PLAN_STORAGE_KEY)).toBe(saved);
});
