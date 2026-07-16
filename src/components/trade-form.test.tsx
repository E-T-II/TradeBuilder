// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import type { FormState } from "@/components/trade-builder-app";
import { TradeForm } from "@/components/trade-form";

const baseForm = (overrides: Partial<FormState> = {}): FormState => ({
  accountBalance: "600",
  riskTolerance: "2",
  targetBuffer: "75",
  direction: "long",
  trend: "uptrend",
  timeframe: "daily",
  atr: "4",
  curveLow: "100",
  curveHigh: "130",
  entryProximal: "108",
  entryDistal: "106",
  targetProximal: "124",
  targetDistal: "126",
  strength: "1",
  time: "0.5",
  freshness: "1",
  openTradeRisk: "0",
  ...overrides,
});

// Renders the wizard parked on the Zones step, holding real form state so
// edits flow through onChange the way they do in the app.
function ZonesStep({ initial }: { initial: FormState }) {
  const [form, setForm] = useState<FormState>(initial);
  const [step, setStep] = useState(2);
  return (
    <TradeForm
      form={form}
      onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
      step={step}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={() => setStep((s) => s + 1)}
      showAdvanced={false}
      onToggleAdvanced={() => {}}
    />
  );
}

describe("given the Zones step guard", () => {
  test("given backwards zone geometry: should disable Next and show the error, then recover after a fix", async () => {
    const user = userEvent.setup();
    render(
      <ZonesStep
        initial={baseForm({
          direction: "short",
          entryProximal: "124",
          entryDistal: "100",
          targetProximal: "108",
          targetDistal: "106",
        })}
      />,
    );

    // The guard is active: the action button is disabled and the field errors.
    const blocked = screen.getByRole("button", {
      name: /check the highlighted values/i,
    });
    expect(blocked).toBeDisabled();
    expect(
      screen.getByText(/entry distal should be above the proximal/i),
    ).toBeInTheDocument();

    // Correct the entry distal so the geometry is valid for a short.
    const entryDistal = screen.getByLabelText("Entry distal ($)");
    await user.clear(entryDistal);
    await user.type(entryDistal, "126");

    // The error clears and Next both enables and advances the wizard.
    expect(
      screen.queryByText(/entry distal should be above the proximal/i),
    ).not.toBeInTheDocument();
    const next = screen.getByRole("button", { name: /^next$/i });
    expect(next).toBeEnabled();

    await user.click(next);
    expect(
      screen.getByRole("heading", { name: "Your read" }),
    ).toBeInTheDocument();
  });
});
