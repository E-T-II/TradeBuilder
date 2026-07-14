"use client";

import { useState } from "react";
import type { FormState } from "@/components/trade-builder-app";
import { JUDGED_MAX } from "@/lib/trade-builder";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RatingChips } from "@/components/rating-chips";
import { SegmentedControl } from "@/components/segmented-control";
import { Separator } from "@/components/ui/separator";

interface TradeFormProps {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
  onLoadExample: () => void;
  onReset: () => void;
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function PriceInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Input
      id={id}
      type="number"
      min="0"
      step="0.01"
      inputMode="decimal"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function SectionTitle({ step, title }: { step: string; title: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-medium">
      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
        {step}
      </span>
      {title}
    </h3>
  );
}

export function TradeForm({
  form,
  onChange,
  onLoadExample,
  onReset,
}: TradeFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Build a trade</CardTitle>
          <CardDescription>
            Read your zones off the chart and enter them here — the score
            updates as you go.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onLoadExample}>
            Load example
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <section className="space-y-4">
          <SectionTitle step="1" title="Account" />
          <Field
            id="balance"
            label="Account balance ($)"
            hint="Your balance with your broker — sets every risk limit"
          >
            <Input
              id="balance"
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="600"
              value={form.accountBalance}
              onChange={(e) => onChange({ accountBalance: e.target.value })}
            />
          </Field>

          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => setShowAdvanced((s) => !s)}
          >
            {showAdvanced ? "Hide" : "Show"} advanced settings
          </button>

          {showAdvanced ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="risk" label="Risk per trade (%)" hint="2% max">
                <Input
                  id="risk"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  inputMode="decimal"
                  value={form.riskTolerance}
                  onChange={(e) => onChange({ riskTolerance: e.target.value })}
                />
              </Field>
              <Field id="buffer" label="Target buffer (%)" hint="75 to 80%">
                <Input
                  id="buffer"
                  type="number"
                  min="0"
                  max="100"
                  inputMode="decimal"
                  value={form.targetBuffer}
                  onChange={(e) => onChange({ targetBuffer: e.target.value })}
                />
              </Field>
              <Field
                id="openRisk"
                label="Risk in open trades ($)"
                hint="For the 6% rule — 0 if this is your only trade"
              >
                <Input
                  id="openRisk"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={form.openTradeRisk}
                  onChange={(e) => onChange({ openTradeRisk: e.target.value })}
                />
              </Field>
            </div>
          ) : null}
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle step="2" title="Trade" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="direction" label="Direction">
              <SegmentedControl
                aria-label="Direction"
                value={form.direction}
                options={[
                  { value: "long", label: "Buy long" },
                  { value: "short", label: "Sell short" },
                ]}
                onChange={(direction) => onChange({ direction })}
              />
            </Field>
            <Field
              id="timeframe"
              label="Income objective"
              hint="Sets the stop buffer: 2% or 10% of ATR"
            >
              <SegmentedControl
                aria-label="Income objective"
                value={form.timeframe}
                options={[
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly +" },
                ]}
                onChange={(timeframe) => onChange({ timeframe })}
              />
            </Field>
          </div>
          <Field id="trend" label="Trend">
            <SegmentedControl
              aria-label="Trend"
              value={form.trend}
              options={[
                { value: "uptrend", label: "Uptrend" },
                { value: "sideways", label: "Sideways" },
                { value: "downtrend", label: "Downtrend" },
              ]}
              onChange={(trend) => onChange({ trend })}
            />
          </Field>
          <Field
            id="atr"
            label="Daily ATR ($)"
            hint="From finviz.com — 14-day average true range"
          >
            <PriceInput
              id="atr"
              placeholder="5.93"
              value={form.atr}
              onChange={(atr) => onChange({ atr })}
            />
          </Field>
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle step="3" title="Zones" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="curveLow"
              label="Curve low ($)"
              hint="HTF demand zone distal line"
            >
              <PriceInput
                id="curveLow"
                value={form.curveLow}
                onChange={(curveLow) => onChange({ curveLow })}
              />
            </Field>
            <Field
              id="curveHigh"
              label="Curve high ($)"
              hint="HTF supply zone distal line"
            >
              <PriceInput
                id="curveHigh"
                value={form.curveHigh}
                onChange={(curveHigh) => onChange({ curveHigh })}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="entryProximal"
              label="Entry proximal ($)"
              hint="The line you enter at"
            >
              <PriceInput
                id="entryProximal"
                value={form.entryProximal}
                onChange={(entryProximal) => onChange({ entryProximal })}
              />
            </Field>
            <Field
              id="entryDistal"
              label="Entry distal ($)"
              hint="The far edge — your stop hides behind it"
            >
              <PriceInput
                id="entryDistal"
                value={form.entryDistal}
                onChange={(entryDistal) => onChange({ entryDistal })}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="targetProximal"
              label="Target proximal ($)"
              hint="Near edge of the zone you exit into"
            >
              <PriceInput
                id="targetProximal"
                value={form.targetProximal}
                onChange={(targetProximal) => onChange({ targetProximal })}
              />
            </Field>
            <Field id="targetDistal" label="Target distal ($)">
              <PriceInput
                id="targetDistal"
                value={form.targetDistal}
                onChange={(targetDistal) => onChange({ targetDistal })}
              />
            </Field>
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <SectionTitle step="4" title="Your judgment" />
          <p className="text-xs text-muted-foreground">
            Score the entry zone from your own analysis per the trade
            methodology.
          </p>
          <Field id="strength" label="Strength">
            <RatingChips
              aria-label="Strength"
              value={Number(form.strength)}
              max={JUDGED_MAX.strength}
              onChange={(v) => onChange({ strength: String(v) })}
            />
          </Field>
          <Field id="time" label="Time">
            <RatingChips
              aria-label="Time"
              value={Number(form.time)}
              max={JUDGED_MAX.time}
              onChange={(v) => onChange({ time: String(v) })}
            />
          </Field>
          <Field id="freshness" label="Freshness">
            <RatingChips
              aria-label="Freshness"
              value={Number(form.freshness)}
              max={JUDGED_MAX.freshness}
              onChange={(v) => onChange({ freshness: String(v) })}
            />
          </Field>
        </section>
      </CardContent>
    </Card>
  );
}
