// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "@testing-library/react";

import { ChartTutorial } from "@/components/chart-tutorial";

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => { },
    removeEventListener: () => { },
    addListener: () => { },
    removeListener: () => { },
    dispatchEvent: () => false,
  }));
}

afterEach(() => vi.unstubAllGlobals());

describe("given ChartTutorial", () => {
  beforeEach(() => stubMatchMedia(false));

  test("shows the supply and demand zones without entry or target labels", () => {
    const { container } = render(<ChartTutorial />);

    expect(container.textContent).toContain("Supply zone");
    expect(container.textContent).toContain("Demand zone");
    expect(container.textContent).not.toContain("your entry");
    expect(container.textContent).not.toContain("your target");
  });

  test("exposes the four edge fields in the SVG's accessible name", () => {
    // role="img" means assistive tech reads only the label, not the inner text,
    // so the distal/proximal edge mapping has to live in the aria-label.
    const { getByRole } = render(<ChartTutorial />);
    const label = getByRole("img").getAttribute("aria-label") ?? "";
    for (const field of [
      "Demand proximal",
      "Demand distal",
      "Supply distal",
      "Supply proximal",
    ]) {
      expect(label).toContain(field);
    }
  });

  test("displays the entered curve values and curve factor", () => {
    const { container, getByText } = render(
      <ChartTutorial
        curveHigh="338.19"
        curveLow="286.73"
      />,
    );

    expect(getByText("$338.19")).toBeInTheDocument();
    expect(getByText("$286.73")).toBeInTheDocument();
    expect(getByText("$17.15")).toBeInTheDocument();
    expect(container.querySelector('text')?.textContent).toBe("338.19");
  });

  test("truncates the curve factor instead of rounding it", () => {
    const { getByText } = render(
      <ChartTutorial curveHigh="300" curveLow="198.852" />,
    );

    expect(getByText("$33.71")).toBeInTheDocument();
  });

  test("positions the curve boundaries from the curve factor", () => {
    const { container } = render(
      <ChartTutorial curveHigh="338.19" curveLow="286.73" />,
    );
    const boundaryLabels = [...container.querySelectorAll("text")]
      .map((text) => text.textContent)
      .filter((text) => text === "321.04" || text === "303.88");

    expect(boundaryLabels).toEqual(["321.04", "303.88"]);
  });

  test("under reduced motion: shows no animated cues and hides Replay", () => {
    stubMatchMedia(true);
    const { container, queryByRole } = render(
      <ChartTutorial />,
    );

    expect(queryByRole("button", { name: /replay/i })).toBeNull();
    const animated = [...container.querySelectorAll("g")].some((g) =>
      g.getAttribute("style")?.includes("animation"),
    );
    expect(animated).toBe(false);
  });
});
