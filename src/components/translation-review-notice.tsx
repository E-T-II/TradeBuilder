"use client";

import { useLanguage } from "@/components/language-provider";

export function TranslationReviewNotice() {
  const { language, text: tx } = useLanguage();
  if (language === "en") return null;

  return (
    <aside className="shrink-0 border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
      {tx("Translations still need native-speaker review.")}
    </aside>
  );
}
