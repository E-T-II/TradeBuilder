"use client";

interface RatingChipsProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  lowLabel?: string;
  highLabel?: string;
  "aria-label"?: string;
}

export function RatingChips({
  value,
  max,
  onChange,
  lowLabel,
  highLabel,
  "aria-label": ariaLabel,
}: RatingChipsProps) {
  const steps: number[] = [];
  for (let v = 0; v <= max; v += 0.5) steps.push(v);

  return (
    // w-fit keeps the end anchors under the first and last chip.
    <div className="w-fit space-y-1.5">
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className="flex flex-wrap gap-1.5"
      >
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
      {lowLabel || highLabel ? (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      ) : null}
    </div>
  );
}
