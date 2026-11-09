"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Dialog } from "@base-ui/react/dialog";
import { Combobox } from "@base-ui/react/combobox";
import { BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/language-provider";
import { TradePlanGraphic } from "@/components/trade-plan-graphic";
import { MyTradePlanPrint } from "@/components/my-trade-plan-print";
import { cn } from "@/lib/utils";
import {
  ACCOUNT_TYPES, ANALYSIS_COLUMNS, ASSET_CLASSES, BROKERS, createMyTradePlan,
  createEmergencyContact, EMERGENCY_CONTACT_FIELDS, formatScheduleTime,
  GOAL_MARKETS, GOAL_PERIODS, IMPROVEMENTS, MY_TRADE_PLAN_STORAGE_KEY, parseMyTradePlan, PLAN_GRAPHICS,
  REPORT_SOURCES, RISK_PARAMETERS, RISK_PARAMETER_MARKETS, RISK_PART_TWO_RULES, RISK_REWARD_RATIOS, RISK_RULES, WEEKEND_CHOICES,
  SCHEDULE_MARKETS, SCHEDULE_PERIODS, SCHEDULE_PURPOSES, SCHEDULE_TIMES, type ScheduleRow,
  STRENGTHS, TARGET_PURPOSES, TARGET_TIMEFRAMES, TIMEFRAMES, TRADE_LOG_DESTINATIONS, TRADE_LOG_SCHEDULES,
  TRADE_TYPES, TRADING_PURPOSES, type GoalRow, type MyTradePlan,
} from "@/lib/my-trade-plan";

export const PAGE_TITLES = [
  "Page Information for My Trade Plan Document",
  "WHY do I trade?",
  "WHAT are my STRENGTHS as a Trader?",
  "WHERE can I IMPROVE as a Trader?",
  "My INCOME goals are?",
  "My WEALTH goals are?",
  "WHICH markets do I trade?",
  "My Trading and Investing ACCOUNTS are listed as follows:",
  "Multiple Timeframe Analysis",
  "My Trading Execution - Rules for Entry",
  "My Trading Execution – Rules for Stop (Loss Exit)",
  "My Trading Execution – Rules for Target(s) (Profit Exit)",
  "My Trading Execution – Including Graphics",
  "My Trading Execution – Placing the Order",
  "My Risk Management Rules Part 1",
  "My Risk Management Rules Part 2",
  "My Trading Execution – Managing the Trade",
  "My Risk Management Rules Part 3",
  "My Trading Execution – Checking Reports",
  "My Trading Execution – Logging the Trade",
  "My Trading Execution – Reviewing Results",
  "My Trading Schedule and Time Commitment",
  "Appendix A – Emergency Contact Reference Data",
] as const;

const PAGE_NUMBERS = PAGE_TITLES.map((_, index) => index);

const selectClass = "h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";
const textAreaClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

function Field({ label, children }: { label: string; children: ReactNode }) {
  const { text: tx } = useLanguage();
  return <label className="block min-w-0 space-y-1.5 text-sm">
    <span className="font-medium">{tx(label)}</span>
    {children}
  </label>;
}

function Choice({
  label, value, options, onChange, className, optionLabel,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  className?: string;
  optionLabel?: (value: string) => string;
}) {
  const { text: tx } = useLanguage();
  return <select aria-label={tx(label)} value={value} className={cn(selectClass, className)} onChange={(event) => onChange(event.target.value)}>
    <option value="">{tx("Select...")}</option>
    {options.map((option) => <option key={option} value={option}>{optionLabel ? optionLabel(option) : tx(option)}</option>)}
  </select>;
}

function Notes({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <Field label={label}>
    <textarea className={`min-h-32 ${textAreaClass}`} value={value} onChange={(event) => onChange(event.target.value)} />
  </Field>;
}

function ChecklistNotes({
  value, onChange, notesOnly, onNotesOnlyChange, label = "Additional Notes",
}: {
  value: string; onChange: (value: string) => void;
  notesOnly: boolean; onNotesOnlyChange: (value: boolean) => void;
  label?: string;
}) {
  const { text: tx } = useLanguage();
  const id = useId();
  return <div className="space-y-1.5">
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <label htmlFor={id} className="font-medium">{tx(label)}</label>
      <label className="flex items-center gap-2">
        <input type="checkbox" className="size-4 accent-primary" checked={notesOnly}
          onChange={(event) => onNotesOnlyChange(event.target.checked)} />
        <span>{tx("Use notes only")}</span>
      </label>
    </div>
    <textarea id={id} className={`min-h-32 ${textAreaClass}`} value={value}
      onChange={(event) => onChange(event.target.value)} />
  </div>;
}

function Checklist({
  title, options, values, onChange,
}: {
  title: string; options: readonly string[]; values: string[]; onChange: (values: string[]) => void;
}) {
  const { text: tx } = useLanguage();
  return <fieldset className="space-y-3">
    <legend className="sr-only">{tx(title)}</legend>
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => <label key={option} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
        <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-primary"
          checked={values.includes(option)}
          onChange={(event) => onChange(event.target.checked ? [...values, option] : values.filter((value) => value !== option))} />
        <span>{tx(option)}</span>
      </label>)}
    </div>
  </fieldset>;
}

function Goals({
  title, rows, onChange, removable = false,
}: {
  title: string; rows: GoalRow[]; onChange: (rows: GoalRow[]) => void; removable?: boolean;
}) {
  const { text: tx } = useLanguage();
  const id = useId();
  function update(index: number, patch: Partial<GoalRow>) {
    onChange(rows.map((row, i) => i === index ? { ...row, ...patch } : row));
  }
  return <div className="space-y-4">
    {rows.map((row, index) => {
      const name = tx("{0} goal {1}", [tx(title), index + 1]);
      return <fieldset key={index} className="rounded-lg border p-3">
        <legend className="px-1 text-sm font-medium">{tx(name)}</legend>
        <div className={`grid items-end gap-3 ${removable ? "sm:grid-cols-[auto_1fr_1fr_1fr_auto]" : "sm:grid-cols-[auto_1fr_1fr_1fr]"}`}>
          <fieldset className="flex h-11 items-center gap-3">
            <legend className="sr-only">{tx("{0} unit", [tx(name)])}</legend>
            {(["$", "%"] as const).map((unit) => <label key={unit} className="flex items-center gap-1 text-sm">
              <input type="radio" name={`${id}-${index}`} value={unit} checked={row.unit === unit}
                onChange={() => update(index, { unit })} className="accent-primary" />
              <span>{unit}</span>
            </label>)}
          </fieldset>
          <Field label="Increase">
            <Input aria-label={tx("{0} increase", [tx(name)])} type="number" min="0" step="any"
              value={row.amount} onChange={(event) => update(index, { amount: event.target.value })} />
          </Field>
          <Field label="Increase per">
            <Choice label={tx("{0} increase per", [name])} value={row.period} options={GOAL_PERIODS}
              onChange={(period) => update(index, { period })} />
          </Field>
          <Field label="Trading">
            <Choice label={tx("{0} trading", [name])} value={row.market} options={GOAL_MARKETS}
              onChange={(market) => update(index, { market })} />
          </Field>
          {removable ? (
            <Button variant="ghost" size="icon" className="mb-1.5 justify-self-end"
              aria-label={tx("Delete {0}", [tx(name)])} title={tx("Delete {0}", [tx(name)])}
              disabled={rows.length === 1}
              onClick={() => onChange(rows.filter((_, i) => i !== index))}>
              <Trash2 aria-hidden />
            </Button>
          ) : null}
        </div>
      </fieldset>;
    })}
  </div>;
}

export function MyTradePlanDialog() {
  const { text: tx, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [plan, setPlan] = useState<MyTradePlan>(createMyTradePlan);
  const [loaded, setLoaded] = useState(false);
  const [readError, setReadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [printReady, setPrintReady] = useState(false);
  const [printError, setPrintError] = useState("");
  const [pageSearch, setPageSearch] = useState("");
  const originalTitle = useRef<string | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const pageSearchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function resetPrint() {
      if (document.body.dataset.printReport === "my-trade-plan") delete document.body.dataset.printReport;
      if (originalTitle.current !== null) {
        document.title = originalTitle.current;
        originalTitle.current = null;
      }
    }
    function afterPrint() {
      resetPrint();
      setPrintReady(false);
    }
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("afterprint", afterPrint);
      resetPrint();
    };
  }, [open]);

  function finishAndDownload() {
    setPrintError("");
    flushSync(() => setPrintReady(true));
    originalTitle.current ??= document.title;
    document.title = plan.title.trim() || tx("My Trade Plan");
    document.body.dataset.printReport = "my-trade-plan";
    try {
      window.print();
    } catch {
      delete document.body.dataset.printReport;
      document.title = originalTitle.current;
      originalTitle.current = null;
      setPrintReady(false);
      setPrintError("Printing could not be opened. Check your browser settings and try again.");
    }
  }

  function load() {
    try {
      const stored = window.localStorage.getItem(MY_TRADE_PLAN_STORAGE_KEY);
      setPlan(stored === null ? createMyTradePlan() : parseMyTradePlan(stored));
      setLoaded(true);
      setReadError("");
    } catch (error) {
      setReadError(error instanceof Error ? error.message : "Your trade plan could not be loaded.");
    }
  }

  function save(next: MyTradePlan) {
    try {
      window.localStorage.setItem(MY_TRADE_PLAN_STORAGE_KEY, JSON.stringify(next));
      setSaveError("");
      setSaved(true);
    } catch {
      setSaved(false);
      setSaveError("Your latest changes could not be saved. They remain in this window. Check browser storage permissions or available space, then retry saving before reloading.");
    }
  }

  function update(patch: Partial<MyTradePlan>) {
    const next = { ...plan, ...patch };
    setPlan(next);
    save(next);
  }

  function goToPage(next: number) {
    setPage(next);
    if (content.current) content.current.scrollTop = 0;
  }

  function textField(key: "title" | "version" | "author" | "currencySymbol", label: string) {
    return <Field label={label}>
      <Input value={plan[key]} onChange={(event) => update({ [key]: event.target.value })} />
    </Field>;
  }

  const notes = (key: "why" | "strengthNotes" | "improvementNotes" | "incomeNotes" | "wealthNotes" |
    "marketNotes" | "accountNotes" | "entryNotes", label: string) =>
    <Notes label={label} value={plan[key]} onChange={(value) => update({ [key]: value })} />;

  return <Dialog.Root open={open} onOpenChange={(next) => {
    if (next && !loaded) load();
    if (!next) setPrintReady(false);
    setOpen(next);
  }}>
    <Dialog.Trigger render={<Button variant="ghost" size="sm" aria-label={tx("Create my trade plan")} />}>
      <BookOpen aria-hidden />
      <span>{tx("Create my trade plan")}</span>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50" />
      <Dialog.Popup lang={language} dir={language === "ar" || language === "he" ? "rtl" : "ltr"}
        className={cn("fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(56rem,96vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border bg-card shadow-lg outline-none",
          (page === 17 || page === 22) && "w-[min(72rem,96vw)]")}>
        <div className={cn("flex items-start justify-between gap-3 border-b p-5", page === 17 && "p-3")}>
          <Dialog.Title className="text-lg font-semibold">{tx("My Trading Plan Creator")}</Dialog.Title>
          <Dialog.Close render={<Button variant="ghost" size="icon-sm" aria-label={tx("Close My Trade Plan")} />}>
            <X aria-hidden />
          </Dialog.Close>
        </div>
        <div ref={content} className={cn("min-h-0 overflow-y-auto p-5", page === 17 && "p-3")}>
          {readError ? <div role="alert" className="mb-4 space-y-2 text-sm text-destructive">
            <p>{tx("Your trade plan could not be loaded: {0}", [tx(readError)])}</p><Button variant="outline" onClick={load}>{tx("Retry loading")}</Button>
          </div> : null}
          <fieldset disabled={!loaded} className={cn("min-w-0 space-y-5", page === 17 && "space-y-3")}>
            <legend className="sr-only">{tx(PAGE_TITLES[page])}</legend>
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 text-base font-semibold" tabIndex={-1}>{tx(PAGE_TITLES[page])}</h2>
              <Button variant="outline" size="sm" className="shrink-0" disabled={!loaded || !!readError}
                onClick={finishAndDownload}>
                <Search aria-hidden />{tx("Preview")}
              </Button>
            </div>
            {page === 0 ? (
              <p className="text-sm text-muted-foreground">
                {tx("Complete the following questions to finalize the formatting of your Trade Plan Document.")}
              </p>
            ) : null}
            {page === 0 ? <div className="grid gap-4 sm:grid-cols-2">
              {textField("title", "Document title")}
              {textField("version", "Version #")}
              {textField("author", "Author's name")}
              {textField("currencySymbol", "Currency symbol")}
            </div> : null}
            {page === 1 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("My purpose (My Why) for learning to trade is more important than trading itself. Trading is simply the means to help me realize my “Why”.")}
              </p>
              {notes("why", "My why")}
            </> : null}
            {page === 2 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("Certain character traits are important to have to learn how to trade.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Check the appropriate boxes and/or enter additional thoughts regarding your strength in the “Additional Notes” field that best describes your strong character traits.")}</em>
              </p>
              <Checklist title={tx("Trader strengths")} options={STRENGTHS} values={plan.strengths} onChange={(strengths) => update({ strengths })} />
              <ChecklistNotes value={plan.strengthNotes} onChange={(strengthNotes) => update({ strengthNotes })}
                notesOnly={plan.strengthNotesOnly} onNotesOnlyChange={(strengthNotesOnly) => update({ strengthNotesOnly })} />
            </> : null}
            {page === 3 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("Certain character traits will keep me from achieving my goals. Being aware of these will help me manage them and improve my approach.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Check the appropriate boxes and/or enter additional thoughts regarding your areas for improvement in the “Additional Notes” field.")}</em>
              </p>
              <Checklist title={tx("Areas to improve")} options={IMPROVEMENTS} values={plan.improvements} onChange={(improvements) => update({ improvements })} />
              <ChecklistNotes value={plan.improvementNotes} onChange={(improvementNotes) => update({ improvementNotes })}
                notesOnly={plan.improvementNotesOnly} onNotesOnlyChange={(improvementNotesOnly) => update({ improvementNotesOnly })} />
            </> : null}
            {page === 4 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("My objective is to establish realistic goals with regards to my training and investing opportunities. This will help me to stay focused on managing my risk and reward.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Choose the appropriate fields to complete the goal. Click on the + to add another Income Goal.")}</em>
              </p>
              <Goals title={tx("Income")} rows={plan.incomeGoals} onChange={(incomeGoals) => update({ incomeGoals })} removable />
              <Button variant="outline" aria-label={tx("Add Income Goal")} onClick={() => update({
                incomeGoals: [...plan.incomeGoals, { unit: "", amount: "", period: "", market: "" }],
              })}>
                <Plus aria-hidden />{tx("Add")}
              </Button>
              <ChecklistNotes value={plan.incomeNotes} onChange={(incomeNotes) => update({ incomeNotes })}
                notesOnly={plan.incomeNotesOnly} onNotesOnlyChange={(incomeNotesOnly) => update({ incomeNotesOnly })} />
            </> : null}
            {page === 5 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("My objective is to establish realistic goals with regards to my training and investing opportunities. This will help me to stay focused on managing my risk and reward.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Choose the appropriate fields to complete the goal. Click on the + to add another Wealth Goal.")}</em>
              </p>
              <Goals title={tx("Wealth")} rows={plan.wealthGoals} onChange={(wealthGoals) => update({ wealthGoals })} removable />
              <Button variant="outline" aria-label={tx("Add Wealth Goal")} onClick={() => update({
                wealthGoals: [...plan.wealthGoals, { unit: "", amount: "", period: "", market: "" }],
              })}>
                <Plus aria-hidden />{tx("Add")}
              </Button>
              <ChecklistNotes value={plan.wealthNotes} onChange={(wealthNotes) => update({ wealthNotes })}
                notesOnly={plan.wealthNotesOnly} onNotesOnlyChange={(wealthNotesOnly) => update({ wealthNotesOnly })} />
            </> : null}
            {page === 6 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("I want to truly be diversified in my trading activity; therefore I will be trading:")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Choose the appropriate values from the drop down list indicating the markets you intend to trade. Be sure to include the description of rules you will use to build your market specific Watch List. Click on the + to add another Market to trade.")}</em>
              </p>
              <div className="space-y-4">
                {plan.markets.map((market, index) => {
                  function updateMarket(patch: Partial<typeof market>) {
                    update({ markets: plan.markets.map((row, i) => i === index ? { ...row, ...patch } : row) });
                  }
                  return <fieldset key={index} aria-label={tx("Market {0}", [index + 1])} className="rounded-lg border p-3">
                    <div className="grid items-start gap-3 sm:grid-cols-[1fr_2fr_auto]">
                      <Field label="Asset Class">
                        <Choice label={tx("Market {0} Asset Class", [index + 1])} value={market.assetClass}
                          options={ASSET_CLASSES} onChange={(assetClass) => updateMarket({ assetClass })} />
                      </Field>
                      <Field label="Market Watch List Rules">
                        <textarea aria-label={tx("Market {0} Watch List Rules", [index + 1])} rows={2} className={`min-h-16 ${textAreaClass}`}
                          value={market.watchListRules}
                          onChange={(event) => updateMarket({ watchListRules: event.target.value })} />
                      </Field>
                      <Button variant="ghost" size="icon" className="justify-self-end sm:mt-7"
                        aria-label={tx("Delete Market {0}", [index + 1])} title={tx("Delete Market {0}", [index + 1])}
                        disabled={plan.markets.length === 1}
                        onClick={() => update({ markets: plan.markets.filter((_, i) => i !== index) })}>
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  </fieldset>;
                })}
              </div>
              <Button variant="outline" aria-label={tx("Add Market")} onClick={() => update({
                markets: [...plan.markets, { assetClass: "", watchListRules: "" }],
              })}>
                <Plus aria-hidden />{tx("Add")}
              </Button>
              <ChecklistNotes label="Additional trading market considerations"
                value={plan.marketNotes} onChange={(marketNotes) => update({ marketNotes })}
                notesOnly={plan.marketNotesOnly} onNotesOnlyChange={(marketNotesOnly) => update({ marketNotesOnly })} />
            </> : null}
            {page === 7 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("This section of my trading plan takes inventory of the accounts I have and the amount of money in each one.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Choose the appropriate fields to complete your account listing. Click on the + to add another account listing.")}</em>
              </p>
              <div className="space-y-4">
                {plan.accounts.map((account, index) => {
                  function updateAccount(patch: Partial<typeof account>) {
                    update({ accounts: plan.accounts.map((row, i) => i === index ? { ...row, ...patch } : row) });
                  }
                  return <fieldset key={index} aria-label={tx("Account {0}", [index + 1])} className="rounded-lg border p-3">
                    <div className="grid items-start gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                      <Field label="Account type">
                        <Choice label={tx("Account {0} type", [index + 1])} value={account.type} options={ACCOUNT_TYPES} onChange={(type) => updateAccount({ type })} />
                      </Field>
                      <Field label="Account with">
                        <Choice label={tx("Account {0} with", [index + 1])} value={account.broker} options={BROKERS} onChange={(broker) => updateAccount({ broker })} />
                      </Field>
                      <Field label={tx("Containing ({0})", [plan.currencySymbol || "$"])}>
                        <Input aria-label={tx("Account {0} amount", [index + 1])} type="number" min="0" step="any" value={account.amount}
                          onChange={(event) => updateAccount({ amount: event.target.value })} />
                      </Field>
                      <Button variant="ghost" size="icon" className="justify-self-end sm:mt-7"
                        aria-label={tx("Delete Account {0}", [index + 1])} title={tx("Delete Account {0}", [index + 1])}
                        disabled={plan.accounts.length === 1}
                        onClick={() => update({ accounts: plan.accounts.filter((_, i) => i !== index) })}>
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  </fieldset>;
                })}
              </div>
              <Button variant="outline" aria-label={tx("Add Account")} onClick={() => update({
                accounts: [...plan.accounts, { type: "", broker: "", amount: "" }],
              })}>
                <Plus aria-hidden />{tx("Add")}
              </Button>
              <ChecklistNotes label="Additional account information"
                value={plan.accountNotes} onChange={(accountNotes) => update({ accountNotes })}
                notesOnly={plan.accountNotesOnly} onNotesOnlyChange={(accountNotesOnly) => update({ accountNotesOnly })} />
            </> : null}
            {page === 8 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("Multiple timeframe analysis is critical for navigating through the Blueprint steps when planning and executing trades.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Complete the following table to document the timeframes to be used when trading for the various purposes.")}</em>
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-2xl border-collapse text-sm">
                  <caption className="sr-only">{tx("Timeframes by trading purpose")}</caption>
                  <thead><tr>
                    {["Trading Purpose", ...ANALYSIS_COLUMNS].map((column) => <th key={column} scope="col" className="p-2 text-start">{tx(column)}</th>)}
                  </tr></thead>
                  <tbody>{TRADING_PURPOSES.map((purpose, row) => <tr key={purpose} className="border-t">
                    <th scope="row" className="p-2 text-start font-medium">{tx(purpose)}</th>
                    {ANALYSIS_COLUMNS.map((column, col) => <td key={column} className="p-2">
                      <Choice label={tx("{0} {1}", [tx(purpose), tx(column)])} value={plan.timeframes[row][col]} options={TIMEFRAMES}
                        onChange={(value) => update({
                          timeframes: plan.timeframes.map((cells, r) =>
                            r === row ? cells.map((cell, c) => c === col ? value : cell) : cells)
                        })} />
                    </td>)}
                  </tr>)}</tbody>
                </table>
              </div>
            </> : null}
            {page === 9 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("Having defined rules for entering a trade helps to keep my trading rule-based and unemotional. Following contains the rules and conditions for each type of entry I will use when trading.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Select your trade type and entry rules.")}</em>
              </p>
              <div className="space-y-4">
                {plan.entries.map((entry, index) => {
                  function updateEntry(patch: Partial<typeof entry>) {
                    update({ entries: plan.entries.map((row, i) => i === index ? { ...row, ...patch } : row) });
                  }
                  return <fieldset key={index} aria-label={tx("Entry {0}", [index + 1])} className="rounded-lg border p-3">
                    <div className="grid items-start gap-3 sm:grid-cols-[1fr_2fr_auto]">
                      <Field label="Trade Type">
                        <Choice label={index === 0 ? tx("Trade Type") : tx("Entry {0} Trade Type", [index + 1])}
                          value={entry.tradeType} options={TRADE_TYPES} onChange={(tradeType) => updateEntry({ tradeType })} />
                      </Field>
                      <Field label="Entry Rules">
                        <textarea aria-label={index === 0 ? tx("Entry Rules") : tx("Entry {0} Rules", [index + 1])}
                          rows={2} className={`min-h-16 ${textAreaClass}`} value={entry.entryRules}
                          onChange={(event) => updateEntry({ entryRules: event.target.value })} />
                      </Field>
                      <Button variant="ghost" size="icon" className="justify-self-end sm:mt-7"
                        aria-label={tx("Delete Entry {0}", [index + 1])} title={tx("Delete Entry {0}", [index + 1])}
                        disabled={plan.entries.length === 1}
                        onClick={() => update({ entries: plan.entries.filter((_, i) => i !== index) })}>
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  </fieldset>;
                })}
              </div>
              <Button variant="outline" aria-label={tx("Add Entry Rule")} onClick={() => update({
                entries: [...plan.entries, { tradeType: "", entryRules: "" }],
              })}>
                <Plus aria-hidden />{tx("Add")}
              </Button>
              <ChecklistNotes label="Additional considerations for rules of entry"
                value={plan.entryNotes} onChange={(entryNotes) => update({ entryNotes })}
                notesOnly={plan.entryNotesOnly} onNotesOnlyChange={(entryNotesOnly) => update({ entryNotesOnly })} />
            </> : null}
            {page === 10 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("Managing my risk is one of the most important keys to being able to trade with skill and confidence. My rules for how to exit a trade when the trade is not going in my favor are as follows.")}
              </p>
              <p className="text-sm text-muted-foreground">
                {tx("The Stop Loss should be placed beyond the Distal line using a Buffer Margin of:")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Input the % buffer amount for Income and Wealth Trades.")}</em>
              </p>
              <table className="w-full border-collapse text-sm">
                <thead><tr>
                  <th scope="col" className="p-2 text-start">{tx("Trading Purpose")}</th>
                  <th scope="col" className="p-2 text-start">{tx("Buffer Amount")}</th>
                </tr></thead>
                <tbody>
                  {([
                    ["Income Trades", "stopIncomeBuffer"],
                    ["Wealth Trades", "stopWealthBuffer"],
                  ] as const).map(([purpose, key]) => <tr key={key} className="border-t">
                    <th scope="row" className="p-2 text-start font-medium">{tx(purpose)}</th>
                    <td className="p-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input aria-label={tx("{0} buffer amount (%)", [tx(purpose)])} className="w-24"
                          value={plan[key]} onChange={(event) => update({ [key]: event.target.value })} />
                        <span>{tx("% of Daily ATR")}</span>
                      </div>
                    </td>
                  </tr>)}
                </tbody>
              </table>
              <ChecklistNotes label="Additional considerations for stop loss"
                value={plan.stopNotes} onChange={(stopNotes) => update({ stopNotes })}
                notesOnly={plan.stopNotesOnly} onNotesOnlyChange={(stopNotesOnly) => update({ stopNotesOnly })} />
            </> : null}
            {page === 11 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("Knowing when to exit a trade is directly related to whether the trade will be profitable or not. The following are my rules to help me achieve a profitable exit.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Select the appropriate values for each field to complete your rule for determining the Target for each trading purpose.")}</em>
              </p>
              <table className="w-full border-collapse text-sm">
                <thead><tr>
                  <th scope="col" className="p-2 text-start">{tx("Trading Purpose")}</th>
                  <th scope="col" className="p-2 text-start">{tx("Target Rule")}</th>
                </tr></thead>
                <tbody>{plan.targetRules.map((rule, index) => {
                  function updateRule(patch: Partial<typeof rule>) {
                    update({ targetRules: plan.targetRules.map((row, i) => i === index ? { ...row, ...patch } : row) });
                  }
                  return <tr key={index} className="border-t">
                    <td className="p-2 align-top">
                      <Choice label={tx("Target {0} trading purpose", [index + 1])} value={rule.purpose}
                        options={TARGET_PURPOSES} onChange={(purpose) => updateRule({ purpose })} />
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{tx("Target is placed")}</span>
                        <Input aria-label={tx("Target {0} buffer (%)", [index + 1])} className="w-20"
                          value={rule.buffer} onChange={(event) => updateRule({ buffer: event.target.value })} />
                        <span>{tx("% before the first opposing")}</span>
                        <div className="w-28">
                          <Choice label={tx("Target {0} timeframe", [index + 1])} value={rule.timeframe}
                            options={TARGET_TIMEFRAMES} onChange={(timeframe) => updateRule({ timeframe })} />
                        </div>
                        <span>{tx("zone")}</span>
                        <Button variant="ghost" size="icon" aria-label={tx("Delete Target {0}", [index + 1])}
                          title={tx("Delete Target {0}", [index + 1])} disabled={plan.targetRules.length === 1}
                          onClick={() => update({ targetRules: plan.targetRules.filter((_, i) => i !== index) })}>
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>;
                })}</tbody>
              </table>
              <Button variant="outline" aria-label={tx("Add Target")} onClick={() => update({
                targetRules: [...plan.targetRules, { purpose: "", buffer: "", timeframe: "" }],
              })}>
                <Plus aria-hidden />{tx("Add")}
              </Button>
              <ChecklistNotes label="Additional target-exit considerations"
                value={plan.targetNotes} onChange={(targetNotes) => update({ targetNotes })}
                notesOnly={plan.targetNotesOnly} onNotesOnlyChange={(targetNotesOnly) => update({ targetNotesOnly })} />
            </> : null}
            {page === 12 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("Include the following graphics in the Trading Execution section of my Trading Plan")}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-xl border-collapse text-sm">
                  <thead><tr>
                    {["Graphic", "Thumbnail", "Preceding Paragraph"].map((heading) =>
                      <th key={heading} scope="col" className="p-2 text-start">{tx(heading)}</th>)}
                  </tr></thead>
                  <tbody>{PLAN_GRAPHICS.map((graphic) => {
                    const value = plan.graphics[graphic.id];
                    function updateGraphic(patch: Partial<typeof value>) {
                      update({ graphics: { ...plan.graphics, [graphic.id]: { ...value, ...patch } } });
                    }
                    return <tr key={graphic.id} className="border-t">
                      <th scope="row" className="p-2 text-start align-top font-medium">
                        <label className="flex items-start gap-2">
                          <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-primary"
                            checked={value.included} onChange={(event) => updateGraphic({ included: event.target.checked })} />
                          <span>{tx(graphic.title)}</span>
                        </label>
                      </th>
                      <td className="w-1/3 p-2 align-top">
                        <TradePlanGraphic id={graphic.id} title={graphic.title} />
                      </td>
                      <td className="w-1/3 p-2 align-top">
                        <textarea aria-label={tx("{0} preceding paragraph", [tx(graphic.title)])} rows={3}
                          className={`min-h-24 ${textAreaClass}`} value={value.precedingParagraph}
                          onChange={(event) => updateGraphic({ precedingParagraph: event.target.value })} />
                      </td>
                    </tr>;
                  })}</tbody>
                </table>
              </div>
            </> : null}
            {page === 13 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("Placing the order of a trade must be checked and double checked. There is a set process I go through when placing a trade.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("List your complete rules and processes for placing your order.")}</em>
              </p>
              <table className="w-full border-collapse text-sm">
                <thead><tr>
                  <th scope="col" className="p-2 text-start">{tx("Placing Order Rules")}</th>
                </tr></thead>
                <tbody>{plan.placingOrderRules.map((rule, index) => <tr key={index} className="border-t">
                  <td className="p-2">
                    <div className="flex items-start gap-3">
                      <textarea aria-label={tx("Placing order rule {0}", [index + 1])} rows={3}
                        className={`min-h-24 ${textAreaClass}`} value={rule}
                        onChange={(event) => update({
                          placingOrderRules: plan.placingOrderRules.map((row, i) =>
                            i === index ? event.target.value : row)
                        })} />
                      <Button variant="ghost" size="icon" aria-label={tx("Delete Order Rule {0}", [index + 1])}
                        title={tx("Delete Order Rule {0}", [index + 1])} disabled={plan.placingOrderRules.length === 1}
                        onClick={() => update({ placingOrderRules: plan.placingOrderRules.filter((_, i) => i !== index) })}>
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  </td>
                </tr>)}</tbody>
              </table>
              <Button variant="outline" aria-label={tx("Add Order Rule")}
                onClick={() => update({ placingOrderRules: [...plan.placingOrderRules, ""] })}>
                <Plus aria-hidden />{tx("Add")}
              </Button>
            </> : null}
            {page === 14 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("It is critical to list the rules that I will actively follow in managing my risk. I apply Core Strategy to help find quality trading opportunities while I manage my risk and my emotions following a rule-based plan that I follow with committed discipline.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Choose the appropriate fields to complete your Risk Management Part 1 rules.")}</em>
              </p>
              <div className="space-y-4">
                {RISK_RULES.map((rule) => <div key={rule.id} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" aria-label={tx(rule.text)} className="mt-1 size-4 shrink-0 accent-primary"
                    checked={plan.riskRules.includes(rule.id)}
                    onChange={(event) => update({
                      riskRules: event.target.checked
                        ? [...plan.riskRules, rule.id] : plan.riskRules.filter((id) => id !== rule.id)
                    })} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{tx(rule.text)}</span>
                    {rule.id === "rewardRatio" ? <>
                      <div className="w-28">
                        <Choice label="Minimum reward ratio" value={plan.riskRewardRatio} options={RISK_REWARD_RATIOS}
                          onChange={(riskRewardRatio) => update({ riskRewardRatio })} />
                      </div>
                      <span>{tx("to my 1st target.")}</span>
                    </> : null}
                    {rule.id === "singleTrade" || rule.id === "multipleTrades" ? <>
                      <Input aria-label={rule.id === "singleTrade" ? tx("Single trade risk (%)") : tx("Multiple trades risk (%)")}
                        className="w-24" type="number" min="0" step="any"
                        value={rule.id === "singleTrade" ? plan.singleTradeRisk : plan.multipleTradeRisk}
                        onChange={(event) => update({ [rule.id === "singleTrade" ? "singleTradeRisk" : "multipleTradeRisk"]: event.target.value })} />
                      <span>{rule.id === "singleTrade" ? tx("% of my trading account for any single trade.") : tx("% of my account.")}</span>
                    </> : null}
                  </div>
                </div>)}
              </div>
            </> : null}
            {page === 15 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("It is critical to list the rules that I will actively follow in managing my risk.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Check the appropriate boxes to complete your Risk Management Part 2 rules.")}</em>
              </p>
              <div className="space-y-4">
                {RISK_PART_TWO_RULES.map((rule) => <label key={rule} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-primary"
                    checked={plan.riskPartTwoRules.includes(rule)}
                    onChange={(event) => update({
                      riskPartTwoRules: event.target.checked
                        ? [...plan.riskPartTwoRules, rule] : plan.riskPartTwoRules.filter((value) => value !== rule)
                    })} />
                  <span>{tx(rule)}</span>
                </label>)}
              </div>
              <ChecklistNotes label="Additional risk management considerations"
                value={plan.riskPartTwoNotes} onChange={(riskPartTwoNotes) => update({ riskPartTwoNotes })}
                notesOnly={plan.riskPartTwoNotesOnly}
                onNotesOnlyChange={(riskPartTwoNotesOnly) => update({ riskPartTwoNotesOnly })} />
            </> : null}
            {page === 16 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("Once my trade has met entry and begins to move in my favor, I will begin moving my Stop Loss Order to lock in any profits.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Select the appropriate values for each field to complete your rules for establishing how a trade will be managed.")}</em>
              </p>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{tx("Move the stop to BREAK EVEN once the trade has reached")}</span>
                  <div className="w-28">
                    <Choice label="Break-even reward ratio" value={plan.breakEvenRatio} options={RISK_REWARD_RATIOS}
                      onChange={(breakEvenRatio) => update({ breakEvenRatio })} />
                  </div>
                  <span>{tx("in my favor")}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span>{tx("Move stop to lock in any profits every time a new Supply Zone (Short Trades), or Demand Zone (Long Trades) is formed in the")}</span>
                  <div className="w-28">
                    <Choice label="Trade management timeframe" value={plan.managementTimeframe} options={TARGET_TIMEFRAMES}
                      onChange={(managementTimeframe) => update({ managementTimeframe })} />
                  </div>
                  <span>{tx("zone, after trade has met entry")}</span>
                </div>
              </div>
              <ChecklistNotes label="Additional trade management considerations"
                value={plan.managementNotes} onChange={(managementNotes) => update({ managementNotes })}
                notesOnly={plan.managementNotesOnly}
                onNotesOnlyChange={(managementNotesOnly) => update({ managementNotesOnly })} />
            </> : null}
            {page === 17 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("It is critical that I list the rules that I will actively follow to manage my risk.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Complete the following table to document the Maximum Risk Parameters.")}</em>
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-xl table-fixed border-collapse text-xs sm:min-w-0">
                  <colgroup>
                    <col className="w-[24%]" />
                    {RISK_PARAMETER_MARKETS.map((market) => <col key={market} className="w-[15.2%]" />)}
                  </colgroup>
                  <thead><tr>
                    <th scope="col" className="wrap-break-word p-1.5 text-start">{tx("Risk Parameters")}</th>
                    {RISK_PARAMETER_MARKETS.map((market) =>
                      <th key={market} scope="col" className="wrap-break-word p-1.5 text-start">{tx(market)}</th>)}
                  </tr></thead>
                  <tbody>{RISK_PARAMETERS.map((parameter, rowIndex) => <tr key={parameter} className="border-t">
                    <th scope="row" className="wrap-break-word p-1.5 text-start font-medium">{tx(parameter)}</th>
                    {RISK_PARAMETER_MARKETS.map((market, columnIndex) => {
                      const weekend = rowIndex === RISK_PARAMETERS.length - 1;
                      const label = tx(weekend ? "{0} — {1}" : "{0} — {1} ($)", [tx(parameter), tx(market)]);
                      const value = plan.riskParameters[rowIndex][columnIndex];
                      function updateCell(next: string) {
                        update({
                          riskParameters: plan.riskParameters.map((row, i) => i === rowIndex
                            ? row.map((cell, j) => j === columnIndex ? next : cell) : row)
                        });
                      }
                      return <td key={market} className="p-1.5">
                        {weekend ? <Choice label={label} value={value} options={WEEKEND_CHOICES} onChange={updateCell}
                          className="h-8 px-1 text-xs md:text-xs" />
                          : <div className="flex items-center gap-1">
                            <span aria-hidden>$</span>
                            <Input aria-label={label} type="number" min="0" step="any" value={value} className="h-8 px-1 text-xs md:text-xs"
                              onChange={(event) => updateCell(event.target.value)} />
                          </div>}
                      </td>;
                    })}
                  </tr>)}</tbody>
                </table>
              </div>
            </> : null}
            {page === 18 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("Being aware of when market reports are published is critical to being prepared for possible shifts in price action.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Select which reports you will include in your trading execution and the how you plan to use them.")}</em>
              </p>
              <table className="w-full table-fixed border-collapse text-sm">
                <thead><tr>
                  <th scope="col" className="w-2/5 p-2 text-start">{tx("Report Name")}</th>
                  <th scope="col" className="p-2 text-start">{tx("Report Notes and Purpose")}</th>
                </tr></thead>
                <tbody>{plan.reports.map((report, index) => {
                  function updateReport(patch: Partial<typeof report>) {
                    update({ reports: plan.reports.map((row, i) => i === index ? { ...row, ...patch } : row) });
                  }
                  return <tr key={index} className="border-t">
                    <td className="p-2 align-top">
                      <Choice label={tx("Report {0} name", [index + 1])} value={report.source} options={REPORT_SOURCES}
                        onChange={(source) => updateReport({ source })} />
                    </td>
                    <td className="p-2 align-top">
                      <div className="flex items-start gap-2">
                        <textarea aria-label={tx("Report {0} notes and purpose", [index + 1])} rows={3}
                          className={`min-h-24 ${textAreaClass}`} value={report.notes}
                          onChange={(event) => updateReport({ notes: event.target.value })} />
                        <Button variant="ghost" size="icon" aria-label={tx("Delete Report {0}", [index + 1])}
                          title={tx("Delete Report {0}", [index + 1])} disabled={plan.reports.length === 1}
                          onClick={() => update({ reports: plan.reports.filter((_, i) => i !== index) })}>
                          <Trash2 aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>;
                })}</tbody>
              </table>
              <Button variant="outline" aria-label={tx("Add Report")}
                onClick={() => update({ reports: [...plan.reports, { source: "", notes: "" }] })}>
                <Plus aria-hidden />{tx("Add")}
              </Button>
            </> : null}
            {page === 19 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("Logging Trades is critical to helping me stay disciplined with my trading and help me learn from my mistakes and identify what helps meet my goals.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Select the appropriate values for each field to complete your rules for establishing your plan for logging your trades.")}</em>
              </p>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{tx("Every closed trade will be logged in")}</span>
                  <div className="w-full sm:w-80">
                    <Choice label="Trade log destination" value={plan.tradeLogDestination} options={TRADE_LOG_DESTINATIONS}
                      onChange={(tradeLogDestination) => update({ tradeLogDestination })} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span>{tx("Trades will be logged")}</span>
                  <div className="w-full sm:w-64">
                    <Choice label="Trade logging schedule" value={plan.tradeLogSchedule} options={TRADE_LOG_SCHEDULES}
                      onChange={(tradeLogSchedule) => update({ tradeLogSchedule })} />
                  </div>
                  <span>{tx("after the trade has closed.")}</span>
                </div>
              </div>
            </> : null}
            {page === 20 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("I will make sure to not only keep the data results of each trade, but I will also take screen shots with notes. In addition I commit to keeping notes on each trade regarding my feelings, impressions and what I learned from the trade.")}
              </p>
              <Notes label="Additional considerations for reviewing results"
                value={plan.reviewNotes} onChange={(reviewNotes) => update({ reviewNotes })} />
            </> : null}
            {page === 21 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("The following helps me plan out my “day-in-the-life” or week or month of my time as a trader/investor. I will treat my schedule regimen as a work day and commit to consistently executing my plan on a regular consistent basis.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Choose the appropriate fields to complete your time commitment plan. Click on the + to add schedule and time commitment consideration.")}</em>
              </p>
              <table className="w-full table-fixed border-collapse text-sm">
                <thead><tr><th scope="col" className="p-2 text-start">{tx("I Will Devote ...")}</th></tr></thead>
                <tbody>{plan.schedules.map((schedule, index) => {
                  function updateSchedule(patch: Partial<ScheduleRow>) {
                    update({ schedules: plan.schedules.map((row, i) => i === index ? { ...row, ...patch } : row) });
                  }
                  return <tr key={index} className="border-t"><td className="p-2">
                    <div className="flex items-start gap-2">
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                        <Input aria-label={tx("Schedule {0} hours", [index + 1])} className="w-24"
                          type="number" min="0" step="any" value={schedule.hours}
                          onChange={(event) => updateSchedule({ hours: event.target.value })} />
                        <span>{tx("hours per")}</span>
                        <div className="w-32"><Choice label={tx("Schedule {0} period", [index + 1])}
                          value={schedule.period} options={SCHEDULE_PERIODS} onChange={(period) => updateSchedule({ period })} /></div>
                        <span>{tx("from")}</span>
                        <div className="w-36"><Choice label={tx("Schedule {0} start time", [index + 1])}
                          value={schedule.start} options={SCHEDULE_TIMES} optionLabel={(value) => formatScheduleTime(value, language)}
                          onChange={(start) => updateSchedule({ start })} /></div>
                        <span>{tx("to")}</span>
                        <div className="w-36"><Choice label={tx("Schedule {0} end time", [index + 1])}
                          value={schedule.end} options={SCHEDULE_TIMES} optionLabel={(value) => formatScheduleTime(value, language)}
                          onChange={(end) => updateSchedule({ end })} /></div>
                        <span>{tx("to trade")}</span>
                        <div className="w-44"><Choice label={tx("Schedule {0} market", [index + 1])}
                          value={schedule.market} options={SCHEDULE_MARKETS} onChange={(market) => updateSchedule({ market })} /></div>
                        <span>{tx("for")}</span>
                        <div className="w-32"><Choice label={tx("Schedule {0} purpose", [index + 1])}
                          value={schedule.purpose} options={SCHEDULE_PURPOSES} onChange={(purpose) => updateSchedule({ purpose })} /></div>
                      </div>
                      <Button variant="ghost" size="icon" aria-label={tx("Delete Schedule {0}", [index + 1])}
                        title={tx("Delete Schedule {0}", [index + 1])} disabled={plan.schedules.length === 1}
                        onClick={() => update({ schedules: plan.schedules.filter((_, i) => i !== index) })}>
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  </td></tr>;
                })}</tbody>
              </table>
              <Button variant="outline" aria-label={tx("Add Schedule")}
                onClick={() => update({ schedules: [...plan.schedules, { hours: "", period: "", start: "", end: "", market: "", purpose: "" }] })}>
                <Plus aria-hidden />{tx("Add")}
              </Button>
              <ChecklistNotes label="Additional schedule and time considerations"
                value={plan.scheduleNotes} onChange={(scheduleNotes) => update({ scheduleNotes })}
                notesOnly={plan.scheduleNotesOnly} onNotesOnlyChange={(scheduleNotesOnly) => update({ scheduleNotesOnly })} />
            </> : null}
            {page === 22 ? <>
              <p className="text-sm text-muted-foreground">
                {tx("I must always be ready for emergency situations with contingency plans and the appropriate emergency contact information to quickly address any issue that may arise.")}
              </p>
              <p className="text-sm text-muted-foreground">
                <em className="text-xs">{tx("Complete the following table to document the emergency contact information. Click on the + to add schedule and time commitment considerations.")}</em>
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-216 table-fixed border-collapse text-sm">
                  <thead><tr>{EMERGENCY_CONTACT_FIELDS.map(({ key, label }) =>
                    <th key={key} scope="col" className="p-2 text-start">{tx(label)}</th>)}</tr></thead>
                  <tbody>{plan.emergencyContacts.map((contact, index) => <tr key={index} className="border-t">
                    {EMERGENCY_CONTACT_FIELDS.map(({ key, label }) => <td key={key} className="p-2 align-top">
                      <div className="flex items-start gap-1">
                        <Input aria-label={tx("Emergency contact {0} — {1}", [index + 1, tx(label)])}
                          type={key === "phone" ? "tel" : key === "website" ? "url" : "text"}
                          dir={key === "phone" || key === "website" ? "ltr" : undefined}
                          value={contact[key]} onChange={(event) => update({
                            emergencyContacts: plan.emergencyContacts.map((row, i) => i === index
                              ? { ...row, [key]: event.target.value } : row),
                          })} />
                        {key === "primaryContact" ? <Button variant="ghost" size="icon"
                          aria-label={tx("Delete Emergency Contact {0}", [index + 1])}
                          title={tx("Delete Emergency Contact {0}", [index + 1])}
                          disabled={plan.emergencyContacts.length === 1}
                          onClick={() => update({ emergencyContacts: plan.emergencyContacts.filter((_, i) => i !== index) })}>
                          <Trash2 aria-hidden />
                        </Button> : null}
                      </div>
                    </td>)}
                  </tr>)}</tbody>
                </table>
              </div>
              <Button variant="outline" aria-label={tx("Add Emergency Contact")} onClick={() => update({
                emergencyContacts: [...plan.emergencyContacts, createEmergencyContact()],
              })}><Plus aria-hidden />{tx("Add")}</Button>
              <p className="text-xs text-muted-foreground">
                {tx("Finish and Download opens the print dialog for your complete trading plan. Choose Save as PDF to download it.")}
              </p>
            </> : null}
          </fieldset>
        </div>
        <div className={cn("space-y-3 border-t p-5", page === 17 && "p-3")}>
          {printError ? <p role="alert" className="text-sm text-destructive">{tx(printError)}</p> : null}
          {saveError ? <div role="alert" className="space-y-2 text-sm text-destructive">
            <p>{tx(saveError)}</p>
            <Button variant="outline" onClick={() => save(plan)}>{tx("Retry saving")}</Button>
          </div> : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" disabled={page === 0} onClick={() => goToPage(page - 1)}>
              <ChevronLeft aria-hidden className="rtl:rotate-180" />{tx("Previous")}
            </Button>
            <div className="text-center text-xs">
              <Combobox.Root items={PAGE_NUMBERS} value={page} inputValue={pageSearch}
                onInputValueChange={setPageSearch} onOpenChange={() => setPageSearch("")}
                itemToStringLabel={(index) => tx("{0} — {1}", [index + 1, tx(PAGE_TITLES[index])])}
                filter={(index, query) => /^\d+$/.test(query.trim())
                  ? index + 1 === Number(query.trim())
                  : tx(PAGE_TITLES[index]).toLocaleLowerCase(language).includes(query.trim().toLocaleLowerCase(language))}
                onValueChange={(index) => { if (index !== null) goToPage(index); }}>
                <Combobox.Trigger render={<Button variant="outline" size="sm" aria-label={tx("Jump to page")} />}>
                  <span role="status">{tx("Page {0} of {1}", [page + 1, PAGE_TITLES.length])}</span>
                  <ChevronDown aria-hidden className="size-3.5 text-muted-foreground" />
                </Combobox.Trigger>
                <Combobox.Portal>
                  <Combobox.Positioner side="top" align="center" sideOffset={8} className="z-60"
                    lang={language} dir={language === "ar" || language === "he" ? "rtl" : "ltr"}>
                    <Combobox.Popup initialFocus={pageSearchInput}
                      className="flex max-h-[min(24rem,var(--available-height))] w-[min(24rem,90vw)] flex-col overflow-hidden rounded-xl border bg-card shadow-lg outline-none">
                      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
                        <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                        <Combobox.Input ref={pageSearchInput} aria-label={tx("Search pages")}
                          placeholder={tx("Search by title or page number")}
                          className="h-9 w-full min-w-0 bg-transparent text-base outline-none md:text-sm" />
                      </div>
                      <Combobox.Empty className="p-4 text-center text-sm text-muted-foreground">
                        {tx("No pages found")}
                      </Combobox.Empty>
                      <Combobox.List aria-label={tx("Trading plan pages")}
                        className="min-h-0 scroll-py-1 overflow-y-auto p-1">
                        {(index: number) => <Combobox.Item key={index} value={index}
                          aria-label={tx("{0} — {1}", [index + 1, tx(PAGE_TITLES[index])])}
                          aria-current={page === index ? "page" : undefined}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm outline-none data-highlighted:bg-accent data-selected:bg-primary/10 data-selected:font-medium">
                          <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs tabular-nums text-muted-foreground">{index + 1}</span>
                          <span className="min-w-0 flex-1 text-start leading-snug">{tx(PAGE_TITLES[index])}</span>
                          <Combobox.ItemIndicator className="shrink-0 text-primary"><Check aria-hidden className="size-4" /></Combobox.ItemIndicator>
                        </Combobox.Item>}
                      </Combobox.List>
                    </Combobox.Popup>
                  </Combobox.Positioner>
                </Combobox.Portal>
              </Combobox.Root>
              {saved ? <p className="text-muted-foreground">{tx("Saved in this browser")}</p> : null}
            </div>
            {page < PAGE_TITLES.length - 1 ? <Button onClick={() => goToPage(page + 1)}>
              {tx("Next")}<ChevronRight aria-hidden className="rtl:rotate-180" />
            </Button> : <Button disabled={!loaded || !!readError} onClick={finishAndDownload}>{tx("Finish and Download")}</Button>}
          </div>
          {printReady ? <MyTradePlanPrint plan={plan} titles={PAGE_TITLES} /> : null}
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}
