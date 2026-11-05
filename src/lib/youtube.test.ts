// @vitest-environment jsdom
import { expect, test, vi } from "vitest";
import { LANGUAGES, isLanguageCode } from "@/lib/languages";
import { hasInterfaceTranslation, translate } from "@/lib/translations";
import { stopEmbeddedYouTubeVideo, tutorialVideoUrl } from "@/lib/youtube";

test.each(LANGUAGES)("supports the $name tutorial language with documented parameters", ({ code }) => {
  expect(isLanguageCode(code)).toBe(true);
  const url = new URL(tutorialVideoUrl("example", code));
  expect(url.origin).toBe("https://www.youtube.com");
  expect(url.searchParams.get("hl")).toBe(code);
  expect(url.searchParams.get("cc_lang_pref")).toBe(code);
  expect(url.searchParams.has("audio_track")).toBe(false);
  expect(url.searchParams.has("modestbranding")).toBe(false);
  expect(url.searchParams.has("cc_load_policy")).toBe(false);
});

test("all offered languages have complete interface catalogs", () => {
  expect(LANGUAGES).toHaveLength(21);
  expect(new Set(LANGUAGES.map((language) => language.code)).size).toBe(21);
  expect(isLanguageCode("unknown")).toBe(false);
  expect(isLanguageCode(null)).toBe(false);
  expect(hasInterfaceTranslation("en")).toBe(true);
  for (const { code } of LANGUAGES) expect(hasInterfaceTranslation(code)).toBe(true);
  expect(translate("es", "languagePreference")).not.toBe(translate("en", "languagePreference"));
});

test("closing a tutorial retains the existing stop-video command", () => {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  const postMessage = vi.spyOn(frame.contentWindow!, "postMessage").mockImplementation(() => {});
  stopEmbeddedYouTubeVideo(frame);
  expect(postMessage).toHaveBeenCalledWith(JSON.stringify({
    event: "command", func: "stopVideo", args: [],
  }), "*");
  expect(() => stopEmbeddedYouTubeVideo(null)).not.toThrow();
  postMessage.mockRestore();
  frame.remove();
});
