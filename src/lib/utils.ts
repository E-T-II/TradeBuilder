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

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Clamp a numeric string into [min, max], returning a string. Empty and
// non-numeric input are left as-is (the caller decides what a blank means).
// Shared by the advanced-setting field's blur handler and localStorage
// hydration so a saved or typed value can never render out of sync with the
// bounds the engine enforces.
export function clampNumericString(
  raw: string,
  min: number,
  max: number,
): string {
  if (raw.trim() === "") return raw
  const n = Number(raw)
  if (!Number.isFinite(n)) return raw
  const clamped = Math.min(max, Math.max(min, n))
  return clamped === n ? raw : String(clamped)
}
