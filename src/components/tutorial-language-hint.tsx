"use client";

import { useLanguage } from "@/components/language-provider";
import { LANGUAGES } from "@/lib/languages";

export function TutorialLanguageHint() {
  const { language, t } = useLanguage();
  const selected = LANGUAGES.find((option) => option.code === language)!;
  return (
    <div className="mb-3 space-y-1 text-xs text-muted-foreground">
      <p>{t("tutorialLanguage")}: <bdi lang={language}>{selected.nativeName}</bdi></p>
      <p>{t("tutorialHint")}</p>
    </div>
  );
}
