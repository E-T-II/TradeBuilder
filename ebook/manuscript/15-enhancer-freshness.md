# Odds enhancer — Freshness

> **Status:** outline

**The question: has price returned to the zone?**

## Scoring

| Score | Condition |
|---|---|
| **2** | Zone not pierced |
| **1** | Pierced 50% or less |
| **0** | Pierced more than 50% |

## Must cover

- [ ] Define **pierced**: price entering the zone after it formed.
- [ ] How to measure the pierce as a percentage of zone height, with charts.
- [ ] Why a fresh zone is worth more — the unfilled orders are still sitting
      there. Each return consumes them.
- [ ] The 50% line and how to judge a pierce that lands near it.
- [ ] Whether a wick through the zone counts the same as a body. State the rule.
- [ ] Why a heavily pierced zone can still be worth trading if other enhancers
      are strong — and when it is not.

## Notes

Reference graphic: `src/components/freshness-reference.tsx`, whose summary reads:

> "Scoring Freshness is based on how far, if at all, price has pierced the zone."

The book owes the reader the measurement method behind that sentence.
