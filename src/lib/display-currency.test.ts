import { expect, test } from "vitest";
import {
  formatMoney, formatHistoricalTotal, isDisplayRate, isRateStale, parseRates,
  RATE_MAX_AGE, type DisplayRate,
} from "@/lib/display-currency";
import { currencyMessages } from "@/lib/currency-translations";
import { LANGUAGES } from "@/lib/languages";

const now = new Date().toISOString();
const rate: DisplayRate = { currency: "EUR", rate: 0.9, source: "Frankfurter", asOf: now.slice(0, 10), checkedAt: now };

test("validates public rates and rejects malformed, duplicate, non-USD and invalid numeric data", () => {
  expect(parseRates([{ base: "USD", quote: "EUR", rate: 0.9, date: rate.asOf }], now)).toEqual([rate]);
  for (const value of [null, [], [{}], [{ base: "EUR", quote: "EUR", rate: 0.9, date: rate.asOf }],
    [0, -1, Infinity, NaN, 1e13].map((value) => ({ base: "USD", quote: "EUR", rate: value, date: rate.asOf })),
    [{ base: "USD", quote: "EUR", rate: 1, date: "2026-02-30" }]]) {
    expect(() => parseRates(value)).toThrow();
  }
  const row = { base: "USD", quote: "EUR", rate: 1, date: rate.asOf };
  expect(() => parseRates([row, row])).toThrow();
  expect(isDisplayRate({ ...rate, currency: "NOT" })).toBe(false);
  expect(isDisplayRate({ ...rate, checkedAt: "bad" })).toBe(false);
});

test("flags old cache and old reference dates, but not fresh rates", () => {
  const time = Date.parse(now);
  expect(isRateStale(rate, time)).toBe(false);
  expect(isRateStale(rate, time + RATE_MAX_AGE)).toBe(true);
  expect(isRateStale({ ...rate, asOf: "2020-01-01" }, time)).toBe(true);
});

test("keeps original USD amounts and signs while adding clearly coded estimates", () => {
  expect(formatMoney(100, null, "en")).toBe("$100.00");
  expect(formatMoney(100, rate, "en")).toBe("$100.00 (≈ EUR 90.00)");
  expect(formatMoney(-100, rate, "en", true)).toBe("-$100.00 (≈ -EUR 90.00)");
  expect(formatMoney(100, rate, "en", true)).toBe("+$100.00 (≈ +EUR 90.00)");
  expect(formatMoney(100, { ...rate, currency: "JPY", rate: 150 }, "ja")).toContain("15,000");
});

test("historical totals use each saved rate, not today's rate, and never add mixed currencies", () => {
  const items = [{ amount: 100, displayRate: rate }, { amount: -50, displayRate: { ...rate, rate: 0.8 } }];
  expect(formatHistoricalTotal(items, "EUR", "en")).toBe("+$50.00 (≈ +EUR 50.00)");
  expect(formatHistoricalTotal(items, "USD", "en")).toBe("+$50.00");
  expect(formatHistoricalTotal([...items, { amount: 10 }], "EUR", "en")).toBe("+$60.00");
  expect(formatHistoricalTotal([...items, { amount: 10, displayRate: { ...rate, currency: "GBP" } }], "EUR", "en")).toBe("+$60.00");
});

test.each(LANGUAGES)("currency copy is complete and translated for $name", ({ code }) => {
  const messages = currencyMessages[code];
  expect(messages).toHaveLength(currencyMessages.en.length);
  for (const [index, message] of messages.entries()) {
    expect(message.trim()).not.toBe("");
    if (code !== "en") expect(message).not.toBe(currencyMessages.en[index]);
    expect(message.match(/\d+(?:e\d+)?/g) ?? []).toEqual(currencyMessages.en[index].match(/\d+(?:e\d+)?/g) ?? []);
  }
});
