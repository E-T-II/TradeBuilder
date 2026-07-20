"use client";

import { useRef } from "react";

interface RatingChipsProps {
  /** null means unanswered: no chip is highlighted, unlike a deliberate 0. */
  value: number | null;
  max: number;
  /** Spacing between options. Strength/freshness step by 1 (0,1,2); time by 0.5. */
  step?: number;
  onChange: (value: number) => void;
  lowLabel?: string;
  highLabel?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

export function RatingChips({
  value,
  max,
  step = 1,
  onChange,
  lowLabel,
  highLabel,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: RatingChipsProps) {
  const steps: number[] = [];
  for (let v = 0; v <= max; v += step) steps.push(v);

  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const matchedIndex = value === null ? -1 : steps.indexOf(value);
  // Keyboard nav and the roving tabindex need a start point even when
  // nothing is selected yet, so they anchor on the first chip.
  const selectedIndex = Math.max(0, matchedIndex);

  // Arrow keys move the selection (WAI-ARIA radiogroup pattern).
  const focusTo = (index: number) => {
    onChange(steps[index]);
    buttons.current[index]?.focus();
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      focusTo((selectedIndex + 1) % steps.length);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      focusTo((selectedIndex - 1 + steps.length) % steps.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusTo(steps.length - 1);
    }
  };

  return (
    // w-fit keeps the end anchors under the first and last chip.
    <div className="w-fit space-y-1.5">
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-1.5"
      >
        {steps.map((step, index) => {
          const selected = step === value;
          return (
            <button
              key={step}
              ref={(el) => {
                buttons.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={index === selectedIndex ? 0 : -1}
              onClick={() => onChange(step)}
              className={`h-9 min-w-11 rounded-full border px-2 text-sm tabular-nums transition-colors ${
                selected
                  ? "border-primary bg-primary font-medium text-primary-foreground"
                  : "bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {step}
            </button>
          );
        })}
      </div>
      {lowLabel || highLabel ? (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
