# Step 2 — Check the trend on the ITF

> **Status:** outline

## Must cover

- [ ] The three verdicts: **uptrend**, **sideways**, **downtrend**. There is no
      fourth option and no "slightly".
- [ ] How to read each one off the ITF chart, with an example of each.
- [ ] Why the trend is read on the intermediary time frame rather than the HTF
      or LTF.
- [ ] What the trend is used for downstream — it scores up to 2 points on the
      scorecard, and it is one of the three inputs to the Decision Matrix.
- [ ] Trading *with* the trend versus *against* it, and why sideways is treated
      as half credit rather than a coin flip.
- [ ] The honest difficulty: this is a judgement call, and two traders can
      disagree. Give the reader a tie-breaker rule.

## Scoring, stated here for completeness

Long:

- Uptrend → **2** points
- Sideways → **1** point
- Downtrend → **0** points

Short is the mirror image: downtrend 2, sideways 1, uptrend 0.

## Notes

Implemented by `trendScore()` in `src/lib/trade-builder.ts`. The full scoring
discussion belongs in the odds-enhancers chapter; keep this section to the
reading of the chart.
