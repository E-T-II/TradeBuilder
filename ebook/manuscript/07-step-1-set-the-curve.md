# Step 1 — Set the curve on the HTF

> **Status:** outline

## Must cover

- [ ] Zone the HTF supply and demand using the five-step process.
- [ ] Take the **distal** lines of those two zones — not the proximal ones — as
      the curve high and curve low.
- [ ] Divide that range into three equal parts.
- [ ] Name them: **wholesale** (bottom third), **equilibrium** (middle),
      **retail** (top third).
- [ ] Why distal lines define the range: they are the extremes price has
      actually reached.
- [ ] The purpose of the curve — it answers "am I buying cheap or expensive?"
      and feeds both the curve odds enhancer and the Decision Matrix.

## Worked example

- [ ] Curve low 100, curve high 130.
- [ ] Wholesale 100–110, equilibrium 110–120, retail 120–130.
- [ ] A demand proximal at 108 sits in wholesale — the good side for a long.
- [ ] The same entry at 122 would sit in retail and score zero on curve.

## Edge cases

- [ ] A price exactly on a boundary counts as the **higher** zone.
- [ ] What to do when the HTF range is very wide or very narrow.
- [ ] When to re-set the curve as the HTF develops.

## Notes

Implemented by `locateOnCurve()` in `src/lib/trade-builder.ts`.
