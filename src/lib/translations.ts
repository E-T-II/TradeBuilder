import type { LanguageCode } from "@/lib/languages";
import sourceMessages from "@/lib/locales/en.json";
import generatedCatalogs from "@/lib/locales";

const english = {
  language: "Language",
  languagePreference: "Language preference",
  chooseLanguage: "Choose your preferred language",
  closeLanguage: "Close language settings",
  languageDescription: "Choose a language for the interface, instructions, dialogs, and messages. Your selection is saved in this browser.",
  translationNotice: "Translations are machine-generated and may need correction. Trading calculations, saved trade data, and USD amounts do not change.",
  tutorialHint: "Dubbed audio is not selected automatically. In the video, open Settings > Audio track and choose your language if available.",
  captionHint: "Tutorial controls and captions request your chosen language. YouTube may use another language if the requested captions are unavailable.",
  languageSaved: "Language preference saved.",
  languageReadError: "Your language preference could not be read. English is being used; choose a language to try saving again.",
  languageInvalid: "The saved language preference was not recognized. Choose a language again.",
  languageSaveError: "The language preference could not be saved. Check browser storage permissions or available space, then try again. Your previous selection was kept.",
  tutorialLanguage: "Preferred tutorial language",
} as const;

export type TranslationKey = keyof typeof english;
export type Messages = { [Key in TranslationKey]: string };

type Catalog = Record<string, string>;
const catalogs: Partial<Record<LanguageCode, Catalog>> = {
  en: sourceMessages,
  ...generatedCatalogs,
};

export function hasInterfaceTranslation(language: LanguageCode): boolean {
  const catalog = catalogs[language];
  return catalog !== undefined && Object.keys(sourceMessages).every((key) => Boolean(catalog[key]));
}

export function translate(language: LanguageCode, key: TranslationKey): string {
  return translateText(language, english[key]);
}

function interpolate(message: string, values: readonly unknown[]): string {
  return message.replace(/\{(\d+)\}/g, (placeholder, index: string) => {
    const value = values[Number(index)];
    return value === undefined ? placeholder : value === null || typeof value === "boolean" ? "" : String(value);
  });
}

const patterns = Object.keys(sourceMessages)
  .filter((key) => /\{\d+\}/.test(key))
  .map((key) => {
    const indices: number[] = [];
    const parts = key.split(/(\{\d+\})/).map((part) => {
      const placeholder = /^\{(\d+)\}$/.exec(part);
      if (placeholder) {
        indices.push(Number(placeholder[1]));
        return "(.*?)";
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    });
    return { key, indices, expression: new RegExp(`^${parts.join("")}$`) };
  });

export function translateText(language: LanguageCode, message: string, values?: readonly unknown[]): string {
  const catalog: Catalog = catalogs[language] ?? sourceMessages;
  const normalized = message.replace(/\s+/g, " ").trim();
  const direct = Object.hasOwn(catalog, normalized) ? catalog[normalized] : undefined;
  if (direct !== undefined) {
    const translated = values ? interpolate(direct, values) : direct;
    const leading = /^\s/.test(message) ? " " : "";
    const trailing = /\s$/.test(message) ? " " : "";
    return leading + translated + trailing;
  }
  if (values) return interpolate(message, values);
  if (language !== "en" && /[a-zA-Z]/.test(normalized)) {
    for (const { key, indices, expression } of patterns) {
      const match = expression.exec(normalized);
      if (!match) continue;
      const captures: unknown[] = [];
      indices.forEach((index, position) => { captures[index] = match[position + 1]; });
      return interpolate(catalog[key] ?? key, captures);
    }
  }
  return message;
}
