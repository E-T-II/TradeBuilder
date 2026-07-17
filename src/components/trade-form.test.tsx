// @vitest-environment jsdom
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
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

    // The error is wired to the field, not just rendered somewhere: the input
    // is marked invalid and exposes the message as its accessible description.
    const entryDistal = screen.getByLabelText("Entry distal ($)");
    expect(entryDistal).toHaveAttribute("aria-invalid", "true");
    expect(entryDistal).toHaveAccessibleDescription(
      /entry distal should be above the proximal/i,
    );

    // Correct the entry distal so the geometry is valid for a short.
    await user.clear(entryDistal);
    await user.type(entryDistal, "126");

    // The error clears, and with it the invalid state and description.
    expect(
      screen.queryByText(/entry distal should be above the proximal/i),
    ).not.toBeInTheDocument();
    expect(entryDistal).not.toHaveAttribute("aria-invalid");
    const next = screen.getByRole("button", { name: /^next$/i });
    expect(next).toBeEnabled();

    await user.click(next);
    expect(
      screen.getByRole("heading", { name: "Your read" }),
    ).toBeInTheDocument();
  });
});

describe("given the odds-enhancer chips on the Your read step", () => {
  const optionsFor = (name: string) =>
    within(screen.getByRole("radiogroup", { name }))
      .getAllByRole("radio")
      .map((r) => r.textContent);

  test("should offer 0/1/2 for strength and freshness, and 0/0.5/1 for time", () => {
    render(
      <TradeForm
        form={baseForm()}
        onChange={() => {}}
        step={3}
        onBack={() => {}}
        onNext={() => {}}
        showAdvanced={false}
        onToggleAdvanced={() => {}}
      />,
    );

    expect(optionsFor("Strength")).toEqual(["0", "1", "2"]);
    expect(optionsFor("Freshness")).toEqual(["0", "1", "2"]);
    expect(optionsFor("Time")).toEqual(["0", "0.5", "1"]);
  });
});
