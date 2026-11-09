// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { LanguageProvider, useLanguageSettings } from "@/components/language-provider";
import { MyTradePlanPrint } from "@/components/my-trade-plan-print";
import { PAGE_TITLES } from "@/components/my-trade-plan-dialog";
import { createMyTradePlan, formatPlanSectionTitle, RISK_PART_TWO_RULES, RISK_RULES } from "@/lib/my-trade-plan";
import { translateText } from "@/lib/translations";

afterEach(() => window.localStorage.clear());

test("the complete printable plan includes every section and saved field without editable controls", () => {
  const plan = createMyTradePlan();
  Object.assign(plan, {
    title: "Personal plan", version: "Version unique", author: "Author unique", currencySymbol: "EUR",
    why: "Why unique\nKeep newline", strengths: ["Patience"], improvements: ["Too Emotional"],
    strengthNotes: "Strength note", improvementNotes: "Improvement note",
    incomeNotes: "Income note", wealthNotes: "Wealth note", marketNotes: "Market note", accountNotes: "Account note",
    entryNotes: "Entry note", stopIncomeBuffer: "1.25", stopWealthBuffer: "2.75", stopNotes: "Stop note",
    targetNotes: "Target note", placingOrderRules: ["Order rule unique"],
    riskRules: RISK_RULES.map(({ id }) => id), riskRewardRatio: "7:1", singleTradeRisk: "1.1", multipleTradeRisk: "3.3",
    riskPartTwoRules: [...RISK_PART_TWO_RULES], riskPartTwoNotes: "Risk two note",
    breakEvenRatio: "4:1", managementTimeframe: "HTF", managementNotes: "Management note",
    tradeLogDestination: "My personal trade log", tradeLogSchedule: "Immediately",
    reviewNotes: "Review note", scheduleNotes: "Schedule note",
  });
  plan.incomeGoals[0] = { unit: "$", amount: "123.45", period: "day", market: "Stocks/ETFs" };
  plan.wealthGoals[0] = { unit: "%", amount: "6.25", period: "year", market: "Options" };
  plan.markets = [{ assetClass: "Futures", watchListRules: "Watch list unique" }];
  plan.accounts = [{ type: "Forex", broker: "Oanda", amount: "4567.89" }];
  plan.timeframes[0] = ["Monthly", "Weekly", "Daily", "5 mins"];
  plan.entries = [{ tradeType: "Income Trade", entryRules: "Entry rule unique" }];
  plan.targetRules = [{ purpose: "Wealth Trades", buffer: "8.75", timeframe: "ITF" }];
  plan.graphics.blueprintSteps = { included: true, precedingParagraph: "Included graphic paragraph" };
  plan.graphics.decisionMatrix = { included: false, precedingParagraph: "Excluded graphic paragraph" };
  plan.riskParameters[0][0] = "9500";
  plan.riskParameters[8][0] = "Yes";
  plan.reports = [{ source: "Finviz.com", notes: "Report note unique" }];
  plan.schedules = [{ hours: "2.5", period: "Week", start: "23:30", end: "00:00", market: "ETFs", purpose: "Income" }];
  plan.emergencyContacts = [{ purpose: "Emergency unique", company: "Company unique", website: "https://example.test",
    serviceHours: "24/7 UTC", phone: "+1 (555) 0100", primaryContact: "Support unique" }];
  const saved = JSON.stringify(plan);
  render(<MyTradePlanPrint plan={plan} titles={PAGE_TITLES} />);
  const report = screen.getByRole("article", { name: "Printable trading plan" });
  expect(report.querySelectorAll("section")).toHaveLength(23);
  expect(within(report).getByRole("heading", { level: 1, name: "Personal plan" })).toBeInTheDocument();
  for (const [index, title] of [
    "My Trading Purpose", "My Strengths", "My Areas of Improvement", "My Income Goals",
    "My Wealth Goals", "Markets I Trade", "My Trading and Investing Accounts", ...PAGE_TITLES.slice(8),
  ].entries()) {
    expect(within(report).getByRole("heading", { level: 2, name: formatPlanSectionTitle(index + 1, title) })).toBeInTheDocument();
  }
  expect(report.querySelector('[data-plan-page="1"]')).toHaveClass("worksheet-cover");
  expect(report.querySelector('[data-plan-page="23"]')).toHaveClass("worksheet-appendix");
  expect(within(report).getAllByRole("table")).toHaveLength(3);
  expect(report).toHaveTextContent("$123.45 increase per day trading Stocks/ETFs.");
  expect(report).toHaveTextContent("Forex account with Oanda containing EUR4567.89.");
  expect(report).toHaveTextContent("8.75% before the first opposing ITF zone.");
  expect(report).toHaveTextContent("I will devote 2.5 hours per Week from 11:30 pm to 12:00 am to trade ETFs for Income.");
  for (const text of [
    "Personal plan", "Version unique", "Author unique", "EUR", "Why unique", "Keep newline",
    "Patience", "Too Emotional", "Strength note", "Improvement note", "$123.45", "%6.25", "Income note", "Wealth note",
    "Watch list unique", "Market note", "Oanda", "4567.89", "Account note", "5 mins",
    "Entry rule unique", "Entry note", "1.25", "2.75", "Stop note", "8.75", "ITF", "Target note",
    "Included graphic paragraph", "Order rule unique", "7:1", "1.1", "3.3", "Risk two note",
    "4:1", "HTF", "Management note", "$9500", "Yes", "Finviz.com", "Report note unique",
    "My personal trade log", "Immediately", "Review note", "2.5", "Week", "11:30 pm", "12:00 am",
    "ETFs", "Income", "Schedule note", "Emergency unique", "Company unique", "https://example.test",
    "24/7 UTC", "+1 (555) 0100", "Support unique",
  ]) expect(report, text).toHaveTextContent(text);
  for (const rule of [...RISK_RULES.map(({ text }) => text), ...RISK_PART_TWO_RULES]) expect(report).toHaveTextContent(rule);
  expect(within(report).getAllByRole("img")).toHaveLength(1);
  expect(report).not.toHaveTextContent("Excluded graphic paragraph");
  expect(report.querySelector("input, textarea, select, button")).toBeNull();
  const notes = report.querySelectorAll(".worksheet-notes");
  expect(notes).toHaveLength(13);
  for (const note of notes) {
    expect(note.querySelector("h3")).toBeNull();
    expect(note.children).toHaveLength(1);
    expect(note.firstElementChild?.tagName).toBe("P");
  }
  expect(JSON.stringify(plan)).toBe(saved);
});

test("the document omits empty notes and unused repeatable rows without dropping partially completed rows", () => {
  const plan = createMyTradePlan();
  plan.accounts[0].broker = "Other";
  plan.incomeGoals[0].amount = "0";
  plan.markets[0].watchListRules = "My partial watch list";
  plan.reports[0].notes = "Report notes without a source";
  render(<MyTradePlanPrint plan={plan} titles={PAGE_TITLES} />);
  const report = screen.getByRole("article");
  expect(report.querySelectorAll(".worksheet-notes")).toHaveLength(0);
  expect(report.querySelectorAll('[data-plan-page="8"] li')).toHaveLength(1);
  expect(report).toHaveTextContent("Other");
  expect(report.querySelectorAll('[data-plan-page="5"] li')).toHaveLength(1);
  expect(report).toHaveTextContent("0 increase per");
  expect(report).toHaveTextContent("My partial watch list");
  expect(report).toHaveTextContent("Report notes without a source");
  expect(report.querySelectorAll('[data-plan-page="9"] tbody tr')).toHaveLength(4);
  expect(report.querySelectorAll('[data-plan-page="18"] tbody tr')).toHaveLength(9);
  expect(report.querySelectorAll('[data-plan-page="23"] tbody tr')).toHaveLength(1);
});

test("page metadata quotes user text as CSS content without creating markup or extra rules", () => {
  const plan = createMyTradePlan();
  plan.title = 'Plan "quoted" \\ notes\n</style><script>alert(1)</script>';
  plan.author = 'Author "; color: red; /*';
  render(<MyTradePlanPrint plan={plan} titles={PAGE_TITLES} />);
  const report = screen.getByRole("article");
  expect(report.querySelector("script")).toBeNull();
  expect(report.querySelectorAll("style")).toHaveLength(1);
  expect(report.querySelector("style")?.textContent).toContain('Plan \\"quoted\\" \\\\ notes');
  expect(report.querySelector("style")?.textContent).toContain('\\3c /style\\3e ');
  expect(report.querySelector("style")?.textContent).toContain('Author \\"; color: red; /*');
  expect(within(report).getByRole("heading", { level: 1 })).toHaveTextContent('Plan "quoted" \\ notes');
});

test("physical page margins include the title, author, version, disclaimer and localized total-page counters", () => {
  const plan = createMyTradePlan();
  Object.assign(plan, { title: "Sample plan", author: "Example Trader", version: "2.0" });
  render(<MyTradePlanPrint plan={plan} titles={PAGE_TITLES} />);
  const style = screen.getByRole("article").querySelector("style")?.textContent;
  expect(style).toContain('@top-right { content: "Sample plan"; }');
  expect(style).toContain('@bottom-center { content: "Example Trader | Version # 2.0" "\\a "');
  expect(style).toContain("Provided for educational purposes. Users are responsible for all their trading choices.");
  expect(style).toContain('"Page " counter(page) " of " counter(pages) ""');
  expect(style).not.toContain("@top-left");
  expect(style).not.toContain("@bottom-left");
});

test("notes-only preferences hide structured choices in the printout without altering saved data", () => {
  const plan = createMyTradePlan();
  const flags = [
    "strengthNotesOnly", "improvementNotesOnly", "incomeNotesOnly", "wealthNotesOnly", "marketNotesOnly",
    "accountNotesOnly", "entryNotesOnly", "stopNotesOnly", "targetNotesOnly", "riskPartTwoNotesOnly",
    "managementNotesOnly", "scheduleNotesOnly",
  ] as const;
  for (const key of flags) plan[key] = true;
  plan.strengths = ["Patience"];
  plan.markets[0].watchListRules = "Hidden market rule";
  plan.schedules[0].hours = "12.5";
  plan.strengthNotes = "Only strength notes";
  plan.marketNotes = "Only market notes";
  plan.scheduleNotes = "Only schedule notes";
  const saved = JSON.stringify(plan);
  render(<MyTradePlanPrint plan={plan} titles={PAGE_TITLES} />);
  const report = screen.getByRole("article");
  expect(report).not.toHaveTextContent("Patience");
  expect(report).not.toHaveTextContent("Hidden market rule");
  expect(report).not.toHaveTextContent("12.5");
  for (const text of ["Only strength notes", "Only market notes", "Only schedule notes"]) expect(report).toHaveTextContent(text);
  expect(JSON.stringify(plan)).toBe(saved);
});

function LanguageControl() {
  const { selectLanguage } = useLanguageSettings();
  return <button onClick={() => selectLanguage("ar")} data-testid="arabic" />;
}

test("the printable plan translates labels and diagrams, preserves user text, and supports RTL", () => {
  const plan = createMyTradePlan();
  plan.why = "<script>alert('not executable')</script> {0}";
  plan.emergencyContacts[0].primaryContact = "My contact";
  plan.graphics.decisionMatrix.included = true;
  render(<LanguageProvider><LanguageControl /><MyTradePlanPrint plan={plan} titles={PAGE_TITLES} /></LanguageProvider>);
  fireEvent.click(screen.getByTestId("arabic"));
  const report = screen.getByRole("article", { name: translateText("ar", "Printable trading plan") });
  expect(report).toHaveAttribute("lang", "ar");
  expect(report).toHaveAttribute("dir", "rtl");
  expect(report).toHaveTextContent(plan.why);
  expect(report).toHaveTextContent("My contact");
  expect(within(report).getByRole("heading", { level: 2, name: `YQ: ${translateText("ar", "My Trading Purpose")}` })).toBeInTheDocument();
  expect(report.querySelector("script")).toBeNull();
  expect(within(report).getByRole("img", { name: translateText("ar", "Decision Matrix") })).toHaveAttribute("direction", "ltr");
  expect(within(report).getByRole("columnheader", { name: translateText("ar", "Primary Contact") })).toBeInTheDocument();
  expect(report.querySelector('[data-plan-page="23"] bdi')).toHaveAttribute("dir", "ltr");
  const pageStyle = report.querySelector("style")?.textContent;
  expect(pageStyle).toContain(translateText("ar", "Provided for educational purposes. Users are responsible for all their trading choices."));
  expect(pageStyle).toContain('"الصفحة " counter(page) " من " counter(pages)');
});
