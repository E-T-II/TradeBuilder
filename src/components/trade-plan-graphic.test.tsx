// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { TRADE_PLAN_GRAPHIC_MESSAGES, TradePlanGraphic, type TradePlanGraphicId } from "./trade-plan-graphic";

const translation = vi.hoisted(() => ({
  rtl: false,
  text: vi.fn((message: string): string => message),
}));

vi.mock("@/components/language-provider", () => ({
  useLanguage: () => ({ text: translation.text, language: translation.rtl ? "ar" : "en" }),
}));

afterEach(() => {
  cleanup();
  translation.rtl = false;
  translation.text.mockReset().mockImplementation((message) => message);
});

const graphics: [TradePlanGraphicId, number, number][] = [
  ["blueprintSteps", 1099, 554],
  ["blueprintFlowChart", 1097, 650],
  ["tradingProcess", 997, 605],
  ["decisionMatrix", 1479, 716],
];

test.each(graphics)("%s retains its image proportions and translates every label", (id, width, height) => {
  translation.rtl = true;
  translation.text.mockImplementation((message) => `ترجمة ${message}`);
  const { container } = render(<TradePlanGraphic id={id} title="Worksheet graphic" />);
  const graphic = screen.getByRole("img", { name: "ترجمة Worksheet graphic" });
  expect(graphic).toHaveAttribute("viewBox", `0 0 ${width} ${height}`);
  expect(graphic).toHaveClass("w-1/2", "h-auto");
  expect(graphic).toHaveAttribute("direction", "ltr");
  expect(graphic).toHaveStyle({ aspectRatio: `${width} / ${height}` });
  for (const [message] of translation.text.mock.calls) {
    if (message !== "Worksheet graphic") {
      expect(TRADE_PLAN_GRAPHIC_MESSAGES).toContain(message);
    }
  }
  for (const label of container.querySelectorAll("text")) {
    expect(label).toHaveAttribute("direction", "ltr");
    if (!/^\d+$/.test(label.textContent ?? "")) {
      expect(label.textContent).toContain("ترجمة");
      expect(label).toHaveStyle({ unicodeBidi: "plaintext" });
    }
  }
});

test("the matrix preserves all 18 decisions and the four XLT scenarios", () => {
  const { container } = render(<TradePlanGraphic id="decisionMatrix" title="Matrix" />);
  const labels = [...container.querySelectorAll("text")].map((node) => node.textContent);
  expect(labels.filter((value) => value === "Short")).toHaveLength(5);
  expect(labels.filter((value) => value === "Short*")).toHaveLength(1);
  expect(labels.filter((value) => value === "Long")).toHaveLength(5);
  expect(labels.filter((value) => value === "Long*")).toHaveLength(1);
  expect(labels.filter((value) => value === "NoAction")).toHaveLength(6);
  expect(labels.filter((value) => value === "XLT")).toHaveLength(4);
});

test("multiple graphics have isolated arrow, gradient, and pattern references", () => {
  const { container } = render(<>
    <TradePlanGraphic id="tradingProcess" title="Process" />
    <TradePlanGraphic id="blueprintFlowChart" title="Flow" />
    <TradePlanGraphic id="decisionMatrix" title="Matrix" />
  </>);
  const ids = [...container.querySelectorAll("[id]")].map((node) => node.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const node of container.querySelectorAll("[marker-end], [fill], [clip-path]")) {
    for (const attr of ["marker-end", "fill", "clip-path"]) {
      const target = node.getAttribute(attr)?.match(/^url\(#(.+)\)$/)?.[1];
      if (target) expect(ids).toContain(target);
    }
  }
});
