"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLanguage } from "@/components/language-provider";
import {
  CURRENCY_STORAGE_KEY, RATES_STORAGE_KEY, RATES_URL, isDisplayCurrency, isDisplayRate,
  isRateStale, parseRates, formatMoney, type DisplayCurrency, type DisplayRate,
} from "@/lib/display-currency";

type CurrencyError = "fetch" | "storage" | "invalid";
interface CurrencySettings {
  currency: DisplayCurrency;
  rate: DisplayRate | null;
  loading: boolean;
  error: CurrencyError | null;
  selectCurrency: (currency: DisplayCurrency) => void;
  refresh: () => void;
  applyManualRate: (value: string) => void;
}
const CurrencyContext = createContext<CurrencySettings | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const existing = useContext(CurrencyContext);
  return existing ? children : <CurrencySettingsProvider>{children}</CurrencySettingsProvider>;
}

function CurrencySettingsProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<DisplayCurrency>("USD");
  const [rates, setRates] = useState<DisplayRate[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CurrencyError | null>(null);
  const request = useRef<AbortController | null>(null);
  const rate = rates.find((item) => item.currency === currency) ?? null;

  useEffect(() => {
    try {
      const preference = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (preference !== null) {
        if (!isDisplayCurrency(preference)) throw new Error("Invalid currency preference.");
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate browser preferences
        setCurrency(preference);
      }
      const cached = window.localStorage.getItem(RATES_STORAGE_KEY);
      if (cached !== null) {
        const parsed: unknown = JSON.parse(cached);
        if (!Array.isArray(parsed) || !parsed.every(isDisplayRate) ||
          new Set(parsed.map((item) => item.currency)).size !== parsed.length) {
          throw new Error("Invalid cached rates.");
        }
        setRates(parsed);
      }
    } catch {
      setError("storage");
    }
    setReady(true);
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, []);

  async function refresh() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 10000);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(RATES_URL, { signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer" });
      if (!response.ok) throw new Error(`Exchange rate request failed: ${response.status}`);
      const quotes = parseRates(await response.json());
      if (controller !== request.current) return;
      if (currency !== "USD" && !quotes.some((item) => item.currency === currency)) {
        throw new Error("Selected currency was not returned.");
      }
      // Retain other cached currencies when a provider temporarily omits them.
      const next = [...quotes, ...rates.filter((item) => !quotes.some((quote) => quote.currency === item.currency))];
      try {
        window.localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        setError("storage");
      }
      setRates(next);
    } catch {
      if (controller === request.current) setError("fetch");
    } finally {
      clearTimeout(timeout);
      if (controller === request.current) {
        setLoading(false);
        request.current = null;
      }
    }
  }

  useEffect(() => {
    if (!ready || currency === "USD" || (rate && (rate.source === "manual" || !isRateStale(rate)))) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch reference rates when the preference changes
    void refresh();
    // Only selection/hydration triggers automatic requests; failures need an explicit retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, ready]);

  function selectCurrency(next: DisplayCurrency) {
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, next);
      request.current?.abort();
      request.current = null;
      setLoading(false);
      setCurrency(next);
      setError(null);
    } catch {
      setError("storage");
    }
  }

  function applyManualRate(value: string) {
    const manual = {
      currency, rate: Number(value), source: "manual",
      asOf: new Date().toISOString().slice(0, 10), checkedAt: new Date().toISOString(),
    };
    if (!value.trim() || !isDisplayRate(manual)) {
      setError("invalid");
      return;
    }
    const next = [manual, ...rates.filter((item) => item.currency !== currency)];
    try {
      window.localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(next));
      request.current?.abort();
      request.current = null;
      setLoading(false);
      setRates(next);
      setError(null);
    } catch {
      setError("storage");
    }
  }

  return <CurrencyContext.Provider value={{ currency, rate, loading, error, selectCurrency, refresh, applyManualRate }}>
    {children}
  </CurrencyContext.Provider>;
}

export function useCurrency() {
  const settings = useContext(CurrencyContext);
  const { language } = useLanguage();
  return {
    currency: settings?.currency ?? "USD",
    rate: settings?.rate ?? null,
    format: (value: number, savedRate: DisplayRate | null = settings?.rate ?? null, signed = false) =>
      formatMoney(value, savedRate, language, signed),
  };
}

export function useCurrencySettings() {
  const settings = useContext(CurrencyContext);
  if (!settings) throw new Error("Currency settings must be used within CurrencyProvider.");
  return settings;
}
