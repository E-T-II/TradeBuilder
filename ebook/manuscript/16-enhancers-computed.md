# Odds enhancers — Trend, Curve and Profit Zone

> **Status:** outline

The three computed enhancers. The reader does not judge these; they follow from
numbers already established. Grouped in one chapter because the reasoning is
shared: each rewards trading with the odds rather than against them.

## Trend — 2 / 1 / 0

Long: uptrend 2, sideways 1, downtrend 0. Short: the mirror.

- [ ] Why with-trend earns full marks and counter-trend earns nothing.
- [ ] Why sideways is half rather than excluded.

## Curve — 1 / 0.5 / 0

Long: wholesale 1, equilibrium 0.5, retail 0. Short: the mirror.

- [ ] Scored on where the **entry proximal** sits, not the whole zone.
- [ ] Worked: entry at 108 on a 100–130 curve is wholesale → 1 point. The same
      entry at 122 is retail → 0.
- [ ] Buy cheap, sell dear, expressed as a score.

## Profit zone — 2 / 1 / 0

**The question: how far away is the opposing fresh zone?**

Measure the entry zone's height, then count how many times it divides into the
distance from entry proximal to target proximal.

| Score | Ratio |
|---|---|
| **2** | 5:1 or better |
| **1** | 3:1 or better |
| **0** | Below 3:1 |

- [ ] Worked: zone height 108 − 106 = 2. Distance 124 − 108 = 16. 16 ÷ 2 = **8:1**
      → 2 points.
- [ ] Why the ratio is measured in zone heights rather than dollars.
- [ ] The double duty this score performs: it is worth 2 points here, **and** it
      is the condition on the Decision Matrix's marginal cells.
- [ ] Distinguish it from reward:risk, which is measured against the stop, not
      the zone height. They are different numbers and readers conflate them.

## Notes

`trendScore()`, `curveScore()`, `profitZoneRatio()` and `profitZoneScore()` in
`src/lib/trade-builder.ts`. Ratio comparisons there use a small epsilon so a
setup landing exactly on 3:1 or 5:1 counts as meeting it — the prose should say
"at least", never "more than".
