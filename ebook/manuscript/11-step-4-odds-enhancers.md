# Step 4 — Score the trade with the odds enhancers

> **Status:** outline

Six factors, ten points. Three are read off the chart by the trader; three are
computed from numbers already given.

## The scorecard

| Odds enhancer | Points | Source |
|---|---|---|
| Strength | 2 / 1 / 0 | Judged from the chart |
| Time | 1 / 0.5 / 0 | Judged from the chart |
| Freshness | 2 / 1 / 0 | Judged from the chart |
| Trend | 2 / 1 / 0 | Computed from step 2 + objective |
| Curve | 1 / 0.5 / 0 | Computed from step 1 + objective |
| Profit zone | 2 / 1 / 0 | Computed from the two zones |

**Total: 10 points.**

## Entry type from the total

- [ ] **8.5 – 10** → Proximal entry (very strong)
- [ ] **7 – 8** → Confirmation entry (strong)
- [ ] **Below 7** → No trade (weak)

State plainly: the score decides *whether and how* you enter, not merely how
confident you feel.

## Must cover

- [ ] Each enhancer gets its own chapter; this one is the map.
- [ ] Why three are judged and three are computed — and why the judged three
      cannot be automated away.
- [ ] Scoring honestly: the temptation is to round a 1 up to a 2 to clear the
      7-point bar. Name that failure mode.
- [ ] The interaction with the Decision Matrix: a qualifying score still gets
      vetoed by a no-trade cell.
- [ ] Half points exist only on Time (0.5) and Curve (0.5).

## Notes

Totalled by `totalScore()`; the banding is `entryType()` in
`src/lib/trade-builder.ts`.
