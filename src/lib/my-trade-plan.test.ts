import { describe, expect, test } from "vitest";
import { createMyTradePlan, parseMyTradePlan } from "@/lib/my-trade-plan";

describe("My Trade Plan storage", () => {
  test("loads older plans with one blank report and round-trips report notes verbatim", () => {
    const { reports, ...legacy } = createMyTradePlan();
    expect(reports).toEqual([{ source: "", notes: "" }]);
    expect(parseMyTradePlan(JSON.stringify(legacy)).reports).toEqual(reports);
    const plan = createMyTradePlan();
    plan.reports = [
      { source: "ForexFactory.com", notes: "Check EUR/USD\nUser notes: {0}" },
      { source: "Other", notes: "My report" },
    ];
    expect(parseMyTradePlan(JSON.stringify(plan))).toEqual(plan);
    expect(createMyTradePlan().reports).toEqual(reports);
  });

  test.each([
    null, [], {}, [{ source: "Unknown", notes: "" }], [{ source: "Econoday.com", notes: 1 }],
    [{ source: null, notes: "" }], [{ source: "", notes: null }], [null],
  ].map((reports) => ({ reports })))("rejects malformed report rows: %j", ({ reports }) => {
    expect(() => parseMyTradePlan(JSON.stringify({ ...createMyTradePlan(), reports }))).toThrow(/invalid data/);
  });

  test("migrates older plans to an independent blank risk parameter table", () => {
    const { riskParameters, ...legacy } = createMyTradePlan();
    expect(riskParameters).toEqual(Array.from({ length: 9 }, () => Array(5).fill("")));
    const restored = parseMyTradePlan(JSON.stringify(legacy));
    expect(restored.riskParameters).toEqual(riskParameters);
    restored.riskParameters[0][0] = "1000.25";
    restored.riskParameters[7][4] = "0";
    restored.riskParameters[8] = ["Yes", "No", "", "Yes", "No"];
    expect(riskParameters[0][0]).toBe("");
    expect(restored.riskParameters[1][0]).toBe("");
    expect(parseMyTradePlan(JSON.stringify(restored))).toEqual(restored);
  });

  test.each([
    null, [], Array.from({ length: 8 }, () => Array(5).fill("")),
    Array.from({ length: 9 }, () => Array(4).fill("")),
    ...["-1", "abc", "Infinity", " ", 42, null, "Yes"].map((cell) => {
      const table = createMyTradePlan().riskParameters;
      return table.map((row, i) => row.map((value, j) => i === 0 && j === 0 ? cell : value));
    }),
    ...["Maybe", "1", false, null].map((cell) => {
      const table = createMyTradePlan().riskParameters;
      return table.map((row, i) => row.map((value, j) => i === 8 && j === 0 ? cell : value));
    }),
  ].map((riskParameters) => ({ riskParameters })))("rejects malformed risk parameter tables: %j", ({ riskParameters }) => {
    expect(() => parseMyTradePlan(JSON.stringify({ ...createMyTradePlan(), riskParameters }))).toThrow(/invalid data/);
  });

  test("loads older plans with blank trade management fields and preserves new values", () => {
    const { breakEvenRatio, managementTimeframe, managementNotes, managementNotesOnly, ...legacy } = createMyTradePlan();
    expect([breakEvenRatio, managementTimeframe, managementNotes, managementNotesOnly]).toEqual(["", "", "", false]);
    expect(parseMyTradePlan(JSON.stringify(legacy))).toMatchObject({
      breakEvenRatio: "", managementTimeframe: "", managementNotes: "", managementNotesOnly: false,
    });
    const plan = { ...createMyTradePlan(), breakEvenRatio: "3:1", managementTimeframe: "ITF",
      managementNotes: "Trail after confirmation\nKeep my notes", managementNotesOnly: true };
    expect(parseMyTradePlan(JSON.stringify(plan))).toEqual(plan);
  });

  test.each([
    { breakEvenRatio: "11:1" }, { breakEvenRatio: null },
    { managementTimeframe: "Daily" }, { managementTimeframe: null },
    { managementNotes: 123 }, { managementNotesOnly: "true" },
  ])("rejects malformed trade management fields: %j", (patch) => {
    expect(() => parseMyTradePlan(JSON.stringify({ ...createMyTradePlan(), ...patch }))).toThrow(/invalid data/);
  });

  test("loads older plans with risk management part two unchecked", () => {
    const { riskPartTwoRules, riskPartTwoNotes, riskPartTwoNotesOnly, ...legacy } = createMyTradePlan();
    expect(riskPartTwoRules).toEqual([]);
    expect(riskPartTwoNotes).toBe("");
    expect(riskPartTwoNotesOnly).toBe(false);
    expect(parseMyTradePlan(JSON.stringify(legacy)).riskPartTwoRules).toEqual([]);
    expect(parseMyTradePlan(JSON.stringify(legacy))).toMatchObject({
      riskPartTwoNotes: "", riskPartTwoNotesOnly: false,
    });
  });

  test("loads older plans with unchecked risk rules and blank values", () => {
    const { riskRules, riskRewardRatio, singleTradeRisk, multipleTradeRisk, ...legacy } = createMyTradePlan();
    expect([riskRules, riskRewardRatio, singleTradeRisk, multipleTradeRisk]).toEqual([[], "", "", ""]);
    expect(parseMyTradePlan(JSON.stringify(legacy))).toMatchObject({
      riskRules: [], riskRewardRatio: "", singleTradeRisk: "", multipleTradeRisk: "",
    });
  });

  test("loads older plans with one blank placing-order rule", () => {
    const { placingOrderRules, ...legacy } = createMyTradePlan();
    expect(placingOrderRules).toEqual([""]);
    expect(parseMyTradePlan(JSON.stringify(legacy)).placingOrderRules).toEqual([""]);
    const plan = createMyTradePlan();
    plan.placingOrderRules = ["Check quantity\nCheck price", "Review order"];
    expect(parseMyTradePlan(JSON.stringify(plan)).placingOrderRules).toEqual(plan.placingOrderRules);
  });

  test("loads older plans with unchecked graphics and blank paragraphs", () => {
    const { graphics, ...legacy } = createMyTradePlan();
    expect(parseMyTradePlan(JSON.stringify(legacy)).graphics).toEqual(graphics);
    const other = createMyTradePlan();
    other.graphics.blueprintSteps.included = true;
    expect(graphics.blueprintSteps.included).toBe(false);
    other.graphics.blueprintSteps.precedingParagraph = "Before the trade\nReview the steps";
    expect(parseMyTradePlan(JSON.stringify(other))).toEqual(other);
  });

  test("migrates grouped target rules preserving purposes and values", () => {
    const plan = createMyTradePlan();
    expect(parseMyTradePlan(JSON.stringify({ ...plan, targetRules: {
      income: [{ buffer: "20", timeframe: "LTF" }, { buffer: "25", timeframe: "ITF" }],
      wealth: [{ buffer: "10", timeframe: "HTF" }],
    } })).targetRules).toEqual([
      { purpose: "Income Trades", buffer: "20", timeframe: "LTF" },
      { purpose: "Income Trades", buffer: "25", timeframe: "ITF" },
      { purpose: "Wealth Trades", buffer: "10", timeframe: "HTF" },
    ]);
  });

  test("loads older plans with blank target rules and notes-only disabled", () => {
    const { targetRules, targetNotesOnly, targetNotes, ...legacy } = createMyTradePlan();
    expect(parseMyTradePlan(JSON.stringify(legacy))).toMatchObject({
      targetRules, targetNotesOnly: false, targetNotes: "",
    });
    expect(targetNotesOnly).toBe(false);
    expect(targetNotes).toBe("");
  });

  test("loads older plans with blank stop-loss fields and notes-only disabled", () => {
    const { stopIncomeBuffer, stopWealthBuffer, stopNotes, stopNotesOnly, ...legacy } = createMyTradePlan();
    expect([stopIncomeBuffer, stopWealthBuffer, stopNotes, stopNotesOnly]).toEqual(["", "", "", false]);
    expect(parseMyTradePlan(JSON.stringify(legacy))).toMatchObject({
      stopIncomeBuffer: "", stopWealthBuffer: "", stopNotes: "", stopNotesOnly: false,
    });
  });

  test("migrates saved entry rules without replacing malformed new entry lists", () => {
    const { entries, ...legacy } = createMyTradePlan();
    expect(entries).toEqual([{ tradeType: "", entryRules: "" }]);
    const saved = { ...legacy, tradeType: "Income Trade", entryRules: "Confirm trend\nCheck risk" };
    expect(parseMyTradePlan(JSON.stringify(saved)).entries).toEqual([
      { tradeType: "Income Trade", entryRules: "Confirm trend\nCheck risk" },
    ]);
    expect(() => parseMyTradePlan(JSON.stringify({ ...saved, entries: null }))).toThrow(/invalid data/);
  });

  test("migrates the original asset class and retains market notes", () => {
    const { markets, marketNotesOnly, ...legacy } = createMyTradePlan();
    expect(markets).toHaveLength(1);
    expect(marketNotesOnly).toBe(false);
    const plan = parseMyTradePlan(JSON.stringify({
      ...legacy, assetClass: "Futures", marketNotes: "Liquid contracts",
    }));
    expect(plan.markets).toEqual([{ assetClass: "Futures", watchListRules: "" }]);
    expect(plan.marketNotes).toBe("Liquid contracts");
    expect(plan.marketNotesOnly).toBe(false);
  });

  test("restores one blank income goal for previously saved empty lists", () => {
    const plan = createMyTradePlan();
    plan.incomeGoals = [];
    expect(parseMyTradePlan(JSON.stringify(plan)).incomeGoals).toEqual([
      { unit: "", amount: "", period: "", market: "" },
    ]);
  });

  test("starts with two accounts and retains entered accounts from older plans", () => {
    const { accountNotesOnly, ...legacy } = createMyTradePlan();
    expect(legacy.accounts).toEqual(Array.from({ length: 2 }, () => ({ type: "", broker: "", amount: "" })));
    expect(accountNotesOnly).toBe(false);
    legacy.accounts = Array.from({ length: 5 }, () => ({ type: "", broker: "", amount: "" }));
    legacy.accounts[4] = { type: "Forex", broker: "Oanda", amount: "1000.25" };
    const restored = parseMyTradePlan(JSON.stringify(legacy));
    expect(restored.accounts).toEqual(legacy.accounts);
    expect(restored.accountNotesOnly).toBe(false);
  });

  test("trims extra trailing blank account rows to two on load", () => {
    const plan = createMyTradePlan();
    plan.accounts = Array.from({ length: 5 }, () => ({ type: "", broker: "", amount: "" }));
    plan.accounts[0] = { type: "Forex", broker: "Oanda", amount: "1000" };
    expect(parseMyTradePlan(JSON.stringify(plan)).accounts).toEqual(plan.accounts.slice(0, 2));
    plan.accounts[2].amount = "0";
    expect(parseMyTradePlan(JSON.stringify(plan)).accounts).toEqual(plan.accounts.slice(0, 3));
  });

  test("loads older plans with notes-only disabled by default", () => {
    const { strengthNotesOnly, improvementNotesOnly, incomeNotesOnly, wealthNotesOnly, entryNotesOnly, ...legacy } = createMyTradePlan();
    expect(strengthNotesOnly).toBe(false);
    expect(improvementNotesOnly).toBe(false);
    expect(incomeNotesOnly).toBe(false);
    expect(wealthNotesOnly).toBe(false);
    expect(entryNotesOnly).toBe(false);
    expect(parseMyTradePlan(JSON.stringify(legacy)).strengthNotesOnly).toBe(false);
    expect(parseMyTradePlan(JSON.stringify(legacy)).improvementNotesOnly).toBe(false);
    expect(parseMyTradePlan(JSON.stringify(legacy)).incomeNotesOnly).toBe(false);
    expect(parseMyTradePlan(JSON.stringify(legacy)).wealthNotesOnly).toBe(false);
    expect(parseMyTradePlan(JSON.stringify(legacy)).entryNotesOnly).toBe(false);
  });

  test("round-trips an unfinished plan and preserves user text verbatim", () => {
    const plan = createMyTradePlan();
    plan.why = "My reasons\nand goals";
    plan.strengths = ["Patience", "Quick Learner"];
    plan.incomeGoals[0] = { unit: "%", amount: "2.5", period: "month", market: "Stocks/ETFs" };
    plan.accounts[0] = { type: "Forex", broker: "Oanda", amount: "1000.25" };
    plan.timeframes[3][3] = "5 mins";
    expect(parseMyTradePlan(JSON.stringify(plan))).toEqual(plan);
    expect(plan.incomeGoals[1].amount).toBe("");
    expect(plan.wealthGoals[0].unit).toBe("");
  });

  test.each([
    null,
    {},
    { ...createMyTradePlan(), author: 123 },
    { ...createMyTradePlan(), strengthNotesOnly: "true" },
    { ...createMyTradePlan(), improvementNotesOnly: "true" },
    { ...createMyTradePlan(), incomeNotesOnly: "true" },
    { ...createMyTradePlan(), wealthNotesOnly: "true" },
    { ...createMyTradePlan(), marketNotesOnly: "true" },
    { ...createMyTradePlan(), accountNotesOnly: "true" },
    { ...createMyTradePlan(), entryNotesOnly: "true" },
    { ...createMyTradePlan(), stopNotesOnly: "true" },
    { ...createMyTradePlan(), stopIncomeBuffer: 2 },
    { ...createMyTradePlan(), stopWealthBuffer: null },
    { ...createMyTradePlan(), stopNotes: false },
    { ...createMyTradePlan(), targetNotesOnly: "true" },
    { ...createMyTradePlan(), targetNotes: 1 },
    { ...createMyTradePlan(), targetRules: null },
    { ...createMyTradePlan(), placingOrderRules: [] },
    { ...createMyTradePlan(), placingOrderRules: null },
    { ...createMyTradePlan(), placingOrderRules: [42] },
    { ...createMyTradePlan(), riskRules: ["unknown"] },
    { ...createMyTradePlan(), riskPartTwoRules: ["unknown"] },
    { ...createMyTradePlan(), riskPartTwoRules: null },
    { ...createMyTradePlan(), riskPartTwoNotesOnly: "true" },
    { ...createMyTradePlan(), riskPartTwoNotes: 1 },
    { ...createMyTradePlan(), riskRules: ["stopOrders", "stopOrders"] },
    { ...createMyTradePlan(), riskRewardRatio: "11:1" },
    { ...createMyTradePlan(), singleTradeRisk: "abc" },
    { ...createMyTradePlan(), singleTradeRisk: 2 },
    { ...createMyTradePlan(), multipleTradeRisk: "-1" },
    { ...createMyTradePlan(), multipleTradeRisk: "Infinity" },
    { ...createMyTradePlan(), graphics: null },
    { ...createMyTradePlan(), graphics: {} },
    { ...createMyTradePlan(), graphics: {
      ...createMyTradePlan().graphics, blueprintSteps: { included: "true", precedingParagraph: "" },
    } },
    { ...createMyTradePlan(), graphics: {
      ...createMyTradePlan().graphics, decisionMatrix: { included: false, precedingParagraph: 1 },
    } },
    { ...createMyTradePlan(), targetRules: [] },
    { ...createMyTradePlan(), targetRules: [{ purpose: "Invalid", buffer: "", timeframe: "" }] },
    { ...createMyTradePlan(), targetRules: [{ purpose: "Income Trades", buffer: 2, timeframe: "LTF" }] },
    { ...createMyTradePlan(), targetRules: { income: [], wealth: [{ buffer: "", timeframe: "" }] } },
    { ...createMyTradePlan(), targetRules: { income: [{ buffer: 2, timeframe: "LTF" }], wealth: [] } },
    { ...createMyTradePlan(), targetRules: {
      income: [{ buffer: "", timeframe: "Daily" }], wealth: [{ buffer: "", timeframe: "" }],
    } },
    { ...createMyTradePlan(), accounts: [] },
    { ...createMyTradePlan(), markets: [] },
    { ...createMyTradePlan(), markets: [{ assetClass: "Invalid", watchListRules: "" }] },
    { ...createMyTradePlan(), markets: [{ assetClass: "Stocks", watchListRules: 42 }] },
    { ...createMyTradePlan(), strengths: ["Not a strength"] },
    { ...createMyTradePlan(), strengths: ["Patience", "Patience"] },
    { ...createMyTradePlan(), incomeGoals: [{}] },
    { ...createMyTradePlan(), wealthGoals: [{ unit: "invalid" }, {}] },
    { ...createMyTradePlan(), accounts: [{ type: "Stock", broker: "Unknown", amount: 10 }] },
    { ...createMyTradePlan(), timeframes: Array.from({ length: 4 }, () => ["invalid", "", "", ""]) },
    { ...createMyTradePlan(), entries: [] },
    { ...createMyTradePlan(), entries: [{ tradeType: "Invalid", entryRules: "" }] },
    { ...createMyTradePlan(), entries: [{ tradeType: "Income Trade", entryRules: 42 }] },
  ])("rejects malformed or incomplete saved structures (%j)", (value) => {
    expect(() => parseMyTradePlan(JSON.stringify(value))).toThrow(/invalid data/);
  });

  test("rejects invalid JSON", () => {
    expect(() => parseMyTradePlan("{")).toThrow();
  });
});
