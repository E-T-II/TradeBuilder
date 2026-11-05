"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Languages, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, useLanguageSettings } from "@/components/language-provider";
import { LANGUAGES, isLanguageCode } from "@/lib/languages";

export function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const { language, t } = useLanguage();
  const { selectLanguage, error, saved } = useLanguageSettings();
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger render={<Button variant="ghost" size="sm" aria-label={t("languagePreference")} />}>
        <Languages aria-hidden />
        <span className="hidden sm:inline">{t("language")}</span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(32rem,96vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-5 shadow-lg outline-none">
          <div className="mb-3 flex items-center justify-between gap-3">
            <Dialog.Title className="font-medium">{t("languagePreference")}</Dialog.Title>
            <Dialog.Close render={<Button variant="ghost" size="icon-sm" aria-label={t("closeLanguage")} />}>
              <X aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mb-4 text-sm text-muted-foreground">
            {t("languageDescription")}
          </Dialog.Description>
          <label className="block space-y-2 text-sm font-medium">
            <span>{t("chooseLanguage")}</span>
            <select value={language} className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
              onChange={(event) => {
                if (!isLanguageCode(event.target.value)) {
                  throw new Error("Unrecognized language selection.");
                }
                selectLanguage(event.target.value);
              }}>
              {LANGUAGES.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name === option.nativeName ? option.name : `${option.nativeName} (${option.name})`}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p>{t("translationNotice")}</p>
            <p>{t("captionHint")}</p>
            <p>{t("tutorialHint")}</p>
          </div>
          {error ? <p role="alert" className="mt-4 text-sm text-destructive">{t(error)}</p> : null}
          {saved && !error ? <p role="status" className="mt-4 text-sm">{t("languageSaved")}</p> : null}
        </Dialog.Popup>
      </Dialog.Portal>
      {error && !open ? <span role="alert" className="sr-only">{t(error)}</span> : null}
    </Dialog.Root>
  );
}
