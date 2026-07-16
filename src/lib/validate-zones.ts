import type { FormState } from "@/components/trade-builder-app";
import { entryPrice, targetPrice } from "./trade-builder";

// Fields that can carry a geometry error.
export type ZoneErrorField =
  | "curveHigh"
  | "entryDistal"
  | "targetProximal"
  | "targetDistal";

export type ZoneErrors = Partial<Record<ZoneErrorField, string>>;

function toNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/**
 * Direction-aware geometry checks on the zone price lines. A pair is only
 * checked once both of its values are present, so nothing fires while a field
 * is still empty. Pure, so it can be unit tested on its own.
 */
export function validateZones(form: FormState): ZoneErrors {
  const errors: ZoneErrors = {};
  const long = form.direction === "long";

  const curveLow = toNumber(form.curveLow);
  const curveHigh = toNumber(form.curveHigh);
  const entryProximal = toNumber(form.entryProximal);
  const entryDistal = toNumber(form.entryDistal);
  const targetProximal = toNumber(form.targetProximal);
  const targetDistal = toNumber(form.targetDistal);

  if (curveLow !== null && curveHigh !== null && curveHigh <= curveLow) {
    errors.curveHigh = "Curve high must be above curve low.";
  }

  if (entryProximal !== null && entryDistal !== null) {
    if (long && entryDistal >= entryProximal) {
      errors.entryDistal = `For a long, entry distal should be below the proximal (${form.entryProximal}).`;
    } else if (!long && entryDistal <= entryProximal) {
      errors.entryDistal = `For a short, entry distal should be above the proximal (${form.entryProximal}).`;
    }
  }

  if (entryProximal !== null && targetProximal !== null) {
    if (long && targetProximal <= entryProximal) {
      errors.targetProximal = "For a long, the target should be above the entry.";
    } else if (!long && targetProximal >= entryProximal) {
      errors.targetProximal = "For a short, the target should be below the entry.";
    } else {
      // Direction is right, but a tight zone plus the confirmation offset can
      // still flip the numbers the engine actually produces. Check the rounded
      // entry and target for the worst case, a confirmation entry.
      const b = toNumber(form.targetBuffer);
      const bufferPct = (b !== null && b > 0 ? Math.min(b, 100) : 75) / 100;
      const worstEntry = entryPrice(entryProximal, "confirmation", form.direction)!;
      const target = targetPrice(
        entryProximal,
        targetProximal,
        bufferPct,
        form.direction,
      );
      const clears = long ? target > worstEntry : target < worstEntry;
      if (!clears) {
        errors.targetProximal =
          "This target zone is too close; after the buffer the exit lands on the wrong side of the entry.";
      }
    }
  }

  if (targetProximal !== null && targetDistal !== null) {
    if (long && targetDistal <= targetProximal) {
      errors.targetDistal = "For a long, target distal should be above the proximal.";
    } else if (!long && targetDistal >= targetProximal) {
      errors.targetDistal = "For a short, target distal should be below the proximal.";
    }
  }

  return errors;
}
