"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Banknote, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/language-provider";
import { useCurrencySettings } from "@/components/currency-provider";
import { DISPLAY_CURRENCIES, isDisplayCurrency, isRateStale } from "@/lib/display-currency";
import { currencyText } from "@/lib/currency-translations";

export function CurrencySelector() {
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState("");
  const { language, text: tx } = useLanguage();
  const { currency, rate, loading, error, selectCurrency, refresh, applyManualRate } = useCurrencySettings();
  const ct = (key: Parameters<typeof currencyText>[1]) => currencyText(language, key);
  const errorText = error ? ct(error === "fetch" ? "fetchError" : error === "storage" ? "storageError" : "invalidError") : null;
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger render={<Button variant="ghost" size="sm" aria-label={ct("title")} />}>
      <Banknote aria-hidden /><span className="hidden sm:inline">{currency}</span>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50" />
      <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(32rem,96vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-5 shadow-lg outline-none">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Dialog.Title className="font-medium">{ct("title")}</Dialog.Title>
          <Dialog.Close render={<Button variant="ghost" size="icon-sm" aria-label={tx("Close")} />}><X aria-hidden /></Dialog.Close>
        </div>
        <Dialog.Description className="mb-4 text-sm text-muted-foreground">{ct("description")}</Dialog.Description>
        <label className="block space-y-2 text-sm font-medium">
          <span>{ct("title")}</span>
          <select value={currency} className="h-11 w-full rounded-lg border bg-background px-3" onChange={(event) => {
            if (!isDisplayCurrency(event.target.value)) throw new Error("Invalid currency selection.");
            setManual("");
            selectCurrency(event.target.value);
          }}>
            {DISPLAY_CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
          </select>
        </label>
        <p className="my-4 text-sm text-muted-foreground">{ct("estimates")}</p>
        {currency !== "USD" ? <div className="space-y-3">
          {rate ? <p className="text-sm"><bdi>{`1 USD = ${rate.rate} ${currency}`}</bdi><br />
            {rate.source === "manual" ? ct("manual") : rate.source} · <time dateTime={rate.asOf}>{rate.asOf}</time>
          </p> : null}
          {rate && (isRateStale(rate) || error === "fetch") ? <p role="status" className="text-sm text-amber-700 dark:text-amber-400">{ct("cached")}</p> : null}
          <Button variant="outline" size="sm" disabled={loading} onClick={refresh}>{ct("refresh")}</Button>
          {loading ? <p role="status" className="text-sm">{ct("loading")}</p> : null}
          <label className="block space-y-2 text-sm">
            <span>{ct("manual")} (<bdi>{`1 USD → ${currency}`}</bdi>)</span>
            <Input type="number" min="0" step="any" value={manual} onChange={(event) => setManual(event.target.value)} />
          </label>
          <Button variant="outline" size="sm" onClick={() => applyManualRate(manual)}>{ct("apply")}</Button>
        </div> : null}
        {errorText ? <p role="alert" className="mt-4 text-sm text-destructive">{errorText}</p> : null}
      </Dialog.Popup>
    </Dialog.Portal>
    {errorText && !open ? <p role="alert" className="max-w-48 text-xs text-destructive">{errorText}</p> : null}
  </Dialog.Root>;
}
