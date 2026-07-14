"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const THEME_KEY = "tradebuilder-theme";

// Icon is driven by the `dark:` variant, not React state, to avoid a
// hydration mismatch with the layout's pre-paint theme script. aria-pressed
// is filled in after mount (undefined during SSR) for the same reason.
export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    const sync = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    sync();
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {}
    setIsDark(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label="Toggle dark theme"
    >
      <Moon className="dark:hidden" aria-hidden />
      <Sun className="hidden dark:block" aria-hidden />
    </Button>
  );
}
