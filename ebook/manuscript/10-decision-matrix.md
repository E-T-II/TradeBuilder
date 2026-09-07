# The Decision Matrix

> **Status:** outline — table below is authoritative and already settled

Steps 1, 2 and 3 combined decide the trade objective: buy long, sell short, or
no trade. The matrix is keyed on three things the reader has already
established — **which zone** is being entered, **where it sits on the curve**,
and **the trend**.

## The eighteen cells

| # | Zone | Curve position | Trend | Objective |
|---|---|---|---|---|
| a | Supply | High | Downtrend | Sell short |
| b | Supply | High | Sideways | Sell short |
| c | Supply | High | Uptrend | Sell short **only if profit zone ≥ 3:1** |
| d | Demand | High | Downtrend | No trade |
| e | Demand | High | Sideways | No trade |
| f | Demand | High | Uptrend | Buy long **only if profit zone ≥ 5:1** |
| g | Supply | Middle | Downtrend | Sell short |
| h | Supply | Middle | Sideways | Sell short |
| i | Supply | Middle | Uptrend | No trade |
| j | Demand | Middle | Downtrend | No trade |
| k | Demand | Middle | Sideways | Buy long |
| l | Demand | Middle | Uptrend | Buy long |
| m | Supply | Low | Downtrend | Sell short **only if profit zone ≥ 5:1** |
| n | Supply | Low | Sideways | No trade |
| o | Supply | Low | Uptrend | No trade |
| p | Demand | Low | Downtrend | Buy long **only if profit zone ≥ 3:1** |
| q | Demand | Low | Sideways | Buy long |
| r | Demand | Low | Uptrend | Buy long |

## Must cover

- [ ] How to read the table: find your zone, your curve third, your trend.
- [ ] A demand zone always *aims* long; a supply zone always *aims* short. The
      matrix's only job is to veto that aim.
- [ ] The four kinds of cell: unconditional trade, conditional on 3:1,
      conditional on 5:1, and outright no trade.
- [ ] Why the conditional cells exist — they are trading from the wrong end of
      the curve, or against the trend, and need extra room to justify the risk.
- [ ] Walk at least four cells in prose, including one of each kind.
- [ ] The matrix is a **gate**: it can veto a setup that scores 9 out of 10. A
      high score does not overrule it.
- [ ] What the reader does on a veto — check whether the opposite direction
      qualifies, then move on.

## Worked contrast

- [ ] Rule **r**: demand, wholesale, uptrend → buy long, no condition.
- [ ] Rule **f**: the same demand zone but in retail → buy long only if the
      profit zone reaches 5:1. Still with the trend, but buying expensive.

## Notes

Implemented as a pure lookup in `decisionMatrix()`, `src/lib/trade-builder.ts`.
The app renders this table interactively and highlights the reader's cell —
`src/components/decision-matrix.tsx`.
