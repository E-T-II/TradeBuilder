"use client";

import { useLanguage } from "@/components/language-provider";
import { useCurrency } from "@/components/currency-provider";
import { currencyText } from "@/lib/currency-translations";
import { isRateStale, type DisplayRate } from "@/lib/display-currency";

export function CurrencyNote({ savedRate }: { savedRate?: DisplayRate | null }) {
  const { language } = useLanguage();
  const { currency, rate: liveRate } = useCurrency();
  const historical = savedRate !== undefined;
  const rate = historical ? savedRate : liveRate;
  if (!rate && currency === "USD") return null;
  return <p className="text-xs text-muted-foreground">
    {currencyText(language, "estimates")}
    {rate ? <>{" "}{historical ? currencyText(language, "saved") : ""}{" "}
      <bdi>{`1 USD = ${rate.rate} ${rate.currency}`}</bdi> · {rate.source === "manual" ? currencyText(language, "manual") : rate.source} · <time dateTime={rate.asOf}>{rate.asOf}</time>
      {!historical && isRateStale(rate) ? <>{" "}{currencyText(language, "cached")}</> : null}
    </> : historical ? <>{" "}{currencyText(language, "noSaved")}</> : null}
  </p>;
}

export function CurrencyAmountHint({ value, savedRate }: { value: string; savedRate?: DisplayRate | null }) {
  const { rate: liveRate, format } = useCurrency();
  const rate = savedRate === undefined ? liveRate : savedRate;
  if (!rate || value.trim() === "" || !Number.isFinite(Number(value))) return null;
  return <p className="text-xs text-muted-foreground"><bdi>{format(Number(value), rate)}</bdi></p>;
}
