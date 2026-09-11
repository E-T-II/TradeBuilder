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

import type { FormState } from "@/components/trade-builder-app";

// Fields that can carry a geometry error.
export type ZoneErrorField =
  | "curveLow"
  | "demandHigh"
  | "demandLow"
  | "supplyHigh"
  | "supplyLow";

export type ZoneErrors = Partial<Record<ZoneErrorField, string>>;

function toNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/**
 * Geometry checks on the two zones. Demand sits below, supply above; direction
 * assigns entry/target, so the old "which line is which" errors are gone. A
 * check only fires once the values it needs are present. Pure, so it can be
 * unit tested on its own.
 */
export function validateZones(form: FormState): ZoneErrors {
  const errors: ZoneErrors = {};

  const curveLow = toNumber(form.curveLow);
  const curveHigh = toNumber(form.curveHigh);
  const demandHigh = toNumber(form.demandHigh);
  const demandLow = toNumber(form.demandLow);
  const supplyHigh = toNumber(form.supplyHigh);
  const supplyLow = toNumber(form.supplyLow);

  // Curve high is entered first, so the error lands on curve low — the field
  // being edited when the pair goes invalid — the same way the zone errors flag
  // the second edge rather than the one the user already left.
  if (curveLow !== null && curveHigh !== null && curveHigh <= curveLow) {
    errors.curveLow = "Curve low must be below curve high.";
  }

  // Each zone needs real height. (Demand distal is the low edge, demand
  // proximal the high edge; supply proximal the low edge, supply distal the
  // high edge — the messages name the fields as they're labeled.)
  if (demandHigh !== null && demandLow !== null && demandLow >= demandHigh) {
    errors.demandLow = "Demand distal must be below demand proximal.";
  }
  if (supplyHigh !== null && supplyLow !== null && supplyLow >= supplyHigh) {
    errors.supplyLow = "Supply proximal must be below supply distal.";
  }

  // Supply sits entirely above demand. Whether the buffered exit actually
  // clears the entry depends on the entry type, which isn't known until the
  // score is in, so buildTrade handles it: it returns no order when the
  // computed target can't clear the computed entry.
  //
  // Supply is entered first now, so the error lands on demand proximal — the
  // field being edited when the pair goes invalid — rather than on the supply
  // line already left behind.
  if (demandHigh !== null && supplyLow !== null && supplyLow <= demandHigh) {
    errors.demandHigh = "The supply zone must sit above the demand zone.";
  }

  // Both zones must sit inside the curve. Otherwise locateOnCurve clamps an
  // out-of-range price to an extreme third and scores it as if it were valid.
  // All four edges are checked directly so the error lands on the field the
  // user actually mistyped, rather than surfacing on the opposite zone.
  if (curveLow !== null && curveHigh !== null && curveHigh > curveLow) {
    if (demandLow !== null && !errors.demandLow && demandLow < curveLow) {
      errors.demandLow = "The demand zone can't sit below the curve low.";
    }
    if (demandHigh !== null && !errors.demandHigh && demandHigh > curveHigh) {
      errors.demandHigh = "The demand zone can't sit above the curve high.";
    }
    if (supplyLow !== null && !errors.supplyLow && supplyLow < curveLow) {
      errors.supplyLow = "The supply zone can't sit below the curve low.";
    }
    if (supplyHigh !== null && !errors.supplyHigh && supplyHigh > curveHigh) {
      errors.supplyHigh = "The supply zone can't sit above the curve high.";
    }
  }

  return errors;
}
