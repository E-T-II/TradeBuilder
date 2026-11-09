// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyTradePlanDialog, PAGE_TITLES } from "@/components/my-trade-plan-dialog";
import {
  ACCOUNT_TYPES, ANALYSIS_COLUMNS, ASSET_CLASSES, BROKERS, createMyTradePlan, EMERGENCY_CONTACT_FIELDS,
  GOAL_MARKETS, GOAL_PERIODS, IMPROVEMENTS, MY_TRADE_PLAN_STORAGE_KEY, PLAN_GRAPHICS,
  REPORT_SOURCES, RISK_PARAMETERS, RISK_PARAMETER_MARKETS, RISK_PART_TWO_RULES, RISK_RULES, STRENGTHS, TIMEFRAMES, TRADING_PURPOSES,
} from "@/lib/my-trade-plan";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

function stored() {
  return JSON.parse(window.localStorage.getItem(MY_TRADE_PLAN_STORAGE_KEY)!);
}

async function selectPage(page: number) {
  const current = Number(screen.getByRole("status").textContent?.match(/Page (\d+)/)?.[1]);
  if (current === page) return;
  fireEvent.click(screen.getByRole("combobox", { name: "Jump to page" }));
  fireEvent.click(await screen.findByRole("option", { name: new RegExp(`^${page} —`) }));
}

function options(label: string) {
  return within(screen.getByRole("combobox", { name: label })).getAllByRole("option").slice(1).map((option) => option.textContent);
}

test("searchable page picker jumps directly while retaining edits and keyboard navigation", async () => {
  const user = userEvent.setup();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await user.type(screen.getByLabelText("Version #"), "draft");
  await user.click(screen.getByRole("combobox", { name: "Jump to page" }));
  expect(await screen.findAllByRole("option")).toHaveLength(PAGE_TITLES.length);
  expect(screen.getByLabelText("Search pages")).toHaveFocus();
  expect(screen.getByRole("option", { name: /^1 —/ })).toHaveAttribute("aria-current", "page");
  await user.type(screen.getByLabelText("Search pages"), "emergency");
  expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1);
  await user.click(screen.getByRole("option", { name: "23 — Appendix A – Emergency Contact Reference Data" }));
  expect(screen.getByRole("status")).toHaveTextContent(`Page 23 of ${PAGE_TITLES.length}`);
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Finish and Download" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Previous" }));
  expect(screen.getByRole("status")).toHaveTextContent(`Page 22 of ${PAGE_TITLES.length}`);
  await user.click(screen.getByRole("combobox", { name: "Jump to page" }));
  await screen.findByRole("listbox");
  expect(screen.getByLabelText("Search pages")).toHaveValue("");
  await user.type(screen.getByLabelText("Search pages"), "1");
  expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1);
  await user.keyboard("{ArrowDown}{Enter}");
  expect(screen.getByRole("status")).toHaveTextContent(`Page 1 of ${PAGE_TITLES.length}`);
  expect(screen.getByLabelText("Version #")).toHaveValue("draft");
  await user.click(screen.getByRole("combobox", { name: "Jump to page" }));
  await screen.findAllByRole("option");
  await user.type(screen.getByLabelText("Search pages"), "no matching page");
  expect(screen.getByText("No pages found")).toBeVisible();
  expect(screen.queryByRole("option")).not.toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  expect(screen.getByRole("dialog")).toBeVisible();
  expect(screen.getByRole("combobox", { name: "Jump to page" })).toHaveFocus();
});

test("opens the worksheet, navigates both ways, and retains document information after reload", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  expect(screen.getByRole("dialog", { name: "My Trading Plan Creator" })).toHaveAttribute("lang", "en");
  expect(screen.getByRole("status")).toHaveTextContent(`Page 1 of ${PAGE_TITLES.length}`);
  expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  expect(screen.queryByLabelText("Go to page")).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Page Information for My Trade Plan Document" })).toBeVisible();
  await user.clear(screen.getByLabelText("Document title"));
  await user.type(screen.getByLabelText("Document title"), "My personal plan");
  await user.type(screen.getByLabelText("Version #"), "1.2");
  await user.type(screen.getByLabelText("Author's name"), "Example author");
  await user.clear(screen.getByLabelText("Currency symbol"));
  await user.type(screen.getByLabelText("Currency symbol"), "EUR");
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.type(screen.getByLabelText("My why"), "Build a consistent process");
  await user.click(screen.getByRole("button", { name: "Previous" }));
  expect(screen.getByLabelText("Document title")).toHaveValue("My personal plan");
  await user.click(screen.getByRole("button", { name: "Close My Trade Plan" }));
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  expect(screen.getByLabelText("Document title")).toHaveValue("My personal plan");
  expect(screen.getByLabelText("Version #")).toHaveValue("1.2");
  expect(screen.getByLabelText("Author's name")).toHaveValue("Example author");
  expect(screen.getByLabelText("Currency symbol")).toHaveValue("EUR");
  await selectPage(2);
  expect(screen.getByLabelText("My why")).toHaveValue("Build a consistent process");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Create my trade plan" })).toHaveFocus();
});

test("renders all checklist choices and saves selected items and additional notes", async () => {
  const user = userEvent.setup();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(3);
  expect(within(screen.getByRole("group", { name: "Trader strengths" })).getAllByRole("checkbox").map((box) => box.closest("label")?.textContent)).toEqual([...STRENGTHS]);
  await user.click(screen.getByLabelText("Patience"));
  await user.type(screen.getByLabelText("Additional Notes"), "Wait for a setup");
  await user.click(screen.getByLabelText("Use notes only"));
  expect(screen.getByLabelText("Patience")).toBeVisible();
  expect(screen.getByLabelText("Patience")).toBeChecked();
  await selectPage(4);
  expect(within(screen.getByRole("group", { name: "Areas to improve" })).getAllByRole("checkbox").map((box) => box.closest("label")?.textContent)).toEqual([...IMPROVEMENTS]);
  await user.click(screen.getByLabelText("Too Emotional"));
  await user.type(screen.getByLabelText("Additional Notes"), "Use a checklist");
  await user.click(screen.getByLabelText("Use notes only"));
  expect(screen.getByLabelText("Too Emotional")).toBeVisible();
  expect(screen.getByLabelText("Too Emotional")).toBeChecked();
  expect(stored()).toMatchObject({
    strengths: ["Patience"], strengthNotesOnly: true, strengthNotes: "Wait for a setup",
    improvements: ["Too Emotional"], improvementNotesOnly: true, improvementNotes: "Use a checklist",
  });
  await selectPage(3);
  expect(screen.getByLabelText("Use notes only")).toBeChecked();
  expect(screen.getByLabelText("Patience")).toBeChecked();
  await user.click(screen.getByLabelText("Patience"));
  expect(stored().strengths).toEqual([]);
  await selectPage(4);
  expect(screen.getByLabelText("Use notes only")).toBeChecked();
  expect(screen.getByLabelText("Additional Notes")).toHaveValue("Use a checklist");
});

test("income and wealth each have two independent goal rows with all requested choices", async () => {
  const user = userEvent.setup();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  for (const [page, title] of [[5, "Income"], [6, "Wealth"]] as const) {
    await selectPage(page);
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
    expect(options(`${title} goal 1 increase per`)).toEqual([...GOAL_PERIODS]);
    expect(options(`${title} goal 1 trading`)).toEqual([...GOAL_MARKETS]);
    await user.click(within(screen.getByRole("group", { name: `${title} goal 1 unit` })).getByLabelText("$"));
    await user.click(within(screen.getByRole("group", { name: `${title} goal 2 unit` })).getByLabelText("%"));
    await user.type(screen.getByLabelText(`${title} goal 1 increase`), "100");
    await user.selectOptions(screen.getByLabelText(`${title} goal 1 increase per`), "month");
    await user.selectOptions(screen.getByLabelText(`${title} goal 1 trading`), "Stocks/ETFs");
    expect(stored()[title === "Income" ? "incomeGoals" : "wealthGoals"]).toEqual([
      { unit: "$", amount: "100", period: "month", market: "Stocks/ETFs" },
      { unit: "%", amount: "", period: "", market: "" },
    ]);
  }
});

test("adds income goals and restores them after reopening the worksheet", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(5);
  expect(screen.getByText("Choose the appropriate fields to complete the goal. Click on the + to add another Income Goal.").tagName).toBe("EM");
  await user.click(screen.getByRole("button", { name: "Add Income Goal" }));
  await user.type(screen.getByLabelText("Income goal 3 increase"), "250");
  await user.selectOptions(screen.getByLabelText("Income goal 3 trading"), "Futures");
  await user.click(screen.getByLabelText("Use notes only"));
  await user.type(screen.getByLabelText("Additional Notes"), "Focus on consistent income");
  expect(screen.getByLabelText("Income goal 3 increase")).toBeVisible();
  expect(stored().incomeNotesOnly).toBe(true);
  expect(stored().incomeGoals).toHaveLength(3);
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(5);
  expect(screen.getByLabelText("Income goal 3 increase")).toHaveValue(250);
  expect(screen.getByLabelText("Income goal 3 trading")).toHaveValue("Futures");
  expect(screen.getByLabelText("Use notes only")).toBeChecked();
  expect(screen.getByLabelText("Additional Notes")).toHaveValue("Focus on consistent income");
});

test("deletes income goals while preserving at least one row and its values", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(5);
  await user.type(screen.getByLabelText("Income goal 2 increase"), "300");
  await user.click(screen.getByRole("button", { name: "Delete Income goal 1" }));
  expect(screen.getByLabelText("Income goal 1 increase")).toHaveValue(300);
  expect(stored().incomeGoals).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Delete Income goal 1" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Delete Income goal 1" }));
  expect(stored().incomeGoals).toHaveLength(1);
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(5);
  expect(screen.getByLabelText("Income goal 1 increase")).toHaveValue(300);
  expect(screen.getByRole("button", { name: "Delete Income goal 1" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Add Income Goal" }));
  expect(screen.getByLabelText("Income goal 2 increase")).toHaveValue(null);
  expect(screen.getByRole("button", { name: "Delete Income goal 1" })).toBeEnabled();
});

test("wealth goals support adding, deleting, and a persistent notes-only preference", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(6);
  expect(screen.getByText("Choose the appropriate fields to complete the goal. Click on the + to add another Wealth Goal.").tagName).toBe("EM");
  await user.click(screen.getByRole("button", { name: "Add Wealth Goal" }));
  await user.type(screen.getByLabelText("Wealth goal 3 increase"), "500");
  await user.click(screen.getByLabelText("Use notes only"));
  await user.type(screen.getByLabelText("Additional Notes"), "Long-term growth");
  expect(screen.getByLabelText("Wealth goal 3 increase")).toBeVisible();
  expect(stored().wealthGoals).toHaveLength(3);
  unmount();
  const restored = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(6);
  expect(screen.getByLabelText("Use notes only")).toBeChecked();
  expect(screen.getByLabelText("Additional Notes")).toHaveValue("Long-term growth");
  expect(screen.getByLabelText("Wealth goal 3 increase")).toHaveValue(500);
  await user.click(screen.getByRole("button", { name: "Delete Wealth goal 1" }));
  await user.click(screen.getByRole("button", { name: "Delete Wealth goal 1" }));
  expect(screen.getByLabelText("Wealth goal 1 increase")).toHaveValue(500);
  expect(screen.getByRole("button", { name: "Delete Wealth goal 1" })).toBeDisabled();
  expect(stored().wealthGoals).toHaveLength(1);
  expect(stored().incomeNotesOnly).toBe(false);
  restored.unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(6);
  expect(screen.getByLabelText("Wealth goal 1 increase")).toHaveValue(500);
  expect(screen.getByRole("button", { name: "Delete Wealth goal 1" })).toBeDisabled();
});

test("market rows retain watch list rules and notes-only preferences through adding, deleting, and reload", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(7);
  expect(screen.getByText(/Choose the appropriate values from the drop down list/).tagName).toBe("EM");
  expect(screen.getByRole("button", { name: "Delete Market 1" })).toBeDisabled();
  await user.selectOptions(screen.getByLabelText("Market 1 Asset Class"), "Stocks");
  await user.type(screen.getByLabelText("Market 1 Watch List Rules"), "Daily volume above one million");
  await user.click(screen.getByRole("button", { name: "Add Market" }));
  await user.selectOptions(screen.getByLabelText("Market 2 Asset Class"), "Futures");
  await user.type(screen.getByLabelText("Market 2 Watch List Rules"), "Liquid contracts");
  await user.click(screen.getByLabelText("Use notes only"));
  await user.type(screen.getByLabelText("Additional trading market considerations"), "Review weekly");
  expect(screen.getByLabelText("Market 1 Asset Class")).toBeVisible();
  expect(stored().markets).toHaveLength(2);
  unmount();
  const restored = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(7);
  expect(screen.getByLabelText("Use notes only")).toBeChecked();
  expect(screen.getByLabelText("Market 1 Watch List Rules")).toHaveValue("Daily volume above one million");
  expect(screen.getByLabelText("Additional trading market considerations")).toHaveValue("Review weekly");
  await user.click(screen.getByRole("button", { name: "Delete Market 1" }));
  expect(screen.getByLabelText("Market 1 Asset Class")).toHaveValue("Futures");
  expect(screen.getByLabelText("Market 1 Watch List Rules")).toHaveValue("Liquid contracts");
  expect(screen.getByRole("button", { name: "Delete Market 1" })).toBeDisabled();
  expect(stored().markets).toEqual([{ assetClass: "Futures", watchListRules: "Liquid contracts" }]);
  restored.unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(7);
  expect(screen.getByLabelText("Market 1 Watch List Rules")).toHaveValue("Liquid contracts");
});

test("account listings and notes-only preference persist without clearing entered accounts", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(8);
  expect(screen.getByText("This section of my trading plan takes inventory of the accounts I have and the amount of money in each one.")).toBeVisible();
  await user.selectOptions(screen.getByLabelText("Account 1 type"), "Forex");
  await user.selectOptions(screen.getByLabelText("Account 1 with"), "Oanda");
  await user.type(screen.getByLabelText("Account 1 amount"), "1000");
  await user.selectOptions(screen.getByLabelText("Account 2 type"), "Stock");
  await user.type(screen.getByLabelText("Additional account information"), "Review balances monthly");
  await user.click(screen.getByLabelText("Use notes only"));
  expect(screen.getByLabelText("Account 1 amount")).toBeVisible();
  expect(stored().accountNotesOnly).toBe(true);
  expect(stored().marketNotesOnly).toBe(false);
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(8);
  expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
  expect(screen.getByLabelText("Account 1 type")).toHaveValue("Forex");
  expect(screen.getByLabelText("Account 1 with")).toHaveValue("Oanda");
  expect(screen.getByLabelText("Account 1 amount")).toHaveValue(1000);
  expect(screen.getByLabelText("Account 2 type")).toHaveValue("Stock");
  expect(screen.getByLabelText("Additional account information")).toHaveValue("Review balances monthly");
  expect(screen.getByLabelText("Use notes only")).toBeChecked();
});

test("account trashcans delete only the selected row and keep at least one across reloads", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(8);
  expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Delete Account 1" })).toBeEnabled();
  await user.selectOptions(screen.getByLabelText("Account 1 type"), "Forex");
  await user.selectOptions(screen.getByLabelText("Account 2 type"), "Stock");
  await user.click(screen.getByRole("button", { name: "Delete Account 1" }));
  expect(screen.getByLabelText("Account 1 type")).toHaveValue("Stock");
  expect(screen.getByRole("button", { name: "Delete Account 1" })).toBeDisabled();
  expect(stored().accounts).toEqual([{ type: "Stock", broker: "", amount: "" }]);
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(8);
  expect(screen.getAllByRole("spinbutton")).toHaveLength(1);
  expect(screen.getByLabelText("Account 1 type")).toHaveValue("Stock");
  expect(screen.getByRole("button", { name: "Delete Account 1" })).toBeDisabled();
});

test("markets, account rows, timeframe matrix, and entry rules include every requested choice", async () => {
  const user = userEvent.setup();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(7);
  expect(options("Market 1 Asset Class")).toEqual([...ASSET_CLASSES]);
  await user.selectOptions(screen.getByLabelText("Market 1 Asset Class"), "Options (non-directional)");
  await user.type(screen.getByLabelText("Additional trading market considerations"), "Liquidity");
  await selectPage(8);
  expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
  expect(screen.queryByText(/^Account \d+$/)).not.toBeInTheDocument();
  expect(screen.getByText(/Choose the appropriate fields to complete your account listing/)).toHaveClass("text-xs");
  for (let row = 2; row < 5; row++) {
    await user.click(screen.getByRole("button", { name: "Add Account" }));
  }
  expect(screen.getAllByRole("spinbutton")).toHaveLength(5);
  for (let row = 1; row <= 5; row++) {
    expect(options(`Account ${row} type`)).toEqual([...ACCOUNT_TYPES]);
    expect(options(`Account ${row} with`)).toEqual([...BROKERS]);
  }
  await user.selectOptions(screen.getByLabelText("Account 5 type"), "Stock/Options");
  await user.selectOptions(screen.getByLabelText("Account 5 with"), "Interactive Brokers");
  await user.type(screen.getByLabelText("Account 5 amount"), "2500.50");
  await selectPage(9);
  expect(screen.getByText("Multiple timeframe analysis is critical for navigating through the Blueprint steps when planning and executing trades.")).toBeVisible();
  const timeframeInstructions = screen.getByText("Complete the following table to document the timeframes to be used when trading for the various purposes.");
  expect(timeframeInstructions.tagName).toBe("EM");
  expect(timeframeInstructions).toHaveClass("text-xs");
  expect(screen.getAllByRole("row")).toHaveLength(5);
  expect(within(screen.getByRole("table")).getAllByRole("combobox")).toHaveLength(16);
  for (const purpose of TRADING_PURPOSES) {
    for (const column of ANALYSIS_COLUMNS) expect(options(`${purpose} ${column}`)).toEqual([...TIMEFRAMES]);
  }
  await user.selectOptions(screen.getByLabelText("Daily Income Curve (HTF)"), "Daily");
  await user.selectOptions(screen.getByLabelText("Monthly Income Refining (RTF)"), "5 mins");
  await selectPage(10);
  expect(screen.getByRole("button", { name: "Next" })).toBeVisible();
  expect(options("Trade Type")).toEqual(["Income Trade", "Wealth trade"]);
  await user.selectOptions(screen.getByLabelText("Trade Type"), "Income Trade");
  await user.type(screen.getByLabelText("Entry Rules"), "Follow the plan");
  await user.type(screen.getByLabelText("Additional considerations for rules of entry"), "Check risk");
  expect(stored()).toMatchObject({
    markets: [{ assetClass: "Options (non-directional)", watchListRules: "" }], marketNotes: "Liquidity",
    entries: [{ tradeType: "Income Trade", entryRules: "Follow the plan" }], entryNotes: "Check risk",
  });
  expect(stored().accounts[4]).toEqual({ type: "Stock/Options", broker: "Interactive Brokers", amount: "2500.5" });
  expect(stored().timeframes[1][0]).toBe("Daily");
  expect(stored().timeframes[3][3]).toBe("5 mins");
  await selectPage(PAGE_TITLES.length);
  await user.click(screen.getByRole("button", { name: "Close My Trade Plan" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("page ten saves notes-only independently and preserves entry rules on reload", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(10);
  expect(screen.getByText("Having defined rules for entering a trade helps to keep my trading rule-based and unemotional. Following contains the rules and conditions for each type of entry I will use when trading.")).toBeVisible();
  const entryInstructions = screen.getByText("Select your trade type and entry rules.");
  expect(entryInstructions.tagName).toBe("EM");
  expect(entryInstructions).toHaveClass("text-xs");
  await user.selectOptions(screen.getByLabelText("Trade Type"), "Income Trade");
  await user.type(screen.getByLabelText("Entry Rules"), "Confirm trend");
  await user.type(screen.getByLabelText("Additional considerations for rules of entry"), "Check risk");
  await user.click(screen.getByLabelText("Use notes only"));
  expect(screen.getByLabelText("Entry Rules")).toBeVisible();
  expect(stored().entryNotesOnly).toBe(true);
  expect(stored().accountNotesOnly).toBe(false);
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(10);
  expect(screen.getByLabelText("Use notes only")).toBeChecked();
  expect(screen.getByLabelText("Trade Type")).toHaveValue("Income Trade");
  expect(screen.getByLabelText("Entry Rules")).toHaveValue("Confirm trend");
  expect(screen.getByLabelText("Entry Rules")).toHaveAttribute("rows", "2");
  expect(screen.getByLabelText("Additional considerations for rules of entry")).toHaveValue("Check risk");
});

test("entry rows can be added and deleted while retaining one row and saving surviving rules", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(10);
  expect(screen.getByRole("button", { name: "Delete Entry 1" })).toBeDisabled();
  await user.selectOptions(screen.getByLabelText("Trade Type", { exact: true }), "Income Trade");
  await user.type(screen.getByLabelText("Entry Rules", { exact: true }), "Confirm trend");
  await user.click(screen.getByRole("button", { name: "Add Entry Rule" }));
  await user.selectOptions(screen.getByLabelText("Entry 2 Trade Type"), "Wealth trade");
  await user.type(screen.getByLabelText("Entry 2 Rules"), "Check weekly zones");
  expect(stored().entries).toEqual([
    { tradeType: "Income Trade", entryRules: "Confirm trend" },
    { tradeType: "Wealth trade", entryRules: "Check weekly zones" },
  ]);
  await user.click(screen.getByRole("button", { name: "Delete Entry 1" }));
  expect(screen.getByLabelText("Trade Type", { exact: true })).toHaveValue("Wealth trade");
  expect(screen.getByLabelText("Entry Rules", { exact: true })).toHaveValue("Check weekly zones");
  expect(screen.getByRole("button", { name: "Delete Entry 1" })).toBeDisabled();
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(10);
  expect(screen.getByLabelText("Entry Rules", { exact: true })).toHaveValue("Check weekly zones");
  expect(stored().entries).toEqual([{ tradeType: "Wealth trade", entryRules: "Check weekly zones" }]);
});

test("page eleven retains independent stop buffers, notes and notes-only through reload", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(11);
  expect(screen.getByRole("heading", { name: "My Trading Execution – Rules for Stop (Loss Exit)" })).toBeVisible();
  const instructions = screen.getByText("Input the % buffer amount for Income and Wealth Trades.");
  expect(instructions.tagName).toBe("EM");
  expect(instructions).toHaveClass("text-xs");
  expect(screen.getAllByRole("row")).toHaveLength(3);
  expect(screen.getAllByText("% of Daily ATR")).toHaveLength(2);
  expect(screen.getByLabelText("Income Trades buffer amount (%)")).toHaveValue("");
  expect(screen.getByLabelText("Wealth Trades buffer amount (%)")).toHaveValue("");
  await user.type(screen.getByLabelText("Income Trades buffer amount (%)"), "2.5");
  await user.type(screen.getByLabelText("Wealth Trades buffer amount (%)"), "10");
  await user.type(screen.getByLabelText("Additional considerations for stop loss"), "Respect the stop");
  await user.click(screen.getByLabelText("Use notes only"));
  expect(screen.getByLabelText("Income Trades buffer amount (%)")).toBeVisible();
  expect(stored()).toMatchObject({
    stopIncomeBuffer: "2.5", stopWealthBuffer: "10", stopNotes: "Respect the stop",
    stopNotesOnly: true, entryNotesOnly: false,
  });
  expect(screen.getByRole("button", { name: "Next" })).toBeVisible();
  await selectPage(PAGE_TITLES.length);
  await user.click(screen.getByRole("button", { name: "Close My Trade Plan" }));
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(11);
  expect(screen.getByRole("status")).toHaveTextContent(`Page 11 of ${PAGE_TITLES.length}`);
  expect(screen.getByLabelText("Income Trades buffer amount (%)")).toHaveValue("2.5");
  expect(screen.getByLabelText("Wealth Trades buffer amount (%)")).toHaveValue("10");
  expect(screen.getByLabelText("Additional considerations for stop loss")).toHaveValue("Respect the stop");
  expect(screen.getByLabelText("Use notes only")).toBeChecked();
});

test("target rules add, delete and persist independently for each trading purpose", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(12);
  expect(screen.getByRole("heading", { name: "My Trading Execution – Rules for Target(s) (Profit Exit)" })).toBeVisible();
  expect(screen.getByText("Select the appropriate values for each field to complete your rule for determining the Target for each trading purpose.")).toHaveClass("text-xs");
  expect(screen.getAllByRole("row")).toHaveLength(3);
  expect(options("Target 1 timeframe")).toEqual(["LTF", "ITF", "HTF"]);
  expect(options("Target 1 trading purpose")).toEqual(["Income Trades", "Wealth Trades"]);
  expect(screen.getByLabelText("Target 1 trading purpose")).toHaveValue("Income Trades");
  expect(screen.getByLabelText("Target 2 trading purpose")).toHaveValue("Wealth Trades");
  expect(screen.getAllByRole("button", { name: /^Add/ })).toHaveLength(1);
  await user.type(screen.getByLabelText("Target 1 buffer (%)"), "20");
  await user.selectOptions(screen.getByLabelText("Target 1 timeframe"), "LTF");
  await user.click(screen.getByRole("button", { name: "Add Target" }));
  await user.selectOptions(screen.getByLabelText("Target 3 trading purpose"), "Income Trades");
  await user.type(screen.getByLabelText("Target 3 buffer (%)"), "25");
  await user.selectOptions(screen.getByLabelText("Target 3 timeframe"), "ITF");
  expect(stored().targetRules).toHaveLength(3);
  await user.click(screen.getByRole("button", { name: "Delete Target 1" }));
  await user.selectOptions(screen.getByLabelText("Target 1 trading purpose"), "Income Trades");
  await user.type(screen.getByLabelText("Target 1 buffer (%)"), "10");
  await user.selectOptions(screen.getByLabelText("Target 1 timeframe"), "HTF");
  await user.type(screen.getByLabelText("Additional target-exit considerations"), "Review opposing zones");
  await user.click(screen.getByLabelText("Use notes only"));
  expect(screen.getByLabelText("Target 1 buffer (%)")).toBeVisible();
  expect(stored().stopNotesOnly).toBe(false);
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(12);
  expect(screen.getByRole("status")).toHaveTextContent(`Page 12 of ${PAGE_TITLES.length}`);
  expect(screen.getByLabelText("Target 2 buffer (%)")).toHaveValue("25");
  expect(screen.getByLabelText("Target 2 timeframe")).toHaveValue("ITF");
  expect(screen.getByLabelText("Target 1 trading purpose")).toHaveValue("Income Trades");
  expect(screen.getByLabelText("Target 1 buffer (%)")).toHaveValue("10");
  expect(screen.getByLabelText("Target 1 timeframe")).toHaveValue("HTF");
  expect(screen.getByLabelText("Additional target-exit considerations")).toHaveValue("Review opposing zones");
  expect(screen.getByLabelText("Use notes only")).toBeChecked();
  await user.click(screen.getByRole("button", { name: "Delete Target 2" }));
  expect(screen.getByRole("button", { name: "Delete Target 1" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next" })).toBeVisible();
  await selectPage(PAGE_TITLES.length);
  await user.click(screen.getByRole("button", { name: "Close My Trade Plan" }));
});

test("graphics appear in supplied order and retain independent selections and paragraphs", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(13);
  expect(screen.getByRole("heading", { name: "My Trading Execution – Including Graphics" })).toBeVisible();
  expect(screen.getByText("Include the following graphics in the Trading Execution section of my Trading Plan")).toBeVisible();
  expect(screen.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
    "Graphic", "Thumbnail", "Preceding Paragraph",
  ]);
  expect(screen.getAllByRole("row")).toHaveLength(5);
  expect(screen.getAllByRole("img").map((img) => img.getAttribute("aria-label"))).toEqual(PLAN_GRAPHICS.map((graphic) => graphic.title));
  for (const [index, graphic] of PLAN_GRAPHICS.entries()) {
    expect(screen.getByRole("checkbox", { name: graphic.title })).not.toBeChecked();
    if (index % 2 === 0) await user.click(screen.getByRole("checkbox", { name: graphic.title }));
    await user.type(screen.getByLabelText(`${graphic.title} preceding paragraph`), `Notes ${index + 1}`);
    expect(screen.getByRole("img", { name: graphic.title })).toHaveAttribute("viewBox", `0 0 ${graphic.width} ${graphic.height}`);
  }
  await user.click(screen.getByRole("checkbox", { name: PLAN_GRAPHICS[0].title }));
  expect(screen.getByLabelText(`${PLAN_GRAPHICS[0].title} preceding paragraph`)).toHaveValue("Notes 1");
  expect(screen.getByRole("button", { name: "Next" })).toBeVisible();
  await selectPage(PAGE_TITLES.length);
  await user.click(screen.getByRole("button", { name: "Close My Trade Plan" }));
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(13);
  expect(screen.getByRole("status")).toHaveTextContent(`Page 13 of ${PAGE_TITLES.length}`);
  for (const [index, graphic] of PLAN_GRAPHICS.entries()) {
    expect(screen.getByRole("checkbox", { name: graphic.title })).toHaveProperty("checked", index === 2);
    expect(screen.getByLabelText(`${graphic.title} preceding paragraph`)).toHaveValue(`Notes ${index + 1}`);
  }
});

test("placing-order rules add, delete and persist with at least one row remaining", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(14);
  expect(screen.getByRole("heading", { name: "My Trading Execution – Placing the Order" })).toBeVisible();
  expect(screen.getByText("Placing the order of a trade must be checked and double checked. There is a set process I go through when placing a trade.")).toBeVisible();
  const instructions = screen.getByText("List your complete rules and processes for placing your order.");
  expect(instructions.tagName).toBe("EM");
  expect(instructions).toHaveClass("text-xs");
  expect(screen.getByRole("columnheader", { name: "Placing Order Rules" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Delete Order Rule 1" })).toBeDisabled();
  await user.type(screen.getByLabelText("Placing order rule 1"), "Check quantity");
  await user.click(screen.getByRole("button", { name: "Add Order Rule" }));
  await user.type(screen.getByLabelText("Placing order rule 2"), "Double check price");
  expect(stored().placingOrderRules).toEqual(["Check quantity", "Double check price"]);
  await user.click(screen.getByRole("button", { name: "Delete Order Rule 1" }));
  expect(screen.getByLabelText("Placing order rule 1")).toHaveValue("Double check price");
  expect(screen.getByRole("button", { name: "Delete Order Rule 1" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next" })).toBeVisible();
  await selectPage(PAGE_TITLES.length);
  await user.click(screen.getByRole("button", { name: "Close My Trade Plan" }));
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(14);
  expect(screen.getByRole("status")).toHaveTextContent(`Page 14 of ${PAGE_TITLES.length}`);
  expect(screen.getByLabelText("Placing order rule 1")).toHaveValue("Double check price");
  expect(stored().placingOrderRules).toEqual(["Double check price"]);
});

test("risk rules have independent checkboxes and restore ratios and numeric percentages", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(15);
  expect(screen.getByRole("heading", { name: "My Risk Management Rules Part 1" })).toBeVisible();
  const instructions = screen.getByText("Choose the appropriate fields to complete your Risk Management Part 1 rules.");
  expect(instructions.tagName).toBe("EM");
  expect(instructions).toHaveClass("text-xs");
  expect(screen.getAllByRole("checkbox")).toHaveLength(8);
  for (const rule of RISK_RULES) {
    expect(screen.getByRole("checkbox", { name: rule.text })).not.toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: rule.text }));
  }
  expect(options("Minimum reward ratio")).toEqual(["10:1", "9:1", "8:1", "7:1", "6:1", "5:1", "4:1", "3:1", "2:1", "1:1"]);
  await user.selectOptions(screen.getByLabelText("Minimum reward ratio"), "3:1");
  await user.type(screen.getByLabelText("Single trade risk (%)"), "abc");
  expect(screen.getByLabelText("Single trade risk (%)")).toHaveValue(null);
  await user.type(screen.getByLabelText("Single trade risk (%)"), "1.5");
  await user.type(screen.getByLabelText("Multiple trades risk (%)"), "6");
  await user.click(screen.getByRole("checkbox", { name: RISK_RULES[6].text }));
  expect(screen.getByLabelText("Single trade risk (%)")).toHaveValue(1.5);
  expect(stored()).toMatchObject({
    riskRewardRatio: "3:1", singleTradeRisk: "1.5", multipleTradeRisk: "6",
    riskRules: RISK_RULES.filter((_, index) => index !== 6).map((rule) => rule.id),
  });
  expect(screen.getByRole("button", { name: "Next" })).toBeVisible();
  await selectPage(PAGE_TITLES.length);
  await user.click(screen.getByRole("button", { name: "Close My Trade Plan" }));
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(15);
  expect(screen.getByRole("status")).toHaveTextContent(`Page 15 of ${PAGE_TITLES.length}`);
  expect(screen.getByLabelText("Minimum reward ratio")).toHaveValue("3:1");
  expect(screen.getByLabelText("Single trade risk (%)")).toHaveValue(1.5);
  expect(screen.getByLabelText("Multiple trades risk (%)")).toHaveValue(6);
  for (const [index, rule] of RISK_RULES.entries()) {
    expect(screen.getByRole("checkbox", { name: rule.text })).toHaveProperty("checked", index !== 6);
  }
});

test("risk management part two preserves five independent checkbox selections across reload", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(16);
  expect(screen.getByRole("heading", { name: "My Risk Management Rules Part 2" })).toBeVisible();
  expect(screen.getByText("It is critical to list the rules that I will actively follow in managing my risk.")).toBeVisible();
  const instructions = screen.getByText("Check the appropriate boxes to complete your Risk Management Part 2 rules.");
  expect(instructions.tagName).toBe("EM");
  expect(instructions).toHaveClass("text-xs");
  expect(screen.getAllByRole("checkbox")).toHaveLength(6);
  for (const rule of RISK_PART_TWO_RULES) {
    expect(screen.getByRole("checkbox", { name: rule })).not.toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: rule }));
  }
  await user.click(screen.getByRole("checkbox", { name: RISK_PART_TWO_RULES[1] }));
  await user.type(screen.getByLabelText("Additional risk management considerations"), "Review exposure weekly");
  await user.click(screen.getByLabelText("Use notes only"));
  expect(screen.getByRole("checkbox", { name: RISK_PART_TWO_RULES[0] })).toBeVisible();
  expect(stored().riskPartTwoNotesOnly).toBe(true);
  expect(stored().riskPartTwoRules).toEqual(RISK_PART_TWO_RULES.filter((_, index) => index !== 1));
  expect(stored().riskRules).toEqual([]);
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "My Trading Execution – Managing the Trade" })).toBeVisible();
  await selectPage(PAGE_TITLES.length);
  await user.click(screen.getByRole("button", { name: "Close My Trade Plan" }));
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(16);
  expect(screen.getByRole("status")).toHaveTextContent(`Page 16 of ${PAGE_TITLES.length}`);
  expect(screen.getByLabelText("Additional risk management considerations")).toHaveValue("Review exposure weekly");
  expect(screen.getByLabelText("Use notes only")).toBeChecked();
  for (const [index, rule] of RISK_PART_TWO_RULES.entries()) {
    expect(screen.getByRole("checkbox", { name: rule })).toHaveProperty("checked", index !== 1);
  }
});

test("trade management rules save dropdowns and notes independently across reload", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(17);
  expect(screen.getByRole("status")).toHaveTextContent(`Page 17 of ${PAGE_TITLES.length}`);
  expect(screen.getByRole("heading", { name: "My Trading Execution – Managing the Trade" })).toBeVisible();
  expect(screen.getByText("Once my trade has met entry and begins to move in my favor, I will begin moving my Stop Loss Order to lock in any profits.")).toBeVisible();
  const instructions = screen.getByText("Select the appropriate values for each field to complete your rules for establishing how a trade will be managed.");
  expect(instructions.tagName).toBe("EM");
  expect(instructions).toHaveClass("text-xs");
  expect(options("Break-even reward ratio")).toEqual(["10:1", "9:1", "8:1", "7:1", "6:1", "5:1", "4:1", "3:1", "2:1", "1:1"]);
  expect(options("Trade management timeframe")).toEqual(["LTF", "ITF", "HTF"]);
  expect(screen.getByLabelText("Break-even reward ratio")).toHaveValue("");
  expect(screen.getByLabelText("Trade management timeframe")).toHaveValue("");
  await user.selectOptions(screen.getByLabelText("Break-even reward ratio"), "3:1");
  await user.selectOptions(screen.getByLabelText("Trade management timeframe"), "ITF");
  fireEvent.change(screen.getByLabelText("Additional trade management considerations"), { target: { value: "Wait for confirmation\nThen trail" } });
  await user.click(screen.getByLabelText("Use notes only"));
  expect(screen.getByLabelText("Break-even reward ratio")).toHaveValue("3:1");
  expect(screen.getByLabelText("Trade management timeframe")).toBeVisible();
  expect(stored()).toMatchObject({
    breakEvenRatio: "3:1", managementTimeframe: "ITF",
    managementNotes: "Wait for confirmation\nThen trail", managementNotesOnly: true,
    riskPartTwoNotesOnly: false,
  });
  await user.click(screen.getByRole("button", { name: "Previous" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByLabelText("Break-even reward ratio")).toHaveValue("3:1");
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "My Risk Management Rules Part 3" })).toBeVisible();
  await selectPage(PAGE_TITLES.length);
  await user.click(screen.getByRole("button", { name: "Close My Trade Plan" }));
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(17);
  expect(screen.getByLabelText("Break-even reward ratio")).toHaveValue("3:1");
  expect(screen.getByLabelText("Trade management timeframe")).toHaveValue("ITF");
  expect(screen.getByLabelText("Additional trade management considerations")).toHaveValue("Wait for confirmation\nThen trail");
  expect(screen.getByLabelText("Use notes only")).toBeChecked();
});

test("risk management part three has forty dollar fields and five weekend choices that persist", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(18);
  expect(screen.getByRole("heading", { name: "My Risk Management Rules Part 3" })).toBeVisible();
  expect(screen.getByText("It is critical that I list the rules that I will actively follow to manage my risk.")).toBeVisible();
  const instructions = screen.getByText("Complete the following table to document the Maximum Risk Parameters.");
  expect(instructions.tagName).toBe("EM");
  expect(instructions).toHaveClass("text-xs");
  expect(screen.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual(["Risk Parameters", ...RISK_PARAMETER_MARKETS]);
  expect(screen.getAllByRole("rowheader").map((cell) => cell.textContent)).toEqual([...RISK_PARAMETERS]);
  expect(screen.getAllByRole("spinbutton")).toHaveLength(40);
  expect(within(screen.getByRole("table")).getAllByRole("combobox")).toHaveLength(5);
  for (const [rowIndex, parameter] of RISK_PARAMETERS.entries()) {
    for (const [columnIndex, market] of RISK_PARAMETER_MARKETS.entries()) {
      if (rowIndex === 8) {
        const label = `${parameter} — ${market}`;
        expect(options(label)).toEqual(["Yes", "No"]);
        expect(screen.getByLabelText(label)).toHaveValue("");
        await user.selectOptions(screen.getByLabelText(label), columnIndex % 2 ? "No" : "Yes");
      } else {
        const field = screen.getByLabelText(`${parameter} — ${market} ($)`);
        expect(field).toHaveAttribute("type", "number");
        expect(field).toHaveAttribute("min", "0");
        expect(field).toHaveAttribute("step", "any");
        expect(field).toHaveValue(null);
        fireEvent.change(field, { target: { value: String(rowIndex * 100 + columnIndex + 0.25) } });
      }
    }
  }
  const saved = stored().riskParameters;
  expect(saved).toHaveLength(9);
  expect(saved[0]).toEqual(["0.25", "1.25", "2.25", "3.25", "4.25"]);
  expect(saved[8]).toEqual(["Yes", "No", "Yes", "No", "Yes"]);
  await user.click(screen.getByRole("button", { name: "Previous" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByLabelText("Account Size — Stocks ($)")).toHaveValue(0.25);
  await selectPage(PAGE_TITLES.length);
  await user.click(screen.getByRole("button", { name: "Close My Trade Plan" }));
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(18);
  for (const [rowIndex, parameter] of RISK_PARAMETERS.entries()) {
    for (const [columnIndex, market] of RISK_PARAMETER_MARKETS.entries()) {
      expect(screen.getByLabelText(`${parameter} — ${market}${rowIndex === 8 ? "" : " ($)"}`))
        .toHaveValue(rowIndex === 8 ? saved[rowIndex][columnIndex] : Number(saved[rowIndex][columnIndex]));
    }
  }
});

test("report rows add, delete, and retain source selections and notes after reload", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(19);
  expect(screen.getByRole("heading", { name: "My Trading Execution – Checking Reports" })).toBeVisible();
  expect(screen.getByText("Being aware of when market reports are published is critical to being prepared for possible shifts in price action.")).toBeVisible();
  const instructions = screen.getByText("Select which reports you will include in your trading execution and the how you plan to use them.");
  expect(instructions.tagName).toBe("EM");
  expect(instructions).toHaveClass("text-xs");
  expect(screen.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual(["Report Name", "Report Notes and Purpose"]);
  expect(within(screen.getByRole("table")).getAllByRole("combobox")).toHaveLength(1);
  expect(options("Report 1 name")).toEqual([...REPORT_SOURCES]);
  expect(screen.getByLabelText("Report 1 name")).toHaveValue("");
  expect(screen.getByRole("button", { name: "Delete Report 1" })).toBeDisabled();
  await user.selectOptions(screen.getByLabelText("Report 1 name"), "EarningsWhispers.com");
  fireEvent.change(screen.getByLabelText("Report 1 notes and purpose"), { target: { value: "Review earnings\nBefore entry" } });
  await user.click(screen.getByRole("button", { name: "Add Report" }));
  await user.selectOptions(screen.getByLabelText("Report 2 name"), "Other");
  fireEvent.change(screen.getByLabelText("Report 2 notes and purpose"), { target: { value: "My custom report" } });
  await user.click(screen.getByRole("button", { name: "Add Report" }));
  await user.selectOptions(screen.getByLabelText("Report 3 name"), "Finviz.com");
  await user.click(screen.getByRole("button", { name: "Delete Report 2" }));
  expect(screen.getByLabelText("Report 2 name")).toHaveValue("Finviz.com");
  await user.selectOptions(screen.getByLabelText("Report 2 name"), "Other");
  fireEvent.change(screen.getByLabelText("Report 2 notes and purpose"), { target: { value: "My custom report" } });
  expect(stored().reports).toEqual([
    { source: "EarningsWhispers.com", notes: "Review earnings\nBefore entry" },
    { source: "Other", notes: "My custom report" },
  ]);
  await user.click(screen.getByRole("button", { name: "Previous" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByLabelText("Report 1 notes and purpose")).toHaveValue("Review earnings\nBefore entry");
  await selectPage(PAGE_TITLES.length);
  await user.click(screen.getByRole("button", { name: "Close My Trade Plan" }));
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(19);
  expect(screen.getByLabelText("Report 1 name")).toHaveValue("EarningsWhispers.com");
  expect(screen.getByLabelText("Report 2 name")).toHaveValue("Other");
  expect(screen.getByLabelText("Report 2 notes and purpose")).toHaveValue("My custom report");
  await user.click(screen.getByRole("button", { name: "Delete Report 1" }));
  expect(screen.getByLabelText("Report 1 name")).toHaveValue("Other");
  expect(screen.getByRole("button", { name: "Delete Report 1" })).toBeDisabled();
});

test("logging rules offer the requested options and retain both selections after reload", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(20);
  expect(screen.getByRole("heading", { name: "My Trading Execution – Logging the Trade" })).toBeVisible();
  expect(screen.getByText("Logging Trades is critical to helping me stay disciplined with my trading and help me learn from my mistakes and identify what helps meet my goals.")).toBeVisible();
  const instructions = screen.getByText("Select the appropriate values for each field to complete your rules for establishing your plan for logging your trades.");
  expect(instructions.tagName).toBe("EM");
  expect(instructions).toHaveClass("text-xs");
  expect(options("Trade log destination")).toEqual(["My trade logs using the Trade Builder", "My personal trade log"]);
  expect(options("Trade logging schedule")).toEqual(["Immediately", "Twice a day", "At the end of the day", "At the end of the week"]);
  expect(screen.getByLabelText("Trade log destination")).toHaveValue("");
  expect(screen.getByLabelText("Trade logging schedule")).toHaveValue("");
  for (const destination of options("Trade log destination")) {
    await user.selectOptions(screen.getByLabelText("Trade log destination"), destination!);
    expect(stored().tradeLogDestination).toBe(destination);
  }
  for (const schedule of options("Trade logging schedule")) {
    await user.selectOptions(screen.getByLabelText("Trade logging schedule"), schedule!);
    expect(stored().tradeLogSchedule).toBe(schedule);
  }
  await user.click(screen.getByRole("button", { name: "Previous" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByLabelText("Trade log destination")).toHaveValue("My personal trade log");
  await selectPage(PAGE_TITLES.length);
  await user.click(screen.getByRole("button", { name: "Close My Trade Plan" }));
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(20);
  expect(screen.getByLabelText("Trade log destination")).toHaveValue("My personal trade log");
  expect(screen.getByLabelText("Trade logging schedule")).toHaveValue("At the end of the week");
});

test("review notes persist without adding unrequested controls", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(21);
  expect(screen.getByRole("heading", { name: "My Trading Execution – Reviewing Results" })).toBeVisible();
  expect(screen.getByText("I will make sure to not only keep the data results of each trade, but I will also take screen shots with notes. In addition I commit to keeping notes on each trade regarding my feelings, impressions and what I learned from the trade.")).toBeVisible();
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Additional considerations for reviewing results"), { target: { value: "Review screenshots\nNotes {0}" } });
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(21);
  expect(screen.getByLabelText("Additional considerations for reviewing results")).toHaveValue("Review screenshots\nNotes {0}");
});

test("schedule rows have all half-hour options, add/delete controls, and saved notes", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(22);
  expect(screen.getByRole("heading", { name: "My Trading Schedule and Time Commitment" })).toBeVisible();
  const instructions = screen.getByText("Choose the appropriate fields to complete your time commitment plan. Click on the + to add schedule and time commitment consideration.");
  expect(instructions.tagName).toBe("EM");
  expect(instructions).toHaveClass("text-xs");
  expect(screen.getByRole("columnheader", { name: "I Will Devote ..." })).toBeVisible();
  expect(screen.getByRole("button", { name: "Delete Schedule 1" })).toBeDisabled();
  expect(screen.getByLabelText("Schedule 1 hours")).toHaveAttribute("type", "number");
  expect(options("Schedule 1 period")).toEqual(["Day", "Week", "Month"]);
  expect(options("Schedule 1 market")).toEqual(["Stocks", "ETFs", "Futures", "Forex", "Options", "Cryptocurrency"]);
  expect(options("Schedule 1 purpose")).toEqual(["Income", "Wealth"]);
  const expectedTimes = Array.from({ length: 48 }, (_, index) =>
    `${Math.floor(index / 2) % 12 || 12}:${index % 2 ? "30" : "00"} ${index < 24 ? "am" : "pm"}`);
  expect(options("Schedule 1 start time")).toEqual(expectedTimes);
  expect(options("Schedule 1 end time")).toEqual(expectedTimes);
  fireEvent.change(screen.getByLabelText("Schedule 1 hours"), { target: { value: "2.5" } });
  await user.selectOptions(screen.getByLabelText("Schedule 1 period"), "Week");
  await user.selectOptions(screen.getByLabelText("Schedule 1 start time"), "23:30");
  await user.selectOptions(screen.getByLabelText("Schedule 1 end time"), "00:00");
  await user.selectOptions(screen.getByLabelText("Schedule 1 market"), "ETFs");
  await user.selectOptions(screen.getByLabelText("Schedule 1 purpose"), "Wealth");
  await user.click(screen.getByRole("button", { name: "Add Schedule" }));
  expect(screen.getByLabelText("Schedule 2 hours")).toHaveValue(null);
  await user.selectOptions(screen.getByLabelText("Schedule 2 market"), "Forex");
  await user.click(screen.getByRole("button", { name: "Add Schedule" }));
  await user.click(screen.getByRole("button", { name: "Delete Schedule 2" }));
  expect(screen.getByLabelText("Schedule 2 market")).toHaveValue("");
  await user.click(screen.getByRole("button", { name: "Delete Schedule 2" }));
  fireEvent.change(screen.getByLabelText("Additional schedule and time considerations"), { target: { value: "Overnight session\nMy notes" } });
  await user.click(screen.getByLabelText("Use notes only"));
  expect(screen.getByLabelText("Schedule 1 start time")).toBeVisible();
  expect(stored()).toMatchObject({
    schedules: [{ hours: "2.5", period: "Week", start: "23:30", end: "00:00", market: "ETFs", purpose: "Wealth" }],
    scheduleNotes: "Overnight session\nMy notes", scheduleNotesOnly: true,
  });
  await user.click(screen.getByRole("button", { name: "Previous" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByLabelText("Schedule 1 hours")).toHaveValue(2.5);
  await user.click(screen.getByRole("button", { name: "Close My Trade Plan" }));
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(22);
  expect(screen.getByLabelText("Schedule 1 hours")).toHaveValue(2.5);
  expect(screen.getByLabelText("Schedule 1 period")).toHaveValue("Week");
  expect(screen.getByLabelText("Schedule 1 start time")).toHaveValue("23:30");
  expect(screen.getByLabelText("Schedule 1 end time")).toHaveValue("00:00");
  expect(screen.getByLabelText("Schedule 1 market")).toHaveValue("ETFs");
  expect(screen.getByLabelText("Schedule 1 purpose")).toHaveValue("Wealth");
  expect(screen.getByLabelText("Additional schedule and time considerations")).toHaveValue("Overnight session\nMy notes");
  expect(screen.getByLabelText("Use notes only")).toBeChecked();
  expect(screen.getByRole("button", { name: "Delete Schedule 1" })).toBeDisabled();
});

test("emergency contacts have six columns, prefilled websites, and saved repeatable rows", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(23);
  expect(screen.getByRole("heading", { name: "Appendix A – Emergency Contact Reference Data" })).toBeVisible();
  expect(screen.getByText("I must always be ready for emergency situations with contingency plans and the appropriate emergency contact information to quickly address any issue that may arise.")).toBeVisible();
  expect(screen.getByText("Complete the following table to document the emergency contact information. Click on the + to add schedule and time commitment considerations.").tagName).toBe("EM");
  expect(screen.getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual(EMERGENCY_CONTACT_FIELDS.map(({ label }) => label));
  expect(screen.getByLabelText("Emergency contact 1 — Website")).toHaveValue("http://");
  expect(screen.getByLabelText("Emergency contact 1 — Phone #")).toHaveAttribute("type", "tel");
  expect(screen.getByRole("button", { name: "Delete Emergency Contact 1" })).toBeDisabled();
  const values = ["Broker help", "Example company", "https://example.test", "24/7 UTC", "+1 555 0100 ext. 3", "Support desk"];
  for (const [i, { label }] of EMERGENCY_CONTACT_FIELDS.entries()) {
    fireEvent.change(screen.getByLabelText(`Emergency contact 1 — ${label}`), { target: { value: values[i] } });
  }
  await user.click(screen.getByRole("button", { name: "Add Emergency Contact" }));
  expect(screen.getByLabelText("Emergency contact 2 — Website")).toHaveValue("http://");
  await user.click(screen.getByRole("button", { name: "Delete Emergency Contact 2" }));
  await user.click(screen.getByRole("button", { name: "Previous" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByLabelText("Emergency contact 1 — Purpose")).toHaveValue("Broker help");
  unmount();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(23);
  for (const [i, { label }] of EMERGENCY_CONTACT_FIELDS.entries()) {
    expect(screen.getByLabelText(`Emergency contact 1 — ${label}`)).toHaveValue(values[i]);
  }
});

test("Finish and Download prints all sections without losing edits or closing the worksheet", async () => {
  const user = userEvent.setup();
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  const title = document.title;
  const plan = createMyTradePlan();
  plan.title = "My PDF document";
  plan.why = "My reason for trading";
  plan.emergencyContacts[0].phone = "+1 555 0100";
  window.localStorage.setItem(MY_TRADE_PLAN_STORAGE_KEY, JSON.stringify(plan));
  const { unmount } = render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(23);
  await user.click(screen.getByRole("button", { name: "Finish and Download" }));
  expect(print).toHaveBeenCalledOnce();
  expect(document.body.dataset.printReport).toBe("my-trade-plan");
  expect(document.title).toBe("My PDF document");
  const report = screen.getByRole("article", { name: "Printable trading plan", hidden: true });
  expect(report.querySelectorAll("section[data-plan-page]")).toHaveLength(23);
  expect(report).toHaveTextContent("My reason for trading");
  expect(report).toHaveTextContent("+1 555 0100");
  expect(stored()).toEqual(plan);
  fireEvent(window, new Event("afterprint"));
  expect(document.body.dataset.printReport).toBeUndefined();
  expect(document.title).toBe(title);
  expect(screen.getByRole("dialog")).toBeVisible();
  expect(screen.queryByRole("article", { hidden: true })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Finish and Download" }));
  unmount();
  expect(document.body.dataset.printReport).toBeUndefined();
  expect(document.title).toBe(title);
});

test("every page has a magnifying-glass Preview that prints the complete current plan", async () => {
  const user = userEvent.setup();
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  const title = document.title;
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  fireEvent.change(screen.getByLabelText("Version #"), { target: { value: "Preview draft" } });
  for (let page = 1; page <= PAGE_TITLES.length; page++) {
    const preview = screen.getByRole("button", { name: "Preview" });
    expect(preview.parentElement).toContainElement(screen.getByRole("heading", { name: PAGE_TITLES[page - 1] }));
    expect(preview.querySelector("svg.lucide-search")).not.toBeNull();
    fireEvent.click(preview);
    const report = screen.getByRole("article", { name: "Printable trading plan", hidden: true });
    expect(report.querySelectorAll("section[data-plan-page]")).toHaveLength(23);
    expect(report).toHaveTextContent("Preview draft");
    expect(document.body.dataset.printReport).toBe("my-trade-plan");
    fireEvent(window, new Event("afterprint"));
    expect(document.title).toBe(title);
    expect(document.body.dataset.printReport).toBeUndefined();
    expect(screen.getByRole("dialog")).toBeVisible();
    if (page < PAGE_TITLES.length) fireEvent.click(screen.getByRole("button", { name: "Next" }));
  }
  expect(print).toHaveBeenCalledTimes(23);
  expect(stored().version).toBe("Preview draft");
}, 15000);

test("print failures show an error and support retry and closing without losing contacts", async () => {
  const user = userEvent.setup();
  const title = document.title;
  const print = vi.spyOn(window, "print").mockImplementation(() => { throw new Error("Unavailable"); });
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(23);
  fireEvent.change(screen.getByLabelText("Emergency contact 1 — Purpose"), { target: { value: "Support" } });
  await user.click(screen.getByRole("button", { name: "Preview" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Printing could not be opened");
  expect(document.body.dataset.printReport).toBeUndefined();
  expect(document.title).toBe(title);
  expect(stored().emergencyContacts[0].purpose).toBe("Support");
  print.mockImplementation(() => {});
  await user.click(screen.getByRole("button", { name: "Finish and Download" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(document.body.dataset.printReport).toBe("my-trade-plan");
  await user.click(screen.getByRole("button", { name: "Close My Trade Plan" }));
  expect(document.body.dataset.printReport).toBeUndefined();
  expect(document.title).toBe(title);
});

test("all worksheet add buttons display only Add", async () => {
  const user = userEvent.setup();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  for (const page of [5, 6, 7, 8, 10, 12, 14, 19, 22, 23]) {
    await selectPage(page);
    expect(screen.getByRole("button", { name: /^Add / })).toHaveTextContent(/^Add$/);
  }
});

test("storage failures retain unsaved edits and offer a retry without claiming success", async () => {
  const user = userEvent.setup();
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  const setItem = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => { throw new Error("Full"); });
  await user.type(screen.getByLabelText("Version #"), "draft");
  expect(screen.getByRole("alert")).toHaveTextContent("could not be saved");
  expect(screen.queryByText("Saved in this browser")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Version #")).toHaveValue("draft");
  setItem.mockRestore();
  await user.click(screen.getByRole("button", { name: "Retry saving" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(stored().version).toBe("draft");
});

test("printing uses the latest unsaved contact edits without claiming they were saved", async () => {
  const user = userEvent.setup();
  vi.spyOn(window, "print").mockImplementation(() => {});
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  await selectPage(23);
  const setItem = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => { throw new Error("Full"); });
  fireEvent.change(screen.getByLabelText("Emergency contact 1 — Purpose"), { target: { value: "Latest unsaved contact" } });
  await user.click(screen.getByRole("button", { name: "Finish and Download" }));
  expect(screen.getByRole("article", { hidden: true })).toHaveTextContent("Latest unsaved contact");
  expect(screen.getByRole("alert")).toHaveTextContent("could not be saved");
  expect(screen.queryByText("Saved in this browser")).not.toBeInTheDocument();
  expect(window.localStorage.getItem(MY_TRADE_PLAN_STORAGE_KEY)).toBeNull();
  fireEvent(window, new Event("afterprint"));
  setItem.mockRestore();
});

test("invalid saved data is reported and cannot be accidentally overwritten", async () => {
  const user = userEvent.setup();
  window.localStorage.setItem(MY_TRADE_PLAN_STORAGE_KEY, '{"invalid":true}');
  render(<MyTradePlanDialog />);
  await user.click(screen.getByRole("button", { name: "Create my trade plan" }));
  expect(screen.getByRole("alert")).toHaveTextContent("could not be loaded");
  expect(screen.getByLabelText("Document title")).toBeDisabled();
  expect(screen.getByRole("button", { name: "Preview" })).toBeDisabled();
  expect(window.localStorage.getItem(MY_TRADE_PLAN_STORAGE_KEY)).toBe('{"invalid":true}');
  await selectPage(23);
  expect(screen.getByRole("button", { name: "Finish and Download" })).toBeDisabled();
  await selectPage(1);
  window.localStorage.setItem(MY_TRADE_PLAN_STORAGE_KEY, JSON.stringify(createMyTradePlan()));
  await user.click(screen.getByRole("button", { name: "Retry loading" }));
  expect(screen.getByLabelText("Document title")).toBeEnabled();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
