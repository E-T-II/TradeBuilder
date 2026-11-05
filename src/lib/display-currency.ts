export const DISPLAY_CURRENCIES = [
  "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "CNY", "INR", "MXN",
  "BRL", "KRW", "ILS", "IDR", "PLN", "UAH", "BDT", "PKR", "AED", "SAR",
] as const;
export type DisplayCurrency = typeof DISPLAY_CURRENCIES[number];
export const CURRENCY_STORAGE_KEY = "tradebuilder-display-currency-v1";
export const RATES_STORAGE_KEY = "tradebuilder-exchange-rates-v1";
export const RATE_MAX_AGE = 24 * 60 * 60 * 1000;
export const RATES_URL = `https://api.frankfurter.dev/v2/rates?base=USD&quotes=${DISPLAY_CURRENCIES.filter((code) => code !== "USD").join(",")}`;

export interface DisplayRate {
  currency: Exclude<DisplayCurrency, "USD">;
  rate: number;
  asOf: string;
  checkedAt: string;
  source: "Frankfurter" | "manual";
}

export function isDisplayCurrency(value: unknown): value is DisplayCurrency {
  return typeof value === "string" && DISPLAY_CURRENCIES.some((code) => code === value);
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

export function isDisplayRate(value: unknown): value is DisplayRate {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return isDisplayCurrency(row.currency) && row.currency !== "USD" &&
    typeof row.rate === "number" && Number.isFinite(row.rate) && row.rate > 0 && row.rate <= 1e12 &&
    isDate(row.asOf) && row.asOf <= new Date().toISOString().slice(0, 10) &&
    typeof row.checkedAt === "string" && Number.isFinite(Date.parse(row.checkedAt)) &&
    Date.parse(row.checkedAt) <= Date.now() &&
    (row.source === "Frankfurter" || row.source === "manual");
}

export function parseRates(value: unknown, checkedAt = new Date().toISOString()): DisplayRate[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error("Invalid exchange rates.");
  const seen = new Set<string>();
  return value.map((item: unknown) => {
    if (typeof item !== "object" || item === null) throw new Error("Invalid exchange rates.");
    const row = item as Record<string, unknown>;
    const rate = { currency: row.quote, rate: row.rate, asOf: row.date, checkedAt, source: "Frankfurter" };
    if (row.base !== "USD" || !isDisplayRate(rate) || seen.has(rate.currency)) {
      throw new Error("Invalid exchange rates.");
    }
    seen.add(rate.currency);
    return rate;
  });
}

export function isRateStale(rate: DisplayRate, now = Date.now()): boolean {
  return now - Date.parse(rate.checkedAt) >= RATE_MAX_AGE ||
    now - Date.parse(`${rate.asOf}T00:00:00Z`) >= RATE_MAX_AGE * 3;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
export function formatUsd(value: number, signed = false): string {
  return `${signed && value > 0 ? "+" : ""}${usd.format(value)}`;
}

export function formatConverted(value: number, currency: DisplayCurrency, language: string, signed = false): string {
  return new Intl.NumberFormat(language, {
    style: "currency", currency, currencyDisplay: "code",
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(value);
}

export function formatMoney(value: number, rate: DisplayRate | null, language: string, signed = false): string {
  const original = formatUsd(value, signed);
  return rate ? `${original} (≈ ${formatConverted(value * rate.rate, rate.currency, language, signed)})` : original;
}

export interface HistoricalAmount {
  amount: number;
  displayRate?: DisplayRate;
}

export function formatHistoricalTotal(items: HistoricalAmount[], currency: DisplayCurrency, language: string): string {
  const usdTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const original = formatUsd(usdTotal, true);
  if (currency === "USD" || !items.length) return original;
  let converted = 0;
  for (const item of items) {
    if (item.displayRate?.currency !== currency) return original;
    converted += item.amount * item.displayRate.rate;
  }
  return `${original} (≈ ${formatConverted(converted, currency, language, true)})`;
}
