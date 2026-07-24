# Trade Builder — Engineering Guide

This is the engineer's companion to the product [`README.md`](../README.md). The
README is the source of truth for *what* the strategy does; this doc explains
*how* the app is built so a new contributor can find their way around quickly.

## Stack

- **Next.js 16** (App Router, Turbopack) — note the repo-root `AGENTS.md`: this
  Next.js has breaking changes from older versions, so check
  `node_modules/next/dist/docs/` before reaching for remembered APIs.
- **React 19** + **TypeScript** (strict).
- **Tailwind CSS 4** for styling; **shadcn/ui** components built on **@base-ui**.
- **lucide-react** icons.
- **Vitest 4** + **Testing Library** for tests.

## Big picture

The app is split into a **pure engine** and a **React UI**. Everything that
decides a trade lives in plain, side-effect-free functions; React only collects
input and renders the result.

```
FormState (strings)                    src/components/trade-builder-app.tsx
   │  toInputs(): validate + numberify + deriveZoneLines
   ▼
TradeInputs ─────────► buildTrade() ─────────► TradeResult
   (numbers)           src/lib/trade-builder.ts   (scorecard, objective,
                                                    order, checks)
                                                        │
                                                        ▼
                          Scorecard · OrderTicket · RiskChecks components
```

Because `buildTrade` is pure, it runs on every keystroke via `useMemo`, and the
whole engine is unit-testable with no DOM.

## The engine, mapped to the six steps

`src/lib/trade-builder.ts` implements the README's six-step process as small
composable functions. `buildTrade` is the orchestrator that runs them in order:

| README step | Engine piece |
|---|---|
| 1. Set the curve | `locateOnCurve()` splits `[curveLow, curveHigh]` into wholesale / equilibrium / retail thirds |
| 2. Trend | `trendScore()` |
| 3. Decision Matrix → objective | `deriveZoneLines()` + `decisionMatrix()` |
| 4. Score the odds enhancers | `curveScore`, `trendScore`, `profitZoneRatio`/`profitZoneScore`, plus the user-judged strength/time/freshness; summed by `totalScore()` → `entryType()` |
| 5. S.E.T.S. | `entryPrice`, `stopBuffer`, `stopLoss`, `targetPrice`, `positionSize`, `applyCapitalCap`, `rewardRiskRatio` |
| 6. Place the order | rendered by `OrderTicket` |

### Demand/supply model (`deriveZoneLines`)

The user draws two physical zones — a **demand** zone and a **supply** zone —
each by its high and low. Direction picks the roles:

- **Long** enters at demand, targets supply.
- **Short** enters at supply, targets demand.

`deriveZoneLines(zones, direction)` maps those to the four entry/target lines the
rest of the engine already worked in (`entryProximal`, `entryDistal`,
`targetProximal`, `targetDistal`), so the scoring and risk math never had to
change when the input model did.

### Decision Matrix (`decisionMatrix`)

Step 3's matrix (README rows a–r) is a pure lookup keyed on **entry zone type ×
curve position × trend**, returning `"long" | "short" | "no-trade"`. The
marginal (counter-trend or awkward-curve) cells only trade when the profit-zone
ratio is 5:1 or better. `buildTrade` runs it as a **gate**: it can veto a setup
to no-trade even when the odds-enhancer score qualifies.

## No-trade has seven distinct reasons

`buildTrade` returns `order: null` in seven cases, and the UI tells them apart:

1. **Matrix veto** — `objective === "no-trade"` (setup invalid for this
   trend/curve).
2. **Low score** — `entryType === "no-trade"` (total below 7).
3. **Tight zones** — the buffered target lands on the wrong side of the entry
   (a tight zone plus the confirmation offset); `blockedReason: "tight-zones"`.
4. **Reward:risk below 3:1** — the best achievable target still can't reach 3:1
   (or a mechanical 3:1 target lands on or past the opposing zone);
   `blockedReason: "reward-risk"`.
5. **Risk budget too small** — the risk-per-trade budget can't cover one
   share's risk, so `rawSize` is 0; `blockedReason: "risk-too-small"`.
6. **Capital cap too tight** — one share costs more than 50% of the balance, so
   the capital cap knocks a positive size to 0; `blockedReason: "capital-too-large"`.
7. **Over 6%** — this trade's risk plus open risk exceeds 6% of the balance;
   `blockedReason: "over-6pct"`.

The order matters. Reasons 3 and 4 depend only on entry/stop/target, so they are
settled before the balance-dependent ones — otherwise a small account is told to
add funds for a setup that was never tradeable at any size.

Reasons 4 and 7 are hard rules (per Eugene): a failing reward:risk or 6% check
rejects the trade outright rather than showing a flagged, placeable order. The
user has to resolve those themselves, so the rejection carries the numbers: a
reward:risk rejection reports the ratio the setup reaches (`result.reachedRewardRisk`),
and a 6% rejection reports both halves of the sum (`result.totalTradeRisk`,
`result.openRisk`) plus the full `checks`, so the Risk-rules card still renders
with the failing row.

Threshold comparisons round the same way on both sides of a rule: reward:risk
goes through `meetsProfitRatio`'s epsilon everywhere, and the 6% sum is
`roundToCent`-quantised like the dollar figures it is compared against, so a
trade landing exactly on either limit is allowed rather than lost to float
noise.

`OrderTicket` shows a matching message for each; `Scorecard` shows a neutral
"No valid trade" badge when the score qualified but no order resulted.

## Target modes

The take-profit target is set one of three ways (`TargetMode`, chosen in
advanced settings):

- **percent** — a % of the profit zone (`targetBufferPct`, kept in 0.75–0.80).
- **ratio** — a mechanical 3:1 target: exactly 3× the per-share risk out from
  the entry. Its reward:risk is 3 by construction, so `buildTrade` reports it as
  3 rather than recomputing from the cent-rounded price.
- **auto** — checks every buffer in the 75–80% range against the mechanical
  3:1 (per Eugene) and keeps whichever gives the higher reward:risk, provided
  the target still sits before the opposing zone. "Before" is strict: a target
  resting on the zone's near edge is the fill risk the 75–80% buffer exists to
  avoid, so a mechanical target that lands exactly there doesn't qualify.
  Implemented as comparing the 80% ceiling to the 3:1 rather than checking all
  six percentages individually — target grows monotonically with the buffer,
  so 80% always beats every lower percentage in the range, making the two
  equivalent. The Target buffer (%) field's typed value plays no part in
  this — auto always uses 80% when the percentage side wins.

The Target buffer (%) field is only shown in `percent` mode (per Eugene) — in
`ratio` it doesn't apply at all, and in `auto` the field's value isn't used
(auto always checks the 80% ceiling, not what's typed), so the control has
nothing to offer the user in either mode.

## The S.E.T.S. breakdown

Per Eugene: the order ticket shows the final Entry/Stop/Target, but also the
working behind Stop and Target, so the numbers aren't a black box. Every result
carries a top-level `math` block for this — present even on a no-trade, where
the results screen shows it greyed under the "No trade" explanation:

- `dailyAtr` — echoes `inputs.atr`.
- `stopBufferPct` — 2 or 10, from the income timeframe.
- `stopBufferDollar` — the computed stop buffer (`ATR × stopBufferPct`).
- `targetBufferPct` — the percentage used, or `null` when the mechanical 3:1
  was used instead (`ratio` mode outright, or `auto` picking the mechanical
  target over the percentage one). `OrderTicket` shows "Mechanical 3:1" in
  that case rather than a percentage. `80` when `auto` picked the percentage
  side — see the auto note under Target modes above.
- `targetBufferPending` — `true` only when an `auto` setup returned no order
  *before* its 75-80%-vs-3:1 comparison ran (a matrix veto or a sub-7 score),
  so no buffer was ever chosen. `OrderTicket` shows the `75–80%` range then;
  every other result resolves `targetBufferPct` and leaves this `false`.

## Validation layers

- **Geometry** (`src/lib/validate-zones.ts`) — direction-independent checks on
  the zone prices (each zone has height, supply sits above demand, curve high >
  low, and each zone edge sits inside the curve). Runs on every render; blocks
  advancing past the Curve/Zones steps so a nonsensical setup can't reach the
  results.
- **Positive inputs** (`toInputs`) — account balance and ATR must be greater
  than zero (a zero balance can't size a trade; a zero ATR leaves no stop
  buffer). Surfaced as a specific message on the results card.
- **Decision Matrix** and the **tight-zone guard** live in `buildTrade`, because
  they depend on the entry type / computed prices, which aren't known until the
  score is in.

## UI layout

- `src/app/layout.tsx` — pre-paint `<script>` tags set the theme and the
  once-per-session splash flag before first paint to avoid a flash.
- `trade-builder-app.tsx` — owns `FormState`, localStorage persistence
  (`STORAGE_KEY`, bump on breaking field changes), and the form↔results switch.
- `trade-form.tsx` — the multi-step wizard, ordered to the six-step methodology
  (Pre-steps · Curve · Trend · Zones · Score), step gating, and focus
  management. Advanced settings clamp risk to 2% max and the target buffer to
  75–80%.
- Result cards: `scorecard.tsx`, `order-ticket.tsx`, `risk-checks.tsx`.
- Inputs: `rating-chips.tsx` (odds enhancers), `segmented-control.tsx`
  (direction/trend/timeframe).
- `reveal.tsx`, `splash-intro.tsx`, `theme-toggle.tsx` — animation and theming.
- `src/components/ui/*` — shadcn primitives.

## Testing

- `npm test` runs Vitest once; `npm run test:watch` watches.
- Engine and validator tests run in the default **node** environment; component
  tests opt into **jsdom** with a `// @vitest-environment jsdom` docblock.
- `vitest.setup.ts` registers the jest-dom matchers and unmounts rendered
  components after each test (so DOM doesn't leak between cases).
- Test names follow a **`given … : should …`** convention. Assertions favour the
  RITE style: explicit `actual`/`expected` and full-object `toEqual` where it
  helps pinpoint a wrong field.
- The Decision Matrix has a test per cell (rows a–r) plus both sides of the 5:1
  condition.

## Commands

```bash
npm run dev         # local dev server (Turbopack)
npm run build       # production build (also type-checks)
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest run
```

## Conventions

- Read `AGENTS.md` before writing Next.js code — the version has breaking changes.
- Keep the engine pure: no React, no I/O, no `Date.now`/`Math.random` inside the
  scoring/risk functions, so results are deterministic and testable.
- Money rounds to the cent; the stop buffer always rounds **up** (per the
  strategy). Helpers: `roundToCent`, `roundUpToCent`.
- Deploys run on Vercel from `main`; every PR gets a preview once the author has
  access to the Vercel project.

## Future ideas

- **Move money math off floats and onto integer cents.** `roundToCent` has
  already needed two fixes (a bare-float 6% comparison, then the helper's own
  half-cent rounding) because JS numbers can't represent most decimals
  exactly. Both were symptoms of the same root cause, patched where they
  surfaced rather than eliminated — there's no guarantee another one isn't
  sitting somewhere else. The standard fix is to store and compute every
  dollar amount as an integer number of cents (e.g. `10592`, not `105.92`),
  only dividing by 100 at render time; that makes this whole class of bug
  structurally impossible instead of something to keep hunting for. It's a
  real refactor — touches `entryPrice`, `stopLoss`, `positionSize`, and every
  test fixture — so not something to do mid-PR, but worth doing before the
  hard-rejection rules (which turned previously-cosmetic rounding noise into
  wrongly-accepted or wrongly-rejected trades) get any more threshold logic
  layered on top.
