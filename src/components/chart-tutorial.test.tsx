// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render } from "@testing-library/react";

import { ChartTutorial } from "@/components/chart-tutorial";

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

afterEach(() => vi.unstubAllGlobals());

// The entry/target role sits in the same <g> as its zone name.
function rolesForZone(container: HTMLElement, zone: string) {
  const label = [...container.querySelectorAll("text")].find(
    (t) => t.textContent === zone,
  );
  const group = label?.closest("g");
  return [...(group?.querySelectorAll("text") ?? [])].map((t) => t.textContent);
}

function outlineWidth(container: HTMLElement, zone: string) {
  const label = [...container.querySelectorAll("text")].find(
    (t) => t.textContent === zone,
  );
  return label
    ?.closest("g")
    ?.querySelector("rect")
    ?.getAttribute("stroke-width");
}

describe("given ChartTutorial", () => {
  beforeEach(() => stubMatchMedia(false));

  test("for a long: demand is the entry with the bolder outline, supply the target", () => {
    const { container } = render(<ChartTutorial direction="long" />);

    expect(rolesForZone(container, "Demand zone")).toContain("your entry");
    expect(rolesForZone(container, "Supply zone")).toContain("your target");
    expect(outlineWidth(container, "Demand zone")).toBe("2.25");
    expect(outlineWidth(container, "Supply zone")).toBe("1");
  });

  test("for a short: supply is the entry with the bolder outline, demand the target", () => {
    const { container } = render(<ChartTutorial direction="short" />);

    expect(rolesForZone(container, "Supply zone")).toContain("your entry");
    expect(rolesForZone(container, "Demand zone")).toContain("your target");
    expect(outlineWidth(container, "Supply zone")).toBe("2.25");
    expect(outlineWidth(container, "Demand zone")).toBe("1");
  });

  test("exposes the four edge fields in the SVG's accessible name", () => {
    // role="img" means assistive tech reads only the label, not the inner text,
    // so the distal/proximal edge mapping has to live in the aria-label.
    const { getByRole } = render(<ChartTutorial direction="long" />);
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

  test("under reduced motion: shows no animated cues and hides Replay", () => {
    stubMatchMedia(true);
    const { container, queryByRole } = render(
      <ChartTutorial direction="long" />,
    );

    expect(queryByRole("button", { name: /replay/i })).toBeNull();
    const animated = [...container.querySelectorAll("g")].some((g) =>
      g.getAttribute("style")?.includes("animation"),
    );
    expect(animated).toBe(false);
  });
});
