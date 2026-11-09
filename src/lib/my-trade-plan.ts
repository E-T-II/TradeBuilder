export const MY_TRADE_PLAN_STORAGE_KEY = "tradebuilder-my-trade-plan-v1";

export const STRENGTHS = [
  "Discipline", "Patience", "Coachable", "Decisiveness", "Flexibility", "Committed",
  "Organized", "Goal Oriented", "Planner", "Less Emotional", "Ability to Focus",
  "Ability to overcome setback (Losing Trade)", "Self-starter", "Quick Learner",
] as const;

export const IMPROVEMENTS = [
  "Lack of Discipline", "Not Patient", "Not Coachable", "Indecisiveness", "Inflexibility",
  "Noncommittal", "Disorganized", "Not Goal Oriented", "Impulsive", "Too Emotional",
  "Difficulty Focusing", "Easily discouraged", "Procrastinator", "Slow Learner",
] as const;

export const GOAL_PERIODS = ["day", "week", "month", "year"] as const;
export const GOAL_MARKETS = ["Stocks/ETFs", "Futures", "Forex", "Options", "Crypto"] as const;
export const ASSET_CLASSES = [
  "Stocks", "ETFs", "Futures", "Forex", "Options (directional)",
  "Options (non-directional)", "Strategic investor", "Cryptocurrency",
] as const;
export const ACCOUNT_TYPES = [
  "Stock", "Stock/Options", "Futures", "Futures/Options", "Forex", "Cryptocurrency",
] as const;
export const BROKERS = [
  "AMP Futures", "Binance", "Coinbase", "E-Trade", "Fidelity", "FXCM", "Gemini",
  "Interactive Brokers", "Kraken", "Kresna Securities", "Merril Lynch", "Morgan Stanley",
  "Oanda", "Other", "Questrade", "Robinhood", "Schwab", "Sharekhan", "Tastyworks",
  "TD Ameritrade", "Thinkorswim", "TradePro Futures", "Tradestation", "Tradier", "Windsor Brokers",
] as const;
export const TRADING_PURPOSES = ["Hourly Income", "Daily Income", "Weekly Income", "Monthly Income"] as const;
export const TIMEFRAMES = [
  "Monthly", "Weekly", "Daily", "4 Hour", "2 Hour", "1 Hour", "30 mins", "15 mins", "5 mins", "1 min",
] as const;
export const TRADE_TYPES = ["Income Trade", "Wealth trade"] as const;
export const ANALYSIS_COLUMNS = ["Curve (HTF)", "Trend (ITF)", "Zone (LTF)", "Refining (RTF)"] as const;
export const TARGET_TIMEFRAMES = ["LTF", "ITF", "HTF"] as const;
export const TARGET_PURPOSES = ["Income Trades", "Wealth Trades"] as const;
export const RISK_REWARD_RATIOS = ["10:1", "9:1", "8:1", "7:1", "6:1", "5:1", "4:1", "3:1", "2:1", "1:1"] as const;
export const RISK_PARAMETER_MARKETS = ["Stocks", "Futures", "Forex", "Options", "Crypto"] as const;
export const RISK_PARAMETERS = [
  "Account Size", "Maximum Risk Per Trade", "Maximum Opened Trades Per Day",
  "Maximum Opened Trades Per Week", "Maximum Opened Trades Per Month",
  "Maximum Daily Loss", "Maximum Weekly Loss", "Maximum Monthly Loss",
  "Can Hold Trades Over the Weekend",
] as const;
export const WEEKEND_CHOICES = ["Yes", "No"] as const;
export const REPORT_SOURCES = [
  "Econoday.com", "ForexFactory.com", "EarningsWhispers.com", "SeekingAlpha.com",
  "Finviz.com", "ETF.Stock-Encyclopedia.com", "Yahoo.Finance.com", "GoogleFinance.com",
  "EconomicTimes.IndiaTimes.com", "MoneyControl.com", "Other",
] as const;
export const RISK_RULES = [
  { id: "stopOrders", text: "I always use Stop Orders." },
  { id: "cutLosses", text: "I cut any losses short and I let any profits run." },
  { id: "initialRisk", text: "I never open a position in the market without knowing my initial risk." },
  { id: "riskMultiple", text: "I define my profit and loss as some multiple of my initial risk." },
  { id: "limitLosses", text: "I limit my losses to 1:1 or less." },
  { id: "rewardRatio", text: "I only take opportunities with a Reward vs. Ratio >=" },
  { id: "singleTrade", text: "I never risk more than" },
  { id: "multipleTrades", text: "With multiple trades in the market (positions) at the same time, I never risk more than" },
] as const;
export const RISK_PART_TWO_RULES = [
  "I use appropriate entry orders to enter my positions. That way I remove my emotions out of the trade",
  "I am always properly diversified; therefore I don’t take correlated trades in the same markets (for example Long the EUR/USD and Short the USD/CHF). If I set up several trades that are correlated, when the first opportunity is filled, the other orders are cancelled",
  "I only use brokers that hold my orders in their servers so in a situation of a power outage or an Internet drop, I will remain protected (Stop Order in place) at all times",
  "I backup my trading platform every day and I backup my trading computer on a cloud drive",
  "I log my trades, I review my results and I learn from my mistakes",
] as const;
export const PLAN_GRAPHICS = [
  { id: "blueprintSteps", title: "Trade Blueprint Steps", src: "/trade-plan/trade-blueprint-steps.png", width: 1099, height: 554 },
  { id: "blueprintFlowChart", title: "Trade Blueprint Flow Chart", src: "/trade-plan/trade-blueprint-flow-chart.png", width: 1097, height: 650 },
  { id: "tradingProcess", title: "6-Step Trading Process", src: "/trade-plan/six-step-trading-process.png", width: 997, height: 605 },
  { id: "decisionMatrix", title: "Decision Matrix", src: "/trade-plan/decision-matrix.png", width: 1479, height: 716 },
] as const;

export interface TargetRule {
  purpose: string;
  buffer: string;
  timeframe: string;
}

export interface GoalRow {
  unit: "" | "$" | "%";
  amount: string;
  period: string;
  market: string;
}

export interface MyTradePlan {
  title: string;
  version: string;
  author: string;
  currencySymbol: string;
  why: string;
  strengths: string[];
  strengthNotesOnly: boolean;
  strengthNotes: string;
  improvements: string[];
  improvementNotesOnly: boolean;
  improvementNotes: string;
  incomeGoals: GoalRow[];
  incomeNotesOnly: boolean;
  incomeNotes: string;
  wealthGoals: GoalRow[];
  wealthNotesOnly: boolean;
  wealthNotes: string;
  markets: { assetClass: string; watchListRules: string }[];
  marketNotesOnly: boolean;
  marketNotes: string;
  accounts: { type: string; broker: string; amount: string }[];
  accountNotesOnly: boolean;
  accountNotes: string;
  timeframes: string[][];
  entries: { tradeType: string; entryRules: string }[];
  entryNotesOnly: boolean;
  entryNotes: string;
  stopIncomeBuffer: string;
  stopWealthBuffer: string;
  stopNotesOnly: boolean;
  stopNotes: string;
  targetRules: TargetRule[];
  targetNotesOnly: boolean;
  targetNotes: string;
  graphics: Record<typeof PLAN_GRAPHICS[number]["id"], { included: boolean; precedingParagraph: string }>;
  placingOrderRules: string[];
  riskRules: string[];
  riskPartTwoRules: string[];
  riskPartTwoNotes: string;
  riskPartTwoNotesOnly: boolean;
  riskRewardRatio: string;
  singleTradeRisk: string;
  multipleTradeRisk: string;
  breakEvenRatio: string;
  managementTimeframe: string;
  managementNotes: string;
  managementNotesOnly: boolean;
  riskParameters: string[][];
  reports: { source: string; notes: string }[];
}

export function createMyTradePlan(): MyTradePlan {
  const goals = (): GoalRow[] => Array.from({ length: 2 }, () => ({
    unit: "", amount: "", period: "", market: "",
  }));
  return {
    title: "My Trade Plan", version: "", author: "", currencySymbol: "$", why: "",
    strengths: [], strengthNotesOnly: false, strengthNotes: "",
    improvements: [], improvementNotesOnly: false, improvementNotes: "",
    incomeGoals: goals(), incomeNotesOnly: false, incomeNotes: "",
    wealthGoals: goals(), wealthNotesOnly: false, wealthNotes: "",
    markets: [{ assetClass: "", watchListRules: "" }], marketNotesOnly: false, marketNotes: "",
    accounts: Array.from({ length: 2 }, () => ({ type: "", broker: "", amount: "" })),
    accountNotesOnly: false, accountNotes: "",
    timeframes: TRADING_PURPOSES.map(() => ANALYSIS_COLUMNS.map(() => "")),
    entries: [{ tradeType: "", entryRules: "" }], entryNotesOnly: false, entryNotes: "",
    stopIncomeBuffer: "", stopWealthBuffer: "", stopNotesOnly: false, stopNotes: "",
    targetRules: TARGET_PURPOSES.map((purpose) => ({ purpose, buffer: "", timeframe: "" })),
    targetNotesOnly: false, targetNotes: "",
    placingOrderRules: [""],
    riskRules: [], riskRewardRatio: "", singleTradeRisk: "", multipleTradeRisk: "",
    riskPartTwoRules: [],
    riskPartTwoNotes: "", riskPartTwoNotesOnly: false,
    breakEvenRatio: "", managementTimeframe: "", managementNotes: "", managementNotesOnly: false,
    riskParameters: RISK_PARAMETERS.map(() => RISK_PARAMETER_MARKETS.map(() => "")),
    reports: [{ source: "", notes: "" }],
    graphics: {
      blueprintSteps: { included: false, precedingParagraph: "" },
      blueprintFlowChart: { included: false, precedingParagraph: "" },
      tradingProcess: { included: false, precedingParagraph: "" },
      decisionMatrix: { included: false, precedingParagraph: "" },
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isChoice(value: unknown, choices: readonly string[]): boolean {
  return typeof value === "string" && (value === "" || choices.includes(value));
}

function isChecklist(value: unknown, choices: readonly string[]): boolean {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && choices.includes(item)) &&
    new Set(value).size === value.length;
}

function isGoals(value: unknown): boolean {
  return Array.isArray(value) && value.length >= 1 && value.every((row: unknown) =>
    isRecord(row) && isChoice(row.unit, ["$", "%"]) && typeof row.amount === "string" &&
    isChoice(row.period, GOAL_PERIODS) && isChoice(row.market, GOAL_MARKETS),
  );
}

function isRiskPercentage(value: unknown): boolean {
  return typeof value === "string" && (value === "" ||
    (value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0));
}

function isMyTradePlan(value: unknown): value is MyTradePlan {
  const defaults = createMyTradePlan();
  const graphics = isRecord(value) ? value.graphics : undefined;
  if (!isRecord(value) ||
    !isRecord(graphics) || !PLAN_GRAPHICS.every(({ id }) => {
      const graphic = graphics[id];
      return isRecord(graphic) && typeof graphic.included === "boolean" &&
        typeof graphic.precedingParagraph === "string";
    }) ||
    !Object.entries(defaults).every(([key, defaultValue]) =>
      typeof defaultValue !== "string" || typeof value[key] === "string",
    ) ||
    !isChecklist(value.strengths, STRENGTHS) ||
    !Array.isArray(value.reports) || value.reports.length < 1 ||
    !value.reports.every((row: unknown) => isRecord(row) &&
      isChoice(row.source, REPORT_SOURCES) && typeof row.notes === "string") ||
    !Array.isArray(value.riskParameters) || value.riskParameters.length !== RISK_PARAMETERS.length ||
    !value.riskParameters.every((row: unknown, index: number) =>
      Array.isArray(row) && row.length === RISK_PARAMETER_MARKETS.length &&
      row.every((cell: unknown) => index === RISK_PARAMETERS.length - 1
        ? isChoice(cell, WEEKEND_CHOICES) : isRiskPercentage(cell))) ||
    !isChecklist(value.riskRules, RISK_RULES.map((rule) => rule.id)) ||
    !isChecklist(value.riskPartTwoRules, RISK_PART_TWO_RULES) ||
    typeof value.riskPartTwoNotesOnly !== "boolean" ||
    !isChoice(value.breakEvenRatio, RISK_REWARD_RATIOS) ||
    !isChoice(value.managementTimeframe, TARGET_TIMEFRAMES) ||
    typeof value.managementNotesOnly !== "boolean" ||
    !isChoice(value.riskRewardRatio, RISK_REWARD_RATIOS) ||
    !isRiskPercentage(value.singleTradeRisk) || !isRiskPercentage(value.multipleTradeRisk) ||
    !Array.isArray(value.placingOrderRules) || value.placingOrderRules.length < 1 ||
    !value.placingOrderRules.every((rule: unknown) => typeof rule === "string") ||
    typeof value.strengthNotesOnly !== "boolean" ||
    typeof value.improvementNotesOnly !== "boolean" ||
    typeof value.incomeNotesOnly !== "boolean" ||
    typeof value.wealthNotesOnly !== "boolean" ||
    typeof value.marketNotesOnly !== "boolean" ||
    typeof value.accountNotesOnly !== "boolean" ||
    typeof value.entryNotesOnly !== "boolean" ||
    typeof value.stopNotesOnly !== "boolean" ||
    typeof value.targetNotesOnly !== "boolean" ||
    !Array.isArray(value.targetRules) || value.targetRules.length < 1 ||
    !value.targetRules.every((rule: unknown) => isRecord(rule) &&
      isChoice(rule.purpose, TARGET_PURPOSES) && typeof rule.buffer === "string" &&
      isChoice(rule.timeframe, TARGET_TIMEFRAMES)) ||
    !isChecklist(value.improvements, IMPROVEMENTS) ||
    !isGoals(value.incomeGoals) || !isGoals(value.wealthGoals) ||
    !Array.isArray(value.markets) || value.markets.length < 1 ||
    !value.markets.every((row: unknown) => isRecord(row) &&
      isChoice(row.assetClass, ASSET_CLASSES) && typeof row.watchListRules === "string") ||
    !Array.isArray(value.entries) || value.entries.length < 1 ||
    !value.entries.every((row: unknown) => isRecord(row) &&
      isChoice(row.tradeType, TRADE_TYPES) && typeof row.entryRules === "string") ||
    !Array.isArray(value.accounts) || value.accounts.length < 1 ||
    !value.accounts.every((row: unknown) => isRecord(row) && isChoice(row.type, ACCOUNT_TYPES) &&
      isChoice(row.broker, BROKERS) && typeof row.amount === "string") ||
    !Array.isArray(value.timeframes) || value.timeframes.length !== TRADING_PURPOSES.length ||
    !value.timeframes.every((row: unknown) => Array.isArray(row) && row.length === ANALYSIS_COLUMNS.length &&
      row.every((timeframe: unknown) => isChoice(timeframe, TIMEFRAMES)))) return false;
  return true;
}

function migrateTargetRules(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const rows: TargetRule[] = [];
  for (const [key, purpose] of [["income", "Income Trades"], ["wealth", "Wealth Trades"]] as const) {
    const rules = value[key];
    if (!Array.isArray(rules) || rules.length < 1) return value;
    for (const rule of rules) {
      if (!isRecord(rule) || typeof rule.buffer !== "string" || typeof rule.timeframe !== "string" ||
        !isChoice(rule.timeframe, TARGET_TIMEFRAMES)) return value;
      rows.push({ purpose, buffer: rule.buffer, timeframe: rule.timeframe });
    }
  }
  return rows;
}

export function parseMyTradePlan(text: string): MyTradePlan {
  const value: unknown = JSON.parse(text);
  const plan = isRecord(value) ? {
    reports: [{ source: "", notes: "" }],
    riskParameters: createMyTradePlan().riskParameters,
    breakEvenRatio: "", managementTimeframe: "", managementNotes: "", managementNotesOnly: false,
    riskPartTwoNotes: "", riskPartTwoNotesOnly: false,
    riskPartTwoRules: [],
    riskRules: [], riskRewardRatio: "", singleTradeRisk: "", multipleTradeRisk: "",
    placingOrderRules: [""],
    graphics: createMyTradePlan().graphics,
    targetNotesOnly: false, targetNotes: "",
    stopIncomeBuffer: "", stopWealthBuffer: "", stopNotesOnly: false, stopNotes: "",
    strengthNotesOnly: false, improvementNotesOnly: false, incomeNotesOnly: false,
    wealthNotesOnly: false, marketNotesOnly: false, accountNotesOnly: false, entryNotesOnly: false, ...value,
    targetRules: Object.hasOwn(value, "targetRules")
      ? migrateTargetRules(value.targetRules)
      : createMyTradePlan().targetRules,
    entries: !Object.hasOwn(value, "entries")
      ? [{ tradeType: value.tradeType, entryRules: value.entryRules }]
      : value.entries,
    markets: !Object.hasOwn(value, "markets") && Object.hasOwn(value, "assetClass")
      ? [{ assetClass: value.assetClass, watchListRules: "" }]
      : value.markets,
    incomeGoals: Array.isArray(value.incomeGoals) && value.incomeGoals.length === 0
      ? createMyTradePlan().incomeGoals.slice(0, 1)
      : value.incomeGoals,
  } : value;
  if (!isMyTradePlan(plan)) {
    throw new Error("The saved trade plan has invalid data. No saved data was changed.");
  }
  while (plan.accounts.length > 2) {
    const last = plan.accounts[plan.accounts.length - 1];
    if (last.type !== "" || last.broker !== "" || last.amount !== "") break;
    plan.accounts.pop();
  }
  return plan;
}
