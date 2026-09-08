// @vitest-environment jsdom
import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import type { FormState } from "@/components/trade-builder-app";
import { TradeForm } from "@/components/trade-form";

const baseForm = (overrides: Partial<FormState> = {}): FormState => ({
  accountBalance: "600",
  riskTolerance: "2",
  targetBuffer: "75",
  targetMode: "percent",
  direction: "long",
  trend: "uptrend",
  timeframe: "daily",
  atr: "4",
  curveLow: "100",
  curveHigh: "130",
  demandHigh: "108",
  demandLow: "106",
  supplyHigh: "126",
  supplyLow: "124",
  strength: "1",
  time: "0.5",
  freshness: "1",
  openTradeRisk: "0",
  ...overrides,
  xltAcknowledgement: overrides.xltAcknowledgement ?? "",
});

// Renders the wizard parked on the Zones step, holding real form state so
// edits flow through onChange the way they do in the app.
function ZonesStep({ initial }: { initial: FormState }) {
  const [form, setForm] = useState<FormState>(initial);
  const [step, setStep] = useState(3);
  return (
    <TradeForm
      form={form}
      onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
      step={step}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onNext={() => setStep((s) => s + 1)}
      showAdvanced={false}
      onToggleAdvanced={() => { }}
    />
  );
}

// Renders the wizard parked on the pre-steps screen (balance + ATR), holding
// real form state so edits flow through onChange the way they do in the app.
function AccountStep({ initial }: { initial: FormState }) {
  const [form, setForm] = useState<FormState>(initial);
  return (
    <TradeForm
      form={form}
      onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
      step={0}
      onBack={() => { }}
      onNext={() => { }}
      showAdvanced={false}
      onToggleAdvanced={() => { }}
    />
  );
}

// Renders the pre-steps screen with advanced settings open, holding real form
// state so the blur clamp flows through onChange the way it does in the app.
function AdvancedSettings({ initial }: { initial: FormState }) {
  const [form, setForm] = useState<FormState>(initial);
  return (
    <TradeForm
      form={form}
      onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
      step={0}
      onBack={() => { }}
      onNext={() => { }}
      showAdvanced={true}
      onToggleAdvanced={() => { }}
    />
  );
}

describe("given the advanced settings caps", () => {
  test("given a risk above 2%: should snap the field down to 2 on blur", async () => {
    const user = userEvent.setup();
    render(<AdvancedSettings initial={baseForm({ riskTolerance: "2" })} />);
    const risk = screen.getByLabelText("Risk per trade (%)");

    await user.clear(risk);
    await user.type(risk, "5");
    expect(risk).toHaveValue(5); // shown as typed until it loses focus
    await user.tab();

    expect(risk).toHaveValue(2);
  });

  test("given a buffer above 80%: should snap the field down to 80 on blur", async () => {
    const user = userEvent.setup();
    render(<AdvancedSettings initial={baseForm()} />);
    const buffer = screen.getByLabelText("Target buffer (%)");

    await user.clear(buffer);
    await user.type(buffer, "90");
    await user.tab();

    expect(buffer).toHaveValue(80);
  });

  test("given a buffer below 75%: should snap the field up to 75 on blur", async () => {
    const user = userEvent.setup();
    render(<AdvancedSettings initial={baseForm()} />);
    const buffer = screen.getByLabelText("Target buffer (%)");

    await user.clear(buffer);
    await user.type(buffer, "50");
    await user.tab();

    expect(buffer).toHaveValue(75);
  });

  test("given a value already in range: should leave it untouched on blur", async () => {
    const user = userEvent.setup();
    render(<AdvancedSettings initial={baseForm()} />);
    const risk = screen.getByLabelText("Risk per trade (%)");

    await user.clear(risk);
    await user.type(risk, "1.5");
    await user.tab();

    expect(risk).toHaveValue(1.5);
  });

  test("given the target mode control: should offer percentage / 3:1 / auto and switch", async () => {
    const user = userEvent.setup();
    render(<AdvancedSettings initial={baseForm()} />);
    const group = screen.getByRole("radiogroup", { name: "Target mode" });
    const options = within(group)
      .getAllByRole("radio")
      .map((r) => r.textContent);
    expect(options).toEqual(["Percentage", "3:1 R:R", "Auto"]);

    // The visible label reads "3:1 R:R"; the accessible name keeps that and
    // spells it out (WCAG 2.5.3), so it reads "3:1 R:R, 3 to 1 reward to risk".
    const ratio = { name: "3:1 R:R, 3 to 1 reward to risk" };
    // Percentage is selected by default; switching to 3:1 checks it.
    expect(within(group).getByRole("radio", { name: "Percentage" })).toBeChecked();
    await user.click(within(group).getByRole("radio", ratio));
    expect(within(group).getByRole("radio", ratio)).toBeChecked();
  });

  test("given a mechanical target mode: should collapse the target buffer field", async () => {
    // Per Eugene: the buffer % only means something in Percentage mode, so
    // 3:1 and Auto hide the control rather than leave it inert on screen.
    const user = userEvent.setup();
    render(<AdvancedSettings initial={baseForm()} />);
    expect(screen.getByLabelText("Target buffer (%)")).toBeInTheDocument();

    const group = screen.getByRole("radiogroup", { name: "Target mode" });
    await user.click(within(group).getByRole("radio", { name: "Auto" }));
    expect(screen.queryByLabelText("Target buffer (%)")).not.toBeInTheDocument();

    await user.click(
      within(group).getByRole("radio", { name: "3:1 R:R, 3 to 1 reward to risk" }),
    );
    expect(screen.queryByLabelText("Target buffer (%)")).not.toBeInTheDocument();

    await user.click(within(group).getByRole("radio", { name: "Percentage" }));
    expect(screen.getByLabelText("Target buffer (%)")).toBeInTheDocument();
  });
});

describe("given the comma-formatted account balance field", () => {
  test("given deleting the comma directly: should keep the caret in place, not jump to the end", () => {
    render(<AccountStep initial={baseForm({ accountBalance: "1234" })} />);
    const input = screen.getByLabelText(
      "Account balance ($)",
    ) as HTMLInputElement;
    expect(input.value).toBe("1,234");

    // Backspace over the comma at index 1: browser deletes it and leaves the
    // caret where the comma was, right after "1".
    fireEvent.change(input, {
      target: { value: "1234", selectionStart: 1, selectionEnd: 1 },
    });

    expect(input.value).toBe("1,234");
    expect(input.selectionStart).toBe(1);
  });

  test("given a leading minus: should keep it instead of silently stripping it", async () => {
    const user = userEvent.setup();
    render(<AccountStep initial={baseForm({ accountBalance: "" })} />);
    const input = screen.getByLabelText("Account balance ($)");

    await user.type(input, "-5");

    expect(input).toHaveValue("-5");
  });
});

// Renders the wizard parked on the Curve step.
function CurveStep({ initial }: { initial: FormState }) {
  const [form, setForm] = useState<FormState>(initial);
  return (
    <TradeForm
      form={form}
      onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
      step={1}
      onBack={() => { }}
      onNext={() => { }}
      showAdvanced={false}
      onToggleAdvanced={() => { }}
    />
  );
}

// The input order is the point of the top-down flow, and it's exactly the kind
// of thing a later layout refactor undoes without anyone noticing.
describe("given the top-down input order", () => {
  test("given the Curve step: should ask for the high before the low", () => {
    render(<CurveStep initial={baseForm()} />);
    const labels = screen
      .getAllByRole("textbox")
      .map((i) => i.getAttribute("id"));
    expect(labels).toEqual(["curveHigh", "curveLow"]);
  });

  test("given the Zones step: should run supply distal down to demand distal, then direction", () => {
    render(<ZonesStep initial={baseForm()} />);
    const ids = screen.getAllByRole("textbox").map((i) => i.getAttribute("id"));
    // Top-down as the chart reads: supply above (distal over proximal), then
    // demand below (proximal over distal).
    expect(ids).toEqual(["supplyHigh", "supplyLow", "demandHigh", "demandLow"]);

    // Direction is deliberately last: mark the zones as they appear, then
    // decide which way to trade them.
    const direction = screen.getByRole("radiogroup", { name: "Direction" });
    const lastPrice = screen.getByLabelText("Demand distal ($)");
    expect(
      lastPrice.compareDocumentPosition(direction) &
      Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

describe("given the Zones step guard", () => {
  test("given a demand zone with the low above the high: should disable Next and show the error, then recover after a fix", async () => {
    const user = userEvent.setup();
    render(<ZonesStep initial={baseForm({ demandLow: "110" })} />);

    // The guard is active: the action button is disabled and the field errors.
    const blocked = screen.getByRole("button", {
      name: /check the highlighted values/i,
    });
    expect(blocked).toBeDisabled();

    // The error is wired to the field, not just rendered somewhere: the input
    // is marked invalid and exposes the message as its accessible description.
    const demandDistal = screen.getByLabelText("Demand distal ($)");
    expect(demandDistal).toHaveAttribute("aria-invalid", "true");
    expect(demandDistal).toHaveAccessibleDescription(
      /demand distal must be below demand proximal/i,
    );

    // Correct the demand distal so the zone has real height.
    await user.clear(demandDistal);
    await user.type(demandDistal, "106");

    // The error clears, and with it the invalid state and description.
    expect(
      screen.queryByText(/demand distal must be below demand proximal/i),
    ).not.toBeInTheDocument();
    expect(demandDistal).not.toHaveAttribute("aria-invalid");
    const next = screen.getByRole("button", { name: /^next$/i });
    expect(next).toBeEnabled();

    await user.click(next);
    expect(
      screen.getByRole("heading", { name: "Score" }),
    ).toBeInTheDocument();
  });
});

describe("given the direction control on the Zones step", () => {
  test("switching direction should flip the entry/target sentence, not the geometry", async () => {
    const user = userEvent.setup();
    render(<ZonesStep initial={baseForm()} />); // long by default

    // Long: enter demand, target supply.
    expect(
      screen.getByText(/you enter at the demand zone/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Sell short" }));

    // Short: the roles swap — enter supply, target demand.
    expect(
      screen.getByText(/you enter at the supply zone/i),
    ).toBeInTheDocument();

    // Geometry is unchanged, but the selected retail-supply/uptrend cell is an
    // XLT setup, so it requires its explicit acknowledgement before advancing.
    await user.click(screen.getByRole("checkbox", { name: /verified the xlt criteria/i }));
    expect(screen.getByRole("button", { name: /^next$/i })).toBeEnabled();
  });

  test("given an XLT matrix cell: should require an acknowledgement before advancing", async () => {
    const user = userEvent.setup();
    render(<ZonesStep initial={baseForm({ trend: "downtrend" })} />);

    const acknowledgement = screen.getByRole("checkbox", {
      name: /verified the xlt criteria/i,
    });
    expect(screen.getByRole("button", { name: /confirm xlt criteria/i })).toBeDisabled();

    await user.click(acknowledgement);
    expect(screen.getByRole("button", { name: /^next$/i })).toBeEnabled();
  });

  test("given a non-XLT matrix cell: should not show an acknowledgement", () => {
    render(<ZonesStep initial={baseForm()} />);

    expect(screen.queryByRole("checkbox", { name: /verified the xlt criteria/i })).toBeNull();
  });
});

describe("given the odds-enhancer controls on the Score step", () => {
  const optionsFor = (name: string) =>
    within(screen.getByRole("radiogroup", { name }))
      .getAllByRole("radio")
      .map((r) => r.textContent);

  test("should display the automatically calculated trend, curve, and profit-zone scores", () => {
    render(
      <TradeForm
        form={baseForm()}
        onChange={() => { }}
        step={4}
        onBack={() => { }}
        onNext={() => { }}
        showAdvanced={false}
        onToggleAdvanced={() => { }}
      />,
    );

    expect(screen.getByRole("status", { name: "Trend score" })).toHaveTextContent("2");
    expect(screen.getByRole("status", { name: "Curve score" })).toHaveTextContent("1");
    expect(screen.getByRole("status", { name: "Profit zone score" })).toHaveTextContent("2");
    expect(screen.getByText("Auto-scored odds enhancers")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Total odds-enhancer score" })).toHaveTextContent("7.5");
  });

  test("should offer a strength dropdown and rating chips for the other factors", () => {
    render(
      <TradeForm
        form={baseForm()}
        onChange={() => { }}
        step={4}
        onBack={() => { }}
        onNext={() => { }}
        showAdvanced={false}
        onToggleAdvanced={() => { }}
      />,
    );

    const strength = screen.getByRole("button", { name: "Strength" });
    expect(strength).toHaveTextContent("1");
    fireEvent.click(strength);
    expect(screen.queryByRole("option", { name: "2" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "1" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "0" })).not.toBeInTheDocument();
    expect(screen.getByText("How did price leave the zone?")).toBeInTheDocument();
    expect(screen.getByText("Move out AND Breakout")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Best strength, 2 points" }));
    expect(screen.queryByText("How did price leave the zone?")).not.toBeInTheDocument();
    fireEvent.click(strength);
    expect(screen.getByText("How did price leave the zone?")).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByText("How did price leave the zone?")).not.toBeInTheDocument();
    fireEvent.click(strength);
    fireEvent.pointerDown(screen.getByText("Strength"));
    fireEvent.click(screen.getByText("Strength"));
    expect(screen.queryByText("How did price leave the zone?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Freshness" })).toHaveTextContent("1");
    fireEvent.click(screen.getByRole("button", { name: "Freshness" }));
    expect(screen.getByText("Has price returned to the zone?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Poor freshness, 0 points" }));
    expect(screen.queryByText("Has price returned to the zone?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Time" })).toHaveTextContent("0.5");
  });

  test("given any factor unanswered: should disable the final action, even with the other two answered", () => {
    render(
      <TradeForm
        form={baseForm({ freshness: "" })}
        onChange={() => { }}
        step={4}
        onBack={() => { }}
        onNext={() => { }}
        showAdvanced={false}
        onToggleAdvanced={() => { }}
      />,
    );

    // Otherwise the auto-scored factors alone (curve + trend + profit zone,
    // up to 5) plus strength and time (up to 3) can clear 7 and qualify a
    // trade the user never finished scoring.
    expect(screen.getByRole("button", { name: /1 field left/i })).toBeDisabled();
  });

  test("given all three answered: should enable the final action", () => {
    render(
      <TradeForm
        form={baseForm()}
        onChange={() => { }}
        step={4}
        onBack={() => { }}
        onNext={() => { }}
        showAdvanced={false}
        onToggleAdvanced={() => { }}
      />,
    );

    expect(screen.getByRole("button", { name: /see my trade/i })).toBeEnabled();
  });
});
