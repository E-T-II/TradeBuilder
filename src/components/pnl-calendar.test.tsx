// @vitest-environment jsdom
import { expect, test } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PnlCalendar } from "@/components/pnl-calendar";

test("aggregates daily P&L, shades profits and losses by magnitude, and leaves non-trading days blank", async () => {
  const user = userEvent.setup();
  render(<PnlCalendar outcomes={[
    { closedOn: "2026-09-01", pnl: 100 },
    { closedOn: "2026-09-01", pnl: -25.25 },
    { closedOn: "2026-09-02", pnl: -200 },
    { closedOn: "2026-09-03", pnl: 0 },
    { closedOn: "2026-09-04", pnl: 200 },
    { closedOn: "2026-09-30", pnl: 0.1 },
    { closedOn: "2026-09-30", pnl: 0.2 },
    { closedOn: "2026-10-01", pnl: 50 },
    { pnl: 10 },
    { closedOn: "2026-02-30", pnl: 20 },
  ]} />);
  await user.click(screen.getByRole("button", { name: "P&L Analysis" }));
  const dialog = screen.getByRole("dialog", { name: "P&L Analysis" });
  fireEvent.change(screen.getByLabelText("Calendar month"), { target: { value: "2026-09" } });
  expect(within(dialog).getByRole("table", { name: "September 2026" })).toBeInTheDocument();
  const gain = screen.getByRole("cell", { name: "2026-09-01: +$74.75, 2 trades" });
  const loss = screen.getByRole("cell", { name: "2026-09-02: -$200.00, 1 trade" });
  const largerGain = screen.getByRole("cell", { name: "2026-09-04: +$200.00, 1 trade" });
  expect(gain.style.backgroundImage).toContain("16, 185, 129");
  expect(loss.style.backgroundImage).toContain("239, 68, 68");
  expect(largerGain.style.backgroundImage).toContain("0.5");
  expect(gain.style.backgroundImage).not.toEqual(largerGain.style.backgroundImage);
  expect(screen.getByRole("cell", { name: "2026-09-03: $0.00, 1 trade" }).style.backgroundImage).toBe("");
  expect(screen.getByRole("cell", { name: "2026-09-05: No trades" }).style.backgroundImage).toBe("");
  expect(screen.getByRole("cell", { name: "2026-09-30: +$0.30, 2 trades" })).toBeInTheDocument();
  expect(within(dialog).getByText("+$75.05")).toBeInTheDocument();
  expect(within(dialog).getByText("7 closed trades · 5 trading days")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("2 completed trades are not shown");
  await user.click(screen.getByRole("button", { name: "Next month" }));
  expect(screen.getByRole("table", { name: "October 2026" })).toBeInTheDocument();
  expect(screen.getByRole("cell", { name: "2026-10-01: +$50.00, 1 trade" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close P&L Analysis" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("supports empty months, leap days, year navigation, and returning to today", async () => {
  const user = userEvent.setup();
  render(<PnlCalendar outcomes={[]} />);
  await user.click(screen.getByRole("button", { name: "P&L Analysis" }));
  fireEvent.change(screen.getByLabelText("Calendar month"), { target: { value: "2024-02" } });
  expect(screen.getByRole("cell", { name: "2024-02-29: No trades" })).toBeInTheDocument();
  expect(screen.getByText("No closed trades with P&L and a Closing date in February 2024.")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Calendar month"), { target: { value: "2026-01" } });
  await user.click(screen.getByRole("button", { name: "Previous month" }));
  expect(screen.getByRole("table", { name: "December 2025" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Today" }));
  expect(screen.getByRole("table", {
    name: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  })).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("prevents navigating or selecting a month beyond the current month", async () => {
  const user = userEvent.setup();
  const now = new Date();
  const latestMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  render(<PnlCalendar outcomes={[]} />);
  await user.click(screen.getByRole("button", { name: "P&L Analysis" }));
  const monthInput = screen.getByLabelText("Calendar month");
  expect(monthInput).toHaveAttribute("max", latestMonth);
  expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Next month" }));
  expect(monthInput).toHaveValue(latestMonth);
  await user.click(screen.getByRole("button", { name: "Previous month" }));
  expect(screen.getByRole("button", { name: "Next month" })).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Next month" }));
  expect(monthInput).toHaveValue(latestMonth);
  expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
  fireEvent.change(monthInput, { target: { value: "9999-12" } });
  expect(monthInput).toHaveValue(latestMonth);
  expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
});
