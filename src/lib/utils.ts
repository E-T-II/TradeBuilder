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
