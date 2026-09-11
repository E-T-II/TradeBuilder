/*
 * Copyright (C) 2026 [e.t.ii aka genoTrades]
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://gnu.org>.
 */

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

  test("given value null (unanswered): should check no chip, unlike a deliberate 0", () => {
    render(
      <RatingChips value={null} max={2} onChange={() => {}} aria-label="Strength" />,
    );
    const options = screen.getAllByRole("radio");
    expect(options.every((r) => r.getAttribute("aria-checked") === "false")).toBe(
      true,
    );
  });
});
