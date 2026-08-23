# Worked example — a long from wholesale

> **Status:** outline

One setup carried end to end, so the reader sees every number produced in order.

## The setup

| Input | Value |
|---|---|
| Account balance | $600 |
| Risk tolerance | 2% |
| Income objective | Daily (2% stop buffer) |
| Daily ATR | 5.93 |
| Curve | 100 – 130 |
| Trend (ITF) | Uptrend |
| Demand zone | 106 – 108 |
| Supply zone | 124 – 126 |

## Must cover, in order

- [ ] **Step 1** — curve thirds: wholesale 100–110, equilibrium 110–120,
      retail 120–130.
- [ ] **Step 2** — uptrend.
- [ ] **Step 3** — the four lines; entry proximal 108 sits in wholesale.
- [ ] **Decision Matrix** — demand, low on the curve, uptrend = rule **r**,
      buy long, unconditional.
- [ ] **Step 4** — score it:
      - Curve: wholesale on a long → 1
      - Trend: long in an uptrend → 2
      - Profit zone: (124 − 108) ÷ (108 − 106) = 8:1 → 2
      - Strength / Time / Freshness: judged from the chart
      - Total, and the entry type it implies
- [ ] **Step 5** — S.E.T.S.:
      - Stop buffer: 5.93 × 2% = 0.1186 → $0.12, rounded up
      - Stop: 106 − 0.12 = 105.88
      - Entry: 108.00 (proximal)
      - Target: 108 + (124 − 108) × 0.75 = 120.00
      - Risk per share: 108 − 105.88 = 2.12
      - Shares, capital requirement, total trade risk
- [ ] **Step 6** — the limit order actually placed.
- [ ] **Risk rules** — check all four, and show them passing.

## Notes

The same zones are worked in `docs/trade-math-walkthrough.md` at an ATR of 4
(buffer 0.08, stop 105.92). That is the deliberate counterpart to this chapter's
ATR of 5.93 (buffer 0.12, stop 105.88): identical zones, identical rule, two
different volatility inputs. If a change to the engine ever broke the buffer or
its rounding, exactly one of the two would still come out right — which is the
point of keeping both.
