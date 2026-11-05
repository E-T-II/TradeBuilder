// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { LanguageProvider } from "@/components/language-provider";
import { LanguageSelector } from "@/components/language-selector";
import { CurveVideoDialog } from "@/components/curve-video-dialog";
import { TrendVideoDialog } from "@/components/trend-video-dialog";
import { ZoningVideoDialog } from "@/components/zoning-video-dialog";
import { OddsEnhancerVideoDialog } from "@/components/odds-enhancer-video-dialog";
import { LANGUAGE_STORAGE_KEY } from "@/lib/languages";
import { translate, translateText } from "@/lib/translations";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

function Settings() {
  return <LanguageProvider><LanguageSelector /></LanguageProvider>;
}

test("offers all 21 languages, translates the dialog immediately, and restores the selected language", async () => {
  const user = userEvent.setup();
  const { unmount } = render(<Settings />);
  await user.click(screen.getByRole("button", { name: "Language preference" }));
  const select = screen.getByRole("combobox", { name: "Choose your preferred language" });
  expect(screen.getAllByRole("option")).toHaveLength(21);
  expect(select).toHaveValue("en");
  await user.selectOptions(select, "es");
  expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("es");
  expect(screen.getByRole("status")).toHaveTextContent(translate("es", "languageSaved"));
  expect(screen.getByRole("dialog")).toHaveAccessibleName(translate("es", "languagePreference"));
  expect(screen.getByText(translate("es", "tutorialHint"))).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: translate("es", "closeLanguage") }));
  unmount();
  render(<Settings />);
  await user.click(screen.getByRole("button", { name: translate("es", "languagePreference") }));
  expect(screen.getByRole("combobox")).toHaveValue("es");
  await user.selectOptions(screen.getByRole("combobox"), "en");
  expect(screen.getByText(translate("en", "translationNotice"))).toBeInTheDocument();
  expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("en");
});

test("a failed preference save keeps the previous language and allows retry", async () => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "fr");
  const user = userEvent.setup();
  render(<Settings />);
  await user.click(screen.getByRole("button", { name: translate("fr", "languagePreference") }));
  const save = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => { throw new Error("Full"); });
  await user.selectOptions(screen.getByRole("combobox"), "de");
  expect(screen.getByRole("alert")).toHaveTextContent(translate("fr", "languageSaveError"));
  expect(screen.getByRole("combobox")).toHaveValue("fr");
  expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("fr");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  save.mockRestore();
  await user.selectOptions(screen.getByRole("combobox"), "de");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("combobox")).toHaveValue("de");
});

test("invalid saved preferences and inaccessible storage are reported", async () => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "invalid");
  const { unmount } = render(<Settings />);
  expect(screen.getByRole("alert")).toHaveTextContent("not recognized");
  unmount();
  vi.spyOn(window.localStorage, "getItem").mockImplementation(() => { throw new Error("Denied"); });
  render(<Settings />);
  expect(screen.getByRole("alert")).toHaveTextContent("could not be read");
});

test("server rendering does not read the saved browser language", () => {
  const read = vi.spyOn(window.localStorage, "getItem");
  const html = renderToString(<Settings />);
  expect(html).toContain("Language preference");
  expect(read).not.toHaveBeenCalled();
});

test.each([
  [CurveVideoDialog, "Watch curve video", "Curve tutorial video", "7YBiZB5RIUc"],
  [TrendVideoDialog, "Watch trend video", "Trend tutorial video", "FtsWTOQlnoA"],
  [ZoningVideoDialog, "Watch zoning video", "Zoning tutorial video", "XLq6BR3MRTw"],
  [OddsEnhancerVideoDialog, "Watch odds enhancer video", "Scoring odds enhancer video", "xdg0jmcsGSE"],
] as const)("tutorial %s uses the saved language while retaining playback controls", async (Video, trigger, title, videoId) => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "ja");
  const user = userEvent.setup();
  render(<LanguageProvider><Video /></LanguageProvider>);
  await user.click(screen.getByRole("button", { name: translateText("ja", trigger) }));
  const iframe = screen.getByTitle(translateText("ja", title));
  const url = new URL(iframe.getAttribute("src")!);
  expect(url.pathname).toBe(`/embed/${videoId}`);
  expect(url.searchParams.get("hl")).toBe("ja");
  expect(url.searchParams.get("cc_lang_pref")).toBe("ja");
  expect(url.searchParams.get("controls")).toBe("1");
  expect(url.searchParams.get("enablejsapi")).toBe("1");
  expect(screen.getByText((_, element) => element?.tagName === "P" && Boolean(element.textContent?.includes("日本語")))).toBeInTheDocument();
  expect(screen.getByText(translate("ja", "tutorialHint"))).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: translateText("ja", "Close") }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
