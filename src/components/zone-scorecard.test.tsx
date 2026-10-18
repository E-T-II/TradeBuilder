// @vitest-environment jsdom
import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
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
  expect(card.getByLabelText("Trend score")).toHaveTextContent(trend);
  expect(card.getByLabelText("Curve score")).toHaveTextContent(curve);
  expect(card.getByLabelText("Profit zone score")).toHaveTextContent(profit);
});
