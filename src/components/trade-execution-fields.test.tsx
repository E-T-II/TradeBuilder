// @vitest-environment jsdom
import { expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { TradeLogEntry } from "@/components/trade-builder-app";
import { TradeExecutionFields } from "@/components/trade-execution-fields";

const entry: TradeLogEntry = {
  id: "one", createdAt: "2025-01-01T00:00:00Z", ticker: "TEST", direction: "long",
  entry: 10, stop: 9, target: 20, positionSize: 100, capitalRequirement: 1000,
  totalTradeRisk: 100, rewardRisk: 10, score: 9, isOpen: false,
};

test("optional execution fields preserve date limits without requiring complete records", () => {
  const onChange = vi.fn();
  render(<TradeExecutionFields entry={entry} onChange={onChange} />);
  const today = new Date();
  const maxDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  expect(screen.getByLabelText("Actual opening price ($) for TEST")).toHaveValue(null);
  expect(screen.getByLabelText("Actual opening date for TEST")).toHaveClass("dark:scheme:light");
  expect(screen.getByLabelText("Actual opening date for TEST")).toHaveAttribute("max", maxDate);
  expect(screen.getByLabelText("Actual shares for TEST")).toHaveValue(null);
  expect(screen.queryByText(/excluded|report|complete/i)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Actual opening date for TEST"), { target: { value: "2025-12-29" } });
  expect(onChange).toHaveBeenCalledWith("one", "openedOn", "2025-12-29");
});
