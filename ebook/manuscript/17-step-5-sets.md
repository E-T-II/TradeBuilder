# Step 5 — S.E.T.S. the trade

> **Status:** outline

Stop, Entry, Target, Size. Four numbers, derived in that order because each
depends on the one before.

## Stop loss

The stop buffer is always the daily ATR multiplied by the income objective's
percentage, applied past the zone's distal line. Nothing else feeds it.

- [ ] Show the daily ATR.
- [ ] Show the stop buffer %: **2%** for daily income or less, **10%** for
      weekly income or greater.
- [ ] Show the stop buffer in dollars: ATR × buffer %, **rounded up**.
- [ ] Show the stop: buffer **subtracted from** the LTF demand distal (long), or
      **added to** the LTF supply distal (short).
- [ ] Worked: ATR 5.93 × 2% = 0.1186 → **$0.12**. Demand distal 106 − 0.12 =
      **105.88**.
- [ ] Risk per share follows: 108 − 105.88 = **2.12**.

## Entry price

- [ ] Determined by the odds enhancer total.
- [ ] **Proximal entry** (8.5–10): enter at the entry zone proximal line.
- [ ] **Confirmation entry** (7–8): enter $0.10 beyond the proximal line.
- [ ] Worked: demand proximal 108 → proximal entry at **108.00**.

## Target price

- [ ] Show the target buffer %.
- [ ] Show the reward:risk ratio.
- [ ] Show the target: profit zone × buffer %, applied from the entry proximal.
- [ ] Worked: (124 − 108) × 0.75 = 12, added to 108 → target **120.00**.
- [ ] The alternative mechanical 3:1 target, and when to use it.

## Size of position

- [ ] Trade risk per share = entry − stop.
- [ ] Max account risk = balance × risk tolerance.
- [ ] Shares = max account risk ÷ trade risk per share, rounded **down**.
- [ ] Capital requirement = shares × entry price.
- [ ] If capital requirement exceeds 50% of the balance, cut the size until it
      does not.
- [ ] Show total risk per trade and the capital requirement.

## Two ATRs, on purpose

The book works the stop twice, on the same zones, with two different ATRs. This
is a verification device, not a duplication to tidy away:

| ATR | Buffer | Rounding exercised | Stop from distal 106 |
|---|---|---|---|
| 5.93 | 5.93 × 2% = 0.1186 → **0.12** | rounds **up** | **105.88** |
| 4.00 | 4.00 × 2% = **0.08** | exact, no rounding | **105.92** |

- [ ] Keep both. One exercises the round-up rule, the other lands exactly on a
      cent and does not.
- [ ] Explain to the reader why both are shown: if a buffer were ever hardcoded,
      or the rounding applied the wrong way, the two examples would disagree with
      the rule and the error would surface immediately. One example alone can
      hide that.
- [ ] Make the reader do the second one themselves before checking the answer.

## Notes

Rounding is where a reader's arithmetic will diverge from the app's. The book
must state, for each figure, whether it rounds up, down, or to the cent — the
stop buffer rounds **up**, share count rounds **down**. Implemented across
`stopBuffer`, `stopLoss`, `entryPrice`, `targetPrice`, `positionSize` and
`applyCapitalCap` in `src/lib/trade-builder.ts`.

The ATR-4 case is the one worked in `docs/trade-math-walkthrough.md` and drawn in
the app's chart diagram; the ATR-5.93 case is the one in the repo `README.md`.
Both must stay correct — they are each other's check.
