// @vitest-environment jsdom
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { ZoneScorecard, type ZoneRatings } from "@/components/zone-scorecard";
import { normalizeForm } from "@/components/trade-builder-app";

const form = normalizeForm({
  ticker: "TEST", accountBalance: "2500", atr: "4",
  curveLow: "100", curveHigh: "130",
  demandHigh: "108", demandLow: "106", supplyHigh: "128", supplyLow: "124",
  strength: "2", time: "1", freshness: "2",
});

function EditableCard() {
  const [ratings, setRatings] = useState<ZoneRatings>({
    strength: "", time: "", freshness: "",
  });
  return <ZoneScorecard form={form} direction="short" opposing ratings={ratings} onChange={(patch) => setRatings((current) => ({ ...current, ...patch }))} />;
}

test("graphical selectors support unanswered, zero and half-point ratings and update the total", async () => {
  const user = userEvent.setup();
  render(<EditableCard />);
  expect(screen.getByLabelText("Total odds-enhancer score")).toHaveTextContent("-");
  expect(screen.getByRole("button", { name: "Strength" }).textContent).toBe("");

  for (const [factor, choice] of [
    ["Strength", "Best strength, 2 points"],
    ["Time", "Good time, 0.5 points"],
    ["Freshness", "Poor freshness, 0 points"],
  ]) {
    await user.click(screen.getByRole("button", { name: factor }));
    expect(screen.getByRole("img", { name: new RegExp(`${factor} reference for a Supply`) })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: choice }));
    expect(screen.getByRole("button", { name: factor })).toHaveAttribute("aria-expanded", "false");
  }
  expect(screen.getByLabelText("Total odds-enhancer score")).toHaveTextContent("4.5");
  expect(screen.getByRole("button", { name: "Freshness" })).toHaveTextContent("0");
  expect(screen.getByRole("button", { name: "Time" })).toHaveTextContent("0.5");

  await user.click(screen.getByRole("button", { name: "Strength" }));
  await user.keyboard("{Escape}");
  expect(screen.getByRole("button", { name: "Strength" })).toHaveAttribute("aria-expanded", "false");
});

test.each([
  { direction: "short" as const, trend: "0", curve: "1", profit: "1", zone: "Supply" },
  { direction: "long" as const, trend: "2", curve: "1", profit: "2", zone: "Demand" },
])("automatically scores the $zone zone using its own direction and width", ({ direction, trend, curve, profit, zone }) => {
  render(<ZoneScorecard form={form} direction={direction} opposing ratings={{ strength: "1", time: "0.5", freshness: "1" }} onChange={() => {}} />);
  const card = within(screen.getByRole("region", { name: "Target zone scorecard" }));
  expect(card.getByText(new RegExp(`${zone} zone`))).toBeInTheDocument();
  expect(card.getByText(direction === "long" ? "Demand · Buy" : "Supply · Sell")).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Target zone scorecard" })).toHaveClass(
    direction === "long" ? "border-t-emerald-500" : "border-t-red-500",
  );
  expect(card.getByLabelText("Trend score")).toHaveTextContent(trend);
  expect(card.getByLabelText("Curve score")).toHaveTextContent(curve);
  expect(card.getByLabelText("Profit zone score")).toHaveTextContent(profit);
});

test.each([
  { direction: "long" as const, opposing: false, zone: "Demand" },
  { direction: "long" as const, opposing: true, zone: "Demand" },
  { direction: "short" as const, opposing: false, zone: "Supply" },
  { direction: "short" as const, opposing: true, zone: "Supply" },
])("opens read-only visual references for the $zone scorecard without changing ratings", async ({ direction, opposing, zone }) => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<ZoneScorecard form={form} direction={direction} opposing={opposing} ratings={{ strength: "2", time: "1", freshness: "2" }} onChange={onChange} />);
  const total = screen.getByLabelText("Total odds-enhancer score").textContent;
  const scores = ["Trend", "Curve", "Profit zone"].map((label) => screen.getByLabelText(`${label} score`).textContent);

  for (const [index, label] of ["Trend", "Curve", "Profit zone"].entries()) {
    const trigger = screen.getByRole("button", { name: `About ${label}` });
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: `${label} reference` });
    const graphic = within(dialog).getByRole("img", { name: new RegExp(`${label} reference for a ${zone}`) });
    expect(graphic).toHaveAttribute("src", `/odds-enhancers/${["trend", "curve", "profit-zone"][index]}${direction === "short" ? "-supply" : ""}.png`);
    expect(graphic).toHaveAccessibleName(/Best = .*Good = .*Poor = 0/);
    expect(dialog.querySelector("figcaption")).toBeNull();
    expect(dialog.querySelector("svg[role='img']")).toBeNull();
    expect(within(dialog).getAllByRole("button")).toHaveLength(1);
    expect(dialog).toHaveAccessibleDescription(/Informational only. Scores are calculated automatically/);

    if (index === 0) {
      await user.keyboard("{Escape}");
    } else {
      await user.click(within(dialog).getByRole("button", { name: `Close ${label} reference` }));
    }
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(screen.getByLabelText(`${label} score`)).toHaveTextContent(scores[index] ?? "");
    expect(screen.getByLabelText("Total odds-enhancer score").textContent).toBe(total);
  }
  expect(onChange).not.toHaveBeenCalled();
});

test.each([false, true])("shows the matching read-only Total score photo as zone direction changes (opposing: %s)", async (opposing) => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  const ratings = { strength: "2", time: "1", freshness: "2" };
  const { rerender } = render(
    <ZoneScorecard form={form} direction="long" opposing={opposing} ratings={ratings} onChange={onChange} />,
  );
  const total = screen.getByLabelText("Total odds-enhancer score").textContent;
  const trigger = screen.getByRole("button", { name: "About Total score" });
  await user.click(trigger);
  const dialog = await screen.findByRole("dialog", { name: "Total score reference" });
  expect(within(dialog).getByRole("img", { name: /Total score reference for a Demand Buy Setup/ }))
    .toHaveAttribute("src", "/odds-enhancers/total-score.png");
  expect(dialog).toHaveAccessibleDescription(/8.5 or more.*7 to 8.*below 7.*Informational only/);
  expect(within(dialog).getAllByRole("button")).toHaveLength(1);
  expect(dialog.querySelector("figcaption")).toBeNull();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(screen.getByLabelText("Total odds-enhancer score").textContent).toBe(total);
  expect(onChange).not.toHaveBeenCalled();

  rerender(<ZoneScorecard form={form} direction="short" opposing={opposing} ratings={ratings} onChange={onChange} />);
  const supplyTotal = screen.getByLabelText("Total odds-enhancer score").textContent;
  await user.click(screen.getByRole("button", { name: "About Total score" }));
  const supplyDialog = await screen.findByRole("dialog", { name: "Total score reference" });
  expect(within(supplyDialog).getByRole("img", { name: /Total score reference for a Supply Sell Setup/ }))
    .toHaveAttribute("src", "/odds-enhancers/total-score-supply.png");
  expect(supplyDialog).toHaveAccessibleDescription(/8.5 or more.*7 to 8.*below 7.*Informational only/);
  expect(within(supplyDialog).getAllByRole("button")).toHaveLength(1);
  expect(supplyDialog.querySelector("figcaption")).toBeNull();
  await user.click(within(supplyDialog).getByRole("button", { name: "Close Total score reference" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "About Total score" })).toHaveFocus();
  expect(screen.getByLabelText("Total odds-enhancer score").textContent).toBe(supplyTotal);
  expect(onChange).not.toHaveBeenCalled();
});

test.each([
  { direction: "long" as const, opposing: false },
  { direction: "long" as const, opposing: true },
  { direction: "short" as const, opposing: false },
  { direction: "short" as const, opposing: true },
])("highlights the option matching each computed score ($direction, opposing: $opposing)", async ({ direction, opposing }) => {
  const user = userEvent.setup();
  render(<ZoneScorecard form={form} direction={direction} opposing={opposing} ratings={{ strength: "2", time: "1", freshness: "2" }} onChange={() => {}} />);

  for (const [label, best] of [["Trend", 2], ["Curve", 1], ["Profit zone", 2], ["Total score", null]] as const) {
    const score = Number(screen.getByLabelText(label === "Total score" ? "Total odds-enhancer score" : `${label} score`).textContent);
    const expected = best === null
      ? score >= 8.5 ? "Proximal" : score >= 7 ? "Confirmation" : "No trade"
      : `${score >= best ? "Best" : score > 0 ? "Good" : "Poor"} = ${score}`;
    await user.click(screen.getByRole("button", { name: `About ${label}` }));
    const dialog = await screen.findByRole("dialog", { name: `${label} reference` });
    expect(dialog.querySelectorAll("svg[data-selected-option]")).toHaveLength(1);
    expect(dialog.querySelector("svg[data-selected-option]")).toHaveAttribute("data-selected-option", expected);
    await user.keyboard("{Escape}");
  }
});

test("does not highlight the Total score card until every rating is answered", async () => {
  const user = userEvent.setup();
  render(<ZoneScorecard form={form} direction="long" opposing={false} ratings={{ strength: "2", time: "", freshness: "2" }} onChange={() => {}} />);
  await user.click(screen.getByRole("button", { name: "About Total score" }));
  const dialog = await screen.findByRole("dialog", { name: "Total score reference" });
  expect(dialog.querySelector("svg[data-selected-option]")).toBeNull();
  await user.keyboard("{Escape}");

  await user.click(screen.getByRole("button", { name: "About Trend" }));
  const trendDialog = await screen.findByRole("dialog", { name: "Trend reference" });
  expect(trendDialog.querySelector("svg[data-selected-option]")).not.toBeNull();
});

test.each([
  { direction: "long" as const, opposing: false },
  { direction: "short" as const, opposing: true },
])("shows the profit zone ratio and, once every rating is in, the entry type ($direction)", ({ direction, opposing }) => {
  const props = { form, direction, opposing, onChange: () => {} };
  const { rerender } = render(<ZoneScorecard {...props} ratings={{ strength: "", time: "1", freshness: "2" }} />);
  expect(screen.getByLabelText(/^Profit zone ratio \d+\.\d{2}:1$/)).toHaveTextContent(/^Ratio \d+\.\d{2}:1$/);
  expect(screen.queryByLabelText(/^Entry type/)).not.toBeInTheDocument();

  for (const [strength, label] of [["2", "Proximal"], ["0", "Confirmation"]] as const) {
    rerender(<ZoneScorecard {...props} ratings={{ strength, time: "1", freshness: "2" }} />);
    const total = Number(screen.getByLabelText("Total odds-enhancer score").textContent);
    const expected = total >= 8.5 ? "Proximal" : total >= 7 ? "Confirmation" : "No Trade";
    expect(screen.getByLabelText(`Entry type ${expected}`)).toHaveTextContent(expected);
    if (direction === "long" && !opposing) expect(expected).toBe(label);
  }
});

test("hides the profit zone ratio and entry type until the zone inputs are valid", () => {
  render(<ZoneScorecard form={{ ...form, curveHigh: "90" }} direction="long" ratings={{ strength: "2", time: "1", freshness: "2" }} onChange={() => {}} />);
  expect(screen.queryByLabelText(/Profit zone ratio/)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/^Entry type/)).not.toBeInTheDocument();
});
