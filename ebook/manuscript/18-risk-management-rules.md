# The risk management rules

> **Status:** outline

The arithmetic behind the commitments made in "The trader's rules". These are
the rules that reject trades the rest of the method has already approved.

## Max account risk per trade — 2%

- [ ] Balance × 2% = the most that may be lost on one trade.
- [ ] Worked: $600 × 0.02 = **$12**.
- [ ] Trade risk per share × shares must not exceed it.
- [ ] This is what sets position size — size is an output, never a choice.

## Trade risk per share

- [ ] Entry price − stop loss.
- [ ] Worked with the running example: risk of **$0.50** per share.
- [ ] $12 ÷ $0.50 = 24 shares.

## Reward:risk ratio — at least 3:1 (hard rule)

- [ ] (Target − entry) ÷ trade risk per share.
- [ ] Must be **at least** 3:1.
- [ ] A setup that cannot reach 3:1 is rejected outright — not flagged, not
      taken smaller.
- [ ] Distinguish from the profit zone score, which is measured in zone heights.

## Capital cap — 50%

- [ ] Never commit more than 50% of the balance to one trade.
- [ ] Shares × entry price = capital requirement.
- [ ] If it exceeds the cap, reduce size until it does not.
- [ ] The case where one share already exceeds 50% — there is no tradeable size.

## Total open risk — 6% (hard rule)

- [ ] Across all open trades, total risk may not exceed 6% of the balance.
- [ ] Worked: $600 × 0.06 = **$36**.
- [ ] Adding a new trade means summing its risk with risk already open.
- [ ] If the sum exceeds the limit: close open risk or skip the trade. It is
      rejected outright.

## When the answer is "no trade"

- [ ] Enumerate every way a setup fails, and what the reader should do about each:
      matrix veto, score below 7, zones too tight, reward:risk below 3:1,
      risk budget too small for one share, one share over the capital cap, and
      the 6% ceiling.
- [ ] The two hard rules — reward:risk and 6% — reject rather than warn.

## Notes

The app enumerates the same seven failure modes and explains each in the order
ticket; see the "No-trade has seven distinct reasons" section of
`docs/ENGINEERING.md`. Ordering matters there and should match here: failures
that depend only on the chart are settled before failures that depend on the
account balance.
