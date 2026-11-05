// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "@/components/language-provider";
import { StrengthReference } from "@/components/strength-reference";
import { TimeReference } from "@/components/time-reference";
import { FreshnessReference } from "@/components/freshness-reference";
import { ComputedEnhancerReference, type ComputedEnhancer } from "@/components/computed-enhancer-reference";
import { LANGUAGES, LANGUAGE_STORAGE_KEY } from "@/lib/languages";
import { oddsIllustrations } from "@/lib/odds-illustrations";
import { oddsIllustrationTranslations, translateIllustration } from "@/lib/odds-illustration-translations";
import { translateText } from "@/lib/translations";
import { IllustrationText } from "@/components/illustration-text";

afterEach(() => window.localStorage.clear());

function coordinates(svg: SVGSVGElement) {
  return [...svg.querySelectorAll("rect, path, line, g")].map((element) => [
    element.tagName,
    [...element.attributes].filter(({ name }) => name !== "aria-label").map(({ name, value }) => [name, value]),
  ]);
}

test.each(LANGUAGES)("$name has every illustration message with unchanged thresholds and placeholders", ({ code }) => {
  const source = oddsIllustrationTranslations.en;
  const translated = oddsIllustrationTranslations[code];
  expect(translated).toHaveLength(source.length);
  translated.forEach((text, index) => {
    expect(text.trim()).not.toBe("");
    expect(text.match(/\{\d+\}/g)).toEqual(source[index].match(/\{\d+\}/g));
    expect(text.replace(/\{\d+\}/g, "").match(/\d+/g)).toEqual(source[index].replace(/\{\d+\}/g, "").match(/\d+/g));
    if (code !== "en") expect(text).not.toBe(source[index]);
  });
  for (const illustration of Object.values(oddsIllustrations)) {
    for (const line of [...illustration.labels.flatMap(({ lines }) => lines), ...illustration.headings.flat()]) {
      expect(translateIllustration(code, line).trim()).not.toBe("");
    }
  }
  for (const value of ["0", "0.5", "1", "2"]) {
    expect(translateIllustration(code, `Good = ${value}`)).toBe(`${translateText(code, "Good")} = ${value}`);
  }
  expect(translateIllustration(code, "> 8 out of 10")).toContain("> 8");
  expect(translateIllustration(code, "7–8 out of 10")).toContain("7–8");
  expect(translateIllustration(code, "< 7 out of 10")).toContain("< 7");
});

test.each(LANGUAGES.filter(({ code }) => code !== "en"))("$name preserves all judged candle and selection coordinates and numeric choices", async ({ code }) => {
  const user = userEvent.setup();
  for (const Reference of [StrengthReference, TimeReference, FreshnessReference]) {
    const scores = Reference === TimeReference ? [1, 0.5, 0] : [2, 1, 0];
    for (const direction of ["long", "short"] as const) {
      for (const selected of scores) {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
        const english = render(<LanguageProvider><Reference direction={direction} selected={selected} onSelect={vi.fn()} /></LanguageProvider>);
        const expected = coordinates(english.container.querySelector("svg")!);
        english.unmount();
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
        const onSelect = vi.fn();
        const localized = render(<LanguageProvider><Reference direction={direction} selected={selected} onSelect={onSelect} /></LanguageProvider>);
        const svg = localized.container.querySelector("svg")!;
        expect(coordinates(svg)).toEqual(expected);
        expect(svg).toHaveTextContent(translateText(code, "Best"));
        const buttons = screen.getAllByRole("button");
        await user.click(buttons[scores.indexOf(selected)]);
        expect(onSelect).toHaveBeenLastCalledWith(selected);
        localized.unmount();
      }
    }
  }
});

test.each(LANGUAGES.filter(({ code }) => code !== "en"))("$name overlays all eight images without moving the selection border or checkmark", async ({ code }) => {
  const user = userEvent.setup();
  for (const enhancer of ["trend", "curve", "profitZone", "total"] as ComputedEnhancer[]) {
    for (const direction of ["long", "short"] as const) {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
      const english = render(<LanguageProvider><ComputedEnhancerReference enhancer={enhancer} direction={direction} score={1} /></LanguageProvider>);
      await user.click(screen.getByRole("button"));
      const expected = coordinates(screen.getByRole("dialog").querySelector("svg[data-selected-option]")!);
      english.unmount();
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
      const localized = render(<LanguageProvider><ComputedEnhancerReference enhancer={enhancer} direction={direction} score={1} /></LanguageProvider>);
      await user.click(screen.getByRole("button"));
      const dialog = screen.getByRole("dialog");
      const overlay = dialog.querySelector(`svg[data-illustration-language="${code}"]`)!;
      const src = dialog.querySelector("img")!.getAttribute("src")!;
      const labels = [
        ...oddsIllustrations[src].labels.flatMap(({ lines }) => lines),
        ...oddsIllustrations[src].headings.flat(),
      ];
      expect([...overlay.querySelectorAll("text")].map((text) => text.textContent)).toEqual(
        labels.map((line) => translateIllustration(code, line)),
      );
      expect(coordinates(dialog.querySelector("svg[data-selected-option]")!)).toEqual(expected);
      expect(dialog.querySelector("svg[data-selected-option] image")).toBeNull();
      expect(dialog.querySelectorAll("button")).toHaveLength(1);
      localized.unmount();
    }
  }
});

test("English vector text keeps its original attributes without translated fitting or direction overrides", () => {
  for (const Reference of [StrengthReference, TimeReference, FreshnessReference]) {
    const { container, unmount } = render(<LanguageProvider><Reference direction="long" /></LanguageProvider>);
    expect(container.querySelector("text[textLength], text[lengthAdjust], text[direction], text[style]")).toBeNull();
    for (const zone of [...container.querySelectorAll("text")].filter((text) => text.textContent === "DZ")) {
      expect(zone).not.toHaveAttribute("data-max-width");
    }
    unmount();
  }
});

test("text fitting includes glyph overhang rather than measuring only the advance width", () => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "hi");
  const { container, rerender } = render(<LanguageProvider><svg><IllustrationText maxWidth={60}>Risk</IllustrationText></svg></LanguageProvider>);
  const text = container.querySelector("text")!;
  text.getComputedTextLength = vi.fn(() => 54);
  text.getBBox = vi.fn(() => new DOMRect(0, 0, 58, 20));
  rerender(<LanguageProvider><svg><IllustrationText maxWidth={57}>Risk</IllustrationText></svg></LanguageProvider>);
  expect(Number(text.getAttribute("textLength"))).toBeCloseTo(54 * 57 / 58);
  expect(text).toHaveAttribute("lengthAdjust", "spacingAndGlyphs");
  cleanup();
});

test.each(["ar", "he"])("%s isolates numeric comparisons, ranges and scores from right-to-left wording", (code) => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  const { container } = render(<LanguageProvider><svg><IllustrationText maxWidth={200}>
    {translateIllustration(code === "ar" ? "ar" : "he", "> 8 out of 10")}
  </IllustrationText></svg></LanguageProvider>);
  const comparison = [...container.querySelectorAll("tspan")].find((element) => element.textContent === "> 8")!;
  expect(comparison).toHaveAttribute("direction", "ltr");
  expect(comparison).toHaveStyle({ unicodeBidi: "isolate" });
  expect(container.querySelector("text")).toHaveTextContent(translateIllustration(code === "ar" ? "ar" : "he", "> 8 out of 10"));
});
