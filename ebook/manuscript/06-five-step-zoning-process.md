# The five-step zoning process

> **Status:** outline — **this chapter is the biggest gap between book and code**

Zoning is used twice: on the HTF to set the curve (step 1), and on the LTF to
mark the zones actually traded (step 3). The process is the same both times.

## Must cover

- [ ] The five steps, named and numbered, each with a chart.
- [ ] What qualifies as a zone and what does not.
- [ ] How to place the proximal line.
- [ ] How to place the distal line.
- [ ] Reading a **demand** zone (below price, proximal on top).
- [ ] Reading a **supply** zone (above price, proximal on bottom).
- [ ] Common errors: drawing to wicks vs bodies, zones too wide, zones drawn
      around consolidation rather than departure.
- [ ] How zone height feeds everything downstream — it is the denominator of the
      profit-zone score and it sets where the stop goes.

## Why this chapter carries the most weight

The Trade Builder cannot do any of this. It asks the reader for four finished
numbers — supply distal, supply proximal, demand proximal, demand distal — and
takes them on trust. Every downstream calculation inherits the quality of these
four lines.

This is also the chapter the app's own documentation does not cover: the repo
README refers to "the five step zoning process" without specifying it. That
specification lives here and nowhere else.

## Notes

Zone geometry the app enforces, which the prose should state as rules:

- Demand distal must be **below** demand proximal.
- Supply proximal must be **below** supply distal.
- The supply zone must sit **above** the demand zone.
- Neither zone may sit outside the curve's low/high.

See `src/lib/validate-zones.ts` for the exact checks.
