# Step 3 — Identify the zones on the LTF

> **Status:** outline

## Must cover

- [ ] Apply the five-step zoning process to the LTF.
- [ ] Mark **both** zones: the demand zone below and the supply zone above.
- [ ] Record four numbers, top-down as they read on the chart:
      supply distal, supply proximal, demand proximal, demand distal.
- [ ] The point that is easiest to miss: these four lines come from **two
      different boxes**. One is where you enter; the other is what you aim at.
- [ ] Which zone is the entry depends on direction — and direction is decided
      next, by the Decision Matrix.
      - Long: enter at demand, target supply.
      - Short: enter at supply, target demand.
- [ ] Zone height is not cosmetic: it is the unit the profit zone is measured in.

## Geometry that must hold

- [ ] Demand distal below demand proximal.
- [ ] Supply proximal below supply distal.
- [ ] The whole supply zone above the whole demand zone.
- [ ] Both zones inside the curve's range.
- [ ] What it means if a chart violates these — the zones are mismarked, not the
      rules.

## Worked example

- [ ] Demand zone 106–108, supply zone 124–126, curve 100–130.
- [ ] For a long: entry proximal 108, entry distal 106, target proximal 124,
      target distal 126.

## Notes

The direction → line mapping is `deriveZoneLines()`; the geometry checks are
`src/lib/validate-zones.ts`.
