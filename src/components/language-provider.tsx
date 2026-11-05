"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isLanguageCode, LANGUAGE_STORAGE_KEY, type LanguageCode } from "@/lib/languages";
import { translate, translateText, type TranslationKey } from "@/lib/translations";

interface LanguageSettings {
  language: LanguageCode;
  error: TranslationKey | null;
  saved: boolean;
  selectLanguage: (language: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageSettings | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const existing = useContext(LanguageContext);
  return existing ? children : <LanguageSettingsProvider>{children}</LanguageSettingsProvider>;
}

function LanguageSettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [error, setError] = useState<TranslationKey | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored === null) return;
      if (!isLanguageCode(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- validates a browser preference after hydration
        setError("languageInvalid");
        return;
      }
      setLanguage(stored);
    } catch {
      setError("languageReadError");
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" || language === "he" ? "rtl" : "ltr";
  }, [language]);

  const selectLanguage = (next: LanguageCode) => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      setLanguage(next);
      setError(null);
      setSaved(true);
    } catch {
      setError("languageSaveError");
      setSaved(false);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, error, saved, selectLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageSettings(): LanguageSettings {
  const settings = useContext(LanguageContext);
  if (!settings) throw new Error("Language settings must be used within LanguageProvider.");
  return settings;
}

export function useLanguage() {
  const settings = useContext(LanguageContext);
  const language = settings?.language ?? "en";
  function text(value: string, values?: readonly ReactNode[]): string;
  function text(value: string | undefined, values?: readonly ReactNode[]): string | undefined;
  function text(value: number): number;
  function text(value: ReactNode, values?: readonly ReactNode[]): ReactNode;
  function text(value: ReactNode, values?: readonly ReactNode[]): ReactNode {
    return typeof value === "string" ? translateText(language, value, values) : value;
  }
  return {
    language,
    t: (key: TranslationKey) => translate(language, key),
    text,
  };
}
