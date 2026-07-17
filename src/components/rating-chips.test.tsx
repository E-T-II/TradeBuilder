// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { RatingChips } from "@/components/rating-chips";

describe("given RatingChips", () => {
  test("given a whole-point factor (default step): should offer only 0, 1, 2", () => {
    render(
      <RatingChips value={0} max={2} onChange={() => {}} aria-label="Strength" />,
    );
    const options = screen.getAllByRole("radio").map((r) => r.textContent);
    expect(options).toEqual(["0", "1", "2"]);
  });

  test("given a half-point factor (step 0.5): should offer 0, 0.5, 1", () => {
    render(
      <RatingChips
        value={0}
        max={1}
        step={0.5}
        onChange={() => {}}
        aria-label="Time"
      />,
    );
    const options = screen.getAllByRole("radio").map((r) => r.textContent);
    expect(options).toEqual(["0", "0.5", "1"]);
  });
});
