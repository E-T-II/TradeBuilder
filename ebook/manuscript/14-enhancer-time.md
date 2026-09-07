# Odds enhancer — Time

> **Status:** outline

**The question: how much time did price spend at the zone?**

## Scoring

| Score | Condition |
|---|---|
| **1** | 1–3 basing candles |
| **0.5** | 4–6 basing candles |
| **0** | More than 6 basing candles |

## Must cover

- [ ] Define **basing candle** precisely — this is the term the whole score
      rests on, and it must be countable, not impressionistic.
- [ ] How to count them at the zone, with charts at each score.
- [ ] The principle: less time at a zone means a more severe imbalance. If price
      lingers, the orders were closer to matched.
- [ ] What a long base tells you about the zone's likely reliability.
- [ ] Counting on the LTF, and what happens to the count if the reader changes
      time frame.

## Notes

The only enhancer with a half point at the top band, so a Time score of 0.5 is
often what leaves a setup stranded at 8 instead of 8.5 — the difference between a
confirmation entry and a proximal one. Worth making that consequence explicit.

Reference graphic: `src/components/time-reference.tsx`.
