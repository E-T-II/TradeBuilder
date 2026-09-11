/*
 * Copyright (C) 2026 [e.t.ii aka genoTrades]
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://gnu.org>.
 */

"use client";

import { useRef } from "react";
import type { LucideIcon } from "lucide-react";

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /**
   * Spoken name, when the visible label reads badly aloud — "3:1 R:R" comes out
   * as "three colon one R colon R". The visible label is unaffected.
   */
  ariaLabel?: string;
  icon?: LucideIcon;
  accent?: "green" | "red";
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

const accentText = {
  green: "text-emerald-600 dark:text-emerald-400",
  red: "text-red-600 dark:text-red-400",
} as const;

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: SegmentedControlProps<T>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  // Arrow keys move the selection (WAI-ARIA radiogroup pattern); a single tab
  // stop lands on the checked option via the roving tabindex below.
  const focusTo = (index: number) => {
    onChange(options[index].value);
    buttons.current[index]?.focus();
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusTo((selectedIndex + 1) % options.length);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusTo((selectedIndex - 1 + options.length) % options.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusTo(options.length - 1);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      onKeyDown={onKeyDown}
      className="flex w-full rounded-lg border bg-muted/40 p-1"
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttons.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.ariaLabel}
            tabIndex={index === selectedIndex ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md text-sm transition-colors ${
              selected
                ? "bg-background font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {Icon ? (
              <Icon
                className={`size-4 shrink-0 ${
                  option.accent ? accentText[option.accent] : ""
                }`}
                aria-hidden
              />
            ) : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
