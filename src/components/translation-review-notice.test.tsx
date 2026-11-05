// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/components/language-provider";
import { TranslationReviewNotice } from "@/components/translation-review-notice";
import { LANGUAGES, LANGUAGE_STORAGE_KEY } from "@/lib/languages";
import { translateText } from "@/lib/translations";

afterEach(() => window.localStorage.clear());

test("does not show the review notice in English", () => {
  render(<LanguageProvider><TranslationReviewNotice /></LanguageProvider>);
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
});

test.each(LANGUAGES.filter(({ code }) => code !== "en"))("shows the review notice in $name across page changes", ({ code }) => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  const page = (name: string) => <LanguageProvider>
    <TranslationReviewNotice />
    <main>{name}</main>
  </LanguageProvider>;
  const { rerender } = render(page("Pre-steps"));
  for (const name of ["Curve", "Trend", "Zones", "Score", "Trade log"]) {
    rerender(page(name));
    expect(screen.getByRole("complementary")).toHaveTextContent(
      translateText(code, "Translations still need native-speaker review."),
    );
    expect(screen.getByRole("complementary")).toBeVisible();
  }
});
