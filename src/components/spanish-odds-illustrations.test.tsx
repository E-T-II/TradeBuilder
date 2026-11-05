// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "@/components/language-provider";
import { StrengthReference } from "@/components/strength-reference";
import { TimeReference } from "@/components/time-reference";
import { FreshnessReference } from "@/components/freshness-reference";
import { ComputedEnhancerReference, type ComputedEnhancer } from "@/components/computed-enhancer-reference";
import { ZoneScorecard } from "@/components/zone-scorecard";
import { normalizeForm } from "@/components/trade-builder-app";
import { LANGUAGE_STORAGE_KEY } from "@/lib/languages";
import { oddsIllustrations } from "@/lib/odds-illustrations";
import { translateIllustration } from "@/lib/odds-illustration-translations";
import { translateText } from "@/lib/translations";
import type { Direction } from "@/lib/trade-builder";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

function geometry(svg: SVGSVGElement) {
  return [...svg.querySelectorAll("rect, line, path, g")].map((element) => ({
    tag: element.tagName,
    attributes: [...element.attributes].filter(({ name }) =>
      !["aria-label", "class", "data-text-box"].includes(name),
    ).map(({ name, value }) => [name, value]),
  }));
}

for (const [name, Reference, scores] of [
  ["Strength", StrengthReference, [2, 1, 0]],
  ["Time", TimeReference, [1, 0.5, 0]],
  ["Freshness", FreshnessReference, [2, 1, 0]],
] as const) {
  test.each(["long", "short"] as const)(`Spanish ${name} preserves every English candle, panel, line, and selection coordinate (%s)`, async (direction) => {
    const user = userEvent.setup();
    for (const selected of scores) {
      const english = render(<LanguageProvider><Reference direction={direction} selected={selected} onSelect={vi.fn()} /></LanguageProvider>);
      const original = geometry(english.container.querySelector("svg")!);
      english.unmount();
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
      const onSelect = vi.fn();
      const spanish = render(<LanguageProvider><Reference direction={direction} selected={selected} onSelect={onSelect} /></LanguageProvider>);
      const spanishSvg = spanish.container.querySelector("svg")!;
      expect(geometry(spanishSvg)).toEqual(original);
      expect(spanishSvg.textContent).toContain("Mejor");
      expect(spanishSvg.textContent).toContain("Bueno");
      expect(spanishSvg.textContent).toContain("Malo");
      expect(spanishSvg.textContent).not.toMatch(/Best|Good|Poor|Basing Candles|\bDZ\b|\bSZ\b/);
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(3);
      for (const [index, button] of buttons.entries()) {
        await user.click(button);
        expect(onSelect).toHaveBeenLastCalledWith(scores[index]);
      }
      spanish.unmount();
      window.localStorage.clear();
    }
  });
}

test.each([
  ["trend", "Trend", 2], ["trend", "Trend", 1], ["trend", "Trend", 0],
  ["curve", "Curve", 1], ["curve", "Curve", 0.5], ["curve", "Curve", 0],
  ["profitZone", "Profit zone", 2], ["profitZone", "Profit zone", 1], ["profitZone", "Profit zone", 0],
  ["total", "Total score", 10], ["total", "Total score", 7.5], ["total", "Total score", 6],
  ["totalSupply", "Total score", 10], ["totalSupply", "Total score", 7.5], ["totalSupply", "Total score", 6],
] as const)("Spanish %s (%s) preserves demand and supply image and selection coordinates at score %s", async (enhancer: ComputedEnhancer, label, score) => {
  const user = userEvent.setup();
  for (const direction of ["long", "short"] as Direction[]) {
    const english = render(<LanguageProvider><ComputedEnhancerReference enhancer={enhancer} direction={direction} score={score} /></LanguageProvider>);
    await user.click(screen.getByRole("button", { name: `About ${label}` }));
    const englishDialog = screen.getByRole("dialog");
    const src = englishDialog.querySelector("img")!.getAttribute("src");
    const marker = geometry(englishDialog.querySelector("svg[data-selected-option]")!);
    expect(englishDialog.querySelector("[data-illustration-language]")).toBeNull();
    english.unmount();
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "es");
    const spanish = render(<LanguageProvider><ComputedEnhancerReference enhancer={enhancer} direction={direction} score={score} /></LanguageProvider>);
    await user.click(screen.getByRole("button", { name: translateText("es", "About {0}", [translateText("es", label)]) }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelector("img")).toHaveAttribute("src", src);
    expect(dialog.querySelector("svg[data-selected-option]") && geometry(dialog.querySelector("svg[data-selected-option]")!)).toEqual(marker);
    const overlay = dialog.querySelector("[data-illustration-language='es']")!;
    expect(overlay).toHaveTextContent(/zona/i);
    expect(overlay).toHaveTextContent(enhancer.startsWith("total") ? translateIllustration("es", "No trade") : "Mejor");
    expect(overlay).not.toHaveTextContent(/Best|Good|Poor|Reward|Risk|Entry Zone|Target Zone/);
    expect(dialog.querySelector("svg[data-selected-option] image")).toBeNull();
    expect(dialog.querySelectorAll("button")).toHaveLength(1);
    spanish.unmount();
    window.localStorage.clear();
  }
});

test("every English screenshot has a Spanish text map with valid original-pixel bounds", () => {
  const sizes: Record<string, [number, number]> = {
    "trend": [693, 274], "trend-supply": [1356, 510],
    "curve": [770, 292], "curve-supply": [1510, 548],
    "profit-zone": [734, 263], "profit-zone-supply": [1390, 506],
    "total-score": [650, 254], "total-score-supply": [647, 257],
  };
  expect(Object.keys(oddsIllustrations)).toHaveLength(8);
  for (const [src, illustration] of Object.entries(oddsIllustrations)) {
    const [width, height] = sizes[src.replace("/odds-enhancers/", "").replace(".png", "")];
    for (const { box: [x1, y1, x2, y2], lines } of illustration.labels) {
      expect(x1).toBeGreaterThanOrEqual(0);
      expect(y1).toBeGreaterThanOrEqual(0);
      expect(x2).toBeGreaterThan(x1);
      expect(y2).toBeGreaterThan(y1);
      expect(x2).toBeLessThanOrEqual(width);
      expect(y2).toBeLessThanOrEqual(height);
      expect(lines.length).toBeGreaterThan(0);
    }
  }
});

test("Spanish Time retains the English popup width and saves fractional scores through the scorecard", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  let englishWidth = "";
  for (const language of ["en", "es"] as const) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    const card = render(<LanguageProvider><ZoneScorecard form={normalizeForm({})} direction="long"
      ratings={{ strength: "", time: "", freshness: "" }} onChange={onChange} /></LanguageProvider>);
    await user.click(screen.getByRole("button", { name: translateText(language, "Time") }));
    const width = card.container.querySelector(".odds-reference-graphic")!.parentElement!.className;
    if (language === "en") englishWidth = width;
    else expect(width).toBe(englishWidth);
    expect(width).toContain("min(34rem,calc(100vw-2.5rem))");
    await user.click(screen.getByRole("button", { name: translateText(language, "{0} time, {1} points", [translateText(language, "Good"), "0.5"]) }));
    expect(onChange).toHaveBeenLastCalledWith({ time: "0.5" });
    expect(screen.queryByText(">6 velas de base")).not.toBeInTheDocument();
    card.unmount();
  }
});
