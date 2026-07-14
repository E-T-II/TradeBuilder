"use client";

interface RatingChipsProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  "aria-label"?: string;
}

/**
 * Tap-to-pick score chips in half-point steps (0, 0.5, 1, ...).
 * Shows the whole scale at a glance, so the range never needs explaining.
 */
export function RatingChips({
  value,
  max,
  onChange,
  "aria-label": ariaLabel,
}: RatingChipsProps) {
  const steps: number[] = [];
  for (let v = 0; v <= max; v += 0.5) steps.push(v);

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {steps.map((step) => {
        const selected = step === value;
        return (
          <button
            key={step}
            type="button"
            role="radio"
            aria-checked={selected}
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
  );
}
