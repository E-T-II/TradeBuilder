"use client";

import type { LucideIcon } from "lucide-react";

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  accent?: "green" | "red";
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  "aria-label"?: string;
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
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex w-full rounded-lg border bg-muted/40 p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
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
