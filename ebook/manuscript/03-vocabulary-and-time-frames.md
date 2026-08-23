# Vocabulary and time frames

> **Status:** outline

Every later chapter leans on these terms. Define them once, precisely, and never
drift from them.

## Must cover

### The three time frames

- [ ] **HTF** — High Time Frame. Where the curve is set (step 1).
- [ ] **ITF** — Intermediary Time Frame. Where the trend is read (step 2).
- [ ] **LTF** — Low Time Frame. Where the traded zones are marked (step 3).
- [ ] How the reader picks the three, and the relationship between them.
- [ ] The link to income objective: HTF at or below daily → daily income and a
      2% stop buffer; HTF at or above weekly → weekly income and a 10% buffer.

### Zone anatomy

- [ ] A zone is a box with two edges.
- [ ] **Proximal** — the near edge, the one price reaches first.
- [ ] **Distal** — the far edge, the one the stop sits beyond.
- [ ] Fixed per zone, not per direction: a demand zone's proximal is always its
      **top**; a supply zone's proximal is always its **bottom**.
- [ ] Why this trips people up, and the sentence that fixes it: *the near edge is
      the edge facing current price.*

### The curve

- [ ] **Curve high** and **curve low**, taken from HTF distal lines.
- [ ] The range split into equal thirds: **retail** (expensive), **equilibrium**
      (middle), **wholesale** (cheap).
- [ ] Buy cheap, sell dear — long wants wholesale, short wants retail.

### Other terms used throughout

- [ ] **Profit zone** — the distance from entry proximal to target proximal.
- [ ] **Trade risk per share** — entry price minus stop loss.
- [ ] **S.E.T.S.** — Stop, Entry, Target, Size.
- [ ] **Odds enhancer** — one of the six scored factors.
- [ ] **Proximal entry** vs **confirmation entry**.

## Notes

A boundary case worth stating explicitly: a price sitting exactly on a curve
third's line counts as the **higher** zone. The implementation uses a strict
`<` (`locateOnCurve` in `src/lib/trade-builder.ts`), so the book should say so
rather than leave it ambiguous.
